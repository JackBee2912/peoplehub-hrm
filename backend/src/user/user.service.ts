import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { UpdateUserDto } from "./dto/user.dto";
import { PaginationDto, buildPaginatedResult } from "../common/dto/pagination.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, tenantId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { employee: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Update related employee record if it exists
    if (user.employee && (dto.firstName || dto.lastName || dto.phone)) {
      await this.prisma.employee.update({
        where: { id: user.employee.id },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.phone && { phone: dto.phone }),
        },
      });
    }

    // Update user settings if provided
    const updateData: any = {};
    if (dto.phone !== undefined) {
      updateData.settings = {
        ...(user.settings as Record<string, unknown>),
        phone: dto.phone,
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { employee: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        employee: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    return updated;
  }

  async findAll(tenantId: string, pagination: PaginationDto, callerRole: UserRole) {
    if (callerRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Only administrators can list all users");
    }

    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    return buildPaginatedResult(users, total, page, limit);
  }
}
