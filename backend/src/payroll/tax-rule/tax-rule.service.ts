import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTaxRuleDto, UpdateTaxRuleDto } from "../dto/tax-rule.dto";

@Injectable()
export class TaxRuleService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.taxRule.findMany({
      where: { tenantId },
      orderBy: [{ name: "asc" }, { bracket: "asc" }],
    });
  }

  async findById(id: string, tenantId: string) {
    const rule = await this.prisma.taxRule.findFirst({
      where: { id, tenantId },
    });

    if (!rule) {
      throw new NotFoundException("Tax rule not found");
    }

    return rule;
  }

  async create(tenantId: string, dto: CreateTaxRuleDto) {
    // Validate no duplicate bracket for same rule name
    const existing = await this.prisma.taxRule.findFirst({
      where: {
        tenantId,
        name: dto.name,
        bracket: dto.bracket,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Tax rule '${dto.name}' already has bracket ${dto.bracket}`,
      );
    }

    return this.prisma.taxRule.create({
      data: {
        tenantId,
        name: dto.name,
        bracket: dto.bracket,
        rate: dto.rate,
        threshold: dto.threshold,
        ceiling: dto.ceiling,
        description: dto.description,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateTaxRuleDto) {
    const existing = await this.prisma.taxRule.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Tax rule not found");
    }

    // Check for duplicate if name or bracket changed
    if (dto.name || dto.bracket !== undefined) {
      const newName = dto.name ?? existing.name;
      const newBracket = dto.bracket ?? existing.bracket;
      const duplicate = await this.prisma.taxRule.findFirst({
        where: {
          tenantId,
          name: newName,
          bracket: newBracket,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Tax rule '${newName}' already has bracket ${newBracket}`,
        );
      }
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.bracket !== undefined) data.bracket = dto.bracket;
    if (dto.rate !== undefined) data.rate = dto.rate;
    if (dto.threshold !== undefined) data.threshold = dto.threshold;
    if (dto.ceiling !== undefined) data.ceiling = dto.ceiling;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.effectiveFrom !== undefined) data.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) data.effectiveTo = new Date(dto.effectiveTo);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.taxRule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.taxRule.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Tax rule not found");
    }

    return this.prisma.taxRule.delete({ where: { id } });
  }

  async getActiveRules(tenantId: string, date: Date) {
    return this.prisma.taxRule.findMany({
      where: {
        tenantId,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } },
        ],
      },
      orderBy: { bracket: "asc" },
    });
  }

  async seedDefaultRules(tenantId: string) {
    // Vietnam personal income tax brackets (2026) - monthly
    const defaultBrackets = [
      { name: "PIT Vietnam 2026", bracket: 1, rate: 0.05, threshold: 0, ceiling: 5000000, description: "5% for income up to 5M VND" },
      { name: "PIT Vietnam 2026", bracket: 2, rate: 0.10, threshold: 5000000, ceiling: 10000000, description: "10% for income 5M-10M VND" },
      { name: "PIT Vietnam 2026", bracket: 3, rate: 0.15, threshold: 10000000, ceiling: 18000000, description: "15% for income 10M-18M VND" },
      { name: "PIT Vietnam 2026", bracket: 4, rate: 0.20, threshold: 18000000, ceiling: 32000000, description: "20% for income 18M-32M VND" },
      { name: "PIT Vietnam 2026", bracket: 5, rate: 0.25, threshold: 32000000, ceiling: 52000000, description: "25% for income 32M-52M VND" },
      { name: "PIT Vietnam 2026", bracket: 6, rate: 0.30, threshold: 52000000, ceiling: 80000000, description: "30% for income 52M-80M VND" },
      { name: "PIT Vietnam 2026", bracket: 7, rate: 0.35, threshold: 80000000, ceiling: null, description: "35% for income above 80M VND" },
    ];

    for (const b of defaultBrackets) {
      await this.prisma.taxRule.upsert({
        where: {
          tenantId_name_bracket: {
            tenantId,
            name: b.name,
            bracket: b.bracket,
          },
        },
        create: {
          tenantId,
          name: b.name,
          bracket: b.bracket,
          rate: b.rate,
          threshold: b.threshold,
          ceiling: b.ceiling,
          description: b.description,
          isActive: true,
        },
        update: {},
      });
    }
  }
}
