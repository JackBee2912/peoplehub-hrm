import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreatePositionDto, UpdatePositionDto } from "./dto/position.dto";
import { PaginationDto, buildPaginatedResult } from "../common/dto/pagination.dto";

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where = { tenantId };

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
        orderBy: { [sortBy]: sortOrder as any },
        skip,
        take: limit,
      }),
      this.prisma.position.count({ where }),
    ]);

    return buildPaginatedResult(positions, total, page, limit);
  }

  async findById(id: string, tenantId: string) {
    const position = await this.prisma.position.findFirst({
      where: { id, tenantId },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    if (!position) {
      throw new NotFoundException("Position not found");
    }

    return position;
  }

  async create(tenantId: string, dto: CreatePositionDto) {
    // Validate salary range
    if (dto.minSalary !== undefined && dto.maxSalary !== undefined && dto.minSalary > dto.maxSalary) {
      throw new BadRequestException("Minimum salary cannot exceed maximum salary");
    }

    // Validate department exists if provided
    if (dto.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, tenantId },
      });
      if (!dept) {
        throw new NotFoundException("Department not found");
      }
    }

    const position = await this.prisma.position.create({
      data: {
        tenantId,
        title: dto.title,
        code: dto.code,
        description: dto.description,
        departmentId: dto.departmentId,
        level: dto.level ?? 1,
        minSalary: dto.minSalary,
        maxSalary: dto.maxSalary,
        headcount: dto.headcount ?? 1,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return position;
  }

  async update(id: string, tenantId: string, dto: UpdatePositionDto) {
    const existing = await this.prisma.position.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Position not found");
    }

    // Validate salary range
    const minSalary = dto.minSalary !== undefined ? dto.minSalary : (existing.minSalary as number);
    const maxSalary = dto.maxSalary !== undefined ? dto.maxSalary : (existing.maxSalary as number);
    if (minSalary !== undefined && maxSalary !== undefined && minSalary > maxSalary) {
      throw new BadRequestException("Minimum salary cannot exceed maximum salary");
    }

    // Validate department exists if provided
    if (dto.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, tenantId },
      });
      if (!dept) {
        throw new NotFoundException("Department not found");
      }
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId;
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.minSalary !== undefined) data.minSalary = dto.minSalary;
    if (dto.maxSalary !== undefined) data.maxSalary = dto.maxSalary;
    if (dto.headcount !== undefined) data.headcount = dto.headcount;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const position = await this.prisma.position.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return position;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.position.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Position not found");
    }

    const position = await this.prisma.position.delete({
      where: { id },
    });

    return position;
  }
}
