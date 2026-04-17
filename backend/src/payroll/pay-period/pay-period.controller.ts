import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { PayPeriodService } from "./pay-period.service";
import { CreatePayPeriodDto, UpdatePayPeriodDto } from "../dto/pay-period.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../../auth/decorators/current-user.decorator";
import { successResponse } from "../../common/dto/response.dto";
import { UserRole, PayPeriodType } from "@prisma/client";

@ApiTags("payroll/pay-periods")
@Controller("payroll/pay-periods")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayPeriodController {
  constructor(private service: PayPeriodService) {}

  @Get()
  @ApiOperation({ summary: "List pay periods" })
  @ApiQuery({ name: "year", required: false })
  @ApiQuery({ name: "type", required: false, enum: PayPeriodType })
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query("year") year?: number,
    @Query("type") type?: PayPeriodType,
  ) {
    const periods = await this.service.findAll(user.tenantId, year ? parseInt(year as unknown as string) : undefined, type);
    return successResponse(periods);
  }

  @Get("open")
  @ApiOperation({ summary: "List open pay periods" })
  async getOpenPeriods(@CurrentUser() user: CurrentUserType) {
    const periods = await this.service.getOpenPeriods(user.tenantId);
    return successResponse(periods);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get pay period by ID" })
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const period = await this.service.findById(id, user.tenantId);
    return successResponse(period);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create pay period" })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePayPeriodDto,
  ) {
    const period = await this.service.create(user.tenantId, dto);
    return successResponse(period);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update pay period" })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto: UpdatePayPeriodDto,
  ) {
    const period = await this.service.update(id, user.tenantId, dto);
    return successResponse(period);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete pay period" })
  async remove(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const period = await this.service.remove(id, user.tenantId);
    return successResponse(period);
  }

  @Post("generate-monthly")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Generate monthly pay periods for a year" })
  @ApiQuery({ name: "year", required: true })
  async generateMonthly(
    @CurrentUser() user: CurrentUserType,
    @Query("year") year: string,
  ) {
    const periods = await this.service.generateMonthlyPeriods(user.tenantId, parseInt(year));
    return successResponse(periods);
  }
}
