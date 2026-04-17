# PeopleHub — System Architecture Document

**Version:** 1.0.0  
**Created:** April 2026  
**Author:** Lead System Architect — AGENT-TEAM  
**Status:** Approved for implementation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Models (Prisma Schema)](#2-data-models-prisma-schema)
3. [API Design](#3-api-design)
4. [Security Architecture](#4-security-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Infrastructure](#6-infrastructure)
7. [File Structure](#7-file-structure)

---

## 1. SYSTEM OVERVIEW

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │  │  Public API  │ │
│  │ React + TS   │  │React Native  │  │ React + TS   │  │  Consumers   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │          │
│         └─────────────────┴────────┬────────┴─────────────────┘          │
│                                    │ HTTPS / WSS                         │
├────────────────────────────────────┼─────────────────────────────────────┤
│                            API GATEWAY                                   │
│  ┌─────────────────────────────────┴──────────────────────────────────┐  │
│  │  Nginx Reverse Proxy / API Gateway                                  │  │
│  │  - TLS termination  - Rate limiting  - CORS  - Request routing     │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
├────────────────────────────────────┼─────────────────────────────────────┤
│                         APPLICATION LAYER                                │
│  ┌─────────────────────────────────┴──────────────────────────────────┐  │
│  │                    NestJS Backend (Monolith-first)                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │   Auth   │ │ Employee │ │Attendance│ │  Payroll │ │Performance│ │  │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module   │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │Recruitmnt│ │Training  │ │Organization││ Reports  │ │Notification││  │
│  │  │  Module  │ │  Module  │ │  Module   │ │  Module  │ │  Module  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │  │
│  │  │  Admin   │ │  Audit   │ │ Webhook  │                            │  │
│  │  │  Module  │ │  Module  │ │  Module  │                            │  │
│  │  └──────────┘ └──────────┘ └──────────┘                            │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
├────────────────────────────────────┼─────────────────────────────────────┤
│                          DATA LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │  Elasticsearch│  │  S3 Storage  │ │
│  │  Primary DB  │  │  Cache/Queue │  │  Full-text    │  │  Documents   │ │
│  │  Prisma ORM  │  │  BullMQ      │  │  Search       │  │  Files       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  SMTP    │ │   SMS    │ │Payment   │ │ AI/ML    │ │ Calendar/SSO │  │
│  │  Email   │ │ Gateway  │ │ Gateway  │ │ Service  │ │  Providers   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend (Web)** | React 19 + TypeScript 5 + Vite + TailwindCSS 4 | Employee portal, admin dashboard, public pages |
| **Backend** | NestJS 11 + Node.js 22 LTS | RESTful API, business logic, authentication |
| **ORM** | Prisma 6 | Type-safe database access, migrations |
| **Database** | PostgreSQL 16 | Primary relational data store |
| **Cache/Sessions** | Redis 7 | Session store, API caching, rate limiting |
| **Job Queue** | BullMQ (on Redis) | Async jobs: email, payroll runs, report generation |
| **Search** | Elasticsearch 8 | Full-text employee/candidate search (Phase 3) |
| **File Storage** | MinIO (S3-compatible) | Document storage, photos, payslip PDFs |
| **Reverse Proxy** | Nginx | TLS termination, rate limiting, routing |
| **Container Runtime** | Docker + Docker Compose | Development and staging |
| **CI/CD** | GitHub Actions | Automated testing, building, deployment |

### 1.3 Architecture Decision Records

**ADR-001: Monolith-first, then microservices**
- Start as a modular monolith (NestJS modules) for development speed
- Each module is independently testable and deployable
- Extract to microservices only when scale demands it (payroll, notifications)

**ADR-002: PostgreSQL as primary database**
- Complex relational data (hierarchy, approvals, payroll) requires ACID guarantees
- JSONB columns for flexible custom fields
- Row-level security for multi-tenant data isolation

**ADR-003: RESTful API as primary, GraphQL for complex queries**
- REST for standard CRUD operations
- GraphQL (Phase 3) for dashboard analytics and custom report builder

**ADR-004: Multi-tenant by `tenantId` (row-level isolation)**
- Single database, tenant-scoped queries
- Every table includes `tenantId` column
- Middleware enforces tenant isolation at application layer

---

## 2. DATA MODELS (PRISMA SCHEMA)

### 2.1 Complete Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  ADMIN
  HR_MANAGER
  MANAGER
  EMPLOYEE
  RECRUITER
}

enum EmployeeStatus {
  PROBATION
  ACTIVE
  SUSPENDED
  TERMINATED
  RESIGNED
  RETIRED
  ON_LEAVE
}

enum ContractType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERN
  FREELANCE
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EARLY_LEAVE
  HALF_DAY
  ON_LEAVE
  REMOTE
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum LeaveTypeCategory {
  ANNUAL
  SICK
  MATERNITY
  PATERNITY
  UNPAID
  COMPENSATORY
  BEREAVEMENT
  MARRIAGE
  CUSTOM
}

enum PayrollStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  PROCESSED
  PAID
  FAILED
}

enum PerformanceRating {
  EXCEEDS_EXPECTATIONS
  MEETS_EXPECTATIONS
  NEEDS_IMPROVEMENT
  UNACCEPTABLE
  NOT_RATED
}

enum ReviewStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  CALIBRATED
}

enum CandidateStatus {
  NEW
  SCREENING
  INTERVIEWING
  OFFERED
  HIRED
  REJECTED
  WITHDRAWN
}

enum InterviewStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum InterviewResult {
  PASS
  FAIL
  HOLD
  PENDING
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
  PUSH
  SLACK
  TEAMS
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  READ
}

enum DocumentType {
  ID_CARD
  PASSPORT
  CONTRACT
  CERTIFICATE
  TAX_FORM
  INSURANCE
  RESUME
  OTHER
}

enum ShiftType {
  FIXED
  ROTATING
  FLEXIBLE
  CUSTOM
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum EnrollmentStatus {
  ENROLLED
  IN_PROGRESS
  COMPLETED
  DROPPED
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ON_HOLD
}

enum OfferStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

// ============================================================
// MULTI-TENANCY
// ============================================================

model Tenant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  domain      String?  @unique
  logo        String?
  timezone    String   @default("UTC")
  language    String   @default("en")
  currency    String   @default("USD")
  isActive    Boolean  @default(true)
  plan        String   @default("FREE")
  maxEmployees Int     @default(10)
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  departments Department[]
  positions   Position[]
  employees   Employee[]
  leaveTypes  LeaveType[]
  shifts      Shift[]
  holidays    Holiday[]
  payrollRuns PayrollRun[]
  taxRules    TaxRule[]
  jobPostings JobPosting[]
  courses     Course[]
  notifications NotificationConfig[]
  auditLogs   AuditLog[]
  webhooks    Webhook[]
  apiKeys     ApiKey[]
}

// ============================================================
// USER & AUTH
// ============================================================

model User {
  id            String    @id @default(uuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  email         String
  emailVerified Boolean   @default(false)
  passwordHash  String?
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  mfaBackupCodes String[]
  role          UserRole  @default(EMPLOYEE)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  lastLoginIp   String?
  failedAttempts Int      @default(0)
  lockedUntil   DateTime?
  settings      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  employee      Employee?
  sessions      Session[]
  refreshTokens RefreshToken[]
  approvals     LeaveApproval[]
  reviewSubmissions PerformanceReviewSubmission[]
  interviewers  Interview[]
  notifications Notification[]
  auditLogs     AuditLog[]
  createdJobs   JobPosting[]     @relation("JobCreator")
  createdCourses Course[]        @relation("CourseCreator")

  @@unique([tenantId, email])
  @@index([tenantId, role])
  @@index([tenantId, isActive])
}

model Session {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  ipAddress  String?
  userAgent  String?
  deviceName String?
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([token])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
}

// ============================================================
// ORGANIZATION
// ============================================================

model Department {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  code        String?
  description String?
  parentId    String?
  parent      Department? @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  managerId   String?
  manager     User?    @relation(fields: [managerId], references: [id])
  budget      Decimal? @db.Decimal(15, 2)
  costCenter  String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employees   Employee[]
  positions   Position[]
  courses     Course[] @relation("CourseDepartment")

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([tenantId, isActive])
}

model Position {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  departmentId String?
  department  Department? @relation(fields: [departmentId], references: [id])
  title       String
  code        String?
  description String?
  level       Int      @default(1)
  minSalary   Decimal? @db.Decimal(15, 2)
  maxSalary   Decimal? @db.Decimal(15, 2)
  headcount   Int      @default(1)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  employees   Employee[]
  jobPostings JobPosting[]

  @@unique([tenantId, code])
  @@index([tenantId])
}

// ============================================================
// EMPLOYEE
// ============================================================

model Employee {
  id              String         @id @default(uuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id])
  userId          String?        @unique
  user            User?          @relation(fields: [userId], references: [id])
  employeeCode    String         @unique
  firstName       String
  lastName        String
  displayName     String?
  email           String
  phone           String?
  dateOfBirth     DateTime?
  gender          String?
  maritalStatus   String?
  nationality     String?
  address         String?
  city            String?
  state           String?
  country         String         @default("VN")
  postalCode      String?
  profilePhoto    String?
  status          EmployeeStatus @default(PROBATION)
  departmentId    String?
  department      Department?    @relation(fields: [departmentId], references: [id])
  positionId      String?
  position        Position?      @relation(fields: [positionId], references: [id])
  managerId       String?
  manager         Employee?      @relation("EmployeeHierarchy", fields: [managerId], references: [id])
  directReports   Employee[]     @relation("EmployeeHierarchy")
  hireDate        DateTime?
  probationEndDate DateTime?
  terminationDate DateTime?
  terminationReason String?
  bankName        String?
  bankAccount     String?
  bankBranch      String?
  taxCode         String?
  socialInsurance String?
  healthInsurance String?
  salary          Decimal?       @db.Decimal(15, 2)
  salaryCurrency  String         @default("USD")
  customFields    Json?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  contracts       Contract[]
  documents       EmployeeDocument[]
  emergencyContacts EmergencyContact[]
  attendances     Attendance[]
  leaveBalances   LeaveBalance[]
  payrollRecords  PayrollRecord[]
  goals           PerformanceGoal[]
  reviewSubmissions PerformanceReviewSubmission[]
  enrollments     TrainingEnrollment[]
  certifications  Certification[]
  interviewee     Candidate?

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, departmentId])
  @@index([tenantId, employeeCode])
}

