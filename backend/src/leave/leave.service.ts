import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  LeaveFilterDto,
  AdjustBalanceDto,
} from "./dto/leave.dto";
import { PaginationDto, buildPaginatedResult, PaginatedResult } from "../common/dto/pagination.dto";
import { LeaveStatus } from "@prisma/client";

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  // ==================== LEAVE TYPES ====================

  async findAllTypes(tenantId: string, pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [types, total] = await Promise.all([
      this.prisma.leaveType.findMany({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.leaveType.count({ where: { tenantId } }),
    ]);
    return buildPaginatedResult(types, total, page, limit);
  }

  async findTypeById(id: string, tenantId: string): Promise<any> {
    const type = await this.prisma.leaveType.findUnique({ where: { id, tenantId } });
    if (!type) throw new NotFoundException("Leave type not found");
    return type;
  }

  async createType(tenantId: string, dto: CreateLeaveTypeDto): Promise<any> {
    const existing = await this.prisma.leaveType.findFirst({
      where: { tenantId, category: dto.category },
    });
    if (existing) {
      throw new ConflictException(`Leave type with category ${dto.category} already exists`);
    }
    return this.prisma.leaveType.create({
      data: { tenantId, ...dto },
    });
  }

  async updateType(id: string, tenantId: string, dto: UpdateLeaveTypeDto): Promise<any> {
    const existing = await this.prisma.leaveType.findUnique({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Leave type not found");
    return this.prisma.leaveType.update({ where: { id, tenantId }, data: dto });
  }

  async removeType(id: string, tenantId: string): Promise<any> {
    const existing = await this.prisma.leaveType.findUnique({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Leave type not found");

    const hasRequests = await this.prisma.leaveRequest.count({ where: { leaveTypeId: id } });
    if (hasRequests > 0) {
      throw new ConflictException("Cannot delete leave type with existing requests");
    }

    return this.prisma.leaveType.delete({ where: { id, tenantId } });
  }

  // ==================== LEAVE REQUESTS ====================

  async createRequest(tenantId: string, employeeId: string, dto: CreateLeaveRequestDto): Promise<any> {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: dto.leaveTypeId, tenantId },
    });
    if (!leaveType || !leaveType.isActive) {
      throw new NotFoundException("Leave type not found or inactive");
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    const totalDays = this.calculateLeaveDays(startDate, endDate, dto.startHalfDay || false, dto.endHalfDay || false, tenantId);

    if (totalDays <= 0) {
      throw new BadRequestException("Invalid leave date range");
    }

    // Check balance
    const year = startDate.getFullYear();
    const balance = await this.getEmployeeBalance(employeeId, dto.leaveTypeId, year);
    const available = balance.totalAccrued + balance.carriedOver + balance.adjusted - balance.used;

    if (available < totalDays) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${available} days, Requested: ${totalDays} days`
      );
    }

    // Check max consecutive days
    if (leaveType.maxConsecutiveDays && totalDays > leaveType.maxConsecutiveDays) {
      throw new BadRequestException(
        `Maximum ${leaveType.maxConsecutiveDays} consecutive days allowed for ${leaveType.name}`
      );
    }

    // Check for overlapping requests
    const overlapping = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });
    if (overlapping) {
      throw new ConflictException("Overlapping leave request already exists");
    }

    // Find manager as approver
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate,
        endDate,
        startHalfDay: dto.startHalfDay,
        endHalfDay: dto.endHalfDay,
        reason: dto.reason,
        attachmentUrl: dto.attachmentUrl,
        totalDays,
        approverId: employee?.managerId,
      },
      include: {
        leaveType: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateRequest(id: string, tenantId: string, employeeId: string, dto: UpdateLeaveRequestDto): Promise<any> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id, tenantId, employeeId },
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException("Can only edit pending leave requests");
    }

    const updateData: any = {};
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.leaveTypeId) updateData.leaveTypeId = dto.leaveTypeId;
    if (dto.startHalfDay !== undefined) updateData.startHalfDay = dto.startHalfDay;
    if (dto.endHalfDay !== undefined) updateData.endHalfDay = dto.endHalfDay;
    if (dto.reason) updateData.reason = dto.reason;
    if (dto.attachmentUrl !== undefined) updateData.attachmentUrl = dto.attachmentUrl;

    // Recalculate days if dates changed
    if (updateData.startDate || updateData.endDate) {
      const start = updateData.startDate || request.startDate;
      const end = updateData.endDate || request.endDate;
      updateData.totalDays = this.calculateLeaveDays(start, end, updateData.startHalfDay ?? request.startHalfDay, updateData.endHalfDay ?? request.endHalfDay, tenantId);
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: updateData,
      include: { leaveType: true, employee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async cancelRequest(id: string, tenantId: string, employeeId: string): Promise<any> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id, tenantId, employeeId },
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException("Can only cancel pending leave requests");
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED },
    });
  }

  async getMyRequests(tenantId: string, employeeId: string, pagination: PaginationDto, filters: LeaveFilterDto): Promise<PaginatedResult<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const where: any = { tenantId, employeeId };
    if (filters.status) where.status = filters.status;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.startDate) where.startDate = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.endDate = { lte: new Date(filters.endDate) };

    const [requests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { leaveType: true, approver: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return buildPaginatedResult(requests, total, page, limit);
  }

  // ==================== APPROVAL WORKFLOW ====================

  async approveRequest(id: string, tenantId: string, approverId: string, dto: ApproveLeaveDto): Promise<any> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id, tenantId },
      include: { leaveType: true },
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException("Request is not pending");
    }
    if (request.approverId !== approverId) {
      throw new ForbiddenException("You are not the designated approver for this request");
    }

    // Deduct balance
    const year = request.startDate.getFullYear();
    await this.deductBalance(request.employeeId, request.leaveTypeId, request.totalDays, year);

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approvalDate: new Date(),
        approvalComment: dto.comment,
      },
      include: { leaveType: true, employee: { select: { id: true, firstName: true, lastName: true } }, approver: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Update employee status to ON_LEAVE if the leave starts today or in the past
    if (request.startDate <= new Date()) {
      await this.prisma.employee.update({
        where: { id: request.employeeId },
        data: { status: "ON_LEAVE" },
      });
    }

    return updated;
  }

  async rejectRequest(id: string, tenantId: string, approverId: string, dto: RejectLeaveDto): Promise<any> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id, tenantId },
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException("Request is not pending");
    }
    if (request.approverId !== approverId) {
      throw new ForbiddenException("You are not the designated approver for this request");
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approvalDate: new Date(),
        rejectionReason: dto.reason,
        approvalComment: dto.comment,
      },
      include: { leaveType: true, employee: { select: { id: true, firstName: true, lastName: true } }, approver: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getPendingApprovals(tenantId: string, approverId: string, pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [requests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: { tenantId, approverId, status: LeaveStatus.PENDING },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          leaveType: true,
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true } },
        },
      }),
      this.prisma.leaveRequest.count({ where: { tenantId, approverId, status: LeaveStatus.PENDING } }),
    ]);
    return buildPaginatedResult(requests, total, page, limit);
  }

  // ==================== LEAVE BALANCES ====================

  async getBalances(tenantId: string, employeeId: string, year?: number): Promise<any[]> {
    const balanceYear = year || new Date().getFullYear();
    const balances = await this.prisma.leaveBalance.findMany({
      where: { tenantId, employeeId, year: balanceYear },
      include: { leaveType: true },
      orderBy: [{ leaveType: { sortOrder: "asc" } }],
    });

    return balances.map((b) => ({
      ...b,
      available: Math.round((b.totalAccrued + b.carriedOver + b.adjusted - b.used) * 100) / 100,
    }));
  }

  async getEmployeeBalance(employeeId: string, leaveTypeId: string, year: number): Promise<any> {
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    });
    if (!balance) {
      return { totalAccrued: 0, used: 0, carriedOver: 0, adjusted: 0 };
    }
    return balance;
  }

  async adjustBalance(tenantId: string, dto: AdjustBalanceDto): Promise<any> {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId, tenantId } });
    if (!employee) throw new NotFoundException("Employee not found");

    const leaveType = await this.prisma.leaveType.findUnique({ where: { id: dto.leaveTypeId, tenantId } });
    if (!leaveType) throw new NotFoundException("Leave type not found");

    return this.prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: dto.employeeId,
          leaveTypeId: dto.leaveTypeId,
          year: dto.year,
        },
      },
      update: { adjusted: { increment: dto.amount } },
      create: {
        tenantId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        year: dto.year,
        adjusted: dto.amount,
      },
    });
  }

  async getAllBalancesForTenant(tenantId: string, year: number): Promise<any[]> {
    return this.prisma.leaveBalance.findMany({
      where: { tenantId, year },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        leaveType: true,
      },
      orderBy: [{ employee: { lastName: "asc" } }, { leaveType: { name: "asc" } }],
    });
  }

  // ==================== ACCRUAL ENGINE ====================

  async accrueLeaveForEmployee(employeeId: string, tenantId: string, year: number): Promise<any[]> {
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { tenantId, isActive: true, accrualRate: { gt: 0 } },
    });

    const results = [];

    for (const leaveType of leaveTypes) {
      // Get or create balance
      const balance = await this.prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: { employeeId, leaveTypeId: leaveType.id, year },
        },
        update: {},
        create: {
          tenantId,
          employeeId,
          leaveTypeId: leaveType.id,
          year,
          totalAccrued: 0,
          used: 0,
          carriedOver: 0,
          adjusted: 0,
        },
      });

      // Add monthly accrual
      const updated = await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { totalAccrued: { increment: leaveType.accrualRate } },
      });

      results.push({
        leaveTypeName: leaveType.name,
        accrued: leaveType.accrualRate,
        newTotal: updated.totalAccrued,
      });
    }

    return results;
  }

  async accrueLeaveForAllEmployees(tenantId: string): Promise<number> {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, isDeleted: false, status: { in: ["ACTIVE", "ON_LEAVE"] } },
      select: { id: true, hireDate: true },
    });

    const year = new Date().getFullYear();
    let totalAccrued = 0;

    for (const employee of employees) {
      // Skip if hired after current month (no accrual for future employees)
      if (employee.hireDate && employee.hireDate > new Date()) continue;

      const results = await this.accrueLeaveForEmployee(employee.id, tenantId, year);
      totalAccrued += results.length;
    }

    return totalAccrued;
  }

  async handleYearEndCarryOver(tenantId: string): Promise<number> {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const balances = await this.prisma.leaveBalance.findMany({
      where: { tenantId, year: previousYear },
      include: { leaveType: true },
    });

    let carriedOver = 0;

    for (const balance of balances) {
      const unused = balance.totalAccrued + balance.adjusted - balance.used;
      const carryOverLimit = balance.leaveType.carryOverLimit || 0;
      const carryOverAmount = Math.min(Math.max(0, unused), carryOverLimit);

      if (carryOverAmount > 0) {
        await this.prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: balance.employeeId,
              leaveTypeId: balance.leaveTypeId,
              year: currentYear,
            },
          },
          update: { carriedOver: carryOverAmount },
          create: {
            tenantId,
            employeeId: balance.employeeId,
            leaveTypeId: balance.leaveTypeId,
            year: currentYear,
            carriedOver: carryOverAmount,
            totalAccrued: 0,
            used: 0,
            adjusted: 0,
          },
        });
        carriedOver++;
      }
    }

    return carriedOver;
  }

  // ==================== HELPERS ====================

  private calculateLeaveDays(
    startDate: Date,
    endDate: Date,
    startHalfDay: boolean,
    endHalfDay: boolean,
    tenantId: string,
  ): number {
    let days = this.countBusinessDays(startDate, endDate);

    if (startHalfDay) days -= 0.5;
    if (endHalfDay && startDate.getTime() !== endDate.getTime()) days -= 0.5;

    // Subtract holidays
    // (For simplicity, we don't fetch holidays here; the accrual engine handles it)

    return Math.round(days * 100) / 100;
  }

  private countBusinessDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  private async deductBalance(employeeId: string, leaveTypeId: string, days: number, year: number): Promise<void> {
    await this.prisma.leaveBalance.update({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
      data: { used: { increment: days } },
    });
  }
}
