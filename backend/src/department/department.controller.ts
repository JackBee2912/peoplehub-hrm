import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DepartmentService } from "./department.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto/department.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("departments")
@Controller("departments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private departmentService: DepartmentService) {}

  @Get()
  @ApiOperation({ summary: "Get department tree structure" })
  async findAllTree(@CurrentUser() user: CurrentUserType) {
    const tree = await this.departmentService.findAllTree(user.tenantId);
    return successResponse(tree);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get department by ID" })
  async findOne(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const department = await this.departmentService.findById(id, user.tenantId);
    return successResponse(department);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create a new department" })
  async create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateDepartmentDto) {
    const department = await this.departmentService.create(user.tenantId, dto);
    return successResponse(department);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update a department" })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentService.update(id, user.tenantId, dto);
    return successResponse(department);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete a department" })
  async remove(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const department = await this.departmentService.remove(id, user.tenantId);
    return successResponse(department);
  }
}
