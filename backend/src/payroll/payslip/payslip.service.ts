import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PayrollPdfGenerator } from "../engine/payroll-pdf.generator";

@Injectable()
export class PayslipService {
  constructor(
    private prisma: PrismaService,
    private pdfGenerator: PayrollPdfGenerator,
  ) {}

  async getMyPayslips(tenantId: string, employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { tenantId, employeeId },
      include: {
        payrollRecord: {
          select: {
            grossPay: true,
            netPay: true,
            totalDeductions: true,
            taxAmount: true,
            insuranceEmployee: true,
            payrollRun: {
              select: {
                payPeriod: {
                  select: {
                    type: true,
                    year: true,
                    period: true,
                    startDate: true,
                    endDate: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { issuedDate: "desc" },
    });
  }

  async findById(id: string, tenantId: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id, tenantId },
      include: {
        payrollRecord: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                taxCode: true,
                bankName: true,
                bankAccount: true,
                department: { select: { name: true } },
                position: { select: { title: true } },
              },
            },
            payrollRun: {
              include: {
                payPeriod: true,
              },
            },
          },
        },
      },
    });

    if (!payslip) {
      throw new NotFoundException("Payslip not found");
    }

    return payslip;
  }

  async generatePdf(payslipId: string, tenantId: string): Promise<{ pdfBuffer: Buffer; pdfPath: string }> {
    const payslip = await this.findById(payslipId, tenantId);

    const pdfBuffer = await this.pdfGenerator.generate(payslip);

    const timestamp = Date.now();
    const pdfPath = `payslips/${tenantId}/${payslip.employeeId}/${payslipId}_${timestamp}.pdf`;

    await this.prisma.payslip.update({
      where: { id: payslipId },
      data: {
        pdfPath,
        status: "ISSUED" as any,
      },
    });

    return { pdfBuffer, pdfPath };
  }

  async downloadPayslip(payslipId: string, tenantId: string): Promise<Buffer> {
    const payslip = await this.findById(payslipId, tenantId);

    if (!payslip.pdfPath) {
      throw new BadRequestException("Payslip PDF has not been generated yet");
    }

    const { pdfBuffer } = await this.generatePdf(payslipId, tenantId);
    return pdfBuffer;
  }

  async issueAll(runId: string, tenantId: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: {
        tenantId,
        payrollRecord: { payrollRunId: runId },
      },
    });

    const results = [];
    for (const payslip of payslips) {
      const result = await this.generatePdf(payslip.id, tenantId);
      results.push({ payslipId: payslip.id, pdfPath: result.pdfPath });
    }

    return results;
  }
}
