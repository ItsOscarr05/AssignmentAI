import { Class } from '../../types';
import { api } from './api';

export const classes = {
  getAll: () => api.get<Class[]>('/classes').then(res => res.data),
  getById: (id: string) => api.get<Class>(`/classes/${id}`).then(res => res.data),
  create: (data: Partial<Class>) => api.post<Class>('/classes', data).then(res => res.data),
  update: (id: string, data: Partial<Class>) =>
    api.put<Class>(`/classes/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};
