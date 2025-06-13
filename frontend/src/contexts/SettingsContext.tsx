import { useSnackbar } from 'notistack';
import React, { createContext, useContext, useEffect, useState } from 'react';
import SettingsService, { UserSettings } from '../services/settingsService';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateGeneralSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateAISettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<UserSettings['privacySettings']>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  toggle2FA: (enable: boolean) => Promise<void>;
  setupBiometricLogin: (enable: boolean) => Promise<void>;
  downloadUserData: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  getActiveSessions: () => Promise<Array<{ id: string; device: string; lastActive: string }>>;
  revokeSession: (sessionId: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const settingsService = SettingsService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await settingsService.getUserSettings();
      setSettings(userSettings);
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      enqueueSnackbar('Failed to load settings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateGeneralSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      await settingsService.updateGeneralSettings(newSettings);
      setSettings(prev => (prev ? { ...prev, ...newSettings } : null));
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update settings', { variant: 'error' });
      throw err;
    }
  };

  const updateAISettings = async (newSettings: Partial<UserSettings>) => {
    try {
      await settingsService.updateAISettings(newSettings);
      setSettings(prev => (prev ? { ...prev, ...newSettings } : null));
      enqueueSnackbar('AI settings updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update AI settings', { variant: 'error' });
      throw err;
    }
  };

  const updateNotificationSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      await settingsService.updateNotificationSettings(newSettings);
      setSettings(prev => (prev ? { ...prev, ...newSettings } : null));
      enqueueSnackbar('Notification settings updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update notification settings', { variant: 'error' });
      throw err;
    }
  };

  const updatePrivacySettings = async (newSettings: Partial<UserSettings['privacySettings']>) => {
    try {
      await settingsService.updatePrivacySettings(newSettings);
      setSettings(prev =>
        prev ? { ...prev, privacySettings: { ...prev.privacySettings, ...newSettings } } : null
      );
      enqueueSnackbar('Privacy settings updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update privacy settings', { variant: 'error' });
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await settingsService.changePassword(currentPassword, newPassword);
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to change password', { variant: 'error' });
      throw err;
    }
  };

  const toggle2FA = async (enable: boolean) => {
    try {
      await settingsService.toggle2FA(enable);
      setSettings(prev =>
        prev
          ? {
              ...prev,
              privacySettings: { ...prev.privacySettings, twoFactorAuth: enable },
            }
          : null
      );
      enqueueSnackbar(`Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully`, {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar(`Failed to ${enable ? 'enable' : 'disable'} two-factor authentication`, {
        variant: 'error',
      });
      throw err;
    }
  };

  const setupBiometricLogin = async (enable: boolean) => {
    try {
      await settingsService.setupBiometricLogin(enable);
      setSettings(prev =>
        prev
          ? {
              ...prev,
              privacySettings: { ...prev.privacySettings, biometricLogin: enable },
            }
          : null
      );
      enqueueSnackbar(`Biometric login ${enable ? 'enabled' : 'disabled'} successfully`, {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar(`Failed to ${enable ? 'enable' : 'disable'} biometric login`, {
        variant: 'error',
      });
      throw err;
    }
  };

  const downloadUserData = async () => {
    try {
      const blob = await settingsService.downloadUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      enqueueSnackbar('User data downloaded successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to download user data', { variant: 'error' });
      throw err;
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      await settingsService.deleteAccount(password);
      enqueueSnackbar('Account deleted successfully', { variant: 'success' });
      // Redirect to login page or handle logout
    } catch (err) {
      enqueueSnackbar('Failed to delete account', { variant: 'error' });
      throw err;
    }
  };

  const getActiveSessions = async () => {
    try {
      return await settingsService.getActiveSessions();
    } catch (err) {
      enqueueSnackbar('Failed to fetch active sessions', { variant: 'error' });
      throw err;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await settingsService.revokeSession(sessionId);
      enqueueSnackbar('Session revoked successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to revoke session', { variant: 'error' });
      throw err;
    }
  };

  const value = {
    settings,
    loading,
    error,
    updateGeneralSettings,
    updateAISettings,
    updateNotificationSettings,
    updatePrivacySettings,
    changePassword,
    toggle2FA,
    setupBiometricLogin,
    downloadUserData,
    deleteAccount,
    getActiveSessions,
    revokeSession,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
