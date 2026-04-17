import { apiClient } from './api';
import type {
  DashboardStats,
  ActivityItem,
  BirthdayItem,
  ApiResponse,
} from '@/types';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },

  getRecentActivity: async (limit = 10): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ApiResponse<ActivityItem[]>>(
      `/dashboard/activity?limit=${limit}`
    );
    return response.data.data;
  },

  getUpcomingBirthdays: async (limit = 10): Promise<BirthdayItem[]> => {
    const response = await apiClient.get<ApiResponse<BirthdayItem[]>>(
      `/dashboard/birthdays?limit=${limit}`
    );
    return response.data.data;
  },
};
