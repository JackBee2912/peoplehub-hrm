import { apiClient } from './api';
import type {
  Employee,
  EmployeeListResponse,
  EmployeeFilters,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ApiResponse,
} from '@/types';

export const employeeService = {
  getList: async (filters: EmployeeFilters): Promise<EmployeeListResponse> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<ApiResponse<EmployeeListResponse>>(
      `/employees?${params.toString()}`
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return response.data.data;
  },

  create: async (data: CreateEmployeeInput): Promise<Employee> => {
    const response = await apiClient.post<ApiResponse<Employee>>('/employees', data);
    return response.data.data;
  },

  update: async (data: UpdateEmployeeInput): Promise<Employee> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, updateData);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/employees/${id}`);
  },

  getStats: async (): Promise<{
    total: number;
    active: number;
    byDepartment: { department: string; count: number }[];
    byStatus: { status: string; count: number }[];
  }> => {
    const response = await apiClient.get<ApiResponse<{
      total: number;
      active: number;
      byDepartment: { department: string; count: number }[];
      byStatus: { status: string; count: number }[];
    }>>('/employees/stats');
    return response.data.data;
  },
};
