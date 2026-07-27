import { apiClient } from './client';
import { Station } from '../types';

export const stationsApi = {
  getAll: async (regionId?: string): Promise<Station[]> => {
    const url = regionId ? `/stations?regionId=${regionId}` : '/stations';
    return apiClient.get<Station[]>(url);
  },

  getOne: async (id: string): Promise<Station> => {
    return apiClient.get<Station>(`/stations/${id}`);
  },

  create: async (data: Partial<Station>): Promise<Station> => {
    return apiClient.post<Station>('/stations', data);
  },

  update: async (id: string, data: Partial<Station>): Promise<Station> => {
    return apiClient.put<Station>(`/stations/${id}`, data);
  },

  getDashboard: async (stationId: string): Promise<any> => {
    return apiClient.get(`/stations/${stationId}/dashboard`);
  },

  delete: async (id: string): Promise<any> => {
    return apiClient.delete(`/stations/${id}`);
  },
};