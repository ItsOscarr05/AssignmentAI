import { User } from '../../types';
import { api } from './api';

export const users = {
  getProfile: () => api.get<User>('/users/profile').then(res => res.data),
  updateProfile: (data: Partial<User>) =>
    api.put<User>('/users/profile', data).then(res => res.data),
  getSettings: () => api.get('/users/settings').then(res => res.data),
  updateSettings: (data: any) => api.put('/users/settings', data).then(res => res.data),
};
