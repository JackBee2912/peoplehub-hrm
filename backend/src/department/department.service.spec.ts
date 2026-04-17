import { Test, TestingModule } from '@nestjs/testing';
import type { DepartmentNode } from './department.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let prisma: PrismaService;

  const tenantId = 'tenant-1';

  const mockPrismaService = {
    department: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findAllTree', () => {
    it('should return empty array when no departments exist', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([]);

      const result = await service.findAllTree(tenantId);

      expect(result).toEqual([]);
    });

    it('should build tree structure from flat departments', async () => {
      const flatDepts = [
        {
          id: 'dept-1',
          name: 'Engineering',
          code: 'ENG',
          description: null,
          parentId: null,
          managerId: null,
          budget: null,
          costCenter: null,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dept-2',
          name: 'Frontend Team',
          code: 'FE',
          description: null,
          parentId: 'dept-1',
          managerId: null,
          budget: null,
          costCenter: null,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dept-3',
          name: 'Backend Team',
          code: 'BE',
          description: null,
          parentId: 'dept-1',
          managerId: null,
          budget: null,
          costCenter: null,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dept-4',
          name: 'HR',
          code: 'HR',
          description: null,
          parentId: null,
          managerId: null,
          budget: null,
          costCenter: null,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.department.findMany.mockResolvedValue(flatDepts);

      const result = await service.findAllTree(tenantId);

      // Should have 2 root departments
      expect(result).toHaveLength(2);

      // Engineering should have 2 children
      const engineering = result.find((d: DepartmentNode) => d.name === 'Engineering');
      expect(engineering).toBeDefined();
      expect(engineering!.children).toHaveLength(2);
      expect(engineering!.children.map((c: DepartmentNode) => c.name)).toContain('Frontend Team');
      expect(engineering!.children.map((c: DepartmentNode) => c.name)).toContain('Backend Team');

      // HR should have no children
      const hr = result.find((d: DepartmentNode) => d.name === 'HR');
      expect(hr).toBeDefined();
      expect(hr!.children).toHaveLength(0);
    });

    it('should only return active departments', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([]);

      await service.findAllTree(tenantId);

      expect(mockPrismaService.department.findMany).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: expect.any(Object),
      });
    });

    it('should handle deep nesting (3+ levels)', async () => {
      const flatDepts = [
        {
          id: 'd1', name: 'Level1', code: 'L1', description: null, parentId: null,
          managerId: null, budget: null, costCenter: null, isActive: true, sortOrder: 0,
          createdAt: new Date(), updatedAt: new Date(),
        },
        {
          id: 'd2', name: 'Level2', code: 'L2', description: null, parentId: 'd1',
          managerId: null, budget: null, costCenter: null, isActive: true, sortOrder: 0,
          createdAt: new Date(), updatedAt: new Date(),
        },
        {
          id: 'd3', name: 'Level3', code: 'L3', description: null, parentId: 'd2',
          managerId: null, budget: null, costCenter: null, isActive: true, sortOrder: 0,
          createdAt: new Date(), updatedAt: new Date(),
        },
      ];

      mockPrismaService.department.findMany.mockResolvedValue(flatDepts);

      const result = await service.findAllTree(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].name).toBe('Level3');
    });
  });

  describe('findById', () => {
    const mockDept = {
      id: 'dept-1',
      name: 'Engineering',
      code: 'ENG',
      tenantId: 'tenant-1',
      parent: null,
      manager: null,
    };

    it('should return department with parent and manager', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(mockDept);

      const result = await service.findById('dept-1', tenantId);

      expect(mockPrismaService.department.findFirst).toHaveBeenCalledWith({
        where: { id: 'dept-1', tenantId },
        include: {
          parent: { select: { id: true, name: true, code: true } },
          manager: { select: { id: true, email: true } },
        },
      });
      expect(result).toEqual(mockDept);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto: CreateDepartmentDto = {
      name: 'Engineering',
      code: 'ENG',
      description: 'Engineering department',
    };

    it('should create a department', async () => {
      mockPrismaService.department.create.mockResolvedValue({
        id: 'new-dept-1',
        name: 'Engineering',
        code: 'ENG',
        parent: null,
        manager: null,
      });

      const result = await service.create(tenantId, createDto);

      expect(mockPrismaService.department.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          name: 'Engineering',
          code: 'ENG',
          description: 'Engineering department',
          isActive: true,
          sortOrder: 0,
        }),
        include: {
          parent: { select: { id: true, name: true, code: true } },
          manager: { select: { id: true, email: true } },
        },
      });
    });

    it('should validate parent exists when parentId is provided', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({ id: 'parent-1' });
      mockPrismaService.department.create.mockResolvedValue({
        id: 'new-dept-1',
        name: 'Sub Team',
        parent: { id: 'parent-1' },
        manager: null,
      });

      const dto: CreateDepartmentDto = { name: 'Sub Team', parentId: 'parent-1' };
      await service.create(tenantId, dto);

      expect(mockPrismaService.department.findFirst).toHaveBeenCalledWith({
        where: { id: 'parent-1', tenantId },
      });
    });

    it('should throw when parent department does not exist', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      const dto: CreateDepartmentDto = { name: 'Sub Team', parentId: 'nonexistent' };
      await expect(service.create(tenantId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should default isActive to true when not specified', async () => {
      mockPrismaService.department.create.mockResolvedValue({
        id: 'new-dept-1',
        name: 'Engineering',
        parent: null,
        manager: null,
      });

      await service.create(tenantId, createDto);

      expect(mockPrismaService.department.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isActive: true }),
        include: expect.any(Object),
      });
    });

    it('should respect explicit isActive value', async () => {
      mockPrismaService.department.create.mockResolvedValue({
        id: 'new-dept-1',
        name: 'Engineering',
        parent: null,
        manager: null,
      });

      await service.create(tenantId, { ...createDto, isActive: false });

      expect(mockPrismaService.department.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isActive: false }),
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateDepartmentDto = {
      name: 'Updated Engineering',
    };

    it('should update an existing department', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({ id: 'dept-1' });
      mockPrismaService.department.update.mockResolvedValue({
        id: 'dept-1',
        name: 'Updated Engineering',
        parent: null,
        manager: null,
      });

      const result = await service.update('dept-1', tenantId, updateDto);

      expect(result.name).toBe('Updated Engineering');
    });

    it('should throw NotFoundException when department not found', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', tenantId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent setting self as parent', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({ id: 'dept-1' });

      await expect(
        service.update('dept-1', tenantId, { parentId: 'dept-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate new parent exists', async () => {
      mockPrismaService.department.findFirst
        .mockResolvedValueOnce({ id: 'dept-1' }) // existing check
        .mockResolvedValueOnce(null); // parent check

      await expect(
        service.update('dept-1', tenantId, { parentId: 'nonexistent-parent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a department with no children and no employees', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({
        id: 'dept-1',
        children: [],
        employees: [],
      });
      mockPrismaService.department.delete.mockResolvedValue({ id: 'dept-1' });

      const result = await service.remove('dept-1', tenantId);

      expect(mockPrismaService.department.delete).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
      });
    });

    it('should throw BadRequestException when department has children', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({
        id: 'dept-1',
        children: [{ id: 'child-1' }],
        employees: [],
      });

      await expect(service.remove('dept-1', tenantId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when department has employees', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({
        id: 'dept-1',
        children: [],
        employees: [{ id: 'emp-1' }],
      });

      await expect(service.remove('dept-1', tenantId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when department not found', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
