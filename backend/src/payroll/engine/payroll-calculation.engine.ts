import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface PayrollCalculationResult {
  employeeId: string;
  baseSalary: number;
  allowances: number;
  bonuses: number;
  overtimePay: number;
  grossPay: number;
  taxAmount: number;
  insuranceEmployee: number;
  insuranceEmployer: number;
  otherDeductions: number;
  totalDeductions: number;
  totalAllowances: number;
  netPay: number;
  employerTotalCost: number;
  breakdown: {
    components: Array<{ name: string; type: string; amount: number }>;
    taxDetails: Array<{ bracket: number; rate: number; taxableAmount: number; tax: number }>;
    insuranceDetails: {
      employeeRate: number;
      employerRate: number;
      employeeAmount: number;
      employerAmount: number;
    };
  };
}

export interface SocialInsuranceRates {
  employeeRate: number;
  employerRate: number;
  salaryCeiling: number | null;
}

@Injectable()
export class PayrollCalculationEngine {
  private readonly defaultInsuranceRates: SocialInsuranceRates = {
    employeeRate: 0.105,
    employerRate: 0.215,
    salaryCeiling: null,
  };

  private readonly personalDeduction = 11000000;
  private readonly dependentDeduction = 4400000;

  constructor(private prisma: PrismaService) {}

  async calculateForEmployee(
    employeeId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PayrollCalculationResult> {
    const components = await this.prisma.salaryComponent.findMany({
      where: {
        employeeId,
        tenantId,
        effectiveDate: { lte: periodEnd },
        isActive: true,
      },
    });

    const baseSalary = this.toNumber(this.sumComponents(components, "BASE"));
    const allowances = this.toNumber(this.sumComponents(components, "ALLOWANCE"));
    const bonuses = this.toNumber(this.sumComponents(components, "BONUS"));
    const otherDeductions = this.toNumber(this.sumComponents(components, "DEDUCTION"));

    const overtimePay = await this.calculateOvertimePay(
      employeeId,
      tenantId,
      periodStart,
      periodEnd,
      baseSalary,
    );

    const grossPay = baseSalary + allowances + bonuses + overtimePay;

    const insurance = this.calculateSocialInsurance(grossPay);

    const taxResult = await this.calculateProgressiveTax(
      grossPay,
      insurance.employee,
      tenantId,
      periodStart,
    );

    const totalDeductions = taxResult.totalTax + insurance.employee + otherDeductions;
    const netPay = Math.max(0, grossPay - totalDeductions);
    const employerTotalCost = grossPay + insurance.employer;

    const componentBreakdown = components.map((c) => ({
      name: c.name,
      type: c.type,
      amount: this.toNumber(c.amount),
    }));

    return {
      employeeId,
      baseSalary: this.round(baseSalary),
      allowances: this.round(allowances),
      bonuses: this.round(bonuses),
      overtimePay: this.round(overtimePay),
      grossPay: this.round(grossPay),
      taxAmount: this.round(taxResult.totalTax),
      insuranceEmployee: this.round(insurance.employee),
      insuranceEmployer: this.round(insurance.employer),
      otherDeductions: this.round(otherDeductions),
      totalDeductions: this.round(totalDeductions),
      totalAllowances: this.round(allowances),
      netPay: this.round(netPay),
      employerTotalCost: this.round(employerTotalCost),
      breakdown: {
        components: componentBreakdown,
        taxDetails: taxResult.bracketDetails,
        insuranceDetails: {
          employeeRate: this.defaultInsuranceRates.employeeRate,
          employerRate: this.defaultInsuranceRates.employerRate,
          employeeAmount: this.round(insurance.employee),
          employerAmount: this.round(insurance.employer),
        },
      },
    };
  }

  private async calculateOvertimePay(
    employeeId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    baseSalary: number,
  ): Promise<number> {
    const attendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId,
        tenantId,
        date: { gte: periodStart, lte: periodEnd },
        overtimeMinutes: { gt: 0 },
      },
    });

    if (attendanceLogs.length === 0) return 0;

    const workingHoursPerMonth = 22 * 8;
    const hourlyRate = baseSalary / workingHoursPerMonth;

    let totalOvertimePay = 0;

    for (const log of attendanceLogs) {
      const overtimeHours = log.overtimeMinutes / 60;
      const dayOfWeek = log.date.getDay();
      const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 2.0 : 1.5;
      totalOvertimePay += hourlyRate * overtimeHours * multiplier;
    }

    return this.round(totalOvertimePay);
  }

  private async calculateProgressiveTax(
    grossIncome: number,
    insuranceDeduction: number,
    tenantId: string,
    periodStart: Date,
  ): Promise<{ totalTax: number; bracketDetails: Array<{ bracket: number; rate: number; taxableAmount: number; tax: number }> }> {
    const taxRules = await this.prisma.taxRule.findMany({
      where: {
        tenantId,
        isActive: true,
        effectiveFrom: { lte: periodStart },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: periodStart } },
        ],
      },
      orderBy: { bracket: "asc" },
    });

    if (taxRules.length === 0) {
      return { totalTax: 0, bracketDetails: [] };
    }

    const taxableIncome = grossIncome - insuranceDeduction - this.personalDeduction;

    if (taxableIncome <= 0) {
      return { totalTax: 0, bracketDetails: [] };
    }

    let totalTax = 0;
    const bracketDetails: Array<{ bracket: number; rate: number; taxableAmount: number; tax: number }> = [];

    for (const rule of taxRules) {
      const threshold = this.toNumber(rule.threshold);
      const ceiling = rule.ceiling ? this.toNumber(rule.ceiling) : null;
      const rate = this.toNumber(rule.rate);

      if (taxableIncome > threshold) {
        let bracketTaxable = 0;

        if (ceiling !== null) {
          const upper = Math.min(taxableIncome, ceiling);
          bracketTaxable = upper - threshold;
        } else {
          bracketTaxable = taxableIncome - threshold;
        }

        if (bracketTaxable > 0) {
          const bracketTax = bracketTaxable * rate;
          totalTax += bracketTax;
          bracketDetails.push({
            bracket: rule.bracket,
            rate,
            taxableAmount: this.round(bracketTaxable),
            tax: this.round(bracketTax),
          });
        }
      }
    }

    return { totalTax: this.round(totalTax), bracketDetails };
  }

  private calculateSocialInsurance(grossPay: number): { employee: number; employer: number } {
    let insurableSalary = grossPay;

    if (this.defaultInsuranceRates.salaryCeiling) {
      insurableSalary = Math.min(insurableSalary, this.defaultInsuranceRates.salaryCeiling);
    }

    return {
      employee: this.round(insurableSalary * this.defaultInsuranceRates.employeeRate),
      employer: this.round(insurableSalary * this.defaultInsuranceRates.employerRate),
    };
  }

  private sumComponents(components: Array<{ amount: any; type: string }>, type: string): any {
    const result = components
      .filter((c) => c.type === type)
      .reduce((sum, c) => sum + this.toNumber(c.amount), 0);
    return result;
  }

  private toNumber(value: any): number {
    if (typeof value === "number") return value;
    if (value && typeof value.toNumber === "function") return value.toNumber();
    return Number(value) || 0;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
