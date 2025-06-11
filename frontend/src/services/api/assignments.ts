import { Assignment } from '../../types';
import { api } from './api';

export const assignments = {
  getAll: () => api.get<Assignment[]>('/assignments').then(res => res.data),
  getById: (id: string) => api.get<Assignment>(`/assignments/${id}`).then(res => res.data),
  create: (data: Partial<Assignment>) =>
    api.post<Assignment>('/assignments', data).then(res => res.data),
  update: (id: string, data: Partial<Assignment>) =>
    api.put<Assignment>(`/assignments/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  generate: (data: any) =>
    api.post<Assignment>('/assignments/generate', data).then(res => res.data),
};
