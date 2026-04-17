import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { RoleService } from "./role.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { successResponse } from "../common/dto/response.dto";

@ApiTags("roles")
@Controller("roles")
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: "Get available roles" })
  async getRoles() {
    const roles = await this.roleService.getAvailableRoles();
    return successResponse(roles);
  }
}
