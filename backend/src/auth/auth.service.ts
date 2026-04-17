import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../common/prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { loadRsaKeys } from "../config/jwt.config";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
      include: { employee: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException("Account is temporarily locked. Try again later.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed attempts
      const newFailedAttempts = user.failedAttempts + 1;
      const updateData: any = { failedAttempts: newFailedAttempts };
      if (newFailedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Reset failed attempts on successful login
    if (user.failedAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return user;
  }

  async register(dto: RegisterDto) {
    // Find or create default tenant
    let tenantId: string;
    const tenantSlug = dto.tenantSlug || "default";
    let tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          name: `${tenantSlug} Organization`,
          slug: tenantSlug,
        },
      });
    }
    tenantId = tenant.id;

    // Check for existing user within this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered in this organization");
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      parseInt(this.configService.get("BCRYPT_SALT_ROUNDS", "10"), 10),
    );

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return { ...user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Rotate: revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const tokens = await this.generateTokens(storedToken.user);
    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }
    return { success: true };
  }

  private async generateTokens(user: any) {
    const { privateKey } = loadRsaKeys();

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: privateKey,
      expiresIn: this.configService.get("JWT_ACCESS_EXPIRATION", "15m"),
      algorithm: "RS256",
    });

    const refreshTokenValue = uuidv4();
    const refreshTokenExpiration = this.configService.get("JWT_REFRESH_EXPIRATION", "7d");
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, token: refreshTokenValue },
      {
        secret: privateKey,
        expiresIn: refreshTokenExpiration,
        algorithm: "RS256",
      },
    );

    // Parse expiration string to calculate DB expiresAt
    const expiresAt = this.parseExpirationToDuration(refreshTokenExpiration);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private parseExpirationToDuration(expiration: string): Date {
    const now = new Date();
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days
      now.setDate(now.getDate() + 7);
      return now;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case "s": now.setSeconds(now.getSeconds() + value); break;
      case "m": now.setMinutes(now.getMinutes() + value); break;
      case "h": now.setHours(now.getHours() + value); break;
      case "d": now.setDate(now.getDate() + value); break;
    }
    return now;
  }
}
