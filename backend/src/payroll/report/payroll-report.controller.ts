import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { PayrollReportService } from "./payroll-report.service";
import { PayrollSummaryQueryDto } from "../dto/report.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../../auth/decorators/current-user.decorator";
import { successResponse } from "../../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("payroll/reports")
@Controller("payroll/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollReportController {
  constructor(private service: PayrollReportService) {}

  @Get("summary")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Get payroll summary by department and period" })
  async getSummary(
    @CurrentUser() user: CurrentUserType,
    @Query() query: PayrollSummaryQueryDto,
  ) {
    const summary = await this.service.getSummary(user.tenantId, query);
    return successResponse(summary);
  }

  @Get("cost-analysis")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Get payroll cost analysis" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "payPeriodId", required: false })
  async getCostAnalysis(
    @CurrentUser() user: CurrentUserType,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("payPeriodId") payPeriodId?: string,
  ) {
    const analysis = await this.service.getCostAnalysis(user.tenantId, {
      startDate,
      endDate,
      payPeriodId,
    });
    return successResponse(analysis);
  }
}
