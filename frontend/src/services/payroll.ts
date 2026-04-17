import { apiClient } from './api';
import type {
  SalaryComponent,
  CreateSalaryComponentInput,
  UpdateSalaryComponentInput,
  EmployeeSalarySetup,
  CreateEmployeeSalaryInput,
  PayPeriod,
  CreatePayPeriodInput,
  UpdatePayPeriodInput,
  PayrollRun,
  CreatePayrollRunInput,
  PayrollRecord,
  PayrollRecordAdjustment,
  PayrollReportData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const payrollService = {
  // --- Salary Components ---
  getSalaryComponents: async (): Promise<SalaryComponent[]> => {
    const response = await apiClient.get<ApiResponse<SalaryComponent[]>>(
      '/payroll/salary-components'
    );
    return response.data.data;
  },

  createSalaryComponent: async (
    data: CreateSalaryComponentInput
  ): Promise<SalaryComponent> => {
    const response = await apiClient.post<ApiResponse<SalaryComponent>>(
      '/payroll/salary-components',
      data
    );
    return response.data.data;
  },

  updateSalaryComponent: async (
    data: UpdateSalaryComponentInput
  ): Promise<SalaryComponent> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<SalaryComponent>>(
      `/payroll/salary-components/${id}`,
      updateData
    );
    return response.data.data;
  },

  deleteSalaryComponent: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/payroll/salary-components/${id}`);
  },

  // --- Employee Salary Setup ---
  getEmployeeSalary: async (employeeId: string): Promise<EmployeeSalarySetup | null> => {
    const response = await apiClient.get<ApiResponse<EmployeeSalarySetup | null>>(
      `/payroll/salary/${employeeId}`
    );
    return response.data.data;
  },

  setEmployeeSalary: async (
    data: CreateEmployeeSalaryInput
  ): Promise<EmployeeSalarySetup> => {
    const response = await apiClient.post<ApiResponse<EmployeeSalarySetup>>(
      '/payroll/salary',
      data
    );
    return response.data.data;
  },

  getEmployeeSalaryHistory: async (
    employeeId: string
  ): Promise<EmployeeSalarySetup[]> => {
    const response = await apiClient.get<ApiResponse<EmployeeSalarySetup[]>>(
      `/payroll/salary/${employeeId}/history`
    );
    return response.data.data;
  },

  // --- Pay Periods ---
  getPayPeriods: async (): Promise<PayPeriod[]> => {
    const response = await apiClient.get<ApiResponse<PayPeriod[]>>(
      '/payroll/pay-periods'
    );
    return response.data.data;
  },

  createPayPeriod: async (data: CreatePayPeriodInput): Promise<PayPeriod> => {
    const response = await apiClient.post<ApiResponse<PayPeriod>>(
      '/payroll/pay-periods',
      data
    );
    return response.data.data;
  },

  updatePayPeriod: async (data: UpdatePayPeriodInput): Promise<PayPeriod> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<PayPeriod>>(
      `/payroll/pay-periods/${id}`,
      updateData
    );
    return response.data.data;
  },

  deletePayPeriod: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/payroll/pay-periods/${id}`);
  },

  lockPayPeriod: async (id: string): Promise<PayPeriod> => {
    const response = await apiClient.post<ApiResponse<PayPeriod>>(
      `/payroll/pay-periods/${id}/lock`
    );
    return response.data.data;
  },

  getPayPeriodCalendar: async (
    year: number
  ): Promise<PayPeriod[]> => {
    const response = await apiClient.get<ApiResponse<PayPeriod[]>>(
      `/payroll/pay-periods/calendar?year=${year}`
    );
    return response.data.data;
  },

  // --- Payroll Runs ---
  getPayrollRuns: async (
    filters?: { status?: string; period?: string; page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<PayrollRun>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<PayrollRun>>>(
      `/payroll/runs?${params.toString()}`
    );
    return response.data.data;
  },

  getPayrollRun: async (id: string): Promise<PayrollRun> => {
    const response = await apiClient.get<ApiResponse<PayrollRun>>(
      `/payroll/runs/${id}`
    );
    return response.data.data;
  },

  createPayrollRun: async (data: CreatePayrollRunInput): Promise<PayrollRun> => {
    const response = await apiClient.post<ApiResponse<PayrollRun>>(
      '/payroll/runs',
      data
    );
    return response.data.data;
  },

  updatePayrollRun: async (
    id: string,
    data: Partial<CreatePayrollRunInput>
  ): Promise<PayrollRun> => {
    const response = await apiClient.patch<ApiResponse<PayrollRun>>(
      `/payroll/runs/${id}`,
      data
    );
    return response.data.data;
  },

  calculatePayroll: async (id: string): Promise<PayrollRun> => {
    const response = await apiClient.post<ApiResponse<PayrollRun>>(
      `/payroll/runs/${id}/calculate`
    );
    return response.data.data;
  },

  approvePayroll: async (id: string, comment?: string): Promise<PayrollRun> => {
    const response = await apiClient.post<ApiResponse<PayrollRun>>(
      `/payroll/runs/${id}/approve`,
      { comment }
    );
    return response.data.data;
  },

  processPayroll: async (id: string): Promise<PayrollRun> => {
    const response = await apiClient.post<ApiResponse<PayrollRun>>(
      `/payroll/runs/${id}/process`
    );
    return response.data.data;
  },

  exportBankFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/payroll/runs/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // --- Payroll Records ---
  getPayrollRecords: async (
    payrollRunId: string,
    filters?: {
      departmentId?: string;
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResponse<PayrollRecord>> => {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<PayrollRecord>>
    >(`/payroll/runs/${payrollRunId}/records?${params.toString()}`);
    return response.data.data;
  },

  getPayrollRecord: async (id: string): Promise<PayrollRecord> => {
    const response = await apiClient.get<ApiResponse<PayrollRecord>>(
      `/payroll/records/${id}`
    );
    return response.data.data;
  },

  adjustPayrollRecord: async (
    data: PayrollRecordAdjustment
  ): Promise<PayrollRecord> => {
    const response = await apiClient.post<ApiResponse<PayrollRecord>>(
      `/payroll/records/${data.recordId}/adjust`,
      { componentName: data.componentName, amount: data.amount, reason: data.reason }
    );
    return response.data.data;
  },

  // --- Payroll Reports ---
  getPayrollReport: async (
    period: string
  ): Promise<PayrollReportData> => {
    const response = await apiClient.get<ApiResponse<PayrollReportData>>(
      `/reports/payroll?period=${period}`
    );
    return response.data.data;
  },

  getPayrollTrend: async (
    dateFrom: string,
    dateTo: string
  ): Promise<{ month: string; totalPayroll: number; employeeCount: number }[]> => {
    const response = await apiClient.get<
      ApiResponse<{ month: string; totalPayroll: number; employeeCount: number }[]>
    >(`/reports/payroll/trend?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    return response.data.data;
  },
};
