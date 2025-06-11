import { Delete, DeleteForever } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActiveSessionsProps {
  sessions: Session[];
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onRevokeAllSessions?: () => Promise<void>;
}

const ActiveSessions: React.FC<ActiveSessionsProps> = ({
  sessions,
  onRevokeSession,
  onRevokeAllSessions,
}) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isRevokeAllDialogOpen, setIsRevokeAllDialogOpen] = useState(false);

  const handleRevokeSession = async (session: Session) => {
    setSelectedSession(session);
  };

  const handleConfirmRevoke = async () => {
    if (selectedSession && onRevokeSession) {
      await onRevokeSession(selectedSession.id);
      setSelectedSession(null);
    }
  };

  const handleRevokeAll = async () => {
    if (onRevokeAllSessions) {
      await onRevokeAllSessions();
      setIsRevokeAllDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Active Sessions</Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForever />}
            onClick={() => setIsRevokeAllDialogOpen(true)}
          >
            Revoke All
          </Button>
        </Box>

        <List>
          {sessions.map(session => (
            <ListItem
              key={session.id}
              secondaryAction={
                !session.isCurrent && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleRevokeSession(session)}
                  >
                    Revoke
                  </Button>
                )
              }
            >
              <ListItemText
                primary={session.deviceName}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {session.ipAddress} • {session.location}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.secondary">
                      Last active: {formatDate(session.lastActive)}
                      {session.isCurrent && ' • Current Session'}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Revoke Session Dialog */}
        <Dialog open={!!selectedSession} onClose={() => setSelectedSession(null)}>
          <DialogTitle>Revoke Session</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to revoke the session from {selectedSession?.deviceName}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedSession(null)}>Cancel</Button>
            <Button onClick={handleConfirmRevoke} color="error">
              Revoke
            </Button>
          </DialogActions>
        </Dialog>

        {/* Revoke All Sessions Dialog */}
        <Dialog open={isRevokeAllDialogOpen} onClose={() => setIsRevokeAllDialogOpen(false)}>
          <DialogTitle>Revoke All Sessions</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to revoke all sessions except your current one? You will need to
              log in again on other devices.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsRevokeAllDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRevokeAll} color="error">
              Revoke All
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ActiveSessions;
