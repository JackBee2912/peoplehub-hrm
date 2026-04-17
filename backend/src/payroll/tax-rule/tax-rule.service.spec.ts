import { Test, TestingModule } from "@nestjs/testing";
import { TaxRuleService } from "./tax-rule.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("TaxRuleService", () => {
  let service: TaxRuleService;
  let prisma: PrismaService;

  const mockPrismaService = {
    taxRule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxRuleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaxRuleService>(TaxRuleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a tax rule", async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);
      mockPrismaService.taxRule.create.mockResolvedValue({
        id: "rule-1",
        tenantId: "tenant-1",
        name: "PIT 2026",
        bracket: 1,
        rate: 0.05,
        threshold: 0,
        ceiling: 5000000,
        isActive: true,
      });

      const result = await service.create("tenant-1", {
        name: "PIT 2026",
        bracket: 1,
        rate: 0.05,
        threshold: 0,
        ceiling: 5000000,
      });

      expect(result.name).toBe("PIT 2026");
      expect(result.bracket).toBe(1);
    });

    it("should reject duplicate tax rules", async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue({
        id: "existing",
        name: "PIT 2026",
        bracket: 1,
      });

      await expect(
        service.create("tenant-1", {
          name: "PIT 2026",
          bracket: 1,
          rate: 0.05,
          threshold: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findById", () => {
    it("should return a tax rule", async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue({
        id: "rule-1",
        tenantId: "tenant-1",
        name: "PIT 2026",
      });

      const result = await service.findById("rule-1", "tenant-1");
      expect(result.id).toBe("rule-1");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);

      await expect(service.findById("nonexistent", "tenant-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getActiveRules", () => {
    it("should return active rules for a given date", async () => {
      const testDate = new Date("2026-06-01");
      mockPrismaService.taxRule.findMany.mockResolvedValue([
        { bracket: 1, rate: 0.05, threshold: 0 },
        { bracket: 2, rate: 0.10, threshold: 5000000 },
      ]);

      const result = await service.getActiveRules("tenant-1", testDate);

      expect(result.length).toBe(2);
      expect(prisma.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            effectiveFrom: expect.any(Object),
          }),
          orderBy: { bracket: "asc" },
        }),
      );
    });
  });
});
