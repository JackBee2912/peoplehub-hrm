import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from './dto/employee.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { EmployeeStatus } from '@prisma/client';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: PrismaService;

  const tenantId = 'tenant-1';

  const mockPrismaService = {
    employee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    const mockEmployees = [
      {
        id: 'emp-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        employeeCode: 'EMP-00001',
        department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
        position: { id: 'pos-1', title: 'Developer', code: 'DEV' },
        status: EmployeeStatus.ACTIVE,
      },
      {
        id: 'emp-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        employeeCode: 'EMP-00002',
        department: null,
        position: null,
        status: EmployeeStatus.PROBATION,
      },
    ];

    it('should return paginated employees with default params', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);
      mockPrismaService.employee.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId, {});

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith({
        where: { tenantId, isDeleted: false },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should apply pagination correctly', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([mockEmployees[0]]);
      mockPrismaService.employee.count.mockResolvedValue(50);

      const pagination: PaginationDto = { page: 2, limit: 10 };
      const result = await service.findAll(tenantId, pagination);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(true);
    });

    it('should apply search filter', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      const filters: EmployeeFilterDto = { search: 'john' };
      await service.findAll(tenantId, {}, filters);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should apply department filter', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      const filters: EmployeeFilterDto = { departmentId: 'dept-1' };
      await service.findAll(tenantId, {}, filters);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: 'dept-1',
          }),
        }),
      );
    });

    it('should apply status filter', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      const filters: EmployeeFilterDto = { status: EmployeeStatus.ACTIVE };
      await service.findAll(tenantId, {}, filters);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EmployeeStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should combine multiple filters', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      const filters: EmployeeFilterDto = {
        search: 'john',
        departmentId: 'dept-1',
        status: EmployeeStatus.ACTIVE,
      };
      await service.findAll(tenantId, {}, filters);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            isDeleted: false,
            departmentId: 'dept-1',
            status: EmployeeStatus.ACTIVE,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    const mockEmployee = {
      id: 'emp-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      employeeCode: 'EMP-00001',
      department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
      position: { id: 'pos-1', title: 'Developer', code: 'DEV' },
      manager: null,
      directReports: [],
      user: { id: 'user-1', email: 'john@example.com', role: 'EMPLOYEE', isActive: true },
      status: EmployeeStatus.ACTIVE,
    };

    it('should return employee with all relations', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(mockEmployee);

      const result = await service.findById('emp-1', tenantId);

      expect(mockPrismaService.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId, isDeleted: false },
        include: expect.objectContaining({
          department: expect.any(Object),
          position: expect.any(Object),
          manager: expect.any(Object),
          directReports: expect.any(Object),
          user: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should not return deleted employees', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      await expect(service.findById('deleted-emp', tenantId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'deleted-emp', tenantId, isDeleted: false },
        include: expect.any(Object),
      });
    });
  });

  describe('create', () => {
    const createDto: CreateEmployeeDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      departmentId: 'dept-1',
      positionId: 'pos-1',
    };

    it('should create an employee with auto-generated code', async () => {
      mockPrismaService.employee.count.mockResolvedValue(0);
      mockPrismaService.employee.create.mockResolvedValue({
        id: 'new-emp-1',
        employeeCode: 'EMP-00001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: EmployeeStatus.PROBATION,
        department: null,
        position: null,
        manager: null,
      });

      const result = await service.create(tenantId, createDto);

      expect(mockPrismaService.employee.count).toHaveBeenCalledWith({
        where: { tenantId, isDeleted: false },
      });
      expect(mockPrismaService.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          employeeCode: 'EMP-00001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          country: 'VN',
          status: EmployeeStatus.PROBATION,
        }),
        include: expect.any(Object),
      });
      expect(result.employeeCode).toBe('EMP-00001');
    });

    it('should generate sequential employee codes', async () => {
      mockPrismaService.employee.count.mockResolvedValue(42);
      mockPrismaService.employee.create.mockResolvedValue({
        id: 'new-emp-43',
        employeeCode: 'EMP-00043',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john43@example.com',
        status: EmployeeStatus.PROBATION,
        department: null,
        position: null,
        manager: null,
      });

      const result = await service.create(tenantId, createDto);
      expect(result.employeeCode).toBe('EMP-00043');
    });
  });

  describe('update', () => {
    const updateDto: UpdateEmployeeDto = {
      firstName: 'Johnny',
      status: EmployeeStatus.ACTIVE,
    };

    it('should update existing employee', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      mockPrismaService.employee.update.mockResolvedValue({
        id: 'emp-1',
        firstName: 'Johnny',
        status: EmployeeStatus.ACTIVE,
        department: null,
        position: null,
        manager: null,
      });

      const result = await service.update('emp-1', tenantId, updateDto);

      expect(mockPrismaService.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId, isDeleted: false },
      });
      expect(result.firstName).toBe('Johnny');
      expect(result.status).toBe(EmployeeStatus.ACTIVE);
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', tenantId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle partial updates', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      mockPrismaService.employee.update.mockResolvedValue({
        id: 'emp-1',
        firstName: 'Johnny',
        department: null,
        position: null,
        manager: null,
      });

      await service.update('emp-1', tenantId, { firstName: 'Johnny' });

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { firstName: 'Johnny' },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should soft delete an employee', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      mockPrismaService.employee.update.mockResolvedValue({
        id: 'emp-1',
        isDeleted: true,
      });

      const result = await service.remove('emp-1', tenantId);

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { isDeleted: true },
      });
      expect(result.isDeleted).toBe(true);
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
