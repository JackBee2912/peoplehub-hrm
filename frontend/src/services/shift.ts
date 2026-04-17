import { apiClient } from './api';
import type {
  Shift,
  ShiftAssignment,
  CreateShiftInput,
  UpdateShiftInput,
  ApiResponse,
} from '@/types';

export const shiftService = {
  getList: async (): Promise<Shift[]> => {
    const response = await apiClient.get<ApiResponse<Shift[]>>('/shifts');
    return response.data.data;
  },

  getById: async (id: string): Promise<Shift> => {
    const response = await apiClient.get<ApiResponse<Shift>>(`/shifts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateShiftInput): Promise<Shift> => {
    const response = await apiClient.post<ApiResponse<Shift>>('/shifts', data);
    return response.data.data;
  },

  update: async (data: UpdateShiftInput): Promise<Shift> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<Shift>>(`/shifts/${id}`, updateData);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/shifts/${id}`);
  },

  // Assignments
  getAssignments: async (): Promise<ShiftAssignment[]> => {
    const response = await apiClient.get<ApiResponse<ShiftAssignment[]>>(
      '/shifts/assignments'
    );
    return response.data.data;
  },

  assignShift: async (data: {
    shiftId: string;
    employeeIds: string[];
    startDate: string;
    endDate?: string;
  }): Promise<ShiftAssignment[]> => {
    const response = await apiClient.post<ApiResponse<ShiftAssignment[]>>(
      '/shifts/assignments',
      data
    );
    return response.data.data;
  },

  removeAssignment: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/shifts/assignments/${id}`);
  },

  // Schedule preview
  getSchedulePreview: async (weekStart: string): Promise<{
    date: string;
    assignments: {
      employeeName: string;
      shiftName: string;
      startTime: string;
      endTime: string;
    }[];
  }[]> => {
    const response = await apiClient.get<ApiResponse<{
      date: string;
      assignments: {
        employeeName: string;
        shiftName: string;
        startTime: string;
        endTime: string;
      }[];
    }[]>>(`/shifts/schedule-preview?weekStart=${weekStart}`);
    return response.data.data;
  },
};
