import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto/department.dto";

export interface DepartmentNode {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parentId: string | null;
  managerId: string | null;
  budget: any;
  costCenter: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  children: DepartmentNode[];
}

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async findAllTree(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        parentId: true,
        managerId: true,
        budget: true,
        costCenter: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.buildTree(departments);
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        parentId: true,
        managerId: true,
        budget: true,
        costCenter: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string, tenantId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, email: true } },
      },
    });

    if (!department) {
      throw new NotFoundException("Department not found");
    }

    return department;
  }

  async create(tenantId: string, dto: CreateDepartmentDto) {
    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.department.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException("Parent department not found");
      }
    }

    const department = await this.prisma.department.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        parentId: dto.parentId,
        managerId: dto.managerId,
        budget: dto.budget,
        costCenter: dto.costCenter,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, email: true } },
      },
    });

    return department;
  }

  async update(id: string, tenantId: string, dto: UpdateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Department not found");
    }

    // Prevent setting self as parent
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException("A department cannot be its own parent");
    }

    // Prevent creating circular hierarchy
    if (dto.parentId) {
      const parent = await this.prisma.department.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException("Parent department not found");
      }
      // Check if the new parent is a descendant of the current department
      if (await this.isDescendant(dto.parentId, id, tenantId)) {
        throw new BadRequestException("Cannot set a descendant department as parent (circular reference)");
      }
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.managerId !== undefined) data.managerId = dto.managerId;
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.costCenter !== undefined) data.costCenter = dto.costCenter;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    const department = await this.prisma.department.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, email: true } },
      },
    });

    return department;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: { children: true, employees: { where: { isDeleted: false }, take: 1 } },
    });

    if (!existing) {
      throw new NotFoundException("Department not found");
    }

    if (existing.children.length > 0) {
      throw new BadRequestException("Cannot delete a department with child departments. Reassign or delete children first.");
    }

    if (existing.employees.length > 0) {
      throw new BadRequestException("Cannot delete a department with assigned employees. Reassign employees first.");
    }

    const department = await this.prisma.department.delete({
      where: { id },
    });

    return department;
  }

  private buildTree(departments: any[]): DepartmentNode[] {
    const map = new Map<string, DepartmentNode>();
    const roots: DepartmentNode[] = [];

    // Create nodes
    for (const dept of departments) {
      map.set(dept.id, { ...dept, children: [] });
    }

    // Build tree
    for (const dept of departments) {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private async isDescendant(potentialDescendantId: string, ancestorId: string, tenantId: string): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === ancestorId) return true;
      if (visited.has(currentId)) break; // Safety against existing cycles
      visited.add(currentId);

      const dept = await this.prisma.department.findFirst({
        where: { id: currentId, tenantId },
        select: { parentId: true },
      });
      currentId = dept?.parentId ?? null;
    }

    return false;
  }
}
