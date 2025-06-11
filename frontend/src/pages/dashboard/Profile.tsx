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
    phone: '',
    institution: '',
  });

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleEditProfile = useCallback(() => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      phone: profile.phone || '',
      institution: profile.institution,
    });
    setIsEditProfileOpen(true);
  }, [profile]);

  const handleSaveProfile = useCallback(() => {
    if (!profile) return;
    updateProfile({
      name: editForm.name,
      phone: editForm.phone,
      institution: editForm.institution,
    });
    setIsEditProfileOpen(false);
  }, [profile, editForm, updateProfile]);

  const handleEditPreferences = useCallback(() => {
    setIsEditPreferencesOpen(true);
  }, []);

  const handleSavePreferences = useCallback(() => {
    if (!profile) return;
    updatePreferences({
      darkMode: !profile.preferences.darkMode,
      notifications: !profile.preferences.notifications,
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
            <Typography variant="subtitle1">Name: {profile.name}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Email: {profile.email}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Institution: {profile.institution}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Verification Status: {profile.isVerified ? 'Verified' : 'Not Verified'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Typography variant="body1">
              Total Assignments: {profile.statistics.totalAssignments}
            </Typography>
            <Typography variant="body1">
              Completed: {profile.statistics.completedAssignments}
            </Typography>
            <Typography variant="body1">
              Average Score: {profile.statistics.averageScore}%
            </Typography>
            <Typography variant="body1">Active Days: {profile.statistics.activeDays}</Typography>
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
            label="Phone"
            fullWidth
            value={editForm.phone}
            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Institution"
            fullWidth
            value={editForm.institution}
            onChange={e => setEditForm({ ...editForm, institution: e.target.value })}
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
                checked={profile.preferences.darkMode}
                onChange={() => {}}
                inputProps={{ 'aria-label': 'Dark Mode' }}
              />
            }
            label="Dark Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profile.preferences.notifications}
                onChange={() => {}}
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
