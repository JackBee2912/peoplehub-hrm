import { PayrollPdfGenerator } from "./payroll-pdf.generator";

describe("PayrollPdfGenerator", () => {
  let generator: PayrollPdfGenerator;

  beforeEach(() => {
    generator = new PayrollPdfGenerator();
  });

  describe("generate", () => {
    it("should generate a valid PDF buffer", async () => {
      const mockPayslipData = {
        id: "payslip-1",
        tenantId: "tenant-1",
        employeeId: "emp-1",
        issuedDate: new Date("2026-01-31"),
        payrollRecord: {
          id: "record-1",
          baseSalary: 20000000,
          grossPay: 23230000,
          netPay: 18000000,
          totalDeductions: 5230000,
          totalAllowances: 1230000,
          taxAmount: 1627500,
          insuranceEmployee: 2100000,
          insuranceEmployer: 4300000,
          overtimePay: 0,
          bonusAmount: 2000000,
          employee: {
            firstName: "Nguyen",
            lastName: "Van A",
            employeeCode: "EMP001",
            taxCode: "0123456789",
            bankName: "Vietcombank",
            bankAccount: "1234567890",
            department: { name: "Engineering" },
            position: { title: "Software Engineer" },
          },
          payrollRun: {
            payPeriod: {
              type: "MONTHLY",
              year: 2026,
              period: 1,
              startDate: new Date("2026-01-01"),
              endDate: new Date("2026-01-31"),
            },
          },
        },
      };

      const pdfBuffer = await generator.generate(mockPayslipData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // PDF files start with %PDF
      expect(pdfBuffer.slice(0, 4).toString()).toBe("%PDF");
    });

    it("should handle missing optional fields", async () => {
      const mockPayslipData = {
        id: "payslip-2",
        tenantId: "tenant-1",
        employeeId: "emp-2",
        issuedDate: new Date("2026-01-31"),
        payrollRecord: {
          id: "record-2",
          baseSalary: 15000000,
          grossPay: 15000000,
          netPay: 12000000,
          totalDeductions: 3000000,
          totalAllowances: 0,
          taxAmount: 1500000,
          insuranceEmployee: 1575000,
          insuranceEmployer: 3225000,
          overtimePay: 0,
          bonusAmount: 0,
          employee: {
            firstName: "Tran",
            lastName: "Thi B",
            employeeCode: "EMP002",
            taxCode: null,
            bankName: null,
            bankAccount: null,
            department: null,
            position: null,
          },
          payrollRun: {
            payPeriod: {
              type: "MONTHLY",
              year: 2026,
              period: 1,
              startDate: new Date("2026-01-01"),
              endDate: new Date("2026-01-31"),
            },
          },
        },
      };

      const pdfBuffer = await generator.generate(mockPayslipData);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe("formatCurrency", () => {
    it("should format numbers with 2 decimal places", () => {
      // Access private method via any cast for testing
      const result = (generator as any).formatCurrency(1234567.89);
      expect(result).toBe("1,234,567.89");
    });

    it("should handle whole numbers", () => {
      const result = (generator as any).formatCurrency(1000000);
      expect(result).toBe("1,000,000.00");
    });
  });
});
