import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateHolidayDto, UpdateHolidayDto, CalendarFilterDto } from "./dto/holiday.dto";
import { PaginationDto, buildPaginatedResult, PaginatedResult } from "../common/dto/pagination.dto";

@Injectable()
export class HolidayService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [holidays, total] = await Promise.all([
      this.prisma.holiday.findMany({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "asc" },
      }),
      this.prisma.holiday.count({ where: { tenantId } }),
    ]);
    return buildPaginatedResult(holidays, total, page, limit);
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const holiday = await this.prisma.holiday.findUnique({ where: { id, tenantId } });
    if (!holiday) throw new NotFoundException("Holiday not found");
    return holiday;
  }

  async create(tenantId: string, dto: CreateHolidayDto): Promise<any> {
    const date = new Date(dto.date);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    // Check for duplicate
    const existing = await this.prisma.holiday.findFirst({
      where: {
        tenantId,
        name: dto.name,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });
    if (existing) {
      throw new ConflictException("Holiday with this name already exists on this date");
    }

    return this.prisma.holiday.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        date,
        type: dto.type,
        isRecurring: dto.isRecurring,
        departmentId: dto.departmentId,
        isActive: dto.isActive,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateHolidayDto): Promise<any> {
    const existing = await this.prisma.holiday.findUnique({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Holiday not found");

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.type) updateData.type = dto.type;
    if (dto.isRecurring !== undefined) updateData.isRecurring = dto.isRecurring;
    if (dto.departmentId !== undefined) updateData.departmentId = dto.departmentId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.holiday.update({ where: { id, tenantId }, data: updateData });
  }

  async remove(id: string, tenantId: string): Promise<any> {
    const existing = await this.prisma.holiday.findUnique({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Holiday not found");
    return this.prisma.holiday.delete({ where: { id, tenantId } });
  }

  async getCalendar(tenantId: string, filter: CalendarFilterDto): Promise<any> {
    const startOfYear = new Date(filter.year, 0, 1);
    const endOfYear = new Date(filter.year, 11, 31, 23, 59, 59);

    const where: any = {
      tenantId,
      date: { gte: startOfYear, lte: endOfYear },
      isActive: true,
    };

    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.departmentId) {
      where.OR = [{ departmentId: filter.departmentId }, { departmentId: null }];
    }

    const holidays = await this.prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    // If there are recurring holidays, also include them from previous years
    const recurring = holidays.filter((h) => h.isRecurring);
    const nonRecurring = holidays.filter((h) => !h.isRecurring);

    // Build calendar map: date -> holidays[]
    const calendarMap: Record<string, any[]> = {};

    for (const holiday of [...nonRecurring, ...recurring]) {
      const key = this.formatDate(holiday.date);
      if (!calendarMap[key]) calendarMap[key] = [];
      calendarMap[key].push({
        id: holiday.id,
        name: holiday.name,
        type: holiday.type,
        isRecurring: holiday.isRecurring,
      });
    }

    // Build month-by-month calendar
    const months: any[] = [];
    for (let month = 0; month < 12; month++) {
      const monthHolidays: any[] = [];
      for (const [dateKey, hols] of Object.entries(calendarMap)) {
        const hDate = new Date(dateKey);
        if (hDate.getMonth() === month) {
          monthHolidays.push(...hols.map((h) => ({ ...h, date: dateKey })));
        }
      }
      months.push({
        month,
        monthName: new Date(filter.year, month).toLocaleString("default", { month: "long" }),
        holidays: monthHolidays,
      });
    }

    return { year: filter.year, months, total: holidays.length };
  }

  async getHolidaysInRange(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.holiday.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
        isActive: true,
      },
      orderBy: { date: "asc" },
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
