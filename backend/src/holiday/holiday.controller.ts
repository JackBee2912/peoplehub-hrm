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
import { HolidayService } from "./holiday.service";
import { CreateHolidayDto, UpdateHolidayDto, CalendarFilterDto } from "./dto/holiday.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("holidays")
@ApiBearerAuth()
@Controller("holidays")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidayController {
  constructor(private holidayService: HolidayService) {}

  @Get()
  @ApiOperation({ summary: "List holidays" })
  async findAll(@CurrentUser() user: CurrentUserType, @Query() pagination: PaginationDto) {
    const result = await this.holidayService.findAll(user.tenantId, pagination);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get holiday by ID" })
  async findOne(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.holidayService.findById(id, user.tenantId);
    return successResponse(result);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create holiday" })
  async create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateHolidayDto) {
    const result = await this.holidayService.create(user.tenantId, dto);
    return successResponse(result);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update holiday" })
  async update(@CurrentUser() user: CurrentUserType, @Param("id") id: string, @Body() dto: UpdateHolidayDto) {
    const result = await this.holidayService.update(id, user.tenantId, dto);
    return successResponse(result);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete holiday" })
  async remove(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const result = await this.holidayService.remove(id, user.tenantId);
    return successResponse(result);
  }

  @Get("calendar")
  @ApiOperation({ summary: "Get holiday calendar for a year" })
  async getCalendar(@CurrentUser() user: CurrentUserType, @Query() filter: CalendarFilterDto) {
    if (!filter.year) {
      filter.year = new Date().getFullYear();
    }
    const result = await this.holidayService.getCalendar(user.tenantId, filter);
    return successResponse(result);
  }
}
