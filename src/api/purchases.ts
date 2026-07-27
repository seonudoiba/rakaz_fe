import { apiClient } from './client';
import { PurchaseOrder } from '../types';

export const purchasesApi = {
  getAll: async (filters?: { status?: string; supplierId?: string; stationId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.stationId) params.append('stationId', filters.stationId);
    return apiClient.get<PurchaseOrder[]>(`/purchases?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<PurchaseOrder>(`/purchases/${id}`);
  },

  create: async (data: Partial<PurchaseOrder>) => {
    return apiClient.post<PurchaseOrder>('/purchases', data);
  },

  approve: async (id: string) => {
    return apiClient.put(`/purchases/${id}/approve`);
  },

  updateStatus: async (id: string, status: string) => {
    return apiClient.put(`/purchases/${id}/status`, { status });
  },

  cancel: async (id: string) => {
    return apiClient.put(`/purchases/${id}/cancel`);
  },
};