import { apiClient } from './client';
import { Tank, InventoryLog } from '../types';

export const inventoryApi = {
    getTankMonitoring: async (stationId: string) => {
    try {
      // ✅ Updated to match the new endpoint
      return await apiClient.get<{ tanks: Tank[] }>(`/inventory/tanks/${stationId}`);
    } catch (error: any) {
      // If 404, return empty tanks array instead of throwing
      if (error.response?.status === 404) {
        console.warn(`Tank monitoring endpoint not found for station ${stationId}, returning empty array`);
        return { tanks: [] };
      }
      throw error;
    }
  },

  getTankById: async (id: string) => {
    return apiClient.get<Tank>(`/inventory/tanks/${id}`);
  },

  updateTankLevel: async (id: string, data: { currentLevel: number; percentage: number }) => {
    return apiClient.put<Tank>(`/inventory/tanks/${id}/level`, data);
  },

  getInventoryLogs: async (stationId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    return apiClient.get<InventoryLog[]>(`/inventory/logs/${stationId}?${query.toString()}`);
  },

  getProductMovement: async (stationId: string, params?: { productType?: string; days?: number }) => {
    const query = new URLSearchParams();
    if (params?.productType) query.append('productType', params.productType);
    if (params?.days) query.append('days', String(params.days));
    return apiClient.get(`/inventory/movement/${stationId}?${query.toString()}`);
  },

  getInventoryAudit: async (stationId: string) => {
    return apiClient.get(`/inventory/audit/${stationId}`);
  },

  performAudit: async (stationId: string, data: any) => {
    return apiClient.post(`/inventory/audit/${stationId}`, data);
  },

  getLowStockAlerts: async (stationId?: string) => {
    const url = stationId ? `/inventory/alerts/${stationId}` : '/inventory/alerts';
    return apiClient.get(url);
  },

  getProductPrices: async (stationId?: string) => {
    const url = stationId ? `/inventory/prices?stationId=${stationId}` : '/inventory/prices';
    return apiClient.get<Array<{ id?: string; productType: string; productName: string; unitPrice: number }>>(url);
  },

  updateProductPrice: async (data: { stationId?: string; productType: string; productName: string; unitPrice: number }) => {
    return apiClient.put('/inventory/prices', data);
  },
};