model Contract {
  id            String       @id @default(uuid())
  tenantId      String
  employeeId    String
  employee      Employee     @relation(fields: [employeeId], references: [id])
  contractType  ContractType
  startDate     DateTime
  endDate       DateTime?
  salary        Decimal      @db.Decimal(15, 2)
  currency      String       @default("USD")
  workingHours  Int          @default(40)
  probationMonths Int        @default(2)
  fileUrl       String?
  status        String       @default("ACTIVE")
  notes         String?
  signedAt      DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([employeeId])
  @@index([tenantId, status])
}

model EmployeeDocument {
  id          String       @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee     @relation(fields: [employeeId], references: [id])
  documentType DocumentType
  name        String
  fileUrl     String
  fileSize    Int
  mimeType    String
  expiryDate  DateTime?
  isVerified  Boolean      @default(false)
  notes       String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([employeeId])
  @@index([tenantId, documentType])
  @@index([tenantId, expiryDate])
}

model EmergencyContact {
  id          String   @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  name        String
  relationship String
  phone       String
  email       String?
  address     String?
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([employeeId])
}

// ============================================================
// ATTENDANCE & TIME TRACKING
// ============================================================

model Shift {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  code        String?
  shiftType   ShiftType @default(FIXED)
  startTime   String   // "09:00"
  endTime     String   // "18:00"
  breakStart  String?  // "12:00"
  breakEnd    String?  // "13:00"
  workHours   Decimal  @default(8) @db.Decimal(4, 2)
  gracePeriod Int      @default(15) // minutes
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  schedules   ShiftSchedule[]
  attendances Attendance[]

  @@unique([tenantId, code])
  @@index([tenantId])
}

model ShiftSchedule {
  id          String   @id @default(uuid())
  tenantId    String
  shiftId     String
  shift       Shift    @relation(fields: [shiftId], references: [id])
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  date        DateTime @db.Date
  createdAt   DateTime @default(now())

  @@unique([tenantId, employeeId, date])
  @@index([tenantId, date])
}

model Holiday {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  date        DateTime @db.Date
  isRecurring Boolean  @default(false)
  description String?
  createdAt   DateTime @default(now())

  @@unique([tenantId, date, name])
  @@index([tenantId, date])
}

model Attendance {
  id              String           @id @default(uuid())
  tenantId        String
  employeeId      String
  employee        Employee         @relation(fields: [employeeId], references: [id])
  shiftId         String?
  shift           Shift?           @relation(fields: [shiftId], references: [id])
  date            DateTime         @db.Date
  checkInTime     DateTime?
  checkOutTime    DateTime?
  status          AttendanceStatus
  lateMinutes     Int              @default(0)
  earlyLeaveMinutes Int            @default(0)
  overtimeMinutes Int              @default(0)
  workHours       Decimal?         @db.Decimal(4, 2)
  notes           String?
  location        Json?            // { lat, lng, address }
  method          String           @default("WEB") // WEB, MOBILE, KIOSK, BIOMETRIC
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([tenantId, employeeId, date])
  @@index([tenantId, date])
  @@index([tenantId, employeeId, date])
}

model OvertimeRequest {
  id          String   @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  date        DateTime @db.Date
  hours       Decimal  @db.Decimal(4, 2)
  reason      String
  status      String   @default("PENDING")
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([employeeId])
  @@index([tenantId, status])
}

// ============================================================
// LEAVE MANAGEMENT
// ============================================================

model LeaveType {
  id          String            @id @default(uuid())
  tenantId    String
  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  name        String
  category    LeaveTypeCategory
  color       String            @default("#3B82F6")
  accrualRule  Json?            // { frequency: "monthly", amount: 1.25 }
  maxBalance  Decimal?          @db.Decimal(5, 2)
  requiresDoc  Boolean          @default(false)
  requiresApproval Boolean      @default(true)
  carryOverDays Int             @default(0)
  isActive    Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  leaveRequests LeaveRequest[]
  leaveBalances LeaveBalance[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

model LeaveBalance {
  id          String   @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  leaveTypeId String
  leaveType   LeaveType @relation(fields: [leaveTypeId], references: [id])
  year        Int
  totalDays   Decimal  @db.Decimal(5, 2)
  usedDays    Decimal  @default(0) @db.Decimal(5, 2)
  remainingDays Decimal @db.Decimal(5, 2)
  adjustedDays Decimal @default(0) @db.Decimal(5, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, employeeId, leaveTypeId, year])
  @@index([tenantId, employeeId])
}

model LeaveRequest {
  id          String     @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee   @relation(fields: [employeeId], references: [id])
  leaveTypeId String
  leaveType   LeaveType  @relation(fields: [leaveTypeId], references: [id])
  startDate   DateTime   @db.Date
  endDate     DateTime   @db.Date
  days        Decimal    @db.Decimal(5, 2)
  reason      String
  status      LeaveStatus @default(PENDING)
  documentUrl String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  approvals   LeaveApproval[]

  @@index([tenantId, employeeId])
  @@index([tenantId, status])
  @@index([tenantId, startDate, endDate])
}

model LeaveApproval {
  id          String   @id @default(uuid())
  leaveRequestId String
  leaveRequest LeaveRequest @relation(fields: [leaveRequestId], references: [id], onDelete: Cascade)
  approverId  String
  approver    User     @relation(fields: [approverId], references: [id])
  action      String   // APPROVED, REJECTED
  comment     String?
  createdAt   DateTime @default(now())

  @@unique([leaveRequestId, approverId])
  @@index([approverId])
}

// ============================================================
// PAYROLL
// ============================================================

model PayrollRun {
  id          String         @id @default(uuid())
  tenantId    String
  tenant      Tenant         @relation(fields: [tenantId], references: [id])
  period      String         // "2026-04"
  startDate   DateTime       @db.Date
  endDate     DateTime       @db.Date
  status      PayrollStatus  @default(DRAFT)
  totalGross  Decimal        @default(0) @db.Decimal(15, 2)
  totalNet    Decimal        @default(0) @db.Decimal(15, 2)
  totalDeductions Decimal    @default(0) @db.Decimal(15, 2)
  totalTax    Decimal        @default(0) @db.Decimal(15, 2)
  currency    String         @default("USD")
  notes       String?
  processedBy String?
  processedAt DateTime?
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  records     PayrollRecord[]

  @@unique([tenantId, period])
  @@index([tenantId, status])
}

model PayrollRecord {
  id              String   @id @default(uuid())
  tenantId        String
  payrollRunId    String
  payrollRun      PayrollRun @relation(fields: [payrollRunId], references: [id])
  employeeId      String
  employee        Employee @relation(fields: [employeeId], references: [id])
  baseSalary      Decimal  @db.Decimal(15, 2)
  allowances      Json?    // [{ name: "Transport", amount: 200 }]
  bonuses         Json?    // [{ name: "Performance", amount: 500 }]
  overtimePay     Decimal  @default(0) @db.Decimal(15, 2)
  grossPay        Decimal  @db.Decimal(15, 2)
  taxAmount       Decimal  @default(0) @db.Decimal(15, 2)
  socialInsurance Decimal  @default(0) @db.Decimal(15, 2)
  healthInsurance Decimal  @default(0) @db.Decimal(15, 2)
  otherDeductions Json?    // [{ name: "Loan", amount: 100 }]
  totalDeductions Decimal  @db.Decimal(15, 2)
  netPay          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  payslipUrl      String?
  status          String   @default("CALCULATED")
  paidAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([payrollRunId, employeeId])
  @@index([tenantId, employeeId])
}

model TaxRule {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  country     String
  region      String?
  brackets    Json     // [{ min: 0, max: 5000, rate: 0.05 }]
  deductions  Json?    // [{ name: "Dependent", amount: 500 }]
  isActive    Boolean  @default(true)
  effectiveFrom DateTime @db.Date
  effectiveTo DateTime? @db.Date
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, country])
}

