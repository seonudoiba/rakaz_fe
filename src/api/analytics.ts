import { apiClient } from './client';
import { PerformanceMetrics, TrendsAnalysis, StationComparison, RevenueForecast } from '../types';

export const analyticsApi = {
  getPerformanceMetrics: async (params: {
    stationId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.stationId) query.append('stationId', params.stationId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return apiClient.get<PerformanceMetrics>(`/analytics/performance?${query.toString()}`);
  },

  getTrendsAnalysis: async (params: {
    stationId?: string;
    startDate?: string;
    endDate?: string;
    metric?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.stationId) query.append('stationId', params.stationId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.metric) query.append('metric', params.metric);
    return apiClient.get<TrendsAnalysis>(`/analytics/trends?${query.toString()}`);
  },

  getStationComparison: async (params: {
    stationIds: string[];
    metric?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    query.append('stationIds', params.stationIds.join(','));
    if (params.metric) query.append('metric', params.metric);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return apiClient.get<StationComparison>(`/analytics/comparison?${query.toString()}`);
  },

  getPredictiveAnalytics: async (params: {
    stationId?: string;
    metric?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.stationId) query.append('stationId', params.stationId);
    if (params.metric) query.append('metric', params.metric);
    return apiClient.get(`/analytics/predictive?${query.toString()}`);
  },

  getRevenueForecast: async (params: {
    stationId?: string;
    days?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.stationId) query.append('stationId', params.stationId);
    if (params.days) query.append('days', String(params.days));
    return apiClient.get<RevenueForecast>(`/analytics/forecast?${query.toString()}`);
  },
};