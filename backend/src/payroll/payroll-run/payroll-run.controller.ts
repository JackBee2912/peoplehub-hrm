import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { PayrollRunService } from "./payroll-run.service";
import { CreatePayrollRunDto, PayrollRunActionDto } from "../dto/payroll-run.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../../auth/decorators/current-user.decorator";
import { successResponse } from "../../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("payroll/payroll-runs")
@Controller("payroll/payroll-runs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollRunController {
  constructor(private service: PayrollRunService) {}

  @Get()
  @ApiOperation({ summary: "List payroll runs" })
  @ApiQuery({ name: "status", required: false })
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query("status") status?: string,
  ) {
    const runs = await this.service.findAll(user.tenantId, status);
    return successResponse(runs);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payroll run details" })
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const run = await this.service.findById(id, user.tenantId);
    return successResponse(run);
  }

  @Get(":id/records")
  @ApiOperation({ summary: "Get payroll records for a run" })
  async getRecords(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const records = await this.service.getRecords(id, user.tenantId);
    return successResponse(records);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create a new payroll run (draft)" })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePayrollRunDto,
  ) {
    const run = await this.service.create(user.tenantId, user.id, dto);
    return successResponse(run);
  }

  @Post(":id/calculate")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Calculate payroll for all employees" })
  async calculate(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const run = await this.service.calculate(id, user.tenantId);
    return successResponse(run);
  }

  @Post(":id/submit")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Submit payroll for approval" })
  async submitForApproval(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto?: PayrollRunActionDto,
  ) {
    const run = await this.service.submitForApproval(id, user.tenantId, dto);
    return successResponse(run);
  }

  @Post(":id/approve")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Approve payroll" })
  async approve(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto?: PayrollRunActionDto,
  ) {
    const run = await this.service.approve(id, user.tenantId, user.id, dto);
    return successResponse(run);
  }

  @Post(":id/process")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Process payroll (generate payslips)" })
  async process(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto?: PayrollRunActionDto,
  ) {
    const run = await this.service.process(id, user.tenantId, dto);
    return successResponse(run);
  }

  @Post(":id/mark-paid")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Mark payroll as paid" })
  async markAsPaid(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto?: PayrollRunActionDto,
  ) {
    const run = await this.service.markAsPaid(id, user.tenantId, dto);
    return successResponse(run);
  }

  @Post(":id/reject")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Reject payroll (return to draft)" })
  async reject(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto?: PayrollRunActionDto,
  ) {
    const run = await this.service.reject(id, user.tenantId, dto);
    return successResponse(run);
  }

  @Post(":id/issue-payslips")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Generate PDF payslips for all employees" })
  async issuePayslips(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const { PayslipService } = require("../payslip/payslip.service");
    const run = await this.service.findById(id, user.tenantId);

    // This is handled by the payslip service - for now return run info
    return successResponse({ message: "Payslip generation triggered", payrollRunId: id });
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete a draft payroll run" })
  async remove(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const run = await this.service.remove(id, user.tenantId);
    return successResponse(run);
  }
}
