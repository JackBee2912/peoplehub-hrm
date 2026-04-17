import { Module } from "@nestjs/common";
import { TaxRuleService } from "./tax-rule.service";
import { TaxRuleController } from "./tax-rule.controller";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [TaxRuleController],
  providers: [TaxRuleService, PrismaService],
  exports: [TaxRuleService],
})
export class TaxRuleModule {}
