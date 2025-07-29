import { Save as SaveIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { UserPreferences } from '../../types/user';
import LoadingSpinner from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';

const UserPreferencesComponent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    console.log('Component mounted, fetching preferences...');
    fetchPreferences();
  }, []);

  useEffect(() => {
    console.log('Preferences state updated:', preferences);
  }, [preferences]);

  useEffect(() => {
    console.log('Loading state updated:', loading);
  }, [loading]);

  const fetchPreferences = async () => {
    try {
      console.log('Fetching preferences...');
      setLoading(true);
      console.log('Loading state set to true');

      const response = await fetch('/api/users/preferences');
      console.log('Fetch response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        console.error('Failed to fetch preferences:', response.status);
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      console.log('Fetched preferences:', data);

      if (!data || typeof data !== 'object') {
        console.error('Invalid preferences data received:', data);
        throw new Error('Invalid preferences data received');
      }

      // Validate required fields
      const requiredFields = ['theme', 'language', 'timezone', 'notifications', 'accessibility'];
      const missingFields = requiredFields.filter(field => !(field in data));

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error('Missing required fields in preferences data');
      }

      console.log('Setting preferences state...');
      setPreferences(data);
      console.log('Preferences state updated');
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
      setToast({
        open: true,
        message: 'Failed to load preferences',
        severity: 'error',
      });
      console.log('Error toast set');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      console.log('Loading state updated');
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setToast({
        open: true,
        message: 'Preferences saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to save preferences',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (event: SelectChangeEvent) => {
    setPreferences(prev => ({
      ...prev!,
      theme: event.target.value as 'light' | 'dark' | 'system',
    }));
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setPreferences(prev => ({
      ...prev!,
      language: event.target.value as string,
    }));
  };

  const handleTimezoneChange = (event: SelectChangeEvent) => {
    setPreferences(prev => ({
      ...prev!,
      timezone: event.target.value as string,
    }));
  };

  const handleNotificationChange =
    (key: keyof UserPreferences['notifications']) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPreferences(prev => ({
        ...prev!,
        notifications: {
          ...prev!.notifications,
          [key]: event.target.checked,
        },
      }));
    };

  const handleAccessibilityChange =
    (key: keyof UserPreferences['accessibility']) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPreferences(prev => ({
        ...prev!,
        accessibility: {
          ...prev!.accessibility,
          [key]: event.target.checked,
        },
      }));
    };

  if (loading) {
    console.log('Rendering loading state');
    return <LoadingSpinner />;
  }

  if (!preferences) {
    console.log('Rendering error state - no preferences');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Failed to load preferences</Typography>
      </Box>
    );
  }

  console.log('Rendering preferences form with data:', preferences);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Application Preferences</Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Theme and Language */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Theme</InputLabel>
              <Select value={preferences.theme} onChange={handleThemeChange} label="Theme">
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select value={preferences.language} onChange={handleLanguageChange} label="Language">
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <TimezoneSelector
                value={preferences.timezone}
                onChange={(timezone) => {
                  setPreferences(prev => ({
                    ...prev!,
                    timezone: timezone,
                  }));
                }}
                label="Timezone"
                showExtended={false}
                fullWidth={true}
                size="medium"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.email}
                    onChange={handleNotificationChange('email')}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.push}
                    onChange={handleNotificationChange('push')}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.assignmentReminders}
                    onChange={handleNotificationChange('assignmentReminders')}
                  />
                }
                label="Assignment Reminders"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.gradeUpdates}
                    onChange={handleNotificationChange('gradeUpdates')}
                  />
                }
                label="Grade Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.feedbackAlerts}
                    onChange={handleNotificationChange('feedbackAlerts')}
                  />
                }
                label="Feedback Alerts"
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Accessibility */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Accessibility
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.accessibility.highContrast}
                    onChange={handleAccessibilityChange('highContrast')}
                  />
                }
                label="High Contrast Mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.accessibility.largeText}
                    onChange={handleAccessibilityChange('largeText')}
                  />
                }
                label="Large Text"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.accessibility.screenReader}
                    onChange={handleAccessibilityChange('screenReader')}
                  />
                }
                label="Screen Reader Mode"
              />
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default UserPreferencesComponent;