// ============================================================
// PERFORMANCE MANAGEMENT
// ============================================================

model PerformanceCycle {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  type        String   // QUARTERLY, ANNUAL, CUSTOM
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  status      String   @default("DRAFT") // DRAFT, ACTIVE, COMPLETED, ARCHIVED
  ratingScale Json?    // { levels: [{ value: 5, label: "Exceeds" }] }
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reviews     PerformanceReview[]

  @@index([tenantId])
  @@index([tenantId, status])
}

model PerformanceReview {
  id          String         @id @default(uuid())
  tenantId    String
  cycleId     String
  cycle       PerformanceCycle @relation(fields: [cycleId], references: [id])
  employeeId  String
  reviewerId  String
  status      ReviewStatus   @default(DRAFT)
  overallRating PerformanceRating @default(NOT_RATED)
  comments    String?
  strengths   String?
  improvements String?
  completedAt DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  submissions PerformanceReviewSubmission[]
  goals       PerformanceGoal[]

  @@unique([cycleId, employeeId])
  @@index([tenantId, employeeId])
  @@index([tenantId, reviewerId])
}

model PerformanceReviewSubmission {
  id          String   @id @default(uuid())
  reviewId    String
  review      PerformanceReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  submitterId String
  submitter   User     @relation(fields: [submitterId], references: [id])
  type        String   // SELF, MANAGER, PEER, SUBORDINATE
  ratings     Json?    // [{ kpiId: "...", rating: 4, comment: "..." }]
  comments    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([reviewId])
  @@index([submitterId])
}

model PerformanceGoal {
  id          String   @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  reviewId    String?
  review      PerformanceReview? @relation(fields: [reviewId], references: [id])
  title       String
  description String?
  type        String   @default("KPI") // KPI, OKR, PERSONAL
  weight      Decimal  @default(1) @db.Decimal(3, 2)
  target      String?
  progress    Int      @default(0)
  status      String   @default("IN_PROGRESS")
  dueDate     DateTime? @db.Date
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([employeeId])
  @@index([tenantId, status])
}

model KpiTemplate {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  category    String?
  metric      String?
  target      String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
}

// ============================================================
// RECRUITMENT (ATS)
// ============================================================

model JobPosting {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  creatorId   String?
  creator     User?    @relation("JobCreator", fields: [creatorId], references: [id])
  positionId  String?
  position    Position? @relation(fields: [positionId], references: [id])
  departmentId String?
  title       String
  description String?
  requirements String?
  location    String?
  jobType     String   @default("FULL_TIME")
  salaryMin   Decimal? @db.Decimal(15, 2)
  salaryMax   Decimal? @db.Decimal(15, 2)
  salaryCurrency String @default("USD")
  status      JobStatus @default(DRAFT)
  openDate    DateTime? @db.Date
  closeDate   DateTime? @db.Date
  openings    Int      @default(1)
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  candidates  Candidate[]
  stages      JobStage[]

  @@index([tenantId])
  @@index([tenantId, status])
}

model JobStage {
  id          String   @id @default(uuid())
  tenantId    String
  jobId       String
  job         JobPosting @relation(fields: [jobId], references: [id], onDelete: Cascade)
  name        String
  order       Int
  type        String   @default("DEFAULT") // SCREENING, INTERVIEW, ASSESSMENT, OFFER
  createdAt   DateTime @default(now())

  @@index([jobId])
}

model Candidate {
  id          String         @id @default(uuid())
  tenantId    String
  jobId       String
  job         JobPosting     @relation(fields: [jobId], references: [id])
  stageId     String?
  stage       JobStage?      @relation(fields: [stageId], references: [id])
  employeeId  String?        @if hired
  firstName   String
  lastName    String
  email       String
  phone       String?
  resumeUrl   String?
  coverLetter String?
  status      CandidateStatus @default(NEW)
  source      String?        // REFERRAL, LINKEDIN, WEBSITE, AGENCY
  appliedDate DateTime       @default(now())
  notes       String?
  score       Decimal?       @db.Decimal(3, 2)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  interviews  Interview[]
  offers      Offer[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, jobId])
}

model Interview {
  id          String         @id @default(uuid())
  tenantId    String
  candidateId String
  candidate   Candidate      @relation(fields: [candidateId], references: [id])
  interviewerId String
  interviewer User           @relation(fields: [interviewerId], references: [id])
  type        String         @default("PHONE") // PHONE, VIDEO, ONSITE
  scheduledAt DateTime
  duration    Int            @default(60) // minutes
  location    String?
  meetingLink String?
  status      InterviewStatus @default(SCHEDULED)
  result      InterviewResult @default(PENDING)
  score       Decimal?       @db.Decimal(3, 2)
  feedback    String?
  notes       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([candidateId])
  @@index([interviewerId])
  @@index([tenantId, scheduledAt])
}

model Offer {
  id          String   @id @default(uuid())
  tenantId    String
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id])
  position    String
  department  String?
  salary      Decimal  @db.Decimal(15, 2)
  currency    String   @default("USD")
  startDate   DateTime @db.Date
  benefits    Json?
  notes       String?
  fileUrl     String?
  status      OfferStatus @default(DRAFT)
  sentAt      DateTime?
  respondedAt DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([candidateId])
  @@index([tenantId, status])
}

// ============================================================
// TRAINING & DEVELOPMENT (LMS)
// ============================================================

model Course {
  id          String     @id @default(uuid())
  tenantId    String
  tenant      Tenant     @relation(fields: [tenantId], references: [id])
  creatorId   String?
  creator     User?      @relation("CourseCreator", fields: [creatorId], references: [id])
  departmentId String?
  department  Department? @relation("CourseDepartment", fields: [departmentId], references: [id])
  title       String
  description String?
  category    String?
  level       String     @default("BEGINNER") // BEGINNER, INTERMEDIATE, ADVANCED
  duration    Int        // minutes
  maxParticipants Int?
  status      CourseStatus @default(DRAFT)
  startDate   DateTime?  @db.Date
  endDate     DateTime?  @db.Date
  location    String?
  isOnline    Boolean    @default(false)
  materials   Json?      // [{ type: "video", url: "...", title: "..." }]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  enrollments TrainingEnrollment[]
  skills      CourseSkill[]

  @@index([tenantId])
  @@index([tenantId, status])
}

model TrainingEnrollment {
  id          String           @id @default(uuid())
  tenantId    String
  courseId    String
  course      Course           @relation(fields: [courseId], references: [id])
  employeeId  String
  employee    Employee         @relation(fields: [employeeId], references: [id])
  status      EnrollmentStatus @default(ENROLLED)
  progress    Int              @default(0)
  startedAt   DateTime?
  completedAt DateTime?
  score       Decimal?         @db.Decimal(5, 2)
  certificateUrl String?
  feedback    String?
  rating      Decimal?         @db.Decimal(3, 2) // 1-5
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([courseId, employeeId])
  @@index([employeeId])
}

model Certification {
  id          String   @id @default(uuid())
  tenantId    String
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  name        String
  issuer      String?
  issueDate   DateTime @db.Date
  expiryDate  DateTime? @db.Date
  fileUrl     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([employeeId])
  @@index([tenantId, expiryDate])
}

