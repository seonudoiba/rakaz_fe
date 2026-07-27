import { apiClient } from './client';

export const settingsApi = {
  getSettings: async (): Promise<any> => {
    return apiClient.get('/settings');
  },

  updateSettings: async (settings: any): Promise<any> => {
    return apiClient.put('/settings', settings);
  },

  getSystemSettings: async (): Promise<any> => {
    return apiClient.get('/settings/system');
  },

  updateSystemSettings: async (settings: any): Promise<any> => {
    return apiClient.put('/settings/system', settings);
  },
};
