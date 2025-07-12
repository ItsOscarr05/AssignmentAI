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
    firstName: '',
    lastName: '',
    bio: '',
  });

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleEditProfile = useCallback(() => {
    if (!profile) return;
    setEditForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio || '',
    });
    setIsEditProfileOpen(true);
  }, [profile]);

  const handleSaveProfile = useCallback(() => {
    if (!profile) return;
    updateProfile({
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      bio: editForm.bio,
    });
    setIsEditProfileOpen(false);
  }, [profile, editForm, updateProfile]);

  const handleEditPreferences = useCallback(() => {
    setIsEditPreferencesOpen(true);
  }, []);

  const handleSavePreferences = useCallback(() => {
    if (!profile) return;
    updatePreferences({
      theme: profile.preferences.theme === 'light' ? 'dark' : 'light',
      notifications: {
        email: !profile.preferences.notifications.email,
        push: !profile.preferences.notifications.push,
      },
    });
    setIsEditPreferencesOpen(false);
  }, [profile, updatePreferences]);

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
            <Typography variant="subtitle1">
              Name: {profile.firstName} {profile.lastName}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Email: {profile.email}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Bio: {profile.bio || 'No bio provided'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Theme: {profile.preferences.theme}</Typography>
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
            label="First Name"
            fullWidth
            value={editForm.firstName}
            onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            value={editForm.lastName}
            onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
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
                checked={profile.preferences.theme === 'dark'}
                onChange={() => {}}
                inputProps={{ 'aria-label': 'Dark Mode' }}
              />
            }
            label="Dark Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile.preferences.notifications.email}
                onChange={() => {}}
                inputProps={{ 'aria-label': 'Email Notifications' }}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile.preferences.notifications.push}
                onChange={() => {}}
                inputProps={{ 'aria-label': 'Push Notifications' }}
              />
            }
            label="Push Notifications"
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
