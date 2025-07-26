import {
  Computer as ComputerIcon,
  Delete as DeleteIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/auth/AuthService';

interface Session {
  id: string;
  device_info: {
    browser?: string;
    os?: string;
    device?: string;
    ip_address?: string;
  };
  created_at: string;
  last_accessed: string;
  expires_at: string;
  is_current: boolean;
}

interface SessionAnalytics {
  user_id: number;
  total_sessions: number;
  active_sessions: number;
  session_analytics: any[];
  summary: {
    total_duration: number;
    average_session_duration: number;
    most_active_device: string;
  };
}

const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const [sessionsData, analyticsData] = await Promise.all([
        AuthService.getSessions(),
        AuthService.getSessionAnalytics(),
      ]);
      setSessions(sessionsData.sessions);
      setAnalytics(analyticsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSession(sessionId);
      await AuthService.revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error: any) {
      setError(error.message || 'Failed to revoke session');
    } finally {
      setRevokingSession(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await AuthService.logoutAll();
      setShowLogoutAllDialog(false);
      // Redirect to login will be handled by AuthContext
    } catch (error: any) {
      setError(error.message || 'Failed to logout from all devices');
    }
  };

  const getDeviceIcon = (deviceInfo: any) => {
    const device = deviceInfo.device?.toLowerCase() || '';
    const userAgent = deviceInfo.browser?.toLowerCase() || '';

    if (device.includes('mobile') || userAgent.includes('mobile')) {
      return <SmartphoneIcon />;
    } else if (device.includes('tablet') || userAgent.includes('tablet')) {
      return <TabletIcon />;
    } else {
      return <ComputerIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceLabel = (deviceInfo: any) => {
    const browser = deviceInfo.browser || 'Unknown Browser';
    const os = deviceInfo.os || 'Unknown OS';
    return `${browser} on ${os}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Active Sessions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {analytics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h6" color="primary">
                  {analytics.active_sessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Sessions
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h6" color="primary">
                  {Math.round(analytics.summary.average_session_duration / 60)}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Session Duration
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="h6" color="primary">
                  {analytics.summary.most_active_device}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Most Active Device
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Device Sessions ({sessions.length})</Typography>
        <Button variant="outlined" color="error" onClick={() => setShowLogoutAllDialog(true)}>
          Logout All Devices
        </Button>
      </Box>

      <Card>
        <List>
          {sessions.map((session, index) => (
            <React.Fragment key={session.id}>
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getDeviceIcon(session.device_info)}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceLabel(session.device_info)}
                      {session.is_current && <Chip label="Current" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        IP: {session.device_info.ip_address || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDate(session.created_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Active: {formatDate(session.last_accessed)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  {!session.is_current && (
                    <IconButton
                      edge="end"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingSession === session.id}
                      color="error"
                    >
                      {revokingSession === session.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              {index < sessions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Card>

      {/* Logout All Dialog */}
      <Dialog open={showLogoutAllDialog} onClose={() => setShowLogoutAllDialog(false)}>
        <DialogTitle>Logout from All Devices</DialogTitle>
        <DialogContent>
          <Typography>
            This will log you out from all devices except this one. You'll need to log in again on
            other devices.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutAllDialog(false)}>Cancel</Button>
          <Button onClick={handleLogoutAll} color="error" variant="contained">
            Logout All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManager;
