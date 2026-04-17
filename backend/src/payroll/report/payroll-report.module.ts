import { Module } from "@nestjs/common";
import { PayrollReportService } from "./payroll-report.service";
import { PayrollReportController } from "./payroll-report.controller";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [PayrollReportController],
  providers: [PayrollReportService, PrismaService],
  exports: [PayrollReportService],
})
export class PayrollReportModule {}