model Skill {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  category    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  courses     CourseSkill[]
  employeeSkills EmployeeSkill[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

model CourseSkill {
  id        String @id @default(uuid())
  courseId  String
  course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  skillId   String
  skill     Skill  @relation(fields: [skillId], references: [id])

  @@unique([courseId, skillId])
}

model EmployeeSkill {
  id         String   @id @default(uuid())
  tenantId   String
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  skillId    String
  skill      Skill    @relation(fields: [skillId], references: [id])
  level      Int      @default(1) // 1-5
  verified   Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@unique([employeeId, skillId])
  @@index([employeeId])
}

// ============================================================
// NOTIFICATIONS
// ============================================================

model NotificationConfig {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  eventType   String   // LEAVE_REQUEST, PAYROLL_READY, CONTRACT_EXPIRY, etc.
  channels    NotificationChannel[]
  template    String   // Handlebars template
  isActive    Boolean  @default(true)
  digestMode  String?  // NONE, DAILY, WEEKLY
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  logs        NotificationLog[]

  @@unique([tenantId, eventType])
  @@index([tenantId])
}

model Notification {
  id          String             @id @default(uuid())
  tenantId    String
  userId      String
  user        User               @relation(fields: [userId], references: [id])
  title       String
  message     String
  type        String             // INFO, WARNING, SUCCESS, ERROR
  channel     NotificationChannel
  status      NotificationStatus @default(PENDING)
  data        Json?
  readAt      DateTime?
  sentAt      DateTime?
  createdAt   DateTime           @default(now())

  @@index([userId, status])
  @@index([userId, readAt])
  @@index([tenantId, createdAt(sort: Desc)])
}

model NotificationLog {
  id          String   @id @default(uuid())
  configId    String
  config      NotificationConfig @relation(fields: [configId], references: [id])
  eventType   String
  payload     Json
  result      String   @default("PENDING") // PENDING, SENT, FAILED
  error       String?
  createdAt   DateTime @default(now())

  @@index([configId])
  @@index([createdAt(sort: Desc)])
}

// ============================================================
// AUDIT LOGGING
// ============================================================

model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  action      String   // CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  entity      String   // Employee, LeaveRequest, PayrollRun, etc.
  entityId    String?
  oldValues   Json?
  newValues   Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([tenantId, entity, entityId])
  @@index([tenantId, userId])
  @@index([tenantId, action])
}

// ============================================================
// WEBHOOKS & API
// ============================================================

model Webhook {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  url         String
  secret      String
  events      String[] // ["employee.created", "leave.approved", ...]
  isActive    Boolean  @default(true)
  lastTriggeredAt DateTime?
  failureCount Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, isActive])
}

model WebhookDelivery {
  id          String   @id @default(uuid())
  tenantId    String
  webhookId   String
  event       String
  payload     Json
  status      String   @default("PENDING")
  responseCode Int?
  response    String?
  attempts    Int      @default(0)
  nextRetryAt DateTime?
  createdAt   DateTime @default(now())

  @@index([webhookId])
  @@index([tenantId, status])
}

model ApiKey {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  keyHash     String   @unique
  prefix      String   // First 8 chars for display
  permissions String[] // ["read:employees", "write:leave", ...]
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, isActive])
}
```

### 2.2 Entity Relationship Summary

```
Tenant (1) ──── (*) User (1) ──── (0..1) Employee
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │                     │                      │
              Department (*)        Contract (*)          Attendance (*)
                    │                     │                      │
              Position (*)          Document (*)            ShiftSchedule
                    │                     │                      │
                    └───── Employee ──────┘                      │
                                                                 │
          LeaveBalance (*) ─── LeaveType ──── LeaveRequest (*)   │
                                                                 │
    PayrollRecord (*) ──── PayrollRun ──── TaxRule               │
                                                                 │
  PerformanceGoal (*) ── PerformanceReview ── PerformanceCycle   │
                                                                 │
    Candidate (*) ──── JobPosting ──── JobStage                  │
         │              │                                        │
    Interview (*)   Offer (*)                                    │
                                                                 │
 TrainingEnrollment ─── Course ──── Skill                        │
         │              │                                        │
  Certification (*)  CourseSkill                                 │
```

---

## 3. API DESIGN

### 3.1 API Conventions

**Base URL:** `https://api.peoplehub.io/api/v1`

**Authentication:** Bearer token in `Authorization` header.

**Tenant Scoping:** Tenant is inferred from JWT claims. Optional `X-Tenant-Id` header for admin operations.

### 3.2 Standard Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

**Paginated List Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false,
    "requestId": "req_abc123",
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Minimum 8 characters required" }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

### 3.3 Error Code Taxonomy

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request body validation failed |
| `CONFLICT` | 409 | Resource conflict (duplicate, race condition) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `TENANT_NOT_FOUND` | 404 | Invalid tenant context |
| `PAYROLL_LOCKED` | 409 | Payroll run already processed |
| `LEAVE_INSUFFICIENT_BALANCE` | 422 | Not enough leave days |

### 3.4 Pagination, Filtering, Sorting

**Query Parameters:**
- `page` (default: 1) — Page number
- `perPage` (default: 20, max: 100) — Items per page
- `sort` — Sort field, prefix with `-` for descending (e.g., `-createdAt`)
- `filter[field]` — Field-level filters
- `q` — Full-text search query

**Example:**
```
GET /api/v1/employees?sort=-hireDate&filter[departmentId]=dept_123&filter[status]=ACTIVE&page=2&perPage=50
```

### 3.5 RESTful Endpoint Structure

#### Auth Module
```
POST   /api/v1/auth/register          # Register (admin creates users)
POST   /api/v1/auth/login             # Login, returns access + refresh token
POST   /api/v1/auth/logout            # Invalidate session
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset with token
POST   /api/v1/auth/verify-email      # Verify email address
POST   /api/v1/auth/mfa/enable        # Enable MFA
POST   /api/v1/auth/mfa/verify        # Verify MFA code
POST   /api/v1/auth/mfa/disable       # Disable MFA
GET    /api/v1/auth/me                # Current user profile
PUT    /api/v1/auth/me                # Update profile
PUT    /api/v1/auth/password          # Change password
GET    /api/v1/auth/sessions          # List active sessions
DELETE /api/v1/auth/sessions/:id      # Revoke session
```

#### Employee Module
```
GET    /api/v1/employees              # List employees (paginated)
POST   /api/v1/employees              # Create employee
GET    /api/v1/employees/:id          # Get employee details
PUT    /api/v1/employees/:id          # Update employee
DELETE /api/v1/employees/:id          # Deactivate employee
POST   /api/v1/employees/import       # Bulk import (CSV/Excel)
GET    /api/v1/employees/export       # Export employees
GET    /api/v1/employees/:id/directory # Public directory profile
GET    /api/v1/employees/org-chart    # Get org chart data
GET    /api/v1/employees/:id/documents # List documents
POST   /api/v1/employees/:id/documents # Upload document
DELETE /api/v1/employees/:id/documents/:docId # Delete document
GET    /api/v1/employees/:id/contracts # List contracts
POST   /api/v1/employees/:id/contracts # Create contract
GET    /api/v1/employees/:id/team     # Get direct reports
```

#### Organization Module
```
GET    /api/v1/departments            # List departments
POST   /api/v1/departments            # Create department
GET    /api/v1/departments/:id        # Get department
PUT    /api/v1/departments/:id        # Update department
DELETE /api/v1/departments/:id        # Delete department
GET    /api/v1/departments/tree       # Get department tree
GET    /api/v1/positions              # List positions
POST   /api/v1/positions              # Create position
GET    /api/v1/positions/:id          # Get position
PUT    /api/v1/positions/:id          # Update position
DELETE /api/v1/positions/:id          # Delete position
```

#### Attendance Module
```
POST   /api/v1/attendance/check-in    # Check in
POST   /api/v1/attendance/check-out   # Check out
GET    /api/v1/attendance             # List attendance records
GET    /api/v1/attendance/:id         # Get record
PUT    /api/v1/attendance/:id         # Correct record (HR only)
GET    /api/v1/attendance/summary     # Attendance summary
GET    /api/v1/attendance/reports     # Generate attendance report
GET    /api/v1/shifts                 # List shifts
POST   /api/v1/shifts                 # Create shift
PUT    /api/v1/shifts/:id             # Update shift
DELETE /api/v1/shifts/:id             # Delete shift
GET    /api/v1/schedules              # List shift schedules
POST   /api/v1/schedules              # Assign schedule
POST   /api/v1/overtime               # Request overtime
GET    /api/v1/overtime               # List overtime requests
PUT    /api/v1/overtime/:id           # Approve/reject overtime
GET    /api/v1/holidays               # List holidays
POST   /api/v1/holidays               # Create holiday
DELETE /api/v1/holidays/:id           # Delete holiday
```

