import { UserSettings } from '../../types';
import { api } from './api';

export const settingsApi = {
  async getSettings(): Promise<{ data: UserSettings }> {
    const response = await api.get('/settings');
    return response;
  },

  async updateSettings(settings: UserSettings): Promise<void> {
    await api.put('/settings', settings);
  },
};
