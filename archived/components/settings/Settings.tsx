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
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Time Zone</InputLabel>
                    <Select
                      value={settings.timezone || 'UTC'}
                      onChange={e => handleSettingChange('timezone', e.target.value)}
                      label="Time Zone"
                    >
                      <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time (US & Canada)</MenuItem>
                      <MenuItem value="America/Chicago">Central Time (US & Canada)</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time (US & Canada)</MenuItem>
                      <MenuItem value="America/Los_Angeles">Pacific Time (US & Canada)</MenuItem>
                      <MenuItem value="America/Anchorage">Alaska</MenuItem>
                      <MenuItem value="Pacific/Honolulu">Hawaii</MenuItem>
                      <MenuItem value="Europe/London">London (GMT/BST)</MenuItem>
                      <MenuItem value="Europe/Paris">Paris (CET/CEST)</MenuItem>
                      <MenuItem value="Europe/Berlin">Berlin (CET/CEST)</MenuItem>
                      <MenuItem value="Europe/Rome">Rome (CET/CEST)</MenuItem>
                      <MenuItem value="Europe/Madrid">Madrid (CET/CEST)</MenuItem>
                      <MenuItem value="Europe/Moscow">Moscow (MSK)</MenuItem>
                      <MenuItem value="Asia/Dubai">Dubai (GST)</MenuItem>
                      <MenuItem value="Asia/Kolkata">India (IST)</MenuItem>
                      <MenuItem value="Asia/Bangkok">Bangkok (ICT)</MenuItem>
                      <MenuItem value="Asia/Singapore">Singapore (SGT)</MenuItem>
                      <MenuItem value="Asia/Hong_Kong">Hong Kong (HKT)</MenuItem>
                      <MenuItem value="Asia/Shanghai">China (CST)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                      <MenuItem value="Asia/Seoul">Seoul (KST)</MenuItem>
                      <MenuItem value="Australia/Sydney">Sydney (AEDT/AEST)</MenuItem>
                      <MenuItem value="Australia/Melbourne">Melbourne (AEDT/AEST)</MenuItem>
                      <MenuItem value="Australia/Brisbane">Brisbane (AEST)</MenuItem>
                      <MenuItem value="Australia/Perth">Perth (AWST)</MenuItem>
                      <MenuItem value="Pacific/Auckland">Auckland (NZDT/NZST)</MenuItem>
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
