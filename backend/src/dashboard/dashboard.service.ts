import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { TeamAttendanceDto, TeamOverviewDto } from "./dto/dashboard.dto";
import { LeaveStatus, AttendanceStatus } from "@prisma/client";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTeamAttendance(tenantId: string, managerId: string, dto: TeamAttendanceDto): Promise<any> {
    const today = dto.date ? new Date(dto.date) : new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get direct reports
    const directReports = await this.prisma.employee.findMany({
      where: {
        tenantId,
        managerId,
        isDeleted: false,
        status: { in: ["ACTIVE", "ON_LEAVE", "PROBATION"] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        departmentId: true,
        positionId: true,
      },
    });

    if (dto.departmentId) {
      // Filter to only employees in specified department (including sub-departments)
    }

    // Get today's attendance for all direct reports
    const employeeIds = directReports.map((e) => e.id);

    const attendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    // Get any on-leave requests approved for today
    const onLeave = await this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        status: LeaveStatus.APPROVED,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      include: { leaveType: true },
    });

    // Build team attendance
    const teamAttendance = directReports.map((emp) => {
      const log = attendanceLogs.find((l) => l.employeeId === emp.id);
      const leave = onLeave.find((l) => l.employeeId === emp.id);

      return {
        employee: emp,
        attendance: log
          ? {
              status: leave ? AttendanceStatus.ON_LEAVE : log.status,
              checkInTime: log.checkInTime,
              checkOutTime: log.checkOutTime,
              workHours: log.workHours,
              lateMinutes: log.lateMinutes,
              earlyLeaveMinutes: log.earlyLeaveMinutes,
            }
          : {
              status: leave ? AttendanceStatus.ON_LEAVE : AttendanceStatus.ABSENT,
              leaveInfo: leave ? { type: leave.leaveType.name, reason: leave.reason } : null,
            },
      };
    });

    const presentCount = teamAttendance.filter(
      (t) => t.attendance.status === AttendanceStatus.PRESENT || t.attendance.status === AttendanceStatus.LATE
    ).length;
    const absentCount = teamAttendance.filter((t) => t.attendance.status === AttendanceStatus.ABSENT).length;
    const onLeaveCount = teamAttendance.filter((t) => t.attendance.status === AttendanceStatus.ON_LEAVE).length;

    return {
      date: startOfDay,
      totalTeam: directReports.length,
      present: presentCount,
      absent: absentCount,
      onLeave: onLeaveCount,
      late: teamAttendance.filter((t) => t.attendance.status === AttendanceStatus.LATE).length,
      earlyLeave: teamAttendance.filter((t) => t.attendance.status === AttendanceStatus.EARLY_LEAVE).length,
      members: teamAttendance,
    };
  }

  async getPendingApprovals(tenantId: string, managerId: string): Promise<any> {
    const pending = await this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        approverId: managerId,
        status: LeaveStatus.PENDING,
      },
      include: {
        leaveType: true,
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
      orderBy: { createdAt: "asc" },
    });

    return {
      count: pending.length,
      requests: pending,
    };
  }

  async getTeamOverview(tenantId: string, managerId: string, dto: TeamOverviewDto): Promise<any> {
    const directReports = await this.prisma.employee.findMany({
      where: {
        tenantId,
        managerId,
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        status: true,
        departmentId: true,
        hireDate: true,
      },
    });

    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Get attendance summary for the month
    const employeeIds = directReports.map((e) => e.id);
    const monthlyAttendance = await this.prisma.attendanceLog.groupBy({
      by: ["employeeId", "status"],
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: true,
    });

    // Calculate average attendance rate
    const attendanceByEmployee: Record<string, { total: number; present: number }> = {};
    for (const record of monthlyAttendance) {
      if (!attendanceByEmployee[record.employeeId]) {
        attendanceByEmployee[record.employeeId] = { total: 0, present: 0 };
      }
      attendanceByEmployee[record.employeeId].total += record._count;
      if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE) {
        attendanceByEmployee[record.employeeId].present += record._count;
      }
    }

    let avgAttendanceRate = 0;
    const empCount = Object.keys(attendanceByEmployee).length;
    if (empCount > 0) {
      const totalRate = Object.values(attendanceByEmployee).reduce(
        (sum, v) => sum + (v.total > 0 ? (v.present / v.total) * 100 : 0),
        0,
      );
      avgAttendanceRate = Math.round((totalRate / empCount) * 100) / 100;
    }

    // Count pending leave approvals
    const pendingApprovals = await this.prisma.leaveRequest.count({
      where: {
        tenantId,
        approverId: managerId,
        status: LeaveStatus.PENDING,
      },
    });

    return {
      teamSize: directReports.length,
      activeMembers: directReports.filter((e) => e.status === "ACTIVE").length,
      onLeave: directReports.filter((e) => e.status === "ON_LEAVE").length,
      probation: directReports.filter((e) => e.status === "PROBATION").length,
      avgAttendanceRate,
      pendingApprovals,
      members: directReports,
    };
  }

  async getManagerDashboard(tenantId: string, managerId: string): Promise<any> {
    const [teamOverview, pendingApprovals, todayAttendance] = await Promise.all([
      this.getTeamOverview(tenantId, managerId, {}),
      this.getPendingApprovals(tenantId, managerId),
      this.getTeamAttendance(tenantId, managerId, {}),
    ]);

    return {
      overview: teamOverview,
      pendingApprovals,
      todayAttendance,
    };
  }
}
