import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { TeamAttendanceDto, TeamOverviewDto } from "./dto/dashboard.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("manager")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get full manager dashboard" })
  async getManagerDashboard(@CurrentUser() user: CurrentUserType) {
    const result = await this.dashboardService.getManagerDashboard(user.tenantId, user.id);
    return successResponse(result);
  }

  @Get("team-attendance")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get team attendance for today" })
  async getTeamAttendance(@CurrentUser() user: CurrentUserType, @Query() dto: TeamAttendanceDto) {
    const result = await this.dashboardService.getTeamAttendance(user.tenantId, user.id, dto);
    return successResponse(result);
  }

  @Get("pending-approvals")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get pending leave approvals" })
  async getPendingApprovals(@CurrentUser() user: CurrentUserType) {
    const result = await this.dashboardService.getPendingApprovals(user.tenantId, user.id);
    return successResponse(result);
  }

  @Get("team-overview")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get team overview" })
  async getTeamOverview(@CurrentUser() user: CurrentUserType, @Query() dto: TeamOverviewDto) {
    const result = await this.dashboardService.getTeamOverview(user.tenantId, user.id, dto);
    return successResponse(result);
  }
}
