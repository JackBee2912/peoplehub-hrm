import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LeaveService } from "./leave.service";
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  LeaveFilterDto,
  AdjustBalanceDto,
} from "./dto/leave.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("leave")
@ApiBearerAuth()
@Controller("leave")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  // ==================== LEAVE TYPES ====================

  @Get("types")
  @ApiOperation({ summary: "List leave types" })
  async findAllTypes(@CurrentUser() user: CurrentUserType, @Query() pagination: PaginationDto) {
    const result = await this.leaveService.findAllTypes(user.tenantId, pagination);
    return successResponse(result.data, result.meta);
  }

  @Get("types/:id")
  @ApiOperation({ summary: "Get leave type by ID" })
  async findOneType(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.leaveService.findTypeById(id, user.tenantId);
    return successResponse(result);
  }

  @Post("types")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create leave type" })
  async createType(@CurrentUser() user: CurrentUserType, @Body() dto: CreateLeaveTypeDto) {
    const result = await this.leaveService.createType(user.tenantId, dto);
    return successResponse(result);
  }

  @Patch("types/:id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update leave type" })
  async updateType(@CurrentUser() user: CurrentUserType, @Param("id") id: string, @Body() dto: UpdateLeaveTypeDto) {
    const result = await this.leaveService.updateType(id, user.tenantId, dto);
    return successResponse(result);
  }

  @Delete("types/:id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete leave type" })
  async removeType(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.leaveService.removeType(id, user.tenantId);
    return successResponse(result);
  }

  // ==================== LEAVE REQUESTS ====================

  @Post("requests")
  @ApiOperation({ summary: "Create leave request" })
  async createRequest(@CurrentUser() user: CurrentUserType, @Body() dto: CreateLeaveRequestDto) {
    const result = await this.leaveService.createRequest(user.tenantId, user.id, dto);
    return successResponse(result);
  }

  @Get("requests/my")
  @ApiOperation({ summary: "Get my leave requests" })
  async getMyRequests(
    @CurrentUser() user: CurrentUserType,
    @Query() pagination: PaginationDto,
    @Query() filters: LeaveFilterDto,
  ) {
    const result = await this.leaveService.getMyRequests(user.tenantId, user.id, pagination, filters);
    return successResponse(result.data, result.meta);
  }

  @Patch("requests/:id")
  @ApiOperation({ summary: "Update my leave request" })
  async updateRequest(@CurrentUser() user: CurrentUserType, @Param("id") id: string, @Body() dto: UpdateLeaveRequestDto) {
    const result = await this.leaveService.updateRequest(id, user.tenantId, user.id, dto);
    return successResponse(result);
  }

  @Post("requests/:id/cancel")
  @ApiOperation({ summary: "Cancel my leave request" })
  async cancelRequest(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.leaveService.cancelRequest(id, user.tenantId, user.id);
    return successResponse(result);
  }

  // ==================== APPROVALS ====================

  @Post("requests/:id/approve")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Approve leave request" })
  async approveRequest(@CurrentUser() user: CurrentUserType, @Param("id") id: string, @Body() dto: ApproveLeaveDto) {
    const result = await this.leaveService.approveRequest(id, user.tenantId, user.id, dto);
    return successResponse(result);
  }

  @Post("requests/:id/reject")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Reject leave request" })
  async rejectRequest(@CurrentUser() user: CurrentUserType, @Param("id") id: string, @Body() dto: RejectLeaveDto) {
    const result = await this.leaveService.rejectRequest(id, user.tenantId, user.id, dto);
    return successResponse(result);
  }

  @Get("pending-approvals")
  @Roles(UserRole.MANAGER, UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get pending approval requests" })
  async getPendingApprovals(@CurrentUser() user: CurrentUserType, @Query() pagination: PaginationDto) {
    const result = await this.leaveService.getPendingApprovals(user.tenantId, user.id, pagination);
    return successResponse(result.data, result.meta);
  }

  // ==================== BALANCES ====================

  @Get("balances")
  @ApiOperation({ summary: "Get my leave balances" })
  async getMyBalances(@CurrentUser() user: CurrentUserType, @Query("year") year?: string) {
    const y = year ? parseInt(year, 10) : undefined;
    const result = await this.leaveService.getBalances(user.tenantId, user.id, y);
    return successResponse(result);
  }

  @Get("balances/all")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Get all leave balances for tenant" })
  async getAllBalances(@CurrentUser() user: CurrentUserType, @Query("year") year?: string) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const result = await this.leaveService.getAllBalancesForTenant(user.tenantId, y);
    return successResponse(result);
  }

  @Post("balances/adjust")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Manually adjust leave balance" })
  async adjustBalance(@CurrentUser() user: CurrentUserType, @Body() dto: AdjustBalanceDto) {
    const result = await this.leaveService.adjustBalance(user.tenantId, dto);
    return successResponse(result);
  }
}
