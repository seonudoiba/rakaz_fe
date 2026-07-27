import { apiClient } from './client';

export const regionsApi = {
  getAll: async (): Promise<any[]> => {
    return apiClient.get('/regions');
  },

  getOne: async (id: string): Promise<any> => {
    return apiClient.get(`/regions/${id}`);
  },

  create: async (data: any): Promise<any> => {
    return apiClient.post('/regions', data);
  },

  update: async (id: string, data: any): Promise<any> => {
    return apiClient.put(`/regions/${id}`, data);
  },

  delete: async (id: string): Promise<any> => {
    return apiClient.delete(`/regions/${id}`);
  },
};
