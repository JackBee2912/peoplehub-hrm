import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { TaxRuleService } from "./tax-rule.service";
import { CreateTaxRuleDto, UpdateTaxRuleDto } from "../dto/tax-rule.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../../auth/decorators/current-user.decorator";
import { successResponse } from "../../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("payroll/tax-rules")
@Controller("payroll/tax-rules")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxRuleController {
  constructor(private service: TaxRuleService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "List all tax rules" })
  async findAll(@CurrentUser() user: CurrentUserType) {
    const rules = await this.service.findAll(user.tenantId);
    return successResponse(rules);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get tax rule by ID" })
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const rule = await this.service.findById(id, user.tenantId);
    return successResponse(rule);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create tax rule" })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateTaxRuleDto,
  ) {
    const rule = await this.service.create(user.tenantId, dto);
    return successResponse(rule);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update tax rule" })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto: UpdateTaxRuleDto,
  ) {
    const rule = await this.service.update(id, user.tenantId, dto);
    return successResponse(rule);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete tax rule" })
  async remove(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const rule = await this.service.remove(id, user.tenantId);
    return successResponse(rule);
  }

  @Post("seed-defaults")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Seed default Vietnam tax rules" })
  async seedDefaults(@CurrentUser() user: CurrentUserType) {
    await this.service.seedDefaultRules(user.tenantId);
    return successResponse({ message: "Default tax rules seeded" });
  }
}
