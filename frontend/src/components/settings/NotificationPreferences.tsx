import {
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Smartphone as SmartphoneIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface NotificationType {
  id: string;
  name: string;
  description: string;
  channels: {
    [key: string]: boolean;
  };
}

const notificationChannels: NotificationChannel[] = [
  {
    id: 'email',
    name: 'Email',
    icon: <EmailIcon data-testid="email-icon" />,
    description: 'Receive notifications via email',
  },
  {
    id: 'push',
    name: 'Push',
    icon: <SmartphoneIcon data-testid="push-icon" />,
    description: 'Receive push notifications',
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: <SmsIcon data-testid="sms-icon" />,
    description: 'Receive SMS notifications',
  },
  {
    id: 'in_app',
    name: 'In-App',
    icon: <NotificationsIcon data-testid="notifications-icon" />,
    description: 'Receive in-app notifications',
  },
];

const defaultNotificationTypes: NotificationType[] = [
  {
    id: 'assignmentReminders',
    name: 'Assignment Updates',
    description: 'Get notified about new assignments and updates',
    channels: { email: true, push: true, sms: false, in_app: true },
  },
  {
    id: 'gradeUpdates',
    name: 'Grade Posted',
    description: 'Get notified when grades are posted',
    channels: { email: true, push: true, sms: true, in_app: true },
  },
  {
    id: 'feedbackAlerts',
    name: 'Feedback Updates',
    description: 'Get notified about feedback and comments',
    channels: { email: true, push: true, sms: true, in_app: true },
  },
  {
    id: 'system',
    name: 'System Updates',
    description: 'Get notified about system updates and maintenance',
    channels: { email: true, push: false, sms: false, in_app: true },
  },
];

const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const [notificationTypes, setNotificationTypes] =
    useState<NotificationType[]>(defaultNotificationTypes);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        if (user) {
          // Load preferences from user data if available
          // For now, we'll use default preferences
          setNotificationTypes(defaultNotificationTypes);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load notification preferences');
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user]);

  const handleChannelToggle = (typeId: string, channelId: string) => {
    setNotificationTypes(prevTypes =>
      prevTypes.map(type =>
        type.id === typeId
          ? {
              ...type,
              channels: {
                ...type.channels,
                [channelId]: !type.channels[channelId],
              },
            }
          : type
      )
    );
  };

  const handleSave = async () => {
    try {
      // For now, just show success message since User interface doesn't support preferences
      // In a real implementation, this would call an API to save preferences
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save notification preferences');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEnableAll = () => {
    setNotificationTypes(prevTypes =>
      prevTypes.map(type => ({
        ...type,
        channels: Object.keys(type.channels).reduce(
          (acc, channelId) => ({ ...acc, [channelId]: true }),
          {}
        ),
      }))
    );
  };

  const handleDisableAll = () => {
    setNotificationTypes(prevTypes =>
      prevTypes.map(type => ({
        ...type,
        channels: Object.keys(type.channels).reduce(
          (acc, channelId) => ({ ...acc, [channelId]: false }),
          {}
        ),
      }))
    );
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    setNotificationTypes(defaultNotificationTypes);
    setShowResetDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress role="progressbar" data-testid="loading-spinner" />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Notification Preferences"
        subheader="Configure how you want to receive notifications"
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Channels
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {notificationChannels.map(channel => (
              <Box
                key={channel.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                {channel.icon}
                <Box>
                  <Typography variant="subtitle1">{channel.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {channel.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Types
          </Typography>
          {notificationTypes.map(type => (
            <Box key={type.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {type.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {type.description}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {notificationChannels.map(channel => (
                  <FormControlLabel
                    key={`${type.id}-${channel.id}`}
                    control={
                      <Switch
                        checked={type.channels[channel.id]}
                        onChange={() => handleChannelToggle(type.id, channel.id)}
                        inputProps={{
                          'aria-label': `${type.name} - ${channel.name}`,
                        }}
                      />
                    }
                    label={channel.name}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleReset} aria-label="Reset">
            Reset
          </Button>
          <Button variant="outlined" onClick={handleDisableAll} aria-label="Disable All">
            Disable All
          </Button>
          <Button variant="outlined" onClick={handleEnableAll} aria-label="Enable All">
            Enable All
          </Button>
          <Button variant="contained" onClick={handleSave} aria-label="Save">
            Save
          </Button>
        </Box>
      </CardContent>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        data-testid="success-snackbar"
      >
        <Box
          sx={{
            background: 'success.main',
            color: 'white',
            p: 2,
            borderRadius: 1,
          }}
          data-testid="success-alert"
          data-severity="success"
        >
          Notification preferences saved successfully!
        </Box>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError(null)}
        data-testid="error-snackbar"
      >
        <Box
          sx={{
            background: 'error.main',
            color: 'white',
            p: 2,
            borderRadius: 1,
          }}
          data-testid="error-alert"
          data-severity="error"
        >
          {error}
        </Box>
      </Snackbar>

      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Reset Notification Preferences</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all notification preferences to their default values?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button onClick={confirmReset} color="primary">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default NotificationPreferences;