#### Leave Module
```
GET    /api/v1/leave/types            # List leave types
POST   /api/v1/leave/types            # Create leave type
PUT    /api/v1/leave/types/:id        # Update leave type
DELETE /api/v1/leave/types/:id        # Delete leave type
GET    /api/v1/leave/requests         # List leave requests
POST   /api/v1/leave/requests         # Submit leave request
GET    /api/v1/leave/requests/:id     # Get request details
PUT    /api/v1/leave/requests/:id     # Update request
POST   /api/v1/leave/requests/:id/approve   # Approve
POST   /api/v1/leave/requests/:id/reject    # Reject
POST   /api/v1/leave/requests/:id/cancel    # Cancel
GET    /api/v1/leave/balances         # Get leave balances
GET    /api/v1/leave/balances/:employeeId/:year # Specific balance
POST   /api/v1/leave/balances/adjust  # Adjust balance (HR only)
GET    /api/v1/leave/calendar         # Team leave calendar
```

#### Payroll Module
```
GET    /api/v1/payroll/runs           # List payroll runs
POST   /api/v1/payroll/runs           # Create payroll run
GET    /api/v1/payroll/runs/:id       # Get payroll run
PUT    /api/v1/payroll/runs/:id       # Update payroll run
POST   /api/v1/payroll/runs/:id/calculate  # Calculate payroll
POST   /api/v1/payroll/runs/:id/approve    # Approve payroll
POST   /api/v1/payroll/runs/:id/process    # Process payroll
POST   /api/v1/payroll/runs/:id/export     # Export bank file
GET    /api/v1/payroll/runs/:id/records    # List payroll records
GET    /api/v1/payroll/payslips       # Get my payslips
GET    /api/v1/payroll/payslips/:id/download # Download payslip PDF
GET    /api/v1/payroll/tax-rules      # List tax rules
POST   /api/v1/payroll/tax-rules      # Create tax rule
PUT    /api/v1/payroll/tax-rules/:id  # Update tax rule
```

#### Performance Module
```
GET    /api/v1/performance/cycles     # List review cycles
POST   /api/v1/performance/cycles     # Create cycle
PUT    /api/v1/performance/cycles/:id # Update cycle
GET    /api/v1/performance/reviews    # List reviews
POST   /api/v1/performance/reviews    # Create review
GET    /api/v1/performance/reviews/:id # Get review
PUT    /api/v1/performance/reviews/:id # Update review
POST   /api/v1/performance/reviews/:id/submit # Submit review
GET    /api/v1/performance/goals      # List goals
POST   /api/v1/performance/goals      # Create goal
PUT    /api/v1/performance/goals/:id  # Update goal
DELETE /api/v1/performance/goals/:id  # Delete goal
GET    /api/v1/performance/kpi-templates # List KPI templates
POST   /api/v1/performance/kpi-templates # Create template
```

#### Recruitment Module
```
GET    /api/v1/jobs                   # List job postings
POST   /api/v1/jobs                   # Create job posting
GET    /api/v1/jobs/:id               # Get job details
PUT    /api/v1/jobs/:id               # Update job posting
DELETE /api/v1/jobs/:id               # Delete job posting
POST   /api/v1/jobs/:id/publish       # Publish job
POST   /api/v1/jobs/:id/close         # Close job
GET    /api/v1/jobs/:id/stages        # List pipeline stages
GET    /api/v1/candidates             # List candidates
POST   /api/v1/candidates             # Add candidate
GET    /api/v1/candidates/:id         # Get candidate
PUT    /api/v1/candidates/:id         # Update candidate
POST   /api/v1/candidates/:id/move    # Move to stage
POST   /api/v1/candidates/:id/interviews  # Schedule interview
GET    /api/v1/interviews             # List interviews
PUT    /api/v1/interviews/:id         # Update interview
POST   /api/v1/interviews/:id/feedback # Submit feedback
POST   /api/v1/offers                 # Create offer
GET    /api/v1/offers/:id             # Get offer
PUT    /api/v1/offers/:id             # Update offer
POST   /api/v1/offers/:id/send        # Send offer
```

#### Training Module
```
GET    /api/v1/courses                # List courses
POST   /api/v1/courses                # Create course
GET    /api/v1/courses/:id            # Get course
PUT    /api/v1/courses/:id            # Update course
DELETE /api/v1/courses/:id            # Delete course
POST   /api/v1/courses/:id/publish    # Publish course
GET    /api/v1/courses/:id/enrollments # List enrollments
POST   /api/v1/enrollments            # Enroll employee
PUT    /api/v1/enrollments/:id        # Update enrollment
DELETE /api/v1/enrollments/:id        # Drop enrollment
GET    /api/v1/certifications         # List certifications
POST   /api/v1/certifications         # Add certification
GET    /api/v1/skills                 # List skills
POST   /api/v1/skills                 # Create skill
GET    /api/v1/employees/:id/skills   # Get employee skills
PUT    /api/v1/employees/:id/skills   # Update employee skills
```

#### Notification Module
```
GET    /api/v1/notifications          # List my notifications
PUT    /api/v1/notifications/:id/read # Mark as read
PUT    /api/v1/notifications/read-all # Mark all as read
GET    /api/v1/notifications/unread-count # Get unread count
GET    /api/v1/notification/configs   # List notification configs
PUT    /api/v1/notification/configs/:id # Update config
GET    /api/v1/notification/preferences # Get my preferences
PUT    /api/v1/notification/preferences # Update preferences
```

#### Reports Module
```
GET    /api/v1/reports/dashboard      # Dashboard data
GET    /api/v1/reports/attendance     # Attendance report
GET    /api/v1/reports/leave          # Leave report
GET    /api/v1/reports/payroll        # Payroll report
GET    /api/v1/reports/performance    # Performance report
GET    /api/v1/reports/recruitment    # Recruitment report
GET    /api/v1/reports/export         # Export report (CSV/PDF/Excel)
```

#### Admin Module
```
GET    /api/v1/admin/tenants          # List tenants (super admin)
GET    /api/v1/admin/tenants/:id      # Get tenant
PUT    /api/v1/admin/tenants/:id      # Update tenant
GET    /api/v1/admin/audit-logs       # List audit logs
GET    /api/v1/admin/health           # System health check
GET    /api/v1/admin/webhooks         # List webhooks
POST   /api/v1/admin/webhooks         # Create webhook
PUT    /api/v1/admin/webhooks/:id     # Update webhook
DELETE /api/v1/admin/webhooks/:id     # Delete webhook
GET    /api/v1/admin/api-keys         # List API keys
POST   /api/v1/admin/api-keys         # Create API key
DELETE /api/v1/admin/api-keys/:id     # Revoke API key
POST   /api/v1/admin/feature-flags    # Toggle feature flag
```

### 3.6 Authentication Flow

```
1. POST /auth/login  →  { accessToken, refreshToken, expiresIn }
2. Subsequent requests: Authorization: Bearer <accessToken>
3. When accessToken expires (15 min):
   POST /auth/refresh  →  { accessToken, expiresIn }
4. POST /auth/logout  →  Invalidate refreshToken + session
```

**Token Payload:**
```json
{
  "sub": "user_uuid",
  "tenantId": "tenant_uuid",
  "role": "HR_MANAGER",
  "email": "user@company.com",
  "iat": 1713351000,
  "exp": 1713351900
}
```

---

## 4. SECURITY ARCHITECTURE

### 4.1 Authentication

| Mechanism | Implementation |
|-----------|---------------|
| **Password Hashing** | bcrypt with cost factor 12 |
| **Access Token** | JWT (RS256), 15-minute expiry |
| **Refresh Token** | Opaque token stored in DB, 30-day expiry, rotation on use |
| **MFA** | TOTP (RFC 6238), backup codes stored encrypted |
| **Session Management** | Device tracking, concurrent session limit (configurable), remote logout |
| **Account Lockout** | Lock after 5 failed attempts, 15-minute cooldown |
| **Password Policy** | Min 8 chars, 1 uppercase, 1 number, 1 special, not in breach database |

### 4.2 Authorization (RBAC)

**Pre-built Roles:**

