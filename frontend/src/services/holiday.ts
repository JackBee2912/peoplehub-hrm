import { apiClient } from './api';
import type {
  Holiday,
  CreateHolidayInput,
  UpdateHolidayInput,
  ApiResponse,
} from '@/types';

export const holidayService = {
  getByYear: async (year: number): Promise<Holiday[]> => {
    const response = await apiClient.get<ApiResponse<Holiday[]>>(`/holidays?year=${year}`);
    return response.data.data;
  },

  getList: async (): Promise<Holiday[]> => {
    const response = await apiClient.get<ApiResponse<Holiday[]>>('/holidays');
    return response.data.data;
  },

  getById: async (id: string): Promise<Holiday> => {
    const response = await apiClient.get<ApiResponse<Holiday>>(`/holidays/${id}`);
    return response.data.data;
  },

  create: async (data: CreateHolidayInput): Promise<Holiday> => {
    const response = await apiClient.post<ApiResponse<Holiday>>('/holidays', data);
    return response.data.data;
  },

  update: async (data: UpdateHolidayInput): Promise<Holiday> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<Holiday>>(`/holidays/${id}`, updateData);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/holidays/${id}`);
  },

  importHolidays: async (holidays: CreateHolidayInput[]): Promise<{ imported: number }> => {
    const response = await apiClient.post<ApiResponse<{ imported: number }>>(
      '/holidays/import',
      { holidays }
    );
    return response.data.data;
  },
};
