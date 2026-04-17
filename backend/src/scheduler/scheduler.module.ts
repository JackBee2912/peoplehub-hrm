import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { LeaveAccrualEngine } from "./leave-accrual.engine";
import { PrismaService } from "../common/prisma/prisma.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [LeaveAccrualEngine, PrismaService],
  exports: [LeaveAccrualEngine],
})
export class SchedulerModule {}
