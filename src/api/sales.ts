import { apiClient } from './client';
import { Sale, DailyReport } from '../types';

export const salesApi = {
  // Get daily report for a specific station or all stations
  getDailyReport: async (stationId?: string | null, date?: string): Promise<DailyReport> => {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId);
    if (date) params.append('date', date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/sales/daily${query}`);
  },

  // Get monthly report
  getMonthlyReport: async (stationId?: string | null, month?: number, year?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId);
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    return apiClient.get(`/sales/monthly?${params.toString()}`);
  },

  // Get station sales - now accepts optional stationId (null = all stations)
  getStationSales: async (stationId?: string | null, startDate?: string, endDate?: string): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (stationId) {
      // Specific station
      return apiClient.get<Sale[]>(`/sales/station/${stationId}?startDate=${startDate}&endDate=${endDate}`);
    } else {
      // All stations - use a different endpoint or fetch from all stations
      return apiClient.get<Sale[]>(`/sales/all?startDate=${startDate}&endDate=${endDate}`);
    }
  },

  createSale: async (data: Partial<Sale>): Promise<Sale> => {
    return apiClient.post<Sale>('/sales', data);
  },

  verifySale: async (saleId: string): Promise<Sale> => {
    return apiClient.put(`/sales/${saleId}/verify`);
  },

  getSalesByProduct: async (stationId?: string | null, startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/sales/by-product?${params.toString()}`);
  },

  getCreditCustomers: async (stationId?: string | null): Promise<any> => {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId);
    return apiClient.get(`/sales/credits?${params.toString()}`);
  },
};