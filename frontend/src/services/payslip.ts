import { apiClient } from './api';
import type { Payslip, ApiResponse, PaginatedResponse } from '@/types';

export const payslipService = {
  // Employee self-service: my payslips
  getMyPayslips: async (
    filters?: { year?: number; page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<Payslip>> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Payslip>>
    >(`/payroll/payslips?${params.toString()}`);
    return response.data.data;
  },

  getMyPayslip: async (id: string): Promise<Payslip> => {
    const response = await apiClient.get<ApiResponse<Payslip>>(
      `/payroll/payslips/${id}`
    );
    return response.data.data;
  },

  downloadPayslip: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/payroll/payslips/${id}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  getMyYTDSummary: async (): Promise<{
    year: number;
    totalGross: number;
    totalNet: number;
    totalTax: number;
    totalDeductions: number;
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        year: number;
        totalGross: number;
        totalNet: number;
        totalTax: number;
        totalDeductions: number;
      }>
    >('/payroll/payslips/ytd-summary');
    return response.data.data;
  },

  // Admin: view any employee's payslips
  getEmployeePayslips: async (
    employeeId: string,
    filters?: { year?: number; page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<Payslip>> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Payslip>>
    >(`/payroll/employees/${employeeId}/payslips?${params.toString()}`);
    return response.data.data;
  },

  generatePayslip: async (payrollRecordId: string): Promise<Payslip> => {
    const response = await apiClient.post<ApiResponse<Payslip>>(
      `/payroll/payslips/generate`,
      { payrollRecordId }
    );
    return response.data.data;
  },

  resendPayslipEmail: async (payslipId: string): Promise<void> => {
    await apiClient.post<ApiResponse>(
      `/payroll/payslips/${payslipId}/resend`
    );
  },
};
