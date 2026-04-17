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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { EmployeeService } from "./employee.service";
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from "./dto/employee.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../auth/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { successResponse } from "../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("employees")
@Controller("employees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: "List employees (paginated, filtered, sorted)" })
  async findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() pagination: PaginationDto,
    @Query() filters: EmployeeFilterDto,
  ) {
    const result = await this.employeeService.findAll(user.tenantId, pagination, filters);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get employee by ID" })
  async findOne(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const employee = await this.employeeService.findById(id, user.tenantId);
    return successResponse(employee);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create a new employee" })
  async create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateEmployeeDto) {
    const employee = await this.employeeService.create(user.tenantId, dto);
    return successResponse(employee);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update an employee" })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const employee = await this.employeeService.update(id, user.tenantId, dto);
    return successResponse(employee);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete an employee (soft delete)" })
  async remove(@CurrentUser() user: CurrentUserType, @Param("id") id: string) {
    const employee = await this.employeeService.remove(id, user.tenantId);
    return successResponse(employee);
  }
}
