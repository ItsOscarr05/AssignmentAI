import { AppSettings } from '../../types/settings';
import { api } from './api';

export const settingsApi = {
  async getSettings(): Promise<{ data: AppSettings }> {
    const response = await api.get('/settings');
    return response;
  },

  async updateSettings(settings: AppSettings): Promise<void> {
    await api.put('/settings', settings);
  },
};
