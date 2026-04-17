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
import { ShiftService } from "./shift.service";
import {
  CreateShiftDto,
  UpdateShiftDto,
  AssignShiftDto,
  AssignMultipleShiftsDto,
  ScheduleFilterDto,
} from "./dto/shift.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("shifts")
@ApiBearerAuth()
@Controller("shifts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftController {
  constructor(private shiftService: ShiftService) {}

  @Get()
  @ApiOperation({ summary: "List all shifts" })
  async findAll(@CurrentUser() user: CurrentUserType, @Query() pagination: PaginationDto) {
    const result = await this.shiftService.findAll(user.tenantId, pagination);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get shift by ID" })
  async findOne(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.shiftService.findById(id, user.tenantId);
    return successResponse(result);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create a new shift" })
  async create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateShiftDto) {
    const result = await this.shiftService.create(user.tenantId, dto);
    return successResponse(result);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update a shift" })
  async update(@CurrentUser() user: CurrentUserType, @Param("id") id: string, @Body() dto: UpdateShiftDto) {
    const result = await this.shiftService.update(id, user.tenantId, dto);
    return successResponse(result);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete a shift" })
  async remove(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.shiftService.remove(id, user.tenantId);
    return successResponse(result);
  }

  @Post("assign")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Assign a shift to an employee" })
  async assignShift(@CurrentUser() user: CurrentUserType, @Body() dto: AssignShiftDto) {
    const result = await this.shiftService.assignShift(user.tenantId, dto);
    return successResponse(result);
  }

  @Post("assign-bulk")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Assign a shift to multiple employees" })
  async assignBulk(@CurrentUser() user: CurrentUserType, @Body() dto: AssignMultipleShiftsDto) {
    const result = await this.shiftService.assignMultipleShifts(user.tenantId, dto);
    return successResponse(result);
  }

  @Post("assignments/:id/end")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "End a shift assignment" })
  async endAssignment(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.shiftService.endAssignment(id, user.tenantId);
    return successResponse(result);
  }

  @Get("schedule")
  @ApiOperation({ summary: "Get shift schedule" })
  async getSchedule(@CurrentUser() user: CurrentUserType, @Query() filters: ScheduleFilterDto) {
    const result = await this.shiftService.getSchedule(user.tenantId, filters);
    return successResponse(result);
  }

  @Get("my-shift")
  @ApiOperation({ summary: "Get current employee's shift" })
  async getMyShift(@CurrentUser() user: CurrentUserType) {
    const result = await this.shiftService.getEmployeeCurrentShift(user.tenantId, user.id);
    return successResponse(result);
  }
}
