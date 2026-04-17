import { Module } from "@nestjs/common";
import { ShiftService } from "./shift.service";
import { ShiftController } from "./shift.controller";
import { PrismaService } from "../common/prisma/prisma.service";

@Module({
  controllers: [ShiftController],
  providers: [ShiftService, PrismaService],
  exports: [ShiftService],
})
export class ShiftModule {}
