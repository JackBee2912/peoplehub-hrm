import { PrismaClient, EmployeeStatus, ContractType, LeaveTypeCategory, HolidayType } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  const saltRounds = 10;

  // 1. Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "peoplehub-demo" },
    update: {},
    create: {
      name: "PeopleHub Demo Organization",
      slug: "peoplehub-demo",
      timezone: "UTC",
      language: "en",
      currency: "USD",
      plan: "FREE",
      maxEmployees: 50,
    },
  });
  console.log(`Tenant created: ${tenant.name} (${tenant.slug})`);

  // 2. Create admin user
  const adminPasswordHash = await bcrypt.hash("Admin@123", saltRounds);
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@peoplehub.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@peoplehub.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // 3. Create HR Manager user
  const hrPasswordHash = await bcrypt.hash("HrManager@123", saltRounds);
  const hrUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "hr@peoplehub.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "hr@peoplehub.com",
      passwordHash: hrPasswordHash,
      role: "HR_MANAGER",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`HR Manager user created: ${hrUser.email}`);

  // 4. Create Manager user
  const managerPasswordHash = await bcrypt.hash("Manager@123", saltRounds);
  const managerUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "manager@peoplehub.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "manager@peoplehub.com",
      passwordHash: managerPasswordHash,
      role: "MANAGER",
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`Manager user created: ${managerUser.email}`);

  // 5. Create departments
  const engineering = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "ENG" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Engineering",
      code: "ENG",
      description: "Software development and engineering",
      managerId: managerUser.id,
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log(`Department created: ${engineering.name}`);

  const hr = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "HR" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Human Resources",
      code: "HR",
      description: "Human resources management",
      managerId: hrUser.id,
      isActive: true,
      sortOrder: 2,
    },
  });
  console.log(`Department created: ${hr.name}`);

  const marketing = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "MKT" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Marketing",
      code: "MKT",
      description: "Marketing and communications",
      isActive: true,
      sortOrder: 3,
    },
  });
  console.log(`Department created: ${marketing.name}`);

  // Sub-departments
  const frontend = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "ENG-FE" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Frontend Team",
      code: "ENG-FE",
      description: "Frontend development",
      parentId: engineering.id,
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log(`Sub-department created: ${frontend.name}`);

  const backend = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "ENG-BE" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Backend Team",
      code: "ENG-BE",
      description: "Backend development",
      parentId: engineering.id,
      isActive: true,
      sortOrder: 2,
    },
  });
  console.log(`Sub-department created: ${backend.name}`);

  // 6. Create positions
  const positions = [
    { title: "Senior Software Engineer", code: "POS-SSE", dept: engineering.id, level: 5, minSalary: 80000, maxSalary: 120000 },
    { title: "Software Engineer", code: "POS-SE", dept: engineering.id, level: 3, minSalary: 60000, maxSalary: 90000 },
    { title: "Frontend Developer", code: "POS-FE", dept: frontend.id, level: 3, minSalary: 55000, maxSalary: 85000 },
    { title: "Backend Developer", code: "POS-BE", dept: backend.id, level: 3, minSalary: 55000, maxSalary: 85000 },
    { title: "HR Manager", code: "POS-HRM", dept: hr.id, level: 5, minSalary: 70000, maxSalary: 100000 },
    { title: "HR Specialist", code: "POS-HRS", dept: hr.id, level: 3, minSalary: 45000, maxSalary: 65000 },
    { title: "Marketing Manager", code: "POS-MKM", dept: marketing.id, level: 5, minSalary: 65000, maxSalary: 95000 },
    { title: "Marketing Specialist", code: "POS-MKS", dept: marketing.id, level: 3, minSalary: 40000, maxSalary: 60000 },
  ];

  for (const pos of positions) {
    await prisma.position.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: pos.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        title: pos.title,
        code: pos.code,
        departmentId: pos.dept,
        level: pos.level,
        minSalary: pos.minSalary,
        maxSalary: pos.maxSalary,
        headcount: 5,
        isActive: true,
      },
    });
    console.log(`Position created: ${pos.title}`);
  }

  // 7. Create employees
  const employees = [
    {
      employeeCode: "EMP-00001",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@peoplehub.com",
      departmentId: engineering.id,
      positionId: null, // Will use the first position
      status: EmployeeStatus.ACTIVE,
      hireDate: new Date("2023-01-15"),
      contractType: ContractType.FULL_TIME,
      phone: "+1-555-0101",
    },
    {
      employeeCode: "EMP-00002",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@peoplehub.com",
      departmentId: hr.id,
      status: EmployeeStatus.ACTIVE,
      hireDate: new Date("2023-03-01"),
      contractType: ContractType.FULL_TIME,
      phone: "+1-555-0102",
    },
    {
      employeeCode: "EMP-00003",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice.johnson@peoplehub.com",
      departmentId: frontend.id,
      status: EmployeeStatus.ACTIVE,
      hireDate: new Date("2024-01-10"),
      contractType: ContractType.FULL_TIME,
      phone: "+1-555-0103",
    },
    {
      employeeCode: "EMP-00004",
      firstName: "Bob",
      lastName: "Williams",
      email: "bob.williams@peoplehub.com",
      departmentId: marketing.id,
      status: EmployeeStatus.PROBATION,
      hireDate: new Date("2025-03-01"),
      contractType: ContractType.FULL_TIME,
      phone: "+1-555-0104",
    },
  ];

  for (const emp of employees) {
    const existing = await prisma.employee.findFirst({
      where: { tenantId: tenant.id, email: emp.email },
    });
    if (!existing) {
      await prisma.employee.create({
        data: {
          tenantId: tenant.id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          departmentId: emp.departmentId,
          positionId: emp.positionId,
          status: emp.status,
          hireDate: emp.hireDate,
          contractType: emp.contractType,
          phone: emp.phone,
          country: "US",
        },
      });
      console.log(`Employee created: ${emp.firstName} ${emp.lastName}`);
    }
  }

  console.log("Employee codes assigned.");

  // ==================== SPRINT 2: ATTENDANCE, LEAVE & TIME ====================

  // 8. Create shifts
  const standardShift = await prisma.shift.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "STD" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Standard Office Hours",
      code: "STD",
      description: "9 AM - 6 PM with 1 hour lunch break",
      type: "FIXED",
      startTime: "09:00",
      endTime: "18:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      breakMinutes: 60,
      workHours: 8,
      lateThreshold: 15,
      earlyLeaveThreshold: 15,
      color: "#4CAF50",
      isDefault: true,
    },
  });
  console.log(`Shift created: ${standardShift.name}`);

  const morningShift = await prisma.shift.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "MOR" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Morning Shift",
      code: "MOR",
      description: "7 AM - 3 PM",
      type: "FIXED",
      startTime: "07:00",
      endTime: "15:00",
      breakStart: "11:00",
      breakEnd: "11:30",
      breakMinutes: 30,
      workHours: 7.5,
      lateThreshold: 10,
      earlyLeaveThreshold: 10,
      color: "#2196F3",
    },
  });
  console.log(`Shift created: ${morningShift.name}`);

  // 9. Create leave types
  const leaveTypes = [
    { name: "Annual Leave", category: LeaveTypeCategory.ANNUAL, annualDays: 12, accrualRate: 1, carryOverLimit: 5, color: "#4CAF50", sortOrder: 1 },
    { name: "Sick Leave", category: LeaveTypeCategory.SICK, annualDays: 10, accrualRate: 0.83, carryOverLimit: 3, requiresAttachment: true, color: "#FF9800", sortOrder: 2 },
    { name: "Maternity Leave", category: LeaveTypeCategory.MATERNITY, annualDays: 180, accrualRate: 0, carryOverLimit: 0, requiresAttachment: true, color: "#E91E63", sortOrder: 3 },
    { name: "Paternity Leave", category: LeaveTypeCategory.PATERNITY, annualDays: 14, accrualRate: 0, carryOverLimit: 0, requiresAttachment: false, color: "#9C27B0", sortOrder: 4 },
    { name: "Unpaid Leave", category: LeaveTypeCategory.UNPAID, annualDays: 0, accrualRate: 0, carryOverLimit: 0, unpaid: true, requiresReason: true, color: "#9E9E9E", sortOrder: 5 },
    { name: "Compensatory Leave", category: LeaveTypeCategory.COMPENSATORY, annualDays: 0, accrualRate: 0, carryOverLimit: 10, color: "#00BCD4", sortOrder: 6 },
    { name: "Bereavement Leave", category: LeaveTypeCategory.BEREAVEMENT, annualDays: 5, accrualRate: 0, carryOverLimit: 0, color: "#607D8B", sortOrder: 7 },
    { name: "Marriage Leave", category: LeaveTypeCategory.MARRIAGE, annualDays: 3, accrualRate: 0, carryOverLimit: 0, color: "#FF5722", sortOrder: 8 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { tenantId_category: { tenantId: tenant.id, category: lt.category } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: lt.name,
        category: lt.category,
        annualDays: lt.annualDays,
        accrualRate: lt.accrualRate,
        carryOverLimit: lt.carryOverLimit,
        requiresAttachment: lt.requiresAttachment || false,
        requiresReason: lt.requiresReason !== undefined ? lt.requiresReason : true,
        unpaid: lt.unpaid || false,
        color: lt.color,
        sortOrder: lt.sortOrder,
      },
    });
    console.log(`Leave type created: ${lt.name}`);
  }

  // 10. Create holidays for current year
  const currentYear = new Date().getFullYear();
  const holidays = [
    { name: "New Year's Day", date: new Date(currentYear, 0, 1), type: HolidayType.PUBLIC, isRecurring: true },
    { name: "Independence Day", date: new Date(currentYear, 6, 4), type: HolidayType.PUBLIC, isRecurring: true },
    { name: "Labor Day", date: new Date(currentYear, 8, 1), type: HolidayType.PUBLIC, isRecurring: true },
    { name: "Christmas Day", date: new Date(currentYear, 11, 25), type: HolidayType.PUBLIC, isRecurring: true },
    { name: "Company Anniversary", date: new Date(currentYear, 3, 15), type: HolidayType.COMPANY, isRecurring: true },
    { name: "Team Building Day", date: new Date(currentYear, 5, 20), type: HolidayType.COMPANY, isRecurring: false },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { tenantId_date_name: { tenantId: tenant.id, date: h.date, name: h.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: h.name,
        date: h.date,
        type: h.type,
        isRecurring: h.isRecurring,
        isActive: true,
      },
    });
    console.log(`Holiday created: ${h.name}`);
  }

  console.log("\nDatabase seeding completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin:  admin@peoplehub.com / Admin@123");
  console.log("  HR:     hr@peoplehub.com / HrManager@123");
  console.log("  Manager: manager@peoplehub.com / Manager@123");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
