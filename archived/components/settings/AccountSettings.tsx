import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { users } from '../../services/api';

export const AccountSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    deleteConfirmation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await users.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess('Password changed successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (formData.deleteConfirmation !== 'DELETE') {
      setError("Please type 'DELETE' to confirm account deletion");
      return;
    }

    if (
      !window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await users.deleteAccount();
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Account Settings
      </Typography>

      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Change Password
        </Typography>
        <form onSubmit={handlePasswordChange}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" gutterBottom color="error">
          Delete Account
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Once you delete your account, there is no going back. Please be certain.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Type 'DELETE' to confirm"
              name="deleteConfirmation"
              value={formData.deleteConfirmation}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAccount}
              disabled={loading || formData.deleteConfirmation !== 'DELETE'}
            >
              Delete Account
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};
