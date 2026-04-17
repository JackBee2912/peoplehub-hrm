import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CheckInDto, CheckOutDto, AttendanceFilterDto, AttendanceStatsDto } from "./dto/attendance.dto";
import { PaginationDto, buildPaginatedResult, PaginatedResult } from "../common/dto/pagination.dto";
import { AttendanceStatus, CheckInOutType } from "@prisma/client";

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(tenantId: string, employeeId: string, dto: CheckInDto, ipAddress: string): Promise<any> {
    const today = this.getStartOfDay(new Date());

    // Check if already checked in today
    const existing = await this.prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing && existing.checkInTime) {
      throw new ConflictException("Already checked in today");
    }

    // Get employee's shift for attendance status calculation
    const shiftAssignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: { shift: true },
      orderBy: { startDate: "desc" },
    });

    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let lateMinutes = 0;

    if (shiftAssignment?.shift) {
      const shift = shiftAssignment.shift;
      const now = new Date();
      const shiftStart = this.getShiftStartTime(today, shift.startTime);
      const diffMinutes = (now.getTime() - shiftStart.getTime()) / (1000 * 60);

      if (diffMinutes > shift.lateThreshold) {
        status = AttendanceStatus.LATE;
        lateMinutes = Math.floor(diffMinutes);
      }
    }

    const log = await this.prisma.attendanceLog.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      update: {
        checkInTime: new Date(),
        ipAddress,
        location: dto.location,
        status,
        lateMinutes,
        shiftId: shiftAssignment?.shiftId,
      },
      create: {
        tenantId,
        employeeId,
        date: today,
        checkInTime: new Date(),
        status,
        lateMinutes,
        ipAddress,
        location: dto.location,
        shiftId: shiftAssignment?.shiftId,
      },
    });

    return log;
  }

  async checkOut(tenantId: string, employeeId: string, dto: CheckOutDto, ipAddress: string): Promise<any> {
    const today = this.getStartOfDay(new Date());

    const existing = await this.prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!existing) {
      throw new BadRequestException("No check-in record found for today");
    }

    if (!existing.checkInTime) {
      throw new BadRequestException("Not checked in yet");
    }

    if (existing.checkOutTime) {
      throw new ConflictException("Already checked out today");
    }

    let workHours = 0;
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;
    let status = existing.status;

    // Get shift to calculate work hours
    const shiftAssignment = existing.shiftId
      ? await this.prisma.shiftAssignment.findUnique({
          where: { id: existing.shiftId },
          include: { shift: true },
        })
      : null;

    const checkOutTime = new Date();

    if (shiftAssignment?.shift) {
      const shift = shiftAssignment.shift;
      const checkInTime = existing.checkInTime!;
      const breakMinutes = shift.breakMinutes || 0;
      const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
      workHours = Math.round(((totalMinutes - breakMinutes) / 60) * 100) / 100;

      const shiftEnd = this.getShiftStartTime(today, shift.endTime);
      const diffFromEnd = (checkOutTime.getTime() - shiftEnd.getTime()) / (1000 * 60);

      if (diffFromEnd < -shift.earlyLeaveThreshold) {
        earlyLeaveMinutes = Math.abs(Math.floor(diffFromEnd));
        status = AttendanceStatus.EARLY_LEAVE;
      } else if (diffFromEnd > 0) {
        overtimeMinutes = Math.floor(diffFromEnd);
      }
    } else {
      const checkInTime = existing.checkInTime!;
      const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
      workHours = Math.round((totalMinutes / 60) * 100) / 100;
    }

    const log = await this.prisma.attendanceLog.update({
      where: { employeeId_date: { employeeId, date: today } },
      data: {
        checkOutTime,
        workHours,
        earlyLeaveMinutes,
        overtimeMinutes,
        status,
        notes: dto.notes || existing.notes,
      },
    });

    return log;
  }

  async getLogs(
    tenantId: string,
    pagination: PaginationDto,
    filters: AttendanceFilterDto,
    employeeId?: string,
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };

    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.startDate) {
      where.date = { ...where.date, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.date = { ...where.date, lte: new Date(filters.endDate) };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const sortBy = pagination.sortBy || "date";
    const sortOrder = pagination.sortOrder || "desc";

    const [logs, total] = await Promise.all([
      this.prisma.attendanceLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
      }),
      this.prisma.attendanceLog.count({ where }),
    ]);

    return buildPaginatedResult(logs, total, page, limit);
  }

  async getStats(tenantId: string, employeeId: string, dto: AttendanceStatsDto): Promise<any> {
    const startDate = dto.startDate ? new Date(dto.startDate) : this.getStartOfMonth(new Date());
    const endDate = dto.endDate ? new Date(dto.endDate) : this.getEndOfMonth(new Date());

    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        tenantId,
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    const totalDays = logs.length;
    const presentDays = logs.filter((l) => l.status === AttendanceStatus.PRESENT).length;
    const lateDays = logs.filter((l) => l.status === AttendanceStatus.LATE).length;
    const absentDays = logs.filter((l) => l.status === AttendanceStatus.ABSENT).length;
    const earlyLeaveDays = logs.filter((l) => l.status === AttendanceStatus.EARLY_LEAVE).length;
    const totalWorkHours = logs.reduce((sum, l) => sum + (l.workHours || 0), 0);
    const totalLateMinutes = logs.reduce((sum, l) => sum + l.lateMinutes, 0);
    const totalOvertimeMinutes = logs.reduce((sum, l) => sum + l.overtimeMinutes, 0);

    return {
      period: { start: startDate, end: endDate },
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      earlyLeaveDays,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      totalLateMinutes,
      totalOvertimeMinutes,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    };
  }

  async getTodayStatus(tenantId: string, employeeId: string): Promise<any> {
    const today = this.getStartOfDay(new Date());
    const log = await this.prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    if (!log) {
      return { checkedIn: false, date: today };
    }

    return {
      checkedIn: !!log.checkInTime,
      checkedOut: !!log.checkOutTime,
      checkInTime: log.checkInTime,
      checkOutTime: log.checkOutTime,
      status: log.status,
      lateMinutes: log.lateMinutes,
      workHours: log.workHours,
      location: log.location,
    };
  }

  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  }

  private getShiftStartTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
}
