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
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PositionService } from "./position.service";
import { CreatePositionDto, UpdatePositionDto } from "./dto/position.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("positions")
@Controller("positions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PositionController {
  constructor(private positionService: PositionService) {}

  @Get()
  @ApiOperation({ summary: "List positions (paginated)" })
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() pagination: PaginationDto,
  ) {
    const result = await this.positionService.findAll(user.tenantId, pagination);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get position by ID" })
  async findOne(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const position = await this.positionService.findById(id, user.tenantId);
    return successResponse(position);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create a new position" })
  async create(@CurrentUser() user: CurrentUserType, @Body() dto: CreatePositionDto) {
    const position = await this.positionService.create(user.tenantId, dto);
    return successResponse(position);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update a position" })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    const position = await this.positionService.update(id, user.tenantId, dto);
    return successResponse(position);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete a position" })
  async remove(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const position = await this.positionService.remove(id, user.tenantId);
    return successResponse(position);
  }
}