| Permission Area | Admin | HR Manager | Manager | Employee |
|----------------|-------|-----------|---------|----------|
| **Employees** | CRUD all | CRUD all | Read team | Read own |
| **Departments** | CRUD | CRUD | Read | Read |
| **Positions** | CRUD | CRUD | Read | Read |
| **Attendance** | CRUD all | CRUD all | Read/Correct team | Check-in/out, Read own |
| **Leave** | CRUD all, Override | CRUD all, Approve | Approve team | Apply, Read own |
| **Payroll** | CRUD all, Approve | CRUD all | Read team payroll | Read own payslips |
| **Performance** | CRUD all | CRUD all | Review team | Set goals, Self-review |
| **Recruitment** | CRUD all | CRUD all | Interview feedback | Referral only |
| **Training** | CRUD all | CRUD all | View team progress | Enroll, View own |
| **Reports** | All reports | All reports | Team reports | Own data only |
| **Admin Panel** | Full access | Limited | No access | No access |
| **Audit Logs** | Read all | Read all | No access | No access |
| **API Keys** | CRUD | No access | No access | No access |

**Data-Level Permissions:**
- `OWN` — Can only access own records
- `TEAM` — Can access records of direct reports
- `DEPARTMENT` — Can access records within department
- `ALL` — Can access all records in tenant

**Implementation:**
```typescript
// NestJS Guard pattern
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return this.checkPermissions(user.role, requiredPermissions);
  }
}

// Decorator usage
@Permissions('employee:read', 'employee:write')
@GetDataScope(DataScope.DEPARTMENT)
@Get(':id')
findOne(@Param('id') id: string) { ... }
```

### 4.3 Data Encryption

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| Passwords | bcrypt (hash) | TLS 1.3 |
| MFA secrets | AES-256-GCM | TLS 1.3 |
| Bank accounts | AES-256-GCM (field-level) | TLS 1.3 |
| SSN/Tax IDs | AES-256-GCM (field-level) | TLS 1.3 |
| Documents | S3 SSE-S3 | TLS 1.3 |
| API Keys | bcrypt (hash of secret) | TLS 1.3 |
| Refresh Tokens | bcrypt (hash) | TLS 1.3 |

### 4.4 Audit Logging

Every mutation operation is logged:
```typescript
{
  action: "UPDATE",
  entity: "Employee",
  entityId: "emp_123",
  oldValues: { status: "ACTIVE", salary: 5000 },
  newValues: { status: "ACTIVE", salary: 5500 },
  userId: "user_456",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: "2026-04-17T10:30:00Z"
}
```

Audit logs are immutable (no UPDATE/DELETE on audit_logs table).

### 4.5 Input Validation & Sanitization

| Layer | Tool | Purpose |
|-------|------|---------|
| **Request DTOs** | class-validator + class-transformer | Type validation, sanitization |
| **SQL** | Prisma (parameterized) | SQL injection prevention |
| **XSS** | DOMPurify (frontend), output encoding (backend) | Cross-site scripting |
| **File Uploads** | File type validation, size limits, virus scan | Malware prevention |
| **Rate Limiting** | express-rate-limit (Redis-backed) | Brute force, API abuse |
| **CORS** | Strict allowlist | Cross-origin restrictions |
| **CSRF** | SameSite cookies + CSRF tokens for non-API routes | Cross-site request forgery |

**Global Validation Pipe:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // Strip unknown properties
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  disableErrorMessages: !isDev,
}));
```

### 4.6 Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 + TypeScript 5 |
| **Build Tool** | Vite 6 |
| **Styling** | TailwindCSS 4 + CSS Modules |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **State Management** | Zustand (global) + React Query (server state) |
| **Routing** | React Router 7 (with file-based routing) |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts + Apache ECharts (for complex dashboards) |
| **Tables** | TanStack Table (headless) |
| **i18n** | i18next |
| **HTTP Client** | Axios with interceptors |
| **Date Handling** | date-fns |
| **Testing** | Vitest + React Testing Library |

### 5.2 Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── locales/
│       ├── en/
│       └── vi/
├── src/
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   ├── router.tsx                 # Route definitions
│   ├── config/
│   │   ├── constants.ts           # App-wide constants
│   │   ├── routes.ts              # Route path constants
│   │   └── permissions.ts         # Role-permission map
│   ├── lib/
│   │   ├── api.ts                 # Axios instance with interceptors
│   │   ├── utils.ts               # Utility functions (cn, format, etc.)
│   │   ├── auth.ts                # Auth helpers (token management)
│   │   └── query-client.ts        # React Query setup
│   ├── hooks/
│   │   ├── use-auth.ts            # Auth state hook
│   │   ├── use-permission.ts      # Permission checking hook
│   │   ├── use-debounce.ts        # Debounce hook
│   │   ├── use-media-query.ts     # Responsive hook
│   │   └── use-tenant.ts          # Tenant context hook
│   ├── stores/
│   │   ├── auth-store.ts          # Zustand auth store
│   │   ├── ui-store.ts            # UI state (sidebar, theme, modals)
│   │   └── notification-store.ts  # Real-time notification state
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── form.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main layout with sidebar
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   ├── Header.tsx         # Top header with search
│   │   │   └── AuthLayout.tsx     # Login/register layout
│   │   ├── common/
│   │   │   ├── DataTable.tsx      # Reusable data table
│   │   │   ├── Pagination.tsx     # Pagination component
│   │   │   ├── FileUpload.tsx     # File upload with preview
│   │   │   ├── RichTextEditor.tsx # Rich text editor
│   │   │   ├── StatusBadge.tsx    # Status indicator
│   │   │   └── EmptyState.tsx     # Empty state placeholder
│   │   └── features/              # Feature-specific components
│   │       ├── employee/
│   │       ├── attendance/
│   │       ├── leave/
│   │       ├── payroll/
│   │       ├── performance/
│   │       ├── recruitment/
│   │       └── training/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx  # Role-aware dashboard
│   │   │   └── components/
│   │   ├── employees/
│   │   │   ├── EmployeeListPage.tsx
│   │   │   ├── EmployeeDetailPage.tsx
│   │   │   ├── EmployeeFormPage.tsx
│   │   │   ├── OrgChartPage.tsx
│   │   │   └── components/
│   │   ├── attendance/
│   │   │   ├── AttendancePage.tsx
│   │   │   ├── CheckInPage.tsx
│   │   │   ├── ShiftsPage.tsx
│   │   │   └── components/
│   │   ├── leave/
│   │   │   ├── LeaveRequestPage.tsx
│   │   │   ├── LeaveBalancePage.tsx
│   │   │   ├── LeaveCalendarPage.tsx
│   │   │   └── components/
│   │   ├── payroll/
│   │   │   ├── PayrollRunPage.tsx
│   │   │   ├── PayslipPage.tsx
│   │   │   ├── TaxRulesPage.tsx
│   │   │   └── components/
│   │   ├── performance/
│   │   │   ├── ReviewCyclePage.tsx
│   │   │   ├── MyGoalsPage.tsx
│   │   │   ├── MyReviewsPage.tsx
│   │   │   └── components/
│   │   ├── recruitment/
│   │   │   ├── JobsPage.tsx
│   │   │   ├── PipelinePage.tsx   # Kanban board
│   │   │   ├── CandidateDetailPage.tsx
│   │   │   └── components/
│   │   ├── training/
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── MyLearningPage.tsx
│   │   │   └── components/
│   │   ├── reports/
│   │   │   ├── ReportsPage.tsx
│   │   │   └── components/
│   │   ├── settings/
│   │   │   ├── GeneralPage.tsx
│   │   │   ├── DepartmentsPage.tsx
│   │   │   ├── PositionsPage.tsx
│   │   │   ├── RolesPage.tsx
│   │   │   └── components/
│   │   └── NotFoundPage.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── auth-api.ts
│   │   │   ├── employee-api.ts
│   │   │   ├── attendance-api.ts
│   │   │   ├── leave-api.ts
│   │   │   ├── payroll-api.ts
│   │   │   ├── performance-api.ts
│   │   │   ├── recruitment-api.ts
│   │   │   ├── training-api.ts
│   │   │   ├── notification-api.ts
│   │   │   └── report-api.ts
│   │   └── websocket.ts           # Real-time notification connection
│   ├── types/
│   │   ├── api.ts                 # API response types
│   │   ├── models.ts              # Data model types
│   │   └── index.ts
│   └── styles/
│       ├── globals.css
│       └── themes/
│           ├── light.css
│           └── dark.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 5.3 Routing Structure

```tsx
// Protected routes with role-based access
const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'employees', element: <RequirePermission permission="employee:read"><EmployeeListPage /></RequirePermission> },
      { path: 'employees/:id', element: <EmployeeDetailPage /> },
      { path: 'employees/new', element: <RequirePermission permission="employee:write"><EmployeeFormPage /></RequirePermission> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'attendance/check-in', element: <CheckInPage /> },
      { path: 'attendance/shifts', element: <RequirePermission permission="shift:read"><ShiftsPage /></RequirePermission> },
      { path: 'leave/requests', element: <LeaveRequestPage /> },
      { path: 'leave/balances', element: <LeaveBalancePage /> },
      { path: 'leave/calendar', element: <LeaveCalendarPage /> },
      { path: 'payroll/runs', element: <RequirePermission permission="payroll:read"><PayrollRunPage /></RequirePermission> },
      { path: 'payroll/payslips', element: <PayslipPage /> },
      { path: 'performance/goals', element: <MyGoalsPage /> },
      { path: 'performance/reviews', element: <MyReviewsPage /> },
      { path: 'recruitment/jobs', element: <RequirePermission permission="job:read"><JobsPage /></RequirePermission> },
      { path: 'recruitment/pipeline/:jobId', element: <RequirePermission permission="candidate:read"><PipelinePage /></RequirePermission> },
      { path: 'training/courses', element: <CoursesPage /> },
      { path: 'training/my-learning', element: <MyLearningPage /> },
      { path: 'reports', element: <RequirePermission permission="report:read"><ReportsPage /></RequirePermission> },
      { path: 'settings', element: <RequirePermission permission="admin:read"><SettingsLayout />},
    ],
  },
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  { path: '/forgot-password', element: <AuthLayout><ForgotPasswordPage /></AuthLayout> },
  { path: '*', element: <NotFoundPage /> },
];
```

### 5.4 State Management

**Zustand (Client State):**
```typescript
// auth-store.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}
```

**React Query (Server State):**
```typescript
// employee queries
const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

