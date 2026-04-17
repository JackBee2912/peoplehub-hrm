import { apiClient } from './api';
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  CreateLeaveRequestInput,
  LeaveApprovalAction,
  LeaveFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const leaveService = {
  // Leave Requests
  getMyRequests: async (filters?: LeaveFilters): Promise<PaginatedResponse<LeaveRequest>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<LeaveRequest>>>(
      `/leave/requests/my?${params.toString()}`
    );
    return response.data.data;
  },

  createRequest: async (data: CreateLeaveRequestInput): Promise<LeaveRequest> => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>('/leave/requests', data);
    return response.data.data;
  },

  cancelRequest: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leave/requests/${id}/cancel`);
    return response.data.data;
  },

  getById: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.get<ApiResponse<LeaveRequest>>(`/leave/requests/${id}`);
    return response.data.data;
  },

  // Leave Balances
  getMyBalances: async (year?: number): Promise<LeaveBalance[]> => {
    const params = year ? `?year=${year}` : '';
    const response = await apiClient.get<ApiResponse<LeaveBalance[]>>(
      `/leave/balances/my${params}`
    );
    return response.data.data;
  },

  // Leave Types
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const response = await apiClient.get<ApiResponse<LeaveType[]>>('/leave/types');
    return response.data.data;
  },

  // Approvals (Manager)
  getPendingApprovals: async (): Promise<LeaveRequest[]> => {
    const response = await apiClient.get<ApiResponse<LeaveRequest[]>>(
      '/leave/approvals/pending'
    );
    return response.data.data;
  },

  getApprovalList: async (filters?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<LeaveRequest>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<ApiResponse<PaginatedResponse<LeaveRequest>>>(
      `/leave/approvals?${params.toString()}`
    );
    return response.data.data;
  },

  processApproval: async (action: LeaveApprovalAction): Promise<LeaveRequest> => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(
      `/leave/approvals/${action.requestId}/${action.action}`,
      { comment: action.comment }
    );
    return response.data.data;
  },

  bulkApprove: async (requestIds: string[]): Promise<{ processed: number }> => {
    const response = await apiClient.post<ApiResponse<{ processed: number }>>(
      '/leave/approvals/bulk-approve',
      { requestIds }
    );
    return response.data.data;
  },
};
