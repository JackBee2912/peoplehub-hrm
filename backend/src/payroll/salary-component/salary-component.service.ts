import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from "../dto/salary-component.dto";

@Injectable()
export class SalaryComponentService {
  constructor(private prisma: PrismaService) {}

  async findAllByEmployee(tenantId: string, employeeId: string) {
    return this.prisma.salaryComponent.findMany({
      where: { tenantId, employeeId },
      orderBy: [{ effectiveDate: "desc" }, { type: "asc" }, { name: "asc" }],
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.salaryComponent.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: [{ effectiveDate: "desc" }],
    });
  }

  async findById(id: string, tenantId: string) {
    const component = await this.prisma.salaryComponent.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });

    if (!component) {
      throw new NotFoundException("Salary component not found");
    }

    return component;
  }

  async create(tenantId: string, employeeId: string, dto: CreateSalaryComponentDto) {
    // Validate employee exists
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return this.prisma.salaryComponent.create({
      data: {
        tenantId,
        employeeId,
        type: dto.type,
        name: dto.name,
        amount: dto.amount,
        effectiveDate: new Date(dto.effectiveDate),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        notes: dto.notes,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateSalaryComponentDto) {
    const existing = await this.prisma.salaryComponent.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Salary component not found");
    }

    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.effectiveDate !== undefined) data.effectiveDate = new Date(dto.effectiveDate);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.salaryComponent.update({
      where: { id },
      data,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.salaryComponent.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Salary component not found");
    }

    return this.prisma.salaryComponent.delete({ where: { id } });
  }

  async getActiveComponentsForPeriod(
    employeeId: string,
    tenantId: string,
    periodEnd: Date,
  ) {
    return this.prisma.salaryComponent.findMany({
      where: {
        employeeId,
        tenantId,
        effectiveDate: { lte: periodEnd },
        isActive: true,
      },
      orderBy: [{ type: "asc" }, { effectiveDate: "desc" }],
    });
  }
}
