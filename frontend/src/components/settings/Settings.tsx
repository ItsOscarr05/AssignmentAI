import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { settingsApi } from '../../services/api/settings';
import { AppSettings } from '../../types/settings';

interface SettingsProps {
  initialSettings?: AppSettings;
  onUpdate?: (settings: Partial<AppSettings>) => void;
  on2FASetup?: () => void;
  on2FADisable?: () => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  onNotificationUpdate?: (notifications: Partial<AppSettings['notifications']>) => void;
  isLoading?: boolean;
  error?: string;
  success?: string;
}

function Settings({ initialSettings, onUpdate }: SettingsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(initialSettings || null);

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
      setSettings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (section: keyof AppSettings, field: string, value: any) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      [section]: {
        ...(settings[section] as Record<string, any>),
        [field]: value,
      },
    };

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
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={e =>
                        handleSettingChange('notifications', 'email', e.target.checked)
                      }
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={e => handleSettingChange('notifications', 'push', e.target.checked)}
                    />
                  }
                  label="Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.assignments}
                      onChange={e =>
                        handleSettingChange('notifications', 'assignments', e.target.checked)
                      }
                    />
                  }
                  label="Assignment Updates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.grades}
                      onChange={e =>
                        handleSettingChange('notifications', 'grades', e.target.checked)
                      }
                    />
                  }
                  label="Grade Notifications"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={settings.appearance.theme}
                      onChange={e => handleSettingChange('appearance', 'theme', e.target.value)}
                      label="Theme"
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Font Size</InputLabel>
                    <Select
                      value={settings.appearance.fontSize}
                      onChange={e => handleSettingChange('appearance', 'fontSize', e.target.value)}
                      label="Font Size"
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Density</InputLabel>
                    <Select
                      value={settings.appearance.density}
                      onChange={e => handleSettingChange('appearance', 'density', e.target.value)}
                      label="Density"
                    >
                      <MenuItem value="comfortable">
                        Comfortable
                      </MenuItem>
                      <MenuItem value="compact">Compact</MenuItem>
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
                      onChange={e => {
                        handleSettingChange('language', '', e.target.value);
                      }}
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
                        handleSettingChange('privacy', 'profileVisibility', e.target.value)
                      }
                      label="Profile Visibility"
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                      <MenuItem value="connections">
                        Connections Only
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.activityStatus}
                        onChange={e =>
                          handleSettingChange('privacy', 'activityStatus', e.target.checked)
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
