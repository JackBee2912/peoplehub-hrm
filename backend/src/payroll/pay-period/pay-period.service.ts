import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreatePayPeriodDto, UpdatePayPeriodDto } from "../dto/pay-period.dto";
import { PayPeriodType } from "@prisma/client";

@Injectable()
export class PayPeriodService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, year?: number, type?: PayPeriodType) {
    const where: any = { tenantId };
    if (year) where.year = year;
    if (type) where.type = type;

    return this.prisma.payPeriod.findMany({
      where,
      orderBy: [{ year: "desc" }, { period: "desc" }],
    });
  }

  async findById(id: string, tenantId: string) {
    const period = await this.prisma.payPeriod.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { payrollRuns: true } },
      },
    });

    if (!period) {
      throw new NotFoundException("Pay period not found");
    }

    return period;
  }

  async create(tenantId: string, dto: CreatePayPeriodDto) {
    // Check for duplicate
    const existing = await this.prisma.payPeriod.findFirst({
      where: {
        tenantId,
        type: dto.type,
        year: dto.year,
        period: dto.period,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Pay period ${dto.type} ${dto.period}/${dto.year} already exists`,
      );
    }

    // Validate dates
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException("Start date must be before end date");
    }

    return this.prisma.payPeriod.create({
      data: {
        tenantId,
        type: dto.type,
        year: dto.year,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        cutoffDate: new Date(dto.cutoffDate),
        status: dto.status || "OPEN",
        notes: dto.notes,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdatePayPeriodDto) {
    const existing = await this.prisma.payPeriod.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { payrollRuns: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException("Pay period not found");
    }

    // Prevent modifying periods with processed payroll runs
    if (existing._count.payrollRuns > 0 && (dto.type || dto.year || dto.period)) {
      throw new BadRequestException(
        "Cannot change period type, year, or period when payroll runs exist",
      );
    }

    // Validate dates if changed
    const newStart = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const newEnd = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    if (newStart >= newEnd) {
      throw new BadRequestException("Start date must be before end date");
    }

    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.period !== undefined) data.period = dto.period;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.cutoffDate !== undefined) data.cutoffDate = new Date(dto.cutoffDate);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.payPeriod.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.payPeriod.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { payrollRuns: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException("Pay period not found");
    }

    if (existing._count.payrollRuns > 0) {
      throw new BadRequestException(
        "Cannot delete a pay period with associated payroll runs",
      );
    }

    return this.prisma.payPeriod.delete({ where: { id } });
  }

  async getOpenPeriods(tenantId: string) {
    return this.prisma.payPeriod.findMany({
      where: { tenantId, status: "OPEN" },
      orderBy: [{ year: "desc" }, { period: "desc" }],
    });
  }

  /**
   * Generate standard monthly pay periods for a given year
   */
  async generateMonthlyPeriods(tenantId: string, year: number) {
    const existing = await this.prisma.payPeriod.findMany({
      where: { tenantId, type: "MONTHLY", year },
    });

    const created: any[] = [];

    for (let month = 1; month <= 12; month++) {
      // Check if already exists
      const exists = existing.some(
        (e) => e.period === month && e.type === "MONTHLY",
      );
      if (exists) continue;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // last day of month
      const cutoffDate = new Date(year, month - 1, 25); // 25th of the month

      const period = await this.prisma.payPeriod.create({
        data: {
          tenantId,
          type: "MONTHLY",
          year,
          period: month,
          startDate,
          endDate,
          cutoffDate,
          status: "OPEN",
        },
      });
      created.push(period);
    }

    return created;
  }
}
