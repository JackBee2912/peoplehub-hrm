import { Test, TestingModule } from "@nestjs/testing";
import { PayrollCalculationEngine } from "./payroll-calculation.engine";
import { PrismaService } from "../../common/prisma/prisma.service";

describe("PayrollCalculationEngine", () => {
  let engine: PayrollCalculationEngine;
  let prisma: PrismaService;

  const mockPrismaService = {
    salaryComponent: {
      findMany: jest.fn(),
    },
    attendanceLog: {
      findMany: jest.fn(),
    },
    taxRule: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollCalculationEngine,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    engine = module.get<PayrollCalculationEngine>(PayrollCalculationEngine);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateForEmployee", () => {
    it("should calculate gross pay from salary components", async () => {
      mockPrismaService.salaryComponent.findMany.mockResolvedValue([
        { type: "BASE", name: "Base Salary", amount: 20000000 },
        { type: "ALLOWANCE", name: "Meal Allowance", amount: 730000 },
        { type: "ALLOWANCE", name: "Transport", amount: 500000 },
        { type: "BONUS", name: "Performance Bonus", amount: 2000000 },
        { type: "DEDUCTION", name: "Loan Repayment", amount: 1000000 },
      ]);
      mockPrismaService.attendanceLog.findMany.mockResolvedValue([]);
      mockPrismaService.taxRule.findMany.mockResolvedValue([
        { bracket: 1, rate: 0.05, threshold: 0, ceiling: 5000000 },
        { bracket: 2, rate: 0.10, threshold: 5000000, ceiling: 10000000 },
        { bracket: 3, rate: 0.15, threshold: 10000000, ceiling: 18000000 },
      ]);

      const result = await engine.calculateForEmployee(
        "emp-1",
        "tenant-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      // Base: 20M, Allowances: 1.23M, Bonus: 2M, Overtime: 0
      expect(result.baseSalary).toBe(20000000);
      expect(result.allowances).toBe(1230000);
      expect(result.bonuses).toBe(2000000);
      expect(result.grossPay).toBe(23230000);
      expect(result.overtimePay).toBe(0);
      expect(result.netPay).toBeGreaterThan(0);
    });

    it("should calculate overtime pay from attendance logs", async () => {
      mockPrismaService.salaryComponent.findMany.mockResolvedValue([
        { type: "BASE", name: "Base Salary", amount: 17600000 }, // ~100K/hour
      ]);
      mockPrismaService.attendanceLog.findMany.mockResolvedValue([
        { overtimeMinutes: 120, date: new Date("2026-01-15") }, // 2 hours weekday OT (1.5x)
        { overtimeMinutes: 180, date: new Date("2026-01-18") }, // 3 hours Sunday OT (2.0x)
      ]);
      mockPrismaService.taxRule.findMany.mockResolvedValue([]);

      const result = await engine.calculateForEmployee(
        "emp-1",
        "tenant-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      // Hourly rate = 17600000 / (22 * 8) = 10000
      // Weekday OT = 2h * 10000 * 1.5 = 30000
      // Sunday OT = 3h * 10000 * 2.0 = 60000
      // Total OT = 90000
      expect(result.overtimePay).toBe(90000);
    });
  });

  describe("progressive tax calculation", () => {
    it("should apply progressive tax brackets correctly", async () => {
      mockPrismaService.salaryComponent.findMany.mockResolvedValue([
        { type: "BASE", name: "Base Salary", amount: 30000000 },
      ]);
      mockPrismaService.attendanceLog.findMany.mockResolvedValue([]);
      mockPrismaService.taxRule.findMany.mockResolvedValue([
        { bracket: 1, rate: 0.05, threshold: 0, ceiling: 5000000 },
        { bracket: 2, rate: 0.10, threshold: 5000000, ceiling: 10000000 },
        { bracket: 3, rate: 0.15, threshold: 10000000, ceiling: 18000000 },
        { bracket: 4, rate: 0.20, threshold: 18000000, ceiling: 32000000 },
      ]);

      const result = await engine.calculateForEmployee(
        "emp-1",
        "tenant-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      // Gross: 30M
      // Insurance (employee): 30M * 0.105 = 3,150,000
      // Personal deduction: 11M
      // Taxable income: 30M - 3.15M - 11M = 15,850,000
      // Bracket 1 (0-5M): 5M * 0.05 = 250,000
      // Bracket 2 (5M-10M): 5M * 0.10 = 500,000
      // Bracket 3 (10M-15.85M): 5.85M * 0.15 = 877,500
      // Total tax: 1,627,500
      expect(result.taxAmount).toBe(1627500);
      expect(result.breakdown.taxDetails.length).toBe(3);
    });

    it("should return zero tax when income is below threshold", async () => {
      mockPrismaService.salaryComponent.findMany.mockResolvedValue([
        { type: "BASE", name: "Base Salary", amount: 8000000 },
      ]);
      mockPrismaService.attendanceLog.findMany.mockResolvedValue([]);
      mockPrismaService.taxRule.findMany.mockResolvedValue([
        { bracket: 1, rate: 0.05, threshold: 0, ceiling: 5000000 },
      ]);

      const result = await engine.calculateForEmployee(
        "emp-1",
        "tenant-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      // Gross: 8M, Insurance: 840K, Personal deduction: 11M
      // Taxable: 8M - 840K - 11M = -3,840,000 (negative = no tax)
      expect(result.taxAmount).toBe(0);
    });
  });

  describe("social insurance calculation", () => {
    it("should calculate employee and employer insurance contributions", async () => {
      mockPrismaService.salaryComponent.findMany.mockResolvedValue([
        { type: "BASE", name: "Base Salary", amount: 20000000 },
      ]);
      mockPrismaService.attendanceLog.findMany.mockResolvedValue([]);
      mockPrismaService.taxRule.findMany.mockResolvedValue([]);

      const result = await engine.calculateForEmployee(
        "emp-1",
        "tenant-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      // Employee: 20M * 0.105 = 2,100,000
      // Employer: 20M * 0.215 = 4,300,000
      expect(result.insuranceEmployee).toBe(2100000);
      expect(result.insuranceEmployer).toBe(4300000);
    });
  });

  describe("net pay calculation", () => {
    it("should never have negative net pay", async () => {
      mockPrismaService.salaryComponent.findMany.mockResolvedValue([
        { type: "BASE", name: "Base Salary", amount: 5000000 },
        { type: "DEDUCTION", name: "Large Deduction", amount: 10000000 },
      ]);
      mockPrismaService.attendanceLog.findMany.mockResolvedValue([]);
      mockPrismaService.taxRule.findMany.mockResolvedValue([]);

      const result = await engine.calculateForEmployee(
        "emp-1",
        "tenant-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      expect(result.netPay).toBeGreaterThanOrEqual(0);
    });
  });
});
