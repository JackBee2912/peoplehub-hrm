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
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
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
  manager?: Employee;
  hireDate?: string;
  probationEndDate?: string;
  terminationDate?: string;
  bankName?: string;
  bankAccount?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
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
