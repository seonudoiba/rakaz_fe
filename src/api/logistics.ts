import { apiClient } from './client';
import { Delivery } from '../types';

export const logisticsApi = {
  getAllDeliveries: async (filters?: { status?: string; stationId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.stationId) params.append('stationId', filters.stationId);
    return apiClient.get<Delivery[]>(`/logistics/deliveries?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<Delivery>(`/logistics/deliveries/${id}`);
  },

  createDelivery: async (data: Partial<Delivery>) => {
    return apiClient.post<Delivery>('/logistics/deliveries', data);
  },

  updateDeliveryStatus: async (id: string, status: string) => {
    return apiClient.put(`/logistics/deliveries/${id}/status`, { status });
  },

  trackDelivery: async (id: string) => {
    return apiClient.get(`/logistics/deliveries/${id}/track`);
  },

  getFleetStatus: async () => {
    return apiClient.get('/logistics/fleet-status');
  },
};