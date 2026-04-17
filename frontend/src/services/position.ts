import { apiClient } from './api';
import type {
  Position,
  CreatePositionInput,
  ApiResponse,
} from '@/types';

export const positionService = {
  getList: async (): Promise<Position[]> => {
    const response = await apiClient.get<ApiResponse<Position[]>>('/positions');
    return response.data.data;
  },

  getById: async (id: string): Promise<Position> => {
    const response = await apiClient.get<ApiResponse<Position>>(`/positions/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePositionInput): Promise<Position> => {
    const response = await apiClient.post<ApiResponse<Position>>('/positions', data);
    return response.data.data;
  },

  update: async (data: Partial<CreatePositionInput> & { id: string }): Promise<Position> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<Position>>(`/positions/${id}`, updateData);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/positions/${id}`);
  },
};
