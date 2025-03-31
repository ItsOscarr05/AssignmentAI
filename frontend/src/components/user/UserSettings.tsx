import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { UserPreferences } from '../../types/user';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';

const UserSettings: React.FC = () => {
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
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/users/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load preferences',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      // TODO: Replace with actual API call
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
        message: 'Settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPreferences((prev) => ({
      ...prev!,
      theme: event.target.value as 'light' | 'dark' | 'system',
    }));
  };

  const handleNotificationChange = (key: keyof UserPreferences['notifications']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences((prev) => ({
      ...prev!,
      notifications: {
        ...prev!.notifications,
        [key]: event.target.checked,
      },
    }));
  };

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPreferences((prev) => ({
      ...prev!,
      language: event.target.value as string,
    }));
  };

  const handleTimezoneChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPreferences((prev) => ({
      ...prev!,
      timezone: event.target.value as string,
    }));
  };

  const handleAccessibilityChange = (key: keyof UserPreferences['accessibility']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences((prev) => ({
      ...prev!,
      accessibility: {
        ...prev!.accessibility,
        [key]: event.target.checked,
      },
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!preferences) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Failed to load settings</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Settings</Typography>
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
        {/* Theme Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theme
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Theme Mode</InputLabel>
              <Select
                value={preferences.theme}
                onChange={handleThemeChange}
                label="Theme Mode"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Language & Timezone */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Language & Timezone
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={preferences.language}
                onChange={handleLanguageChange}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={preferences.timezone}
                onChange={handleTimezoneChange}
                label="Timezone"
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                <MenuItem value="America/Chicago">Central Time</MenuItem>
                <MenuItem value="America/Denver">Mountain Time</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Notification Settings */}
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

        {/* Accessibility Settings */}
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
                label="Screen Reader Support"
              />
            </FormGroup>
            <Alert severity="info" sx={{ mt: 2 }}>
              These settings will help make the application more accessible for users with different needs.
            </Alert>
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

export default UserSettings; 