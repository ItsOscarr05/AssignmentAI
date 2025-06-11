export interface NotificationSettings {
  email: boolean;
  push: boolean;
  assignments: boolean;
  grades: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  activityStatus: boolean;
}

export interface AppSettings {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  language: string;
  timezone: string;
  privacy: PrivacySettings;
}

export interface SettingsProps {
  initialSettings: AppSettings;
  onUpdate?: (settings: Partial<AppSettings>) => void;
  on2FASetup?: () => void;
  on2FADisable?: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onNotificationUpdate?: (settings: Partial<NotificationSettings>) => void;
  isLoading?: boolean;
  error?: string;
  success?: string;
}
