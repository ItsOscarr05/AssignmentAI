import {
  Box,
  Card,
  CardContent,
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
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
                {t('settings.notifications.title')}
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
                  label={t('settings.notifications.email')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={e => handleSettingChange('notifications', 'push', e.target.checked)}
                    />
                  }
                  label={t('settings.notifications.push')}
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
                  label={t('settings.notifications.assignments')}
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
                  label={t('settings.notifications.grades')}
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
                {t('settings.appearance.title')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.appearance.theme')}</InputLabel>
                    <Select
                      value={settings.appearance.theme}
                      onChange={e => handleSettingChange('appearance', 'theme', e.target.value)}
                      label={t('settings.appearance.theme')}
                    >
                      <MenuItem value="light">{t('settings.appearance.themeLight')}</MenuItem>
                      <MenuItem value="dark">{t('settings.appearance.themeDark')}</MenuItem>
                      <MenuItem value="system">{t('settings.appearance.themeSystem')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.appearance.fontSize')}</InputLabel>
                    <Select
                      value={settings.appearance.fontSize}
                      onChange={e => handleSettingChange('appearance', 'fontSize', e.target.value)}
                      label={t('settings.appearance.fontSize')}
                    >
                      <MenuItem value="small">{t('settings.appearance.fontSizeSmall')}</MenuItem>
                      <MenuItem value="medium">{t('settings.appearance.fontSizeMedium')}</MenuItem>
                      <MenuItem value="large">{t('settings.appearance.fontSizeLarge')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.appearance.density')}</InputLabel>
                    <Select
                      value={settings.appearance.density}
                      onChange={e => handleSettingChange('appearance', 'density', e.target.value)}
                      label={t('settings.appearance.density')}
                    >
                      <MenuItem value="comfortable">
                        {t('settings.appearance.densityComfortable')}
                      </MenuItem>
                      <MenuItem value="compact">{t('settings.appearance.densityCompact')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Language and Timezone */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.language.title')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.language.language')}</InputLabel>
                    <Select
                      value={settings.language}
                      onChange={e => {
                        handleSettingChange('language', '', e.target.value);
                        i18n.changeLanguage(e.target.value);
                      }}
                      label={t('settings.language.language')}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TimezoneSelector
                    value={settings.timezone}
                    onChange={timezone => handleSettingChange('timezone', '', timezone)}
                    label={t('settings.language.timezone')}
                    showExtended={false}
                    fullWidth={true}
                    size="medium"
                  />
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
                {t('settings.privacy.title')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('settings.privacy.profileVisibility')}</InputLabel>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onChange={e =>
                        handleSettingChange('privacy', 'profileVisibility', e.target.value)
                      }
                      label={t('settings.privacy.profileVisibility')}
                    >
                      <MenuItem value="public">{t('settings.privacy.visibilityPublic')}</MenuItem>
                      <MenuItem value="private">{t('settings.privacy.visibilityPrivate')}</MenuItem>
                      <MenuItem value="connections">
                        {t('settings.privacy.visibilityConnections')}
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
                    label={t('settings.privacy.activityStatus')}
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
