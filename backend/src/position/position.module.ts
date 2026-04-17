import { Module } from "@nestjs/common";
import { PositionService } from "./position.service";
import { PositionController } from "./position.controller";
import { PrismaService } from "../common/prisma/prisma.service";

@Module({
  controllers: [PositionController],
  providers: [PositionService, PrismaService],
  exports: [PositionService],
})
export class PositionModule {}
