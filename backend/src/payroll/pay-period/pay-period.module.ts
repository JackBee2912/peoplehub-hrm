import { Module } from "@nestjs/common";
import { PayPeriodService } from "./pay-period.service";
import { PayPeriodController } from "./pay-period.controller";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [PayPeriodController],
  providers: [PayPeriodService, PrismaService],
  exports: [PayPeriodService],
})
export class PayPeriodModule {}
