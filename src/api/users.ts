import { apiClient } from './client';
import { User } from '../types';

export const usersApi = {
  getAll: async (filters?: { role?: string; stationId?: string; regionId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.stationId) params.append('stationId', filters.stationId);
    if (filters?.regionId) params.append('regionId', filters.regionId);
    return apiClient.get<User[]>(`/users?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<User>(`/users/${id}`);
  },

  create: async (data: Partial<User>) => {
    return apiClient.post<User>('/users', data);
  },

  update: async (id: string, data: Partial<User>) => {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/users/${id}`);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.post('/users/change-password', { currentPassword, newPassword });
  },

  getActivityLog: async (id: string) => {
    return apiClient.get<any[]>(`/users/${id}/activity-log`);
  },
};