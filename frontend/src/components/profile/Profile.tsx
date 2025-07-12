import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

interface ProfileData {
  full_name: string;
  email: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          throw new Error('New passwords do not match');
        }
      }

      await api.put('/users/profile', {
        full_name: formData.full_name,
        email: formData.email,
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      setSuccess('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in to view your profile.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Avatar
            src={user.avatar || '/default-avatar.png'}
            alt={`${user.name}'s avatar`}
            sx={{ width: 100, height: 100 }}
          />
          <Box>
            <Typography variant="h4">{user.name}</Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          {user.name}'s Profile
        </Typography>

        <div className="profile-info">
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Password"
                name="current_password"
                type="password"
                value={formData.current_password}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="New Password"
                name="new_password"
                type="password"
                value={formData.new_password}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};
