import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from "./dto/employee.dto";
import { PaginationDto, buildPaginatedResult } from "../common/dto/pagination.dto";
import { EmployeeStatus } from "@prisma/client";

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  private async generateEmployeeCode(tenantId: string): Promise<string> {
    const count = await this.prisma.employee.count({
      where: { tenantId, isDeleted: false },
    });
    const padded = String(count + 1).padStart(5, "0");
    return `EMP-${padded}`;
  }

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters: EmployeeFilterDto = {},
  ) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isDeleted: false };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { employeeCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          position: { select: { id: true, title: true, code: true } },
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder as any },
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return buildPaginatedResult(employees, total, page, limit);
  }

  async findById(id: string, tenantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        department: { select: { id: true, name: true, code: true } },
        position: { select: { id: true, title: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        directReports: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return employee;
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const employeeCode = await this.generateEmployeeCode(tenantId);

    // Validate manager exists if provided
    if (dto.managerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: dto.managerId, tenantId, isDeleted: false },
      });
      if (!manager) {
        throw new NotFoundException("Manager not found");
      }
    }

    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        displayName: dto.displayName,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender,
        maritalStatus: dto.maritalStatus,
        nationality: dto.nationality,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country || "VN",
        postalCode: dto.postalCode,
        profilePhoto: dto.profilePhoto,
        status: dto.status || EmployeeStatus.PROBATION,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        managerId: dto.managerId,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
        probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : null,
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        taxCode: dto.taxCode,
        contractType: dto.contractType,
        salary: dto.salary,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        emergencyContactRelation: dto.emergencyContactRelation,
        notes: dto.notes,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        position: { select: { id: true, title: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return employee;
  }

  async update(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException("Employee not found");
    }

    // Prevent setting self as manager
    if (dto.managerId && dto.managerId === id) {
      throw new BadRequestException("An employee cannot be their own manager");
    }

    // Validate manager exists if provided
    if (dto.managerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: dto.managerId, tenantId, isDeleted: false },
      });
      if (!manager) {
        throw new NotFoundException("Manager not found");
      }
    }

    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.maritalStatus !== undefined) data.maritalStatus = dto.maritalStatus;
    if (dto.nationality !== undefined) data.nationality = dto.nationality;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.profilePhoto !== undefined) data.profilePhoto = dto.profilePhoto;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId;
    if (dto.positionId !== undefined) data.positionId = dto.positionId;
    if (dto.managerId !== undefined) data.managerId = dto.managerId;
    if (dto.hireDate !== undefined) data.hireDate = dto.hireDate ? new Date(dto.hireDate) : null;
    if (dto.probationEndDate !== undefined) data.probationEndDate = dto.probationEndDate ? new Date(dto.probationEndDate) : null;
    if (dto.terminationDate !== undefined) data.terminationDate = dto.terminationDate ? new Date(dto.terminationDate) : null;
    if (dto.terminationReason !== undefined) data.terminationReason = dto.terminationReason;
    if (dto.bankName !== undefined) data.bankName = dto.bankName;
    if (dto.bankAccount !== undefined) data.bankAccount = dto.bankAccount;
    if (dto.taxCode !== undefined) data.taxCode = dto.taxCode;
    if (dto.contractType !== undefined) data.contractType = dto.contractType;
    if (dto.salary !== undefined) data.salary = dto.salary;
    if (dto.emergencyContactName !== undefined) data.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined) data.emergencyContactPhone = dto.emergencyContactPhone;
    if (dto.emergencyContactRelation !== undefined) data.emergencyContactRelation = dto.emergencyContactRelation;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true, code: true } },
        position: { select: { id: true, title: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return employee;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, tenantId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException("Employee not found");
    }

    // Soft delete
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { isDeleted: true },
    });

    return employee;
  }
}
