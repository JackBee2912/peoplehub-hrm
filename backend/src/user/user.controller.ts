import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { UpdateUserDto } from "./dto/user.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@CurrentUser() user: CurrentUserType) {
    const profile = await this.userService.getProfile(user.id, user.tenantId);
    return successResponse(profile);
  }

  @Put("me")
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.userService.updateProfile(user.id, user.tenantId, dto);
    return successResponse(updated);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "List all users (admin only)" })
  async findAll(
    @CurrentUser() user: CurrentUserType,
    pagination: PaginationDto,
  ) {
    const result = await this.userService.findAll(user.tenantId, pagination, user.role as UserRole);
    return successResponse(result.data, result.meta);
  }
}
