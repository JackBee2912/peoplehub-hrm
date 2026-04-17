import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PayrollCalculationEngine } from "../engine/payroll-calculation.engine";
import { CreatePayrollRunDto, PayrollRunActionDto } from "../dto/payroll-run.dto";

@Injectable()
export class PayrollRunService {
  constructor(
    private prisma: PrismaService,
    private calculationEngine: PayrollCalculationEngine,
  ) {}

  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.payrollRun.findMany({
      where,
      include: {
        payPeriod: true,
        createdByUser: { select: { id: true, email: true } },
        _count: { select: { records: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        payPeriod: true,
        records: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: { select: { name: true } },
              },
            },
            payslip: true,
          },
        },
        createdByUser: { select: { id: true, email: true } },
      },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    return run;
  }

  async getRecords(runId: string, tenantId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    return this.prisma.payrollRecord.findMany({
      where: { payrollRunId: runId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        payslip: true,
      },
      orderBy: [{ "employee": { lastName: "asc" } }],
    });
  }

  /**
   * Step 1: Create a draft payroll run
   */
  async create(tenantId: string, userId: string, dto: CreatePayrollRunDto) {
    // Validate pay period exists and is open
    const payPeriod = await this.prisma.payPeriod.findFirst({
      where: { id: dto.payPeriodId, tenantId },
    });

    if (!payPeriod) {
      throw new NotFoundException("Pay period not found");
    }

    if (payPeriod.status !== "OPEN") {
      throw new BadRequestException("Pay period is not open");
    }

    // Check if a draft run already exists for this period
    const existingDraft = await this.prisma.payrollRun.findFirst({
      where: { payPeriodId: dto.payPeriodId, tenantId, status: "DRAFT" },
    });

    if (existingDraft) {
      throw new BadRequestException("A draft payroll run already exists for this pay period");
    }

    return this.prisma.payrollRun.create({
      data: {
        tenantId,
        payPeriodId: dto.payPeriodId,
        status: "DRAFT",
        createdBy: userId,
        notes: dto.notes,
      },
      include: {
        payPeriod: true,
      },
    });
  }

  /**
   * Step 2: Calculate payroll for all employees
   */
  async calculate(runId: string, tenantId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
      include: { payPeriod: true },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    if (run.status !== "DRAFT") {
      throw new BadRequestException("Can only calculate payroll for draft runs");
    }

    const { payPeriod } = run;

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        hireDate: { lte: payPeriod.endDate },
      },
    });

    if (employees.length === 0) {
      throw new BadRequestException("No active employees found for this period");
    }

    // Calculate for each employee
    const results = [];
    for (const emp of employees) {
      try {
        const calc = await this.calculationEngine.calculateForEmployee(
          emp.id,
          tenantId,
          payPeriod.startDate,
          payPeriod.endDate,
        );
        results.push(calc);
      } catch (error) {
        // Log error but continue with other employees
        console.error(`Failed to calculate payroll for employee ${emp.id}:`, error);
      }
    }

    // Upsert payroll records
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    let totalAllowances = 0;
    let totalTax = 0;
    let totalInsurance = 0;
    let totalEmployerCost = 0;

    for (const result of results) {
      await this.prisma.payrollRecord.upsert({
        where: {
          payrollRunId_employeeId: {
            payrollRunId: runId,
            employeeId: result.employeeId,
          },
        },
        create: {
          tenantId,
          payrollRunId: runId,
          employeeId: result.employeeId,
          baseSalary: result.baseSalary,
          grossPay: result.grossPay,
          netPay: result.netPay,
          totalDeductions: result.totalDeductions,
          totalAllowances: result.totalAllowances,
          taxAmount: result.taxAmount,
          insuranceEmployee: result.insuranceEmployee,
          insuranceEmployer: result.insuranceEmployer,
          overtimePay: result.overtimePay,
          bonusAmount: result.bonuses,
        },
        update: {
          baseSalary: result.baseSalary,
          grossPay: result.grossPay,
          netPay: result.netPay,
          totalDeductions: result.totalDeductions,
          totalAllowances: result.totalAllowances,
          taxAmount: result.taxAmount,
          insuranceEmployee: result.insuranceEmployee,
          insuranceEmployer: result.insuranceEmployer,
          overtimePay: result.overtimePay,
          bonusAmount: result.bonuses,
        },
      });

      totalGross += result.grossPay;
      totalNet += result.netPay;
      totalDeductions += result.totalDeductions;
      totalAllowances += result.totalAllowances;
      totalTax += result.taxAmount;
      totalInsurance += result.insuranceEmployee;
      totalEmployerCost += result.employerTotalCost;
    }

    // Update payroll run totals
    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        totalGrossPay: totalGross,
        totalNetPay: totalNet,
        totalDeductions: totalDeductions,
        totalAllowances: totalAllowances,
        totalTax: totalTax,
        totalInsurance: totalInsurance,
        totalEmployerCost: totalEmployerCost,
        employeeCount: results.length,
      },
      include: { payPeriod: true },
    });
  }

  /**
   * Step 3: Submit for approval (DRAFT → PENDING_APPROVAL)
   */
  async submitForApproval(runId: string, tenantId: string, dto?: PayrollRunActionDto) {
    return this.transitionStatus(runId, tenantId, "DRAFT", "PENDING_APPROVAL", dto?.notes);
  }

  /**
   * Step 4: Approve payroll (PENDING_APPROVAL → APPROVED)
   */
  async approve(runId: string, tenantId: string, userId: string, dto?: PayrollRunActionDto) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    if (run.status !== "PENDING_APPROVAL") {
      throw new BadRequestException("Payroll run is not pending approval");
    }

    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: "APPROVED",
        approvedBy: userId,
        notes: dto?.notes ?? run.notes,
      },
      include: { payPeriod: true },
    });
  }

  /**
   * Step 5: Process payroll (APPROVED → PROCESSED)
   * This generates payslips for all records
   */
  async process(runId: string, tenantId: string, dto?: PayrollRunActionDto) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    if (run.status !== "APPROVED") {
      throw new BadRequestException("Payroll run must be approved before processing");
    }

    // Get all payroll records
    const records = await this.prisma.payrollRecord.findMany({
      where: { payrollRunId: runId },
    });

    // Generate payslip entries for each record
    for (const record of records) {
      await this.prisma.payslip.upsert({
        where: { payrollRecordId: record.id },
        create: {
          tenantId,
          payrollRecordId: record.id,
          employeeId: record.employeeId,
          status: "DRAFT",
        },
        update: {},
      });
    }

    // Close the pay period
    await this.prisma.payPeriod.update({
      where: { id: run.payPeriodId },
      data: { status: "CLOSED" },
    });

    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        notes: dto?.notes ?? run.notes,
      },
      include: { payPeriod: true },
    });
  }

  /**
   * Step 6: Mark as paid (PROCESSED → PAID)
   */
  async markAsPaid(runId: string, tenantId: string, dto?: PayrollRunActionDto) {
    return this.transitionStatus(runId, tenantId, "PROCESSED", "PAID", dto?.notes);
  }

  /**
   * Reject/return to draft (PENDING_APPROVAL → DRAFT)
   */
  async reject(runId: string, tenantId: string, dto?: PayrollRunActionDto) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    if (run.status !== "PENDING_APPROVAL") {
      throw new BadRequestException("Can only reject a pending approval run");
    }

    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: "DRAFT" as any,
        notes: `Rejected: ${dto?.notes ?? "No reason provided"}`,
      },
      include: { payPeriod: true },
    });
  }

  /**
   * Delete a draft payroll run
   */
  async remove(runId: string, tenantId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    if (run.status !== "DRAFT") {
      throw new BadRequestException("Can only delete draft payroll runs");
    }

    // Delete associated records and payslips
    await this.prisma.payrollRecord.deleteMany({
      where: { payrollRunId: runId },
    });

    return this.prisma.payrollRun.delete({ where: { id: runId } });
  }

  private async transitionStatus(
    runId: string,
    tenantId: string,
    fromStatus: string,
    toStatus: string,
    notes?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
    });

    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }

    if (run.status !== fromStatus) {
      throw new BadRequestException(`Payroll run must be ${fromStatus} to transition to ${toStatus}`);
    }

    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: toStatus as any,
        notes: notes ?? run.notes,
      },
      include: { payPeriod: true },
    });
  }
}
