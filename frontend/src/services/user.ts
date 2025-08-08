import { api } from '../lib/api';
import { UserPreferences, UserProfile } from '../types';

class UserService {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  }

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const response = await api.put<UserProfile>('/users/profile', profile);
    return response.data;
  }

  async updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    const response = await api.patch<UserPreferences>('/preferences', preferences);
    return response.data;
  }

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    const response = await api.post<{ avatarUrl: string }>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/users/account');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async getActiveSessions(): Promise<any[]> {
    const response = await api.get('/users/sessions');
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/users/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    await api.delete('/users/sessions');
  }
}

export const userService = new UserService();
