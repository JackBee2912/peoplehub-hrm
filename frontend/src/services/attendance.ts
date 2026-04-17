import { apiClient } from './api';
import type {
  AttendanceLog,
  AttendanceFilters,
  CheckInOutResponse,
  AttendanceDayRecord,
  AttendanceReportData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const attendanceService = {
  checkIn: async (): Promise<CheckInOutResponse> => {
    const response = await apiClient.post<ApiResponse<CheckInOutResponse>>('/attendance/check-in');
    return response.data.data;
  },

  checkOut: async (): Promise<CheckInOutResponse> => {
    const response = await apiClient.post<ApiResponse<CheckInOutResponse>>('/attendance/check-out');
    return response.data.data;
  },

  getTodayStatus: async (): Promise<{
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    status?: string;
    workedHours?: number;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      checkedIn: boolean;
      checkedOut: boolean;
      checkInTime?: string;
      checkOutTime?: string;
      status?: string;
      workedHours?: number;
    }>>('/attendance/today');
    return response.data.data;
  },

  getRecentHistory: async (limit = 10): Promise<AttendanceLog[]> => {
    const response = await apiClient.get<ApiResponse<AttendanceLog[]>>(
      `/attendance/recent?limit=${limit}`
    );
    return response.data.data;
  },

  getList: async (filters: AttendanceFilters): Promise<PaginatedResponse<AttendanceLog>> => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<AttendanceLog>>>(
      `/attendance?${params.toString()}`
    );
    return response.data.data;
  },

  getCalendarData: async (year: number, month: number): Promise<AttendanceDayRecord[]> => {
    const response = await apiClient.get<ApiResponse<AttendanceDayRecord[]>>(
      `/attendance/calendar?year=${year}&month=${month + 1}`
    );
    return response.data.data;
  },

  getReport: async (
    dateFrom: string,
    dateTo: string
  ): Promise<AttendanceReportData> => {
    const response = await apiClient.get<ApiResponse<AttendanceReportData>>(
      `/attendance/report?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return response.data.data;
  },

  exportCSV: async (filters: AttendanceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/attendance/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
