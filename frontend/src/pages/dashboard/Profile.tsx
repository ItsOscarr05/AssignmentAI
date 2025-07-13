import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfileStore } from '../../services/ProfileService';

const Profile: React.FC = () => {
  const { logout } = useAuth();
  const { profile, isLoading, error, updateProfile, updatePreferences } = useProfileStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditPreferencesOpen, setIsEditPreferencesOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    institution: '',
    phone: '',
    bio: '',
  });
  const [preferencesForm, setPreferencesForm] = useState({
    darkMode: false,
    notifications: false,
  });

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleEditProfile = useCallback(() => {
    if (!profile) return;
    setEditForm({
      name: (profile as any).name || '',
      institution: (profile as any).institution || '',
      phone: (profile as any).phone || '',
      bio: profile.bio || '',
    });
    setIsEditProfileOpen(true);
  }, [profile]);

  const handleSaveProfile = useCallback(() => {
    if (!profile) return;
    updateProfile({
      name: editForm.name,
      institution: editForm.institution,
      phone: editForm.phone,
    } as any);
    setIsEditProfileOpen(false);
  }, [profile, editForm, updateProfile]);

  const handleEditPreferences = useCallback(() => {
    if (!profile) return;
    setPreferencesForm({
      darkMode: (profile.preferences as any).darkMode ?? profile.preferences.theme === 'dark',
      notifications:
        typeof profile.preferences.notifications === 'boolean'
          ? profile.preferences.notifications
          : false,
    });
    setIsEditPreferencesOpen(true);
  }, [profile]);

  const handleSavePreferences = useCallback(() => {
    if (!profile) return;
    updatePreferences({
      darkMode: !preferencesForm.darkMode,
      notifications: !preferencesForm.notifications,
    } as any);
    setIsEditPreferencesOpen(false);
  }, [profile, preferencesForm, updatePreferences]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
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

  if (!profile) {
    return (
      <Box p={3}>
        <Typography color="error">Profile not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Profile
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Name: {(profile as any).name ?? ''}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Email: {profile.email}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Institution: {(profile as any).institution ?? ''}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Bio: {profile.bio || 'No bio provided'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Theme:{' '}
              {(profile.preferences as any).darkMode !== undefined
                ? (profile.preferences as any).darkMode
                  ? 'dark'
                  : 'light'
                : profile.preferences.theme === 'dark'
                ? 'dark'
                : 'light'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Verification Status: {(profile as any).isVerified ? 'Verified' : 'Unverified'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Total Assignments: {(profile as any).statistics?.totalAssignments ?? 0}
            </Typography>
            <Typography variant="subtitle1">
              Completed: {(profile as any).statistics?.completedAssignments ?? 0}
            </Typography>
            <Typography variant="subtitle1">
              Average Score: {(profile as any).statistics?.averageScore ?? 0}%
            </Typography>
            <Typography variant="subtitle1">
              Active Days: {(profile as any).statistics?.activeDays ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleEditProfile}>
              Edit Profile
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEditPreferences}
              sx={{ ml: 2 }}
            >
              Edit Preferences
            </Button>
            <Button variant="contained" color="primary" onClick={handleLogout} sx={{ ml: 2 }}>
              Logout
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Dialog open={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Institution"
            fullWidth
            value={editForm.institution}
            onChange={e => setEditForm({ ...editForm, institution: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={editForm.phone}
            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Bio"
            fullWidth
            multiline
            rows={3}
            value={editForm.bio}
            onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isEditPreferencesOpen} onClose={() => setIsEditPreferencesOpen(false)}>
        <DialogTitle>Edit Preferences</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={preferencesForm.darkMode}
                onChange={e =>
                  setPreferencesForm({ ...preferencesForm, darkMode: e.target.checked })
                }
                inputProps={{ 'aria-label': 'Dark Mode' }}
              />
            }
            label="Dark Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferencesForm.notifications}
                onChange={e =>
                  setPreferencesForm({ ...preferencesForm, notifications: e.target.checked })
                }
                inputProps={{ 'aria-label': 'Notifications' }}
              />
            }
            label="Notifications"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditPreferencesOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreferences}>Save Preferences</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
