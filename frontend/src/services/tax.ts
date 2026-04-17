import { apiClient } from './api';
import type {
  TaxRule,
  CreateTaxRuleInput,
  UpdateTaxRuleInput,
  ApiResponse,
} from '@/types';

export const taxService = {
  getTaxRules: async (): Promise<TaxRule[]> => {
    const response = await apiClient.get<ApiResponse<TaxRule[]>>(
      '/payroll/tax-rules'
    );
    return response.data.data;
  },

  getTaxRule: async (id: string): Promise<TaxRule> => {
    const response = await apiClient.get<ApiResponse<TaxRule>>(
      `/payroll/tax-rules/${id}`
    );
    return response.data.data;
  },

  createTaxRule: async (data: CreateTaxRuleInput): Promise<TaxRule> => {
    const response = await apiClient.post<ApiResponse<TaxRule>>(
      '/payroll/tax-rules',
      data
    );
    return response.data.data;
  },

  updateTaxRule: async (data: UpdateTaxRuleInput): Promise<TaxRule> => {
    const { id, ...updateData } = data;
    const response = await apiClient.patch<ApiResponse<TaxRule>>(
      `/payroll/tax-rules/${id}`,
      updateData
    );
    return response.data.data;
  },

  deleteTaxRule: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/payroll/tax-rules/${id}`);
  },

  toggleTaxRule: async (id: string, isActive: boolean): Promise<TaxRule> => {
    const response = await apiClient.post<ApiResponse<TaxRule>>(
      `/payroll/tax-rules/${id}/toggle`,
      { isActive }
    );
    return response.data.data;
  },

  calculateTax: async (
    grossPay: number,
    taxRuleId: string
  ): Promise<{
    taxAmount: number;
    socialInsurance: number;
    healthInsurance: number;
    totalDeductions: number;
    netPay: number;
    bracketBreakdown: { min: number; max: number | null; rate: number; taxable: number; tax: number }[];
  }> => {
    const response = await apiClient.post<
      ApiResponse<{
        taxAmount: number;
        socialInsurance: number;
        healthInsurance: number;
        totalDeductions: number;
        netPay: number;
        bracketBreakdown: {
          min: number;
          max: number | null;
          rate: number;
          taxable: number;
          tax: number;
        }[];
      }>
    >('/payroll/tax-rules/calculate', { grossPay, taxRuleId });
    return response.data.data;
  },
};
