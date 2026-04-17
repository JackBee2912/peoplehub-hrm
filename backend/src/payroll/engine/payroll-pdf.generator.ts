import { Injectable } from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

@Injectable()
export class PayrollPdfGenerator {
  private readonly FONT_SIZE_TITLE = 18;
  private readonly FONT_SIZE_HEADER = 12;
  private readonly FONT_SIZE_BODY = 10;
  private readonly FONT_SIZE_SMALL = 8;
  private readonly MARGIN = 40;
  private readonly LINE_HEIGHT = 16;

  async generate(payslipData: any): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const record = payslipData.payrollRecord;
    const employee = record.employee;
    const payPeriod = record.payrollRun.payPeriod;

    let y = height - this.MARGIN;

    // --- Header ---
    y = this.drawText(page, boldFont, "PAYSLIP", this.FONT_SIZE_TITLE, this.MARGIN, y, rgb(0.1, 0.1, 0.5));
    y -= 8;
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, rgb(0.7, 0.7, 0.7));
    y -= 12;

    // --- Company Info ---
    const tenant = payslipData.tenant || { name: "PeopleHub HRM" };
    y = this.drawText(page, boldFont, tenant.name || "PeopleHub HRM", this.FONT_SIZE_HEADER, this.MARGIN, y);
    y -= this.LINE_HEIGHT;

    // --- Pay Period Info ---
    y = this.drawText(page, boldFont, "Pay Period", this.FONT_SIZE_HEADER, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    const periodLabel = `${payPeriod.type.toLowerCase()} ${payPeriod.period}/${payPeriod.year}`;
    y = this.drawText(page, font, `Period: ${periodLabel}`, this.FONT_SIZE_BODY, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    const startDate = new Date(payPeriod.startDate).toLocaleDateString();
    const endDate = new Date(payPeriod.endDate).toLocaleDateString();
    y = this.drawText(page, font, `From: ${startDate}  To: ${endDate}`, this.FONT_SIZE_BODY, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    y = this.drawText(page, font, `Issued: ${new Date(payslipData.issuedDate).toLocaleDateString()}`, this.FONT_SIZE_BODY, this.MARGIN, y);
    y -= 16;
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, this.lightGray);
    y -= 12;

    // --- Employee Info ---
    y = this.drawText(page, boldFont, "Employee Information", this.FONT_SIZE_HEADER, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Name:", `${employee.firstName} ${employee.lastName}`, this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Employee Code:", employee.employeeCode, this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    if (employee.department?.name) {
      y = this.drawTwoColumn(page, font, "Department:", employee.department.name, this.FONT_SIZE_BODY, this.MARGIN, y, width);
      y -= this.LINE_HEIGHT;
    }
    if (employee.position?.title) {
      y = this.drawTwoColumn(page, font, "Position:", employee.position.title, this.FONT_SIZE_BODY, this.MARGIN, y, width);
      y -= this.LINE_HEIGHT;
    }
    if (employee.taxCode) {
      y = this.drawTwoColumn(page, font, "Tax Code:", employee.taxCode, this.FONT_SIZE_BODY, this.MARGIN, y, width);
      y -= this.LINE_HEIGHT;
    }
    if (employee.bankName && employee.bankAccount) {
      y = this.drawTwoColumn(page, font, "Bank:", `${employee.bankName} (${employee.bankAccount})`, this.FONT_SIZE_BODY, this.MARGIN, y, width);
      y -= this.LINE_HEIGHT;
    }
    y -= 8;
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, this.lightGray);
    y -= 12;

    // --- Earnings Section ---
    y = this.drawText(page, boldFont, "EARNINGS", this.FONT_SIZE_HEADER, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Base Salary", this.formatCurrency(record.baseSalary), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Allowances", this.formatCurrency(record.totalAllowances), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Bonuses", this.formatCurrency(record.bonusAmount), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Overtime Pay", this.formatCurrency(record.overtimePay), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, boldFont, "GROSS PAY", this.formatCurrency(record.grossPay), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= 12;
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, this.lightGray);
    y -= 12;

    // --- Deductions Section ---
    y = this.drawText(page, boldFont, "DEDUCTIONS", this.FONT_SIZE_HEADER, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Income Tax", this.formatCurrency(record.taxAmount), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, font, "Insurance (Employee)", this.formatCurrency(record.insuranceEmployee), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= this.LINE_HEIGHT;
    y = this.drawTwoColumn(page, boldFont, "TOTAL DEDUCTIONS", this.formatCurrency(record.totalDeductions), this.FONT_SIZE_BODY, this.MARGIN, y, width);
    y -= 12;
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, this.lightGray);
    y -= 16;

    // --- Net Pay ---
    y = this.drawText(page, boldFont, "NET PAY", this.FONT_SIZE_HEADER + 2, this.MARGIN, y, this.darkGreen);
    y -= this.LINE_HEIGHT;
    y = this.drawText(page, boldFont, this.formatCurrency(record.netPay), this.FONT_SIZE_HEADER + 4, this.MARGIN, y, this.darkGreen);
    y -= 20;
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, this.lightGray);
    y -= 12;

    // --- Employer Cost ---
    y = this.drawText(page, boldFont, "Employer Cost", this.FONT_SIZE_HEADER, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    y = this.drawText(page, font, `Employer insurance contribution: ${this.formatCurrency(record.insuranceEmployer)}`, this.FONT_SIZE_SMALL, this.MARGIN, y);
    y -= this.LINE_HEIGHT;
    y = this.drawText(page, font, `Total employer cost: ${this.formatCurrency(record.grossPay + record.insuranceEmployer)}`, this.FONT_SIZE_SMALL, this.MARGIN, y);
    y -= 30;

    // --- Footer ---
    y = this.drawHorizontalLine(page, this.MARGIN, y, width - this.MARGIN * 2, this.lightGray);
    y -= 20;
    y = this.drawText(page, font, "This is a system-generated payslip. For queries, contact HR department.", this.FONT_SIZE_SMALL, this.MARGIN, y, this.gray);

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private drawText(
    page: any,
    font: PDFFont,
    text: string,
    size: number,
    x: number,
    y: number,
    color?: { r: number; g: number; b: number },
  ): number {
    page.drawText(text, { x, y, font, size, color });
    return y;
  }

  private drawHorizontalLine(page: any, x: number, y: number, length: number, color?: { r: number; g: number; b: number }): number {
    page.drawLine({
      start: { x, y },
      end: { x: x + length, y },
      thickness: 1,
      color,
    });
    return y;
  }

  private drawTwoColumn(
    page: any,
    font: PDFFont,
    label: string,
    value: string,
    size: number,
    x: number,
    y: number,
    pageWidth: number,
    color?: { r: number; g: number; b: number },
  ): number {
    page.drawText(label, { x, y, font, size, color });
    // Right-align value
    const textWidth = font.widthOfTextAtSize(value, size);
    const valueX = pageWidth - this.MARGIN - textWidth;
    page.drawText(value, { x: valueX, y, font, size, color });
    return y;
  }

  private formatCurrency(value: any): string {
    const num = typeof value === "number" ? value : Number(value);
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
