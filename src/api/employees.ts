import { apiClient } from './client';
import { Employee } from '../types';

export const employeesApi = {
  getAll: async (stationId?: string) => {
    const url = stationId ? `/employees?stationId=${stationId}` : '/employees';
    return apiClient.get<Employee[]>(url);
  },

  getById: async (id: string) => {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  create: async (data: Partial<Employee>) => {
    return apiClient.post<Employee>('/employees', data);
  },

  update: async (id: string, data: Partial<Employee>) => {
    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/employees/${id}`);
  },
};