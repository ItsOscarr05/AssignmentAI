import { api } from '../lib/api';

export interface UserSettings {
  appearance: {
    dark_mode: boolean;
    font_size: number;
    animations: boolean;
    compact_mode: boolean;
  };
  language: {
    language: string;

    date_format: string;
    auto_translate: boolean;
    show_original_text: boolean;
    use_metric_system: boolean;
    use_24_hour_format: boolean;
  };
  sound: {
    sound_effects: boolean;
    haptic_feedback: boolean;
    volume: number;

    typing_sounds: boolean;
    completion_sounds: boolean;
    quiet_hours_start: number;
    quiet_hours_end: number;
  };

  privacy: {
    two_factor_auth: boolean;
    biometric_login: boolean;
    data_collection: boolean;
    share_analytics: boolean;
    show_online_status: boolean;
    allow_tracking: boolean;
    auto_lock: boolean;
    lock_timeout: number;
    password_expiry: number;
    session_timeout: number;
  };
  ai: {
    max_tokens: number;
    temperature: number;
    context_length: number;
    auto_complete: boolean;
    code_snippets: boolean;
    ai_suggestions: boolean;
    real_time_analysis: boolean;
  };
}

export interface SettingsResponse {
  success: boolean;
  data?: UserSettings;
  message?: string;
}

class SettingsService {
  private readonly baseUrl = '/api/v1';

  /**
   * Get user settings from backend
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      // Use the preferences endpoint that actually exists
      const response = await api.get<SettingsResponse>(`${this.baseUrl}/preferences`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to load settings');
    } catch (error) {
      console.error('Error loading user settings:', error);
      throw error;
    }
  }

  /**
   * Save user settings to backend
   */
  async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      // Use the preferences endpoint that actually exists
      await api.patch(`${this.baseUrl}/preferences`, settings);
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  /**
   * Update specific setting category
   */
  async updateSettingsCategory(
    category: keyof UserSettings,
    settings: Partial<UserSettings[keyof UserSettings]>
  ): Promise<void> {
    try {
      const response = await api.patch<SettingsResponse>(
        `${this.baseUrl}/user/${category}`,
        settings
      );

      if (!response.data.success) {
        throw new Error(response.data.message || `Failed to update ${category} settings`);
      }
    } catch (error) {
      console.error(`Error updating ${category} settings:`, error);
      throw error;
    }
  }

  /**
   * Get default settings (for new users)
   */
  async getDefaultSettings(): Promise<UserSettings> {
    try {
      const response = await api.get<SettingsResponse>(`${this.baseUrl}/settings/defaults`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to load default settings');
    } catch (error) {
      console.error('Error loading default settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      const response = await api.post<SettingsResponse>(`${this.baseUrl}/settings/reset`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/settings/export`, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('settings', file);

      const response = await api.post<SettingsResponse>(
        `${this.baseUrl}/settings/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to import settings');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Sync settings with localStorage
   */
  async syncWithLocalStorage(): Promise<void> {
    try {
      // Get settings from localStorage
      const localSettings = this.getLocalStorageSettings();

      // Send to backend
      await this.saveUserSettings(localSettings);
    } catch (error) {
      console.error('Error syncing settings with localStorage:', error);
      throw error;
    }
  }

  /**
   * Get settings from localStorage
   */
  getLocalStorageSettings(): Partial<UserSettings> {
    const settings: Partial<UserSettings> = {};

    // Language settings
    const dateFormat = localStorage.getItem('dateFormat');
    const use24HourFormat = localStorage.getItem('use24HourFormat');
    const language = localStorage.getItem('language');

    if (dateFormat || use24HourFormat || language) {
      settings.language = {
        language: language || 'en',

        date_format: dateFormat || 'MM/DD/YYYY',
        auto_translate: localStorage.getItem('autoTranslate') === 'true',
        show_original_text: localStorage.getItem('showOriginalText') !== 'false',
        use_metric_system: localStorage.getItem('useMetricSystem') === 'true',
        use_24_hour_format: use24HourFormat === 'true',
      };
    }

    // Sound settings
    const soundEffects = localStorage.getItem('soundEffects');
    const volume = localStorage.getItem('volume');

    if (soundEffects || volume) {
      settings.sound = {
        sound_effects: soundEffects !== 'false',
        haptic_feedback: localStorage.getItem('hapticFeedback') !== 'false',
        volume: volume ? parseInt(volume) : 70,

        typing_sounds: localStorage.getItem('typingSounds') === 'true',
        completion_sounds: localStorage.getItem('completionSounds') !== 'false',
        quiet_hours_start: parseInt(localStorage.getItem('quietHoursStart') || '22'),
        quiet_hours_end: parseInt(localStorage.getItem('quietHoursEnd') || '7'),
      };
    }

    return settings;
  }

  /**
   * Save settings to localStorage
   */
  saveToLocalStorage(settings: Partial<UserSettings>): void {
    if (settings.language) {
      localStorage.setItem('dateFormat', settings.language.date_format);
      localStorage.setItem('use24HourFormat', settings.language.use_24_hour_format.toString());
      localStorage.setItem('language', settings.language.language);

      localStorage.setItem('autoTranslate', settings.language.auto_translate.toString());
      localStorage.setItem('showOriginalText', settings.language.show_original_text.toString());
      localStorage.setItem('useMetricSystem', settings.language.use_metric_system.toString());
    }

    if (settings.sound) {
      localStorage.setItem('soundEffects', settings.sound.sound_effects.toString());
      localStorage.setItem('hapticFeedback', settings.sound.haptic_feedback.toString());
      localStorage.setItem('volume', settings.sound.volume.toString());

      localStorage.setItem('typingSounds', settings.sound.typing_sounds.toString());
      localStorage.setItem('completionSounds', settings.sound.completion_sounds.toString());
      localStorage.setItem('quietHoursStart', settings.sound.quiet_hours_start.toString());
      localStorage.setItem('quietHoursEnd', settings.sound.quiet_hours_end.toString());
    }
  }
}

export const settingsService = new SettingsService();
