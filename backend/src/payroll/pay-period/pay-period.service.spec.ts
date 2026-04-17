import { Test, TestingModule } from "@nestjs/testing";
import { PayPeriodService } from "./pay-period.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

describe("PayPeriodService", () => {
  let service: PayPeriodService;
  let prisma: PrismaService;

  const mockPrismaService = {
    payPeriod: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayPeriodService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PayPeriodService>(PayPeriodService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a pay period", async () => {
      mockPrismaService.payPeriod.findFirst.mockResolvedValue(null);
      mockPrismaService.payPeriod.create.mockResolvedValue({
        id: "period-1",
        tenantId: "tenant-1",
        type: "MONTHLY",
        year: 2026,
        period: 1,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-31"),
        cutoffDate: new Date("2026-01-25"),
        status: "OPEN",
      });

      const result = await service.create("tenant-1", {
        type: "MONTHLY",
        year: 2026,
        period: 1,
        startDate: "2026-01-01T00:00:00Z",
        endDate: "2026-01-31T23:59:59Z",
        cutoffDate: "2026-01-25T00:00:00Z",
      });

      expect(result.type).toBe("MONTHLY");
      expect(result.year).toBe(2026);
      expect(result.period).toBe(1);
    });

    it("should reject duplicate pay periods", async () => {
      mockPrismaService.payPeriod.findFirst.mockResolvedValue({ id: "existing" });

      await expect(
        service.create("tenant-1", {
          type: "MONTHLY",
          year: 2026,
          period: 1,
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-31T23:59:59Z",
          cutoffDate: "2026-01-25T00:00:00Z",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject invalid date range", async () => {
      mockPrismaService.payPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.create("tenant-1", {
          type: "MONTHLY",
          year: 2026,
          period: 1,
          startDate: "2026-02-01T00:00:00Z",
          endDate: "2026-01-01T00:00:00Z",
          cutoffDate: "2026-01-25T00:00:00Z",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("generateMonthlyPeriods", () => {
    it("should generate 12 monthly periods for a year", async () => {
      mockPrismaService.payPeriod.findMany.mockResolvedValue([]);
      mockPrismaService.payPeriod.create.mockImplementation((data: any) =>
        Promise.resolve({ id: `period-${data.data.period}`, ...data.data }),
      );

      const result = await service.generateMonthlyPeriods("tenant-1", 2026);

      expect(result.length).toBe(12);
      expect(prisma.payPeriod.create).toHaveBeenCalledTimes(12);

      // Check January
      expect(prisma.payPeriod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "MONTHLY",
            year: 2026,
            period: 1,
          }),
        }),
      );
    });

    it("should skip existing periods", async () => {
      mockPrismaService.payPeriod.findMany.mockResolvedValue([
        { type: "MONTHLY", period: 1, year: 2026 },
        { type: "MONTHLY", period: 2, year: 2026 },
      ]);
      mockPrismaService.payPeriod.create.mockResolvedValue({});

      const result = await service.generateMonthlyPeriods("tenant-1", 2026);

      // Should only create 10 periods (skip Jan and Feb)
      expect(prisma.payPeriod.create).toHaveBeenCalledTimes(10);
    });
  });
});
