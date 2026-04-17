import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
  hash: jest.fn(() => Promise.resolve('hashed$pass')),
}));

// Mock loadRsaKeys to avoid file I/O
jest.mock('../config/jwt.config', () => ({
  loadRsaKeys: jest.fn(() => ({
    privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntestkey\n-----END RSA PRIVATE KEY-----',
    publicKey: '-----BEGIN PUBLIC KEY-----\ntestkey\n-----END PUBLIC KEY-----',
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt') as { compare: jest.Mock; hash: jest.Mock };

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    role: 'EMPLOYEE',
    tenantId: 'tenant-1',
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    employee: null,
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('hashed$pass');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', isActive: true },
        include: { employee: true },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      };
      mockPrismaService.user.findFirst.mockResolvedValue(lockedUser);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Account is temporarily locked');
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWithFailures = {
        ...mockUser,
        failedAttempts: 4,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(userWithFailures);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          failedAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      });
    });

    it('should reset failed attempts on successful login', async () => {
      const userWithFailures = {
        ...mockUser,
        failedAttempts: 3,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(userWithFailures);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw when user has no passwordHash (SSO user)', async () => {
      const ssoUser = { ...mockUser, passwordHash: null };
      mockPrismaService.user.findFirst.mockResolvedValue(ssoUser);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', slug: 'default' });
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'newuser@example.com',
        role: 'EMPLOYEE',
        tenantId: 'tenant-1',
        createdAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          email: 'newuser@example.com',
          passwordHash: 'hashed$pass',
          role: 'EMPLOYEE',
        }),
        select: expect.any(Object),
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException when email already registered', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should create a new tenant if it does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        id: 'new-tenant-1',
        name: 'myorg Organization',
        slug: 'myorg',
      });
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'newuser@example.com',
        role: 'EMPLOYEE',
        tenantId: 'new-tenant-1',
        createdAt: new Date(),
      });

      const dto: RegisterDto = { ...registerDto, tenantSlug: 'myorg' };
      await service.register(dto);

      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: {
          name: 'myorg Organization',
          slug: 'myorg',
        },
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully and return tokens', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        tenantId: 'tenant-1',
      });
    });

    it('should fail with invalid credentials', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should issue new tokens and revoke old refresh token', async () => {
      const storedToken = {
        id: 'rt-1',
        token: 'old-refresh-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(storedToken);

      const result = await service.refreshToken('old-refresh-token');

      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw when refresh token is invalid', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token is revoked', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      });

      await expect(service.refreshToken('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token is expired', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revoked: false,
        expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token', async () => {
      await service.logout('user-1', 'specific-token');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', token: 'specific-token' },
        data: { revoked: true },
      });
    });

    it('should revoke all refresh tokens when no specific token provided', async () => {
      await service.logout('user-1');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { revoked: true },
      });
    });

    it('should return success', async () => {
      const result = await service.logout('user-1');
      expect(result).toEqual({ success: true });
    });
  });
});
