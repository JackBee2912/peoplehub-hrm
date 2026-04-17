import { apiClient } from './api';
import type {
  TeamAttendanceSummary,
  PendingApprovalSummary,
  ApiResponse,
} from '@/types';

export const managerService = {
  getTeamAttendance: async (): Promise<TeamAttendanceSummary> => {
    const response = await apiClient.get<ApiResponse<TeamAttendanceSummary>>(
      '/manager/team-attendance'
    );
    return response.data.data;
  },

  getPendingApprovals: async (): Promise<PendingApprovalSummary> => {
    const response = await apiClient.get<ApiResponse<PendingApprovalSummary>>(
      '/manager/pending-approvals'
    );
    return response.data.data;
  },

  getTeamCalendar: async (month: number, year: number): Promise<{
    date: string;
    absent: { name: string; type: string }[];
    onLeave: { name: string; leaveType: string }[];
    late: { name: string }[];
  }[]> => {
    const response = await apiClient.get<ApiResponse<{
      date: string;
      absent: { name: string; type: string }[];
      onLeave: { name: string; leaveType: string }[];
      late: { name: string }[];
    }[]>>(`/manager/team-calendar?month=${month}&year=${year}`);
    return response.data.data;
  },
};
