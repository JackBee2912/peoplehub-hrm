import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CreateShiftDto,
  UpdateShiftDto,
  AssignShiftDto,
  AssignMultipleShiftsDto,
  ScheduleFilterDto,
} from "./dto/shift.dto";
import { PaginationDto, buildPaginatedResult, PaginatedResult } from "../common/dto/pagination.dto";

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.shift.count({ where: { tenantId } }),
    ]);

    return buildPaginatedResult(shifts, total, page, limit);
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const shift = await this.prisma.shift.findUnique({
      where: { id, tenantId },
      include: {
        assignments: {
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException("Shift not found");
    }
    return shift;
  }

  async create(tenantId: string, dto: CreateShiftDto): Promise<any> {
    if (dto.isDefault) {
      await this.prisma.shift.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        type: dto.type,
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakStart: dto.breakStart,
        breakEnd: dto.breakEnd,
        breakMinutes: dto.breakMinutes,
        workHours: dto.workHours,
        lateThreshold: dto.lateThreshold,
        earlyLeaveThreshold: dto.earlyLeaveThreshold,
        color: dto.color,
        isActive: dto.isActive,
        isDefault: dto.isDefault,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateShiftDto): Promise<any> {
    const existing = await this.prisma.shift.findUnique({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException("Shift not found");
    }

    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.shift.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.update({
      where: { id, tenantId },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string): Promise<any> {
    const existing = await this.prisma.shift.findUnique({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException("Shift not found");
    }

    // Check if shift has active assignments
    const activeAssignments = await this.prisma.shiftAssignment.count({
      where: {
        shiftId: id,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    if (activeAssignments > 0) {
      throw new ConflictException("Cannot delete shift with active assignments. End assignments first.");
    }

    return this.prisma.shift.delete({ where: { id, tenantId } });
  }

  async assignShift(tenantId: string, dto: AssignShiftDto): Promise<any> {
    // Verify shift exists and belongs to tenant
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId, tenantId },
    });
    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    // Verify employee exists and belongs to tenant
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    // Check for conflicting assignments
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    const conflict = await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId: dto.employeeId,
        startDate: { lte: endDate || new Date("2099-12-31") },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException("Employee already has an overlapping shift assignment");
    }

    return this.prisma.shiftAssignment.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        shiftId: dto.shiftId,
        startDate,
        endDate,
        dayOfWeek: dto.dayOfWeek,
      },
      include: {
        shift: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async assignMultipleShifts(tenantId: string, dto: AssignMultipleShiftsDto): Promise<any[]> {
    const results: any[] = [];

    for (const employeeId of dto.employeeIds) {
      // Verify employee
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId, tenantId },
      });
      if (!employee) continue;

      // Check for conflicts
      const startDate = new Date(dto.startDate);
      const endDate = dto.endDate ? new Date(dto.endDate) : null;

      const conflict = await this.prisma.shiftAssignment.findFirst({
        where: {
          employeeId,
          startDate: { lte: endDate || new Date("2099-12-31") },
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        },
      });

      if (conflict) continue;

      const assignment = await this.prisma.shiftAssignment.create({
        data: {
          tenantId,
          employeeId,
          shiftId: dto.shiftId,
          startDate,
          endDate,
        },
        include: {
          shift: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      results.push(assignment);
    }

    return results;
  }

  async endAssignment(assignmentId: string, tenantId: string): Promise<any> {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: assignmentId, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }

    return this.prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: { endDate: new Date() },
    });
  }

  async getSchedule(tenantId: string, filters: ScheduleFilterDto): Promise<any[]> {
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date();
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      tenantId,
      startDate: { lte: endDate },
      OR: [{ endDate: null }, { endDate: { gte: startDate } }],
    };

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    const assignments = await this.prisma.shiftAssignment.findMany({
      where,
      include: {
        shift: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            departmentId: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Filter by department if specified
    if (filters.departmentId) {
      return assignments.filter((a) => a.employee.departmentId === filters.departmentId);
    }

    return assignments;
  }

  async getEmployeeCurrentShift(tenantId: string, employeeId: string): Promise<any> {
    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: { shift: true },
      orderBy: { startDate: "desc" },
    });

    return assignment;
  }
}
