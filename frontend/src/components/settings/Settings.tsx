import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { settingsApi } from '../../services/api/settings';
import { UserSettings } from '../../types/index';

interface SettingsProps {
  initialSettings?: UserSettings;
  onUpdate?: (settings: Partial<UserSettings>) => void;
  on2FASetup?: () => void;
  on2FADisable?: () => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;

  isLoading?: boolean;
  error?: string;
  success?: string;
}

function Settings({ initialSettings, onUpdate }: SettingsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(() => {
    if (initialSettings) {
      return {
        ...initialSettings,
        privacy: {
          ...(initialSettings.privacy || {}),
          profileVisibility: initialSettings.privacy?.profileVisibility || 'public',
          activityStatus: initialSettings.privacy?.activityStatus ?? true,
        },
      };
    }
    return null;
  });

  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [initialSettings]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.getSettings();
      const fetchedSettings = response.data;
      setSettings({
        ...fetchedSettings,
        privacy: {
          ...(fetchedSettings.privacy || {}),
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (
    field: keyof UserSettings,
    value: string | boolean,
    subField?: string
  ) => {
    if (!settings) return;

    let updatedSettings;
    if (subField && field === 'privacy') {
      updatedSettings = {
        ...settings,
        privacy: {
          ...settings.privacy,
          [subField]: value,
        },
      };
    } else {
      updatedSettings = {
        ...settings,
        [field]: value,
      };
    }

    setSettings(updatedSettings);

    try {
      await settingsApi.updateSettings(updatedSettings);
      if (onUpdate) {
        onUpdate(updatedSettings);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update settings');
      // Revert the change on error
      setSettings(settings);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom className="page-title" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Theme */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Theme
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={settings.theme}
                      onChange={e => handleSettingChange('theme', e.target.value)}
                      label="Theme"
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Language */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Language & Region
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.language}
                      onChange={e => handleSettingChange('language', e.target.value)}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Privacy & Security
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Profile Visibility</InputLabel>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onChange={e =>
                        handleSettingChange('privacy', e.target.value, 'profileVisibility')
                      }
                      label="Profile Visibility"
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                      <MenuItem value="connections">Connections Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.activityStatus}
                        onChange={e =>
                          handleSettingChange('privacy', e.target.checked, 'activityStatus')
                        }
                      />
                    }
                    label="Activity Status"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
