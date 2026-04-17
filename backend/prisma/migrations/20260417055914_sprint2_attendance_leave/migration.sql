-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'HALF_DAY', 'ON_LEAVE', 'REMOTE');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveTypeCategory" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPENSATORY', 'BEREAVEMENT', 'MARRIAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('FIXED', 'ROTATING', 'FLEXIBLE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC', 'COMPANY', 'DEPARTMENT', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "CheckInOutType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "type" "ShiftType" NOT NULL DEFAULT 'FIXED',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "workHours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "lateThreshold" INTEGER NOT NULL DEFAULT 15,
    "earlyLeaveThreshold" INTEGER NOT NULL DEFAULT 15,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "type" "CheckInOutType" NOT NULL DEFAULT 'CHECK_IN',
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "workHours" DOUBLE PRECISION,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyLeaveMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "shiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LeaveTypeCategory" NOT NULL DEFAULT 'ANNUAL',
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "annualDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accrualRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carryOverLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carryOverExpiry" TEXT,
    "maxConsecutiveDays" INTEGER,
    "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
    "requiresReason" BOOLEAN NOT NULL DEFAULT true,
    "unpaid" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAccrued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carriedOver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjusted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "endHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "totalDays" DOUBLE PRECISION NOT NULL,
    "approverId" TEXT,
    "approvalDate" TIMESTAMP(3),
    "approvalComment" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "HolidayType" NOT NULL DEFAULT 'PUBLIC',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_tenantId_idx" ON "Shift"("tenantId");

-- CreateIndex
CREATE INDEX "Shift_tenantId_isActive_idx" ON "Shift"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_tenantId_code_key" ON "Shift"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ShiftAssignment_tenantId_idx" ON "ShiftAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_employeeId_idx" ON "ShiftAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_shiftId_idx" ON "ShiftAssignment"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_employeeId_shiftId_startDate_key" ON "ShiftAssignment"("employeeId", "shiftId", "startDate");

-- CreateIndex
CREATE INDEX "AttendanceLog_tenantId_idx" ON "AttendanceLog"("tenantId");

-- CreateIndex
CREATE INDEX "AttendanceLog_employeeId_idx" ON "AttendanceLog"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceLog_date_idx" ON "AttendanceLog"("date");

-- CreateIndex
CREATE INDEX "AttendanceLog_tenantId_date_idx" ON "AttendanceLog"("tenantId", "date");

-- CreateIndex
CREATE INDEX "AttendanceLog_employeeId_date_idx" ON "AttendanceLog"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLog_employeeId_date_key" ON "AttendanceLog"("employeeId", "date");

-- CreateIndex
CREATE INDEX "LeaveType_tenantId_idx" ON "LeaveType"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveType_tenantId_isActive_idx" ON "LeaveType"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_tenantId_category_key" ON "LeaveType"("tenantId", "category");

-- CreateIndex
CREATE INDEX "LeaveBalance_tenantId_idx" ON "LeaveBalance"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveBalance_leaveTypeId_idx" ON "LeaveBalance"("leaveTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeId_year_key" ON "LeaveBalance"("employeeId", "leaveTypeId", "year");

-- CreateIndex
CREATE INDEX "LeaveRequest_tenantId_idx" ON "LeaveRequest"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_leaveTypeId_idx" ON "LeaveRequest"("leaveTypeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_tenantId_status_idx" ON "LeaveRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_approverId_idx" ON "LeaveRequest"("approverId");

-- CreateIndex
CREATE INDEX "Holiday_tenantId_idx" ON "Holiday"("tenantId");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_tenantId_isActive_idx" ON "Holiday"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_tenantId_date_name_key" ON "Holiday"("tenantId", "date", "name");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveType" ADD CONSTRAINT "LeaveType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
