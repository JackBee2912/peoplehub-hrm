import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PayrollReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Payroll summary by department and period
   */
  async getSummary(tenantId: string, query: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    payPeriodId?: string;
  }) {
    const runs = await this.prisma.payrollRun.findMany({
      where: {
        tenantId,
        status: { in: ["PROCESSED", "PAID"] },
        ...(query.payPeriodId ? { payPeriodId: query.payPeriodId } : {}),
        ...(query.startDate ? { createdAt: { gte: new Date(query.startDate) } } : {}),
        ...(query.endDate ? { createdAt: { lte: new Date(query.endDate) } } : {}),
      },
      include: {
        payPeriod: true,
        records: {
          include: {
            employee: {
              include: {
                department: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate by department
    const departmentMap = new Map<string, any>();
    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;
    let totalInsurance = 0;
    let totalDeductions = 0;
    let totalAllowances = 0;
    let totalEmployerCost = 0;
    let employeeCount = 0;

    for (const run of runs) {
      for (const record of run.records) {
        const dept = record.employee.department;
        const deptId = dept?.id || "unassigned";
        const deptName = dept?.name || "Unassigned";

        if (!departmentMap.has(deptId)) {
          departmentMap.set(deptId, {
            departmentId: deptId,
            departmentName: deptName,
            employeeCount: 0,
            grossPay: 0,
            netPay: 0,
            taxAmount: 0,
            insurance: 0,
            deductions: 0,
            allowances: 0,
            employerCost: 0,
          });
        }

        const deptData = departmentMap.get(deptId);
        deptData.employeeCount++;
        deptData.grossPay += Number(record.grossPay);
        deptData.netPay += Number(record.netPay);
        deptData.taxAmount += Number(record.taxAmount);
        deptData.insurance += Number(record.insuranceEmployee);
        deptData.deductions += Number(record.totalDeductions);
        deptData.allowances += Number(record.totalAllowances);
        deptData.employerCost += Number(record.grossPay) + Number(record.insuranceEmployer);

        totalGross += Number(record.grossPay);
        totalNet += Number(record.netPay);
        totalTax += Number(record.taxAmount);
        totalInsurance += Number(record.insuranceEmployee);
        totalDeductions += Number(record.totalDeductions);
        totalAllowances += Number(record.totalAllowances);
        totalEmployerCost += Number(record.grossPay) + Number(record.insuranceEmployer);
        employeeCount++;
      }
    }

    return {
      summary: {
        totalRuns: runs.length,
        employeeCount,
        totalGrossPay: totalGross,
        totalNetPay: totalNet,
        totalTax: totalTax,
        totalInsurance: totalInsurance,
        totalDeductions: totalDeductions,
        totalAllowances: totalAllowances,
        totalEmployerCost: totalEmployerCost,
      },
      byDepartment: Array.from(departmentMap.values()).sort(
        (a, b) => b.grossPay - a.grossPay,
      ),
      runs: runs.map((r) => ({
        id: r.id,
        status: r.status,
        payPeriod: `${r.payPeriod.type} ${r.payPeriod.period}/${r.payPeriod.year}`,
        employeeCount: r.employeeCount,
        totalGrossPay: r.totalGrossPay,
        totalNetPay: r.totalNetPay,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Cost analysis - breakdown of employer costs
   */
  async getCostAnalysis(tenantId: string, query: {
    startDate?: string;
    endDate?: string;
    payPeriodId?: string;
  }) {
    const runs = await this.prisma.payrollRun.findMany({
      where: {
        tenantId,
        status: { in: ["PROCESSED", "PAID"] },
        ...(query.payPeriodId ? { payPeriodId: query.payPeriodId } : {}),
        ...(query.startDate ? { createdAt: { gte: new Date(query.startDate) } } : {}),
        ...(query.endDate ? { createdAt: { lte: new Date(query.endDate) } } : {}),
      },
      include: {
        payPeriod: true,
        records: {
          include: {
            employee: {
              select: {
                department: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Monthly cost trend
    const monthlyTrend = new Map<string, any>();

    for (const run of runs) {
      const monthKey = `${run.payPeriod.year}-${String(run.payPeriod.period).padStart(2, "0")}`;

      if (!monthlyTrend.has(monthKey)) {
        monthlyTrend.set(monthKey, {
          period: monthKey,
          grossPay: 0,
          netPay: 0,
          taxAmount: 0,
          insuranceEmployee: 0,
          insuranceEmployer: 0,
          totalEmployerCost: 0,
          overtimePay: 0,
          bonuses: 0,
          allowances: 0,
          employeeCount: 0,
        });
      }

      const monthData = monthlyTrend.get(monthKey);

      for (const record of run.records) {
        monthData.grossPay += Number(record.grossPay);
        monthData.netPay += Number(record.netPay);
        monthData.taxAmount += Number(record.taxAmount);
        monthData.insuranceEmployee += Number(record.insuranceEmployee);
        monthData.insuranceEmployer += Number(record.insuranceEmployer);
        monthData.totalEmployerCost += Number(record.grossPay) + Number(record.insuranceEmployer);
        monthData.overtimePay += Number(record.overtimePay);
        monthData.bonuses += Number(record.bonusAmount);
        monthData.allowances += Number(record.totalAllowances);
        monthData.employeeCount++;
      }
    }

    // Cost distribution
    let totalBase = 0;
    let totalAllowances = 0;
    let totalBonuses = 0;
    let totalOvertime = 0;
    let totalTax = 0;
    let totalInsuranceEmployee = 0;
    let totalInsuranceEmployer = 0;

    for (const run of runs) {
      for (const record of run.records) {
        totalBase += Number(record.baseSalary);
        totalAllowances += Number(record.totalAllowances);
        totalBonuses += Number(record.bonusAmount);
        totalOvertime += Number(record.overtimePay);
        totalTax += Number(record.taxAmount);
        totalInsuranceEmployee += Number(record.insuranceEmployee);
        totalInsuranceEmployer += Number(record.insuranceEmployer);
      }
    }

    return {
      monthlyTrend: Array.from(monthlyTrend.values()).sort((a, b) => a.period.localeCompare(b.period)),
      costDistribution: {
        baseSalary: totalBase,
        allowances: totalAllowances,
        bonuses: totalBonuses,
        overtime: totalOvertime,
        incomeTax: totalTax,
        insuranceEmployee: totalInsuranceEmployee,
        insuranceEmployer: totalInsuranceEmployer,
      },
      ratios: {
        benefitsToGross: totalAllowances + totalBonuses + totalOvertime > 0
          ? ((totalAllowances + totalBonuses + totalOvertime) / (totalBase + totalAllowances + totalBonuses + totalOvertime) * 100).toFixed(1)
          : "0.0",
        taxToGross: totalTax > 0
          ? (totalTax / (totalBase + totalAllowances + totalBonuses + totalOvertime) * 100).toFixed(1)
          : "0.0",
        insuranceRate: totalInsuranceEmployee + totalInsuranceEmployer > 0
          ? ((totalInsuranceEmployee + totalInsuranceEmployer) / (totalBase + totalAllowances + totalBonuses + totalOvertime) * 100).toFixed(1)
          : "0.0",
      },
      totalRuns: runs.length,
    };
  }
}
