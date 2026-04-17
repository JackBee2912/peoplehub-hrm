import { Module } from "@nestjs/common";
import { PayrollRunService } from "./payroll-run.service";
import { PayrollRunController } from "./payroll-run.controller";
import { PayrollCalculationEngine } from "../engine/payroll-calculation.engine";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [PayrollRunController],
  providers: [PayrollRunService, PayrollCalculationEngine, PrismaService],
  exports: [PayrollRunService, PayrollCalculationEngine],
})
export class PayrollRunModule {}
