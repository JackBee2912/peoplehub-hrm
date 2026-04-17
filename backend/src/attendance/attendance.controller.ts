import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { CheckInDto, CheckOutDto, AttendanceFilterDto, AttendanceStatsDto } from "./dto/attendance.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";
import { Request } from "express";

@ApiTags("attendance")
@ApiBearerAuth()
@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post("checkin")
  @ApiOperation({ summary: "Check in for the current day" })
  async checkIn(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CheckInDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const result = await this.attendanceService.checkIn(user.tenantId, user.id, dto, ipAddress);
    return successResponse(result);
  }

  @Post("checkout")
  @ApiOperation({ summary: "Check out for the current day" })
  async checkOut(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CheckOutDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const result = await this.attendanceService.checkOut(user.tenantId, user.id, dto, ipAddress);
    return successResponse(result);
  }

  @Get("today")
  @ApiOperation({ summary: "Get today's attendance status" })
  async getTodayStatus(@CurrentUser() user: CurrentUserType) {
    const result = await this.attendanceService.getTodayStatus(user.tenantId, user.id);
    return successResponse(result);
  }

  @Get()
  @ApiOperation({ summary: "List attendance logs" })
  async getLogs(
    @CurrentUser() user: CurrentUserType,
    @Query() pagination: PaginationDto,
    @Query() filters: AttendanceFilterDto,
  ) {
    // Employees can only see their own logs; managers/admins see all
    const employeeId = user.role === UserRole.EMPLOYEE ? user.id : undefined;
    const result = await this.attendanceService.getLogs(user.tenantId, pagination, filters, employeeId);
    return successResponse(result.data, result.meta);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get attendance statistics" })
  async getStats(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: AttendanceStatsDto,
  ) {
    const result = await this.attendanceService.getStats(user.tenantId, user.id, dto);
    return successResponse(result);
  }
}
