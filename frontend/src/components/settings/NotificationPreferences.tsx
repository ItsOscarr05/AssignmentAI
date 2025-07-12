import {
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  PushPin as PushPinIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';
import React from 'react';

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
    name: 'Email Notifications',
    icon: <EmailIcon />,
    description: 'Receive notifications via email',
  },
  {
    id: 'push',
    name: 'Push Notifications',
    icon: <PushPinIcon />,
    description: 'Receive push notifications in the browser',
  },
  {
    id: 'sms',
    name: 'SMS Notifications',
    icon: <SmsIcon />,
    description: 'Receive notifications via SMS',
  },
  {
    id: 'in_app',
    name: 'In-App Notifications',
    icon: <NotificationsIcon />,
    description: 'Receive notifications within the application',
  },
];

const defaultNotificationTypes: NotificationType[] = [
  {
    id: 'assignment_updates',
    name: 'Assignment Updates',
    description: 'Notifications for upcoming assignment deadlines',
    channels: {
      email: true,
      push: true,
      sms: true,
      in_app: true,
    },
  },
  {
    id: 'feedback_updates',
    name: 'Feedback Updates',
    description: 'Notifications when you receive feedback on your submissions',
    channels: {
      email: true,
      push: true,
      sms: true,
      in_app: true,
    },
  },
  {
    id: 'grade_posted',
    name: 'Grade Posted',
    description: 'Notifications when grades are posted for your submissions',
    channels: {
      email: true,
      push: true,
      sms: true,
      in_app: true,
    },
  },
  {
    id: 'comment_mention',
    name: 'Comment Mentions',
    description: 'Notifications when someone mentions you in a comment',
    channels: {
      email: true,
      push: true,
      sms: true,
      in_app: true,
    },
  },
  {
    id: 'system_updates',
    name: 'System Updates',
    description: 'Notifications about system updates and maintenance',
    channels: {
      email: true,
      push: false,
      sms: false,
      in_app: true,
    },
  },
];

const NotificationPreferences: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [notificationTypes, setNotificationTypes] =
    React.useState<NotificationType[]>(defaultNotificationTypes);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        // TODO: Implement proper API call to load notification preferences
        // For now, just set loading to false
        setLoading(false);
      } catch (err) {
        setError('Failed to load notification preferences');
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

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
      // TODO: Implement API call to save notification preferences
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

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success">Preferences saved successfully</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Reset Preferences</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all notification preferences to their default values?
          </Typography>
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
