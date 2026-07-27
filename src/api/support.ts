import { apiClient } from './client';
import { SupportTicket } from '../types';

export const supportApi = {
  getAllTickets: async (filters?: { status?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    return apiClient.get<SupportTicket[]>(`/support/tickets?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient.get<SupportTicket>(`/support/tickets/${id}`);
  },

  create: async (data: Partial<SupportTicket>) => {
    return apiClient.post<SupportTicket>('/support/tickets', data);
  },

  update: async (id: string, data: Partial<SupportTicket>) => {
    return apiClient.put<SupportTicket>(`/support/tickets/${id}`, data);
  },

  addComment: async (ticketId: string, message: string, isInternal: boolean) => {
    return apiClient.post(`/support/tickets/${ticketId}/comments`, { message, isInternal });
  },

  resolve: async (id: string) => {
    return apiClient.put(`/support/tickets/${id}/resolve`);
  },
};