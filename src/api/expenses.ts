import { apiClient } from './client';
import { Expense } from '../types';

export const expensesApi = {
  // Fix: stationId should be in the path, not query
  getStationExpenses: async (stationId?: string | null, filters?: { 
    category?: string; 
    startDate?: string; 
    endDate?: string;
  }) => {
    // If stationId is provided, use path parameter
    if (stationId) {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get<Expense[]>(`/expenses/station/${stationId}${query}`);
    } else {
      // If no stationId, use the all-stations endpoint or query param
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      const query = params.toString() ? `?${params.toString()}` : '';
      // This assumes you have an endpoint that returns all expenses
      return apiClient.get<Expense[]>(`/expenses/all${query}`);
    }
  },

  getById: async (id: string) => {
    return apiClient.get<Expense>(`/expenses/${id}`);
  },

  create: async (data: Partial<Expense>): Promise<Expense> => {
    return apiClient.post<Expense>('/expenses', data);
  },

  approve: async (id: string): Promise<Expense> => {
    return apiClient.put(`/expenses/${id}/approve`);
  },

  getSummary: async (stationId?: string | null, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/expenses/summary?${params.toString()}`);
  },

  getPendingApprovals: async (stationId?: string | null) => {
    if (stationId) {
      return apiClient.get(`/expenses/pending/${stationId}`);
    } else {
      return apiClient.get('/expenses/pending/all');
    }
  },

  delete: async (id: string) => {
    return apiClient.delete(`/expenses/${id}`);
  },
};