const useEmployees = (filters: EmployeeFilters) =>
  useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => employeeApi.list(filters),
    staleTime: 30_000,
  });
```

### 5.5 UI Design System

- **Color System:** CSS custom properties for theming (light/dark)
- **Typography:** Inter font family, 4px spacing scale
- **Spacing:** Tailwind default scale (0.25rem increments)
- **Breakpoints:** sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- **Component Pattern:** Compound components for complex UI (DataTable, Form)

---

## 6. INFRASTRUCTURE

### 6.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  # ─── Backend ───
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: peoplehub-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://peoplehub:password@postgres:5432/peoplehub
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - S3_SECRET_KEY=${MINIO_SECRET_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/admin/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─── Frontend ───
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: peoplehub-web
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

  # ─── Database ───
  postgres:
    image: postgres:16-alpine
    container_name: peoplehub-postgres
    environment:
      - POSTGRES_USER=peoplehub
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=peoplehub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U peoplehub"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Cache ───
  redis:
    image: redis:7-alpine
    container_name: peoplehub-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Object Storage ───
  minio:
    image: minio/minio:latest
    container_name: peoplehub-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

  # ─── Database Admin ───
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: peoplehub-pgadmin
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@peoplehub.io
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD}
    depends_on:
      - postgres
    profiles:
      - dev

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 6.2 Environment Variables

```bash
# ─── Application ───
NODE_ENV=production
PORT=3000
APP_URL=https://peoplehub.io
API_URL=https://api.peoplehub.io

# ─── Database ───
DATABASE_URL=postgresql://peoplehub:password@localhost:5432/peoplehub
DB_PASSWORD=your_secure_password

# ─── Redis ───
REDIS_URL=redis://localhost:6379

# ─── JWT ───
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# ─── S3 / MinIO ───
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=peoplehub-documents
S3_ACCESS_KEY=minio_access_key
S3_SECRET_KEY=minio_secret_key
S3_REGION=us-east-1

# ─── Email ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@peoplehub.io
SMTP_PASS=app_password
FROM_EMAIL=noreply@peoplehub.io
FROM_NAME=PeopleHub

# ─── SMS (Optional) ───
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# ─── Admin ───
PGADMIN_PASSWORD=your_pgadmin_password
ADMIN_EMAIL=admin@peoplehub.io
ADMIN_PASSWORD=your_initial_admin_password

# ─── Security ───
CORS_ORIGINS=https://peoplehub.io
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ─── Monitoring (Optional) ───
SENTRY_DSN=https://your_sentry_dsn
```

### 6.3 CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '22'
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/peoplehub_test'

jobs:
  # ─── Lint & Type Check ───
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: cd backend && npm ci && npm run lint
      - run: cd frontend && npm ci && npm run lint

  # ─── Type Check ───
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: cd backend && npm ci && npx prisma generate && npm run typecheck
      - run: cd frontend && npm ci && npm run typecheck

  # ─── Backend Tests ───
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: peoplehub_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci && npx prisma generate
      - run: cd backend && npx prisma migrate deploy
      - run: cd backend && npm run test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          directory: ./backend/coverage

  # ─── Frontend Tests ───
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci && npm run test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          directory: ./frontend/coverage

  # ─── Build ───
  build:
    needs: [lint, typecheck, backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: cd backend && npm ci && npm run build
      - run: cd frontend && npm ci && npm run build

  # ─── Deploy (main branch only) ───
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        run: |
          echo "Deploying to production..."
          # Docker push, SSH deploy, or cloud provider deploy
```

