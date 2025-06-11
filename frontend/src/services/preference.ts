import { api } from '../lib/api';
import { Preference, PreferenceUpdate } from '../types';

class PreferenceService {
  async getPreferences(): Promise<Preference> {
    const response = await api.get<Preference>('/preferences');
    return response.data;
  }

  async updatePreferences(preferences: PreferenceUpdate): Promise<Preference> {
    const response = await api.patch<Preference>('/preferences', preferences);
    return response.data;
  }

  async resetPreferences(): Promise<Preference> {
    const response = await api.post<Preference>('/preferences/reset');
    return response.data;
  }

  async deletePreferences(): Promise<void> {
    await api.delete('/preferences');
  }
}

export const preferenceService = new PreferenceService();
