import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async getAvailableRoles() {
    return [
      { value: "ADMIN", label: "Administrator", description: "Full system access" },
      { value: "HR_MANAGER", label: "HR Manager", description: "Manage employees, departments, and HR operations" },
      { value: "MANAGER", label: "Manager", description: "Manage team members and approvals" },
      { value: "EMPLOYEE", label: "Employee", description: "Standard employee access" },
      { value: "RECRUITER", label: "Recruiter", description: "Manage recruitment pipeline" },
    ];
  }
}
