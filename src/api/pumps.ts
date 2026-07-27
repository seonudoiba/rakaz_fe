import { apiClient } from './client';
import { Pump, PumpReading } from '../types';

export const pumpsApi = {
  getStationPumps: async (stationId: string) => {
    return apiClient.get<Pump[]>(`/pumps/station/${stationId}`);
  },

  getById: async (id: string) => {
    return apiClient.get<Pump>(`/pumps/${id}`);
  },

  create: async (data: Partial<Pump> & { stationId: string }) => {
    return apiClient.post<Pump>('/pumps', data);
  },

  update: async (id: string, data: Partial<Pump>) => {
    return apiClient.put<Pump>(`/pumps/${id}`, data);
  },

  // ✅ ADD THIS DELETE METHOD
  delete: async (id: string) => {
    return apiClient.delete(`/pumps/${id}`);
  },

  recordReading: async (data: Partial<PumpReading> & { stationId: string }) => {
    return apiClient.post<PumpReading>('/pumps/readings', data);
  },

  getReadings: async (pumpId: string, startDate: string, endDate: string) => {
    return apiClient.get<PumpReading[]>(`/pumps/${pumpId}/readings?startDate=${startDate}&endDate=${endDate}`);
  },

  getPumpDashboard: async (stationId: string) => {
    return apiClient.get(`/pumps/dashboard?stationId=${stationId}`);
  },
};