import {
  Accessibility as AccessibilityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { preferenceService } from '../../services/preference';
import { Preference, PreferenceUpdate } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preferences-tabpanel-${index}`}
      aria-labelledby={`preferences-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const Preferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await preferenceService.getPreferences();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreferenceChange = async (update: PreferenceUpdate) => {
    if (!preferences) return;

    try {
      const updated = await preferenceService.updatePreferences(update);
      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  const handleReset = async () => {
    try {
      const reset = await preferenceService.resetPreferences();
      setPreferences(reset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset preferences');
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Please log in to view your preferences</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!preferences) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load preferences</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="preferences tabs">
            <Tab icon={<SettingsIcon />} label="UI" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<VisibilityIcon />} label="Privacy" />
            <Tab icon={<AccessibilityIcon />} label="Accessibility" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
            {error}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={preferences.theme}
                  label="Theme"
                  onChange={e =>
                    handlePreferenceChange({ theme: e.target.value as Preference['theme'] })
                  }
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={preferences.language}
                  label="Language"
                  onChange={e => handlePreferenceChange({ language: e.target.value })}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Font Size</InputLabel>
                <Select
                  value={preferences.font_size}
                  label="Font Size"
                  onChange={e =>
                    handlePreferenceChange({ font_size: e.target.value as Preference['font_size'] })
                  }
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.compact_mode}
                    onChange={e => handlePreferenceChange({ compact_mode: e.target.checked })}
                  />
                }
                label="Compact Mode"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.email_notifications}
                    onChange={e =>
                      handlePreferenceChange({ email_notifications: e.target.checked })
                    }
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.push_notifications}
                    onChange={e => handlePreferenceChange({ push_notifications: e.target.checked })}
                  />
                }
                label="Push Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Notification Types
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(preferences.notification_types).map(([type, enabled]) => (
                  <Grid item xs={12} sm={6} key={type}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enabled}
                          onChange={e =>
                            handlePreferenceChange({
                              notification_types: {
                                ...preferences.notification_types,
                                [type]: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label={type
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.show_profile}
                    onChange={e => handlePreferenceChange({ show_profile: e.target.checked })}
                  />
                }
                label="Show Profile"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.show_progress}
                    onChange={e => handlePreferenceChange({ show_progress: e.target.checked })}
                  />
                }
                label="Show Progress"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.show_activity}
                    onChange={e => handlePreferenceChange({ show_activity: e.target.checked })}
                  />
                }
                label="Show Activity"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.high_contrast}
                    onChange={e => handlePreferenceChange({ high_contrast: e.target.checked })}
                  />
                }
                label="High Contrast"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.reduced_motion}
                    onChange={e => handlePreferenceChange({ reduced_motion: e.target.checked })}
                  />
                }
                label="Reduced Motion"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.screen_reader}
                    onChange={e => handlePreferenceChange({ screen_reader: e.target.checked })}
                  />
                }
                label="Screen Reader Mode"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="secondary" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
