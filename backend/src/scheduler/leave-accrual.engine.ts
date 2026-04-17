import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/prisma/prisma.service";

/**
 * Leave Accrual Engine
 * Runs daily at midnight to accrue leave balances for all active employees.
 * Also handles year-end carry-over on January 1st.
 */
@Injectable()
export class LeaveAccrualEngine implements OnModuleInit {
  private readonly logger = new Logger(LeaveAccrualEngine.name);
  private isRunning = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log("Leave Accrual Engine initialized");
  }

  /**
   * Daily accrual job - runs at 00:00 UTC every day
   * Accrues leave for all active employees based on their leave type accrual rates.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAccrual() {
    if (this.isRunning) {
      this.logger.warn("Previous accrual job still running, skipping");
      return;
    }

    this.isRunning = true;
    this.logger.log("Starting daily leave accrual...");

    try {
      const tenants = await this.prisma.tenant.findMany({ where: { isActive: true }, select: { id: true } });
      let totalAccrued = 0;

      for (const tenant of tenants) {
        const count = await this.accrueForTenant(tenant.id);
        totalAccrued += count;
        this.logger.log(`Tenant ${tenant.id}: accrued ${count} balance entries`);
      }

      this.logger.log(`Daily accrual complete. Total balance entries updated: ${totalAccrued}`);
    } catch (error) {
      this.logger.error("Daily accrual failed", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Year-end carry-over job - runs at 00:05 UTC on January 1st
   * Handles carry-over of unused leave from previous year.
   */
  @Cron("0 5 1 1 *")
  async handleYearEndCarryOver() {
    this.logger.log("Starting year-end carry-over processing...");

    try {
      const tenants = await this.prisma.tenant.findMany({ where: { isActive: true }, select: { id: true } });
      let totalCarriedOver = 0;

      for (const tenant of tenants) {
        const count = await this.carryOverForTenant(tenant.id);
        totalCarriedOver += count;
        this.logger.log(`Tenant ${tenant.id}: carried over ${count} balance entries`);
      }

      this.logger.log(`Year-end carry-over complete. Total entries carried: ${totalCarriedOver}`);
    } catch (error) {
      this.logger.error("Year-end carry-over failed", error);
    }
  }

  /**
   * Attendance summary generation - runs at 23:00 UTC every day
   * Generates daily attendance summaries for reporting.
   */
  @Cron("0 23 * * *")
  async generateAttendanceSummary() {
    this.logger.log("Generating daily attendance summary...");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tenants = await this.prisma.tenant.findMany({ where: { isActive: true }, select: { id: true } });

      for (const tenant of tenants) {
        await this.processTenantAttendance(tenant.id, today);
      }

      this.logger.log("Attendance summary generation complete");
    } catch (error) {
      this.logger.error("Attendance summary generation failed", error);
    }
  }

  private async accrueForTenant(tenantId: string): Promise<number> {
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        isDeleted: false,
        status: { in: ["ACTIVE", "ON_LEAVE", "PROBATION"] },
      },
      select: { id: true, hireDate: true },
    });

    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { tenantId, isActive: true, accrualRate: { gt: 0 } },
    });

    const year = new Date().getFullYear();
    const today = new Date();
    let accrued = 0;

    for (const employee of employees) {
      // Calculate pro-rata accrual if hired this year
      let monthsWorked = 12;
      if (employee.hireDate && employee.hireDate.getFullYear() === year) {
        monthsWorked = today.getMonth() - employee.hireDate.getMonth() + 1;
        if (monthsWorked < 0) monthsWorked = 0;
      }

      // For monthly accrual, we accrue 1/12th of annual days per month
      // But the accrualRate is already per-month, so we just add it
      for (const leaveType of leaveTypes) {
        // Skip if employee was hired after this month
        if (employee.hireDate && employee.hireDate > today) continue;

        await this.prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              year,
            },
          },
          update: { totalAccrued: { increment: leaveType.accrualRate } },
          create: {
            tenantId,
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year,
            totalAccrued: leaveType.accrualRate,
            used: 0,
            carriedOver: 0,
            adjusted: 0,
          },
        });

        accrued++;
      }
    }

    return accrued;
  }

  private async carryOverForTenant(tenantId: string): Promise<number> {
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

  private async processTenantAttendance(tenantId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find employees without attendance records today
    const employeesWithAttendance = await this.prisma.attendanceLog.findMany({
      where: { tenantId, date: { gte: startOfDay, lte: endOfDay } },
      select: { employeeId: true },
    });

    const employeeIdsWithAttendance = new Set(employeesWithAttendance.map((e) => e.employeeId));

    // Mark absent employees (those who should have worked today)
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        isDeleted: false,
        status: { in: ["ACTIVE", "PROBATION"] },
        id: { notIn: Array.from(employeeIdsWithAttendance) },
      },
    });

    // Check if today is a holiday
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        tenantId,
        date: { gte: startOfDay, lte: endOfDay },
        isActive: true,
      },
    });

    if (holiday) {
      // Don't mark as absent on holidays
      return;
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend - don't mark as absent
      return;
    }

    // Create absent records
    for (const employee of employees) {
      await this.prisma.attendanceLog.upsert({
        where: { employeeId_date: { employeeId: employee.id, date: startOfDay } },
        update: {},
        create: {
          tenantId,
          employeeId: employee.id,
          date: startOfDay,
          status: "ABSENT",
        },
      });
    }
  }
}
