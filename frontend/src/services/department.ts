import { apiClient } from './api';
import type {
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ApiResponse,
} from '@/types';

export const departmentService = {
  getTree: async (): Promise<Department[]> => {
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments/tree');
    return response.data.data;
  },

  getList: async (): Promise<Department[]> => {
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments');
    return response.data.data;
  },

  getById: async (id: string): Promise<Department> => {
    const response = await apiClient.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDepartmentInput): Promise<Department> => {
    const response = await apiClient.post<ApiResponse<Department>>('/departments', data);
    return response.data.data;
  },

  update: async (data: UpdateDepartmentInput): Promise<Department> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<Department>>(`/departments/${id}`, updateData);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/departments/${id}`);
  },
};
