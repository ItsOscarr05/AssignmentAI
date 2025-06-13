import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface UserSettings {
  // General Settings
  darkMode: boolean;
  language: string;
  fontSize: number;
  animations: boolean;
  compactMode: boolean;
  soundEffects: boolean;
  volume: number;
  quietHoursStart: number;
  quietHoursEnd: number;

  // Language & Region Settings
  timeZone: string;
  dateFormat: string;
  autoTranslate: boolean;
  showOriginalText: boolean;
  useMetricSystem: boolean;
  use24HourFormat: boolean;

  // Sound & Feedback Settings
  hapticFeedback: boolean;
  notificationSounds: boolean;
  typingSounds: boolean;
  completionSounds: boolean;

  // AI Settings
  aiModel: string;
  maxTokens: number;
  temperature: number;
  contextLength: number;
  autoComplete: boolean;
  codeSnippets: boolean;
  aiSuggestions: boolean;
  realTimeAnalysis: boolean;

  // Notification Settings
  notifications: {
    email: boolean;
    desktop: boolean;
    sound: boolean;
    assignments: boolean;
    deadlines: boolean;
    feedback: boolean;
    updates: boolean;
  };

  // Privacy & Security Settings
  privacySettings: {
    twoFactorAuth: boolean;
    biometricLogin: boolean;
    dataCollection: boolean;
    shareAnalytics: boolean;
    showOnlineStatus: boolean;
    allowTracking: boolean;
    autoLock: boolean;
    lockTimeout: number;
    passwordExpiry: number;
    sessionTimeout: number;
  };
}

class SettingsService {
  private static instance: SettingsService;
  private baseUrl = `${API_BASE_URL}/settings`;

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // Get all user settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await axios.get(`${this.baseUrl}/user`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  // Update general settings
  async updateGeneralSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/general`, settings);
    } catch (error) {
      console.error('Error updating general settings:', error);
      throw error;
    }
  }

  // Update AI settings
  async updateAISettings(settings: {
    aiModel?: string;
    maxTokens?: number;
    temperature?: number;
    contextLength?: number;
    autoComplete?: boolean;
    codeSnippets?: boolean;
    aiSuggestions?: boolean;
    realTimeAnalysis?: boolean;
  }): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/ai`, settings);
    } catch (error) {
      console.error('Error updating AI settings:', error);
      throw error;
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings: {
    notifications?: UserSettings['notifications'];
    quietHoursStart?: number;
    quietHoursEnd?: number;
  }): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/notifications`, settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(settings: Partial<UserSettings['privacySettings']>): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/privacy`, settings);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/password`, {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Enable/disable 2FA
  async toggle2FA(enable: boolean): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/2fa`, { enabled: enable });
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      throw error;
    }
  }

  // Setup biometric login
  async setupBiometricLogin(enable: boolean): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/biometric`, { enabled: enable });
    } catch (error) {
      console.error('Error setting up biometric login:', error);
      throw error;
    }
  }

  // Download user data
  async downloadUserData(): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseUrl}/data`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading user data:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/account`, {
        data: { password },
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Get active sessions
  async getActiveSessions(): Promise<Array<{ id: string; device: string; lastActive: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  }

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/sessions/${sessionId}`);
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }
}

export default SettingsService;
