import { PrismaClient, EmployeeStatus, ContractType } from "@prisma/client";
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
          employeeCode: "TEMP",
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

  // Fix employee codes (re-generate after all employees are created)
  const allEmployees = await prisma.employee.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < allEmployees.length; i++) {
    const code = `EMP-${String(i + 1).padStart(5, "0")}`;
    await prisma.employee.update({
      where: { id: allEmployees[i].id },
      data: { employeeCode: code },
    });
  }
  console.log("Employee codes updated.");

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
