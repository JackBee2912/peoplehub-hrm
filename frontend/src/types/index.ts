// ============================================================
// User & Auth Types
// ============================================================

export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE' | 'RECRUITER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
  };
  tokens: AuthTokens;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// ============================================================
// Employee Types
// ============================================================

export type EmployeeStatus =
  | 'PROBATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'RESIGNED'
  | 'RETIRED'
  | 'ON_LEAVE';

export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'FREELANCE';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  profilePhoto?: string;
  status: EmployeeStatus;
  contractType?: ContractType;
  departmentId?: string;
  department?: Department;
  positionId?: string;
  position?: Position;
  managerId?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  directReports?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: EmployeeStatus;
  }[];
  hireDate?: string;
  probationEndDate?: string;
  terminationDate?: string;
  bankName?: string;
  bankAccount?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  page?: number;
  pageSize?: number;
}

export interface EmployeeListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: EmployeeStatus;
  contractType?: ContractType;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  hireDate?: string;
  probationEndDate?: string;
  bankName?: string;
  bankAccount?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  id: string;
}

// ============================================================
// Department Types
// ============================================================

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  parent?: Department;
  children?: Department[];
  managerId?: string;
  manager?: User;
  budget?: number;
  costCenter?: string;
  isActive: boolean;
  sortOrder: number;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  budget?: number;
  costCenter?: string;
}

export interface UpdateDepartmentInput extends Partial<CreateDepartmentInput> {
  id: string;
}

// ============================================================
// Position Types
// ============================================================

export interface Position {
  id: string;
  title: string;
  code?: string;
  description?: string;
  level: number;
  departmentId?: string;
  department?: Department;
  minSalary?: number;
  maxSalary?: number;
  headcount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionInput {
  title: string;
  code?: string;
  description?: string;
  level?: number;
  departmentId?: string;
  minSalary?: number;
  maxSalary?: number;
  headcount?: number;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  newHiresThisMonth: number;
  terminationsThisMonth: number;
  departmentsWithOpenings: number;
}

export interface ActivityItem {
  id: string;
  type: 'hire' | 'termination' | 'transfer' | 'promotion' | 'department_change';
  employeeName: string;
  description: string;
  createdAt: string;
}

export interface BirthdayItem {
  id: string;
  name: string;
  dateOfBirth: string;
  department?: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// Attendance Types
// ============================================================

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'REMOTE';

export type ShiftType = 'FIXED' | 'ROTATING' | 'FLEXIBLE' | 'CUSTOM';

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  type: ShiftType;
  color?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftInput {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  type?: ShiftType;
  color?: string;
}

export interface UpdateShiftInput extends Partial<CreateShiftInput> {
  id: string;
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  shift: Shift;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { name: string };
  };
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  workedHours?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  location?: string;
  ipAddress?: string;
  notes?: string;
  shift?: Shift;
  createdAt: string;
}

export interface CheckInOutResponse {
  type: 'check_in' | 'check_out';
  timestamp: string;
  status: AttendanceStatus;
  message: string;
}

export interface AttendanceDayRecord {
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  workedHours?: number;
  lateMinutes?: number;
}

export interface AttendanceFilters {
  employeeId?: string;
  departmentId?: string;
  status?: AttendanceStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceReportData {
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    onLeaveDays: number;
    remoteDays: number;
    totalWorkedHours: number;
    avgWorkedHours: number;
  };
  dailyData: {
    date: string;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  }[];
}

// ============================================================
// Leave Types
// ============================================================

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type LeaveTypeCategory =
  | 'ANNUAL'
  | 'SICK'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID'
  | 'COMPENSATORY'
  | 'BEREAVEMENT'
  | 'MARRIAGE'
  | 'CUSTOM';

export interface LeaveType {
  id: string;
  name: string;
  category: LeaveTypeCategory;
  description?: string;
  daysPerYear: number;
  accrualRate?: number;
  carryOverLimit?: number;
  requiresAttachment?: boolean;
  requiresApproval?: boolean;
  maxConsecutiveDays?: number;
  color?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveTypeInput {
  name: string;
  category: LeaveTypeCategory;
  description?: string;
  daysPerYear: number;
  accrualRate?: number;
  carryOverLimit?: number;
  requiresAttachment?: boolean;
  requiresApproval?: boolean;
  maxConsecutiveDays?: number;
  color?: string;
}

export interface UpdateLeaveTypeInput extends Partial<CreateLeaveTypeInput> {
  id: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: {
    id: string;
    name: string;
    category: LeaveTypeCategory;
    color?: string;
    daysPerYear: number;
  };
  totalAllocated: number;
  used: number;
  remaining: number;
  pending: number;
  carryOver: number;
  year: number;
  lastAccruedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { name: string };
  };
  leaveTypeId: string;
  leaveType: {
    id: string;
    name: string;
    category: LeaveTypeCategory;
    color?: string;
  };
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  reason: string;
  status: LeaveStatus;
  attachmentUrl?: string;
  approverId?: string;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay?: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  reason: string;
  attachmentUrl?: string;
}

export interface LeaveApprovalAction {
  requestId: string;
  action: 'approve' | 'reject';
  comment?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'PUBLIC' | 'COMPANY' | 'DEPARTMENT';
  description?: string;
  isRecurring: boolean;
  departmentId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayInput {
  name: string;
  date: string;
  type?: 'PUBLIC' | 'COMPANY' | 'DEPARTMENT';
  description?: string;
  isRecurring?: boolean;
  departmentId?: string;
}

export interface UpdateHolidayInput extends Partial<CreateHolidayInput> {
  id: string;
}

export interface LeaveFilters {
  employeeId?: string;
  status?: LeaveStatus;
  leaveTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================
// Manager Dashboard Types
// ============================================================

export interface TeamAttendanceSummary {
  totalTeamMembers: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  lateToday: number;
  remoteToday: number;
  teamMembers: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { name: string };
    status: AttendanceStatus;
    checkInTime?: string;
    shift?: { name: string };
  }[];
}

export interface PendingApprovalSummary {
  totalPending: number;
  requests: {
    id: string;
    employeeName: string;
    employeeCode: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    createdAt: string;
  }[];
}