### 6.4 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY dist/ ./dist/

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD curl -f http://localhost:3000/api/v1/admin/health || exit 1
CMD ["node", "dist/main.js"]
```

### 6.5 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. FILE STRUCTURE

### 7.1 Complete Project Directory

```
hrm-system/
├── README.md
├── ARCHITECTURE.md              # This file
├── PRODUCT_VISION.md            # CEO output
├── TECH_STACK.md                # Researcher output
├── MASTER_PLAN.md               # Planner output
├── SPRINT_STATUS.md             # Sprint tracking
├── docker-compose.yml           # Development infrastructure
├── docker-compose.prod.yml      # Production infrastructure
├── .env.example                 # Environment template
├── .gitignore
│
├── backend/                     # NestJS Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (Section 2)
│   │   ├── seed.ts              # Seed data
│   │   └── migrations/          # Prisma migrations
│   ├── src/
│   │   ├── main.ts              # Application entry point
│   │   ├── app.module.ts        # Root module
│   │   ├── app.controller.ts    # Health check, root
│   │   ├── config/
│   │   │   ├── app.config.ts    # Application config
│   │   │   ├── database.config.ts # Database config
│   │   │   ├── jwt.config.ts    # JWT config
│   │   │   ├── mail.config.ts   # SMTP config
│   │   │   ├── s3.config.ts     # Storage config
│   │   │   └── index.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── permissions.decorator.ts
│   │   │   │   ├── data-scope.decorator.ts
│   │   │   │   └── api-response.decorator.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── permissions.guard.ts
│   │   │   │   └── data-scope.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── response.interceptor.ts
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   └── audit.interceptor.ts
│   │   │   ├── filters/
│   │   │   │   ├── http-exception.filter.ts
│   │   │   │   └── prisma-exception.filter.ts
│   │   │   ├── pipes/
│   │   │   │   └── validation.pipe.ts
│   │   │   ├── middleware/
│   │   │   │   ├── tenant.middleware.ts
│   │   │   │   └── logger.middleware.ts
│   │   │   ├── dto/
│   │   │   │   ├── pagination.dto.ts
│   │   │   │   ├── filter.dto.ts
│   │   │   │   └── sort.dto.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── paginated-response.interface.ts
│   │   │   │   ├── api-response.interface.ts
│   │   │   │   └── user-request.interface.ts
│   │   │   └── constants/
│   │   │       ├── roles.ts
│   │   │       ├── permissions.ts
│   │   │       └── error-codes.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── refresh-token.strategy.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   └── refresh-token.dto.ts
│   │   │   │   └── mfa/
│   │   │   │       ├── mfa.service.ts
│   │   │   │       └── mfa.controller.ts
│   │   │   ├── user/
│   │   │   │   ├── user.module.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   └── dto/
│   │   │   ├── employee/
│   │   │   │   ├── employee.module.ts
│   │   │   │   ├── employee.controller.ts
│   │   │   │   ├── employee.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-employee.dto.ts
│   │   │   │   │   ├── update-employee.dto.ts
│   │   │   │   │   └── query-employee.dto.ts
│   │   │   │   └── import/
│   │   │   │       └── employee-import.service.ts
│   │   │   ├── organization/
│   │   │   │   ├── organization.module.ts
│   │   │   │   ├── department/
│   │   │   │   │   ├── department.controller.ts
│   │   │   │   │   └── department.service.ts
│   │   │   │   └── position/
│   │   │   │       ├── position.controller.ts
│   │   │   │       └── position.service.ts
│   │   │   ├── attendance/
│   │   │   │   ├── attendance.module.ts
│   │   │   │   ├── attendance.controller.ts
│   │   │   │   ├── attendance.service.ts
│   │   │   │   ├── shift/
│   │   │   │   │   ├── shift.controller.ts
│   │   │   │   │   └── shift.service.ts
│   │   │   │   ├── schedule/
│   │   │   │   └── overtime/
│   │   │   ├── leave/
│   │   │   │   ├── leave.module.ts
│   │   │   │   ├── leave.controller.ts
│   │   │   │   ├── leave.service.ts
│   │   │   │   ├── leave-type/
│   │   │   │   │   └── leave-type.service.ts
│   │   │   │   └── balance/
│   │   │   │       └── leave-balance.service.ts
│   │   │   ├── payroll/
│   │   │   │   ├── payroll.module.ts
│   │   │   │   ├── payroll.controller.ts
│   │   │   │   ├── payroll.service.ts
│   │   │   │   ├── payroll-run/
│   │   │   │   │   └── payroll-run.service.ts
│   │   │   │   ├── payslip/
│   │   │   │   │   └── payslip.service.ts
│   │   │   │   └── tax-rule/
│   │   │   └── performance/
│   │   │       ├── performance.module.ts
│   │   │       ├── performance.controller.ts
│   │   │       └── performance.service.ts
│   │   │   ├── recruitment/
│   │   │   │   ├── recruitment.module.ts
│   │   │   │   ├── recruitment.controller.ts
│   │   │   │   └── recruitment.service.ts
│   │   │   ├── training/
│   │   │   │   ├── training.module.ts
│   │   │   │   ├── training.controller.ts
│   │   │   │   └── training.service.ts
│   │   │   ├── notification/
│   │   │   │   ├── notification.module.ts
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── notification.processor.ts  # BullMQ consumer
│   │   │   ├── report/
│   │   │   │   ├── report.module.ts
│   │   │   │   ├── report.controller.ts
│   │   │   │   └── report.service.ts
│   │   │   ├── admin/
│   │   │   │   ├── admin.module.ts
│   │   │   │   ├── admin.controller.ts
│   │   │   │   └── admin.service.ts
│   │   │   ├── audit/
│   │   │   │   ├── audit.module.ts
│   │   │   │   └── audit.service.ts
│   │   │   └── webhook/
│   │   │       ├── webhook.module.ts
│   │   │       ├── webhook.service.ts
│   │   │       └── webhook.processor.ts
│   │   ├── database/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── queue/
│   │   │   ├── queue.module.ts
│   │   │   ├── email.processor.ts
│   │   │   ├── notification.processor.ts
│   │   │   └── report.processor.ts
│   │   ├── mail/
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.service.ts
│   │   │   └── templates/
│   │   │       ├── welcome.hbs
│   │   │       ├── password-reset.hbs
│   │   │       ├── leave-approved.hbs
│   │   │       ├── payslip-ready.hbs
│   │   │       └── ...
│   │   └── storage/
│   │       ├── storage.module.ts
│   │       └── storage.service.ts
│   ├── test/
│   │   ├── jest-e2e.json
│   │   ├── app.e2e-spec.ts
│   │   └── modules/
│   │       ├── auth.e2e-spec.ts
│   │       ├── employee.e2e-spec.ts
│   │       └── ...
│   └── generated/
│       └── prisma/
│
├── frontend/                    # React Frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── .eslintrc.cjs
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router.tsx
│       ├── config/
│       │   ├── constants.ts
│       │   ├── routes.ts
│       │   └── permissions.ts
│       ├── lib/
│       │   ├── api.ts
│       │   ├── utils.ts
│       │   ├── auth.ts
│       │   ├── query-client.ts
│       │   └── i18n.ts
│       ├── hooks/
│       │   ├── use-auth.ts
│       │   ├── use-permission.ts
│       │   ├── use-debounce.ts
│       │   └── use-tenant.ts
│       ├── stores/
│       │   ├── auth-store.ts
│       │   └── ui-store.ts
│       ├── components/
│       │   ├── ui/
│       │   ├── layout/
│       │   ├── common/
│       │   └── features/
│       ├── pages/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── employees/
│       │   ├── attendance/
│       │   ├── leave/
│       │   ├── payroll/
│       │   ├── performance/
│       │   ├── recruitment/
│       │   ├── training/
│       │   ├── reports/
│       │   └── settings/
│       ├── services/
│       │   └── api/
│       ├── types/
│       │   ├── api.ts
│       │   └── models.ts
│       └── styles/
│           ├── globals.css
│           └── themes/
│
├── docs/                        # Documentation
│   ├── api/
│   │   └── openapi.yaml         # OpenAPI 3.0 spec
│   ├── guides/
│   │   ├── setup.md
│   │   ├── deployment.md
│   │   └── development.md
│   └── adr/                     # Architecture Decision Records
│       └── 001-monolith-first.md
│
└── scripts/
    ├── seed.ts                  # Database seeding
    ├── migrate.ts               # Migration helper
    └── setup.sh                 # Initial setup script
```

### 7.2 Module Dependency Graph

```
                    ┌─────────────┐
                    │   App Root  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐
    │  Auth     │   │  Common   │   │  Admin    │
    │  Module   │   │  Module   │   │  Module   │
    └─────┬─────┘   └───────────┘   └───────────┘
          │
    ┌─────┴──────────────────────────────────┐
    │                                        │
┌───┴───┐ ┌───────┐ ┌─────────┐ ┌─────────┐
│Employee│ │Attendance│ │  Leave  │ │ Payroll │
│ Module │ │  Module  │ │  Module │ │ Module  │
└───┬───┘ └────┬────┘ └────┬────┘ └────┬────┘
    │          │           │           │
    └──────────┴───────────┴───────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
        ┌─────┴─────┐        ┌─────┴─────┐
        │Performance│        │Recruitment│
        │  Module   │        │  Module   │
        └───────────┘        └───────────┘
              │                     │
        ┌─────┴─────┐        ┌─────┴─────┐
        │  Training │        │Notification│
        │  Module   │        │  Module   │
        └───────────┘        └─────┬─────┘
                                   │
                             ┌─────┴─────┐
                             │  Report   │
                             │  Module   │
                             └───────────┘
```

---

## APPENDIX A: Database Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| All tables | `(tenantId)` | Tenant-scoped queries |
| Employee | `(tenantId, status)`, `(tenantId, departmentId)`, `(tenantId, employeeCode)` | Filtering, lookup |
| Attendance | `(tenantId, employeeId, date)` UNIQUE, `(tenantId, date)` | Daily queries |
| LeaveRequest | `(tenantId, employeeId)`, `(tenantId, status)`, `(tenantId, startDate, endDate)` | Approval queues, calendar |
| PayrollRecord | `(payrollRunId, employeeId)` UNIQUE | Per-run lookups |
| AuditLog | `(tenantId, createdAt DESC)`, `(tenantId, entity, entityId)` | Timeline, entity history |
| Notification | `(userId, status)`, `(userId, readAt)` | Unread count, inbox |

## APPENDIX B: Multi-Tenant Data Isolation

All queries are automatically scoped to the current tenant via:

1. **JWT Middleware** extracts `tenantId` from token
2. **Prisma Middleware** applies `where: { tenantId }` to all queries
3. **Guards** verify user belongs to the tenant

```typescript
// prisma.middleware.ts
prisma.$use(async (params, next) => {
  if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(params.action)) {
    if (params.args.where && !params.args.where.tenantId) {
      params.args.where = { ...params.args.where, tenantId: currentTenantId };
    }
  }
  return next(params);
});
```

## APPENDIX C: Payroll Calculation Flow

```
1. HR creates PayrollRun (DRAFT) for period
2. System fetches all ACTIVE employees
3. For each employee:
   a. Load base salary from contract
   b. Calculate attendance-based pay (days worked, overtime)
   c. Apply allowances (from JSON config)
   d. Calculate gross pay
   e. Apply tax rules (bracket-based calculation)
   f. Deduct social/health insurance
   g. Apply additional deductions (loans, advances)
   h. Calculate net pay
4. HR reviews payroll run
5. HR Manager approves
6. System processes: generates payslips (PDF), sends notifications
7. Status changes to PAID
```

## APPENDIX D: Leave Accrual System

```
Scheduled job (cron: 1st of each month):
  For each employee:
    For each leave type with accrual rule:
      Calculate accrued days (from JSON rule)
      Add to leave balance
      Cap at maxBalance if configured
      Apply carryOverDays from previous year (if January)
```

---

*Document Version: 1.0.0*  
*Last Updated: April 2026*  
*Author: Lead System Architect — AGENT-TEAM*
