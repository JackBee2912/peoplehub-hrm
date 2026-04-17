import { Module } from "@nestjs/common";
import { SalaryComponentService } from "./salary-component.service";
import { SalaryComponentController } from "./salary-component.controller";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [SalaryComponentController],
  providers: [SalaryComponentService, PrismaService],
  exports: [SalaryComponentService],
})
export class SalaryComponentModule {}
