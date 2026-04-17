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
import { SalaryComponentService } from "./salary-component.service";
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from "../dto/salary-component.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser, CurrentUserType } from "../../auth/decorators/current-user.decorator";
import { successResponse } from "../../common/dto/response.dto";
import { UserRole } from "@prisma/client";

@ApiTags("payroll/salary-components")
@Controller("payroll/salary-components")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalaryComponentController {
  constructor(private service: SalaryComponentService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "List all salary components" })
  async findAll(@CurrentUser() user: CurrentUserType) {
    const components = await this.service.findAll(user.tenantId);
    return successResponse(components);
  }

  @Get("employee/:employeeId")
  @ApiOperation({ summary: "Get salary components for an employee" })
  async findByEmployee(
    @CurrentUser() user: CurrentUserType,
    @Param("employeeId") employeeId: string,
  ) {
    const components = await this.service.findAllByEmployee(user.tenantId, employeeId);
    return successResponse(components);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get salary component by ID" })
  async findOne(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const component = await this.service.findById(id, user.tenantId);
    return successResponse(component);
  }

  @Post("employee/:employeeId")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Create salary component for an employee" })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Param("employeeId") employeeId: string,
    @Body() dto: CreateSalaryComponentDto,
  ) {
    const component = await this.service.create(user.tenantId, employeeId, dto);
    return successResponse(component);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Update salary component" })
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
    @Body() dto: UpdateSalaryComponentDto,
  ) {
    const component = await this.service.update(id, user.tenantId, dto);
    return successResponse(component);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: "Delete salary component" })
  async remove(
    @CurrentUser() user: CurrentUserType,
    @Param("id") id: string,
  ) {
    const component = await this.service.remove(id, user.tenantId);
    return successResponse(component);
  }
}
