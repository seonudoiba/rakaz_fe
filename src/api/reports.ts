import { apiClient } from './client';

export const reportsApi = {
  generateReport: async (params: any) => {
    return apiClient.post('/reports/generate', params);
  },

  generateSalesReport: async (params: any) => {
    return apiClient.post('/reports/sales', params);
  },

  generateFinancialReport: async (params: any) => {
    return apiClient.post('/reports/financial', params);
  },

  generateInventoryReport: async (params: any) => {
    return apiClient.post('/reports/inventory', params);
  },

  generateStationReport: async (params: any) => {
    return apiClient.post('/reports/station', params);
  },

  exportReport: async (reportIdOrType: string, formatOrData?: any, format?: string) => {
    if (format) {
      return apiClient.post(`/reports/export/${reportIdOrType}`, { data: formatOrData, format });
    }
    return apiClient.get(`/reports/export/${reportIdOrType}?format=${formatOrData}`);
  },
};