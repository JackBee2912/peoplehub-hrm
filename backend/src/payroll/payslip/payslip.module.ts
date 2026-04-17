import { Module } from "@nestjs/common";
import { PayslipService } from "./payslip.service";
import { PayslipController } from "./payslip.controller";
import { PayrollPdfGenerator } from "../engine/payroll-pdf.generator";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [PayslipController],
  providers: [PayslipService, PayrollPdfGenerator, PrismaService],
  exports: [PayslipService],
})
export class PayslipModule {}
