import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface UserSettingsData {
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

const UserSettings: React.FC = () => {
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettingsData>({
    theme: currentTheme,
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  });

  const handleThemeChange = (event: SelectChangeEvent<'light' | 'dark'>) => {
    const newTheme = event.target.value as 'light' | 'dark';
    setSettings(prev => ({
      ...prev,
      theme: newTheme,
    }));
    toggleTheme();
  };

  const handleNotificationChange = (type: keyof UserSettingsData['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          User Settings
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="theme-select-label">Theme</InputLabel>
          <Select
            labelId="theme-select-label"
            id="theme-select"
            value={settings.theme}
            label="Theme"
            onChange={handleThemeChange}
            data-testid="theme-select"
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Notifications
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={settings.notifications.email}
              onChange={() => handleNotificationChange('email')}
              inputProps={{
                'aria-label': 'Email Notifications',
                role: 'switch',
              }}
            />
          }
          label="Email Notifications"
          data-testid="email-notification-label"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.notifications.push}
              onChange={() => handleNotificationChange('push')}
              inputProps={{
                'aria-label': 'Push Notifications',
                role: 'switch',
              }}
            />
          }
          label="Push Notifications"
          data-testid="push-notification-label"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.notifications.sms}
              onChange={() => handleNotificationChange('sms')}
              inputProps={{
                'aria-label': 'SMS Notifications',
                role: 'switch',
              }}
            />
          }
          label="SMS Notifications"
          data-testid="sms-notification-label"
        />
      </CardContent>
    </Card>
  );
};

export default UserSettings;
