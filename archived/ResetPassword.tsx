import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or expired reset link');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(token, newPassword);
      toast.success('Password updated! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
        }}
      >
        <Container maxWidth="sm" sx={{ my: 'auto' }}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 6 },
              width: '100%',
              bgcolor: 'background.paper',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              color="error"
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontSize: { xs: '2rem', md: '2.4rem' },
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Invalid Reset Link
            </Typography>
            <Typography
              sx={{
                color: '#666666',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                letterSpacing: '0.01em',
                fontSize: '1.1rem',
                mb: 3,
              }}
            >
              This password reset link is invalid or has expired. Please request a new password
              reset link.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/forgot-password')}
              sx={{
                py: 1.5,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              Request New Reset Link
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
      }}
    >
      <Container maxWidth="sm" sx={{ my: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 6 },
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img
              src="/scroll_transparent.png"
              alt="Logo"
              style={{ height: 35, marginBottom: 16 }}
            />
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontSize: { xs: '2rem', md: '2.4rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Reset Password
            </Typography>
            <Typography
              sx={{
                color: '#666666',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                letterSpacing: '0.01em',
                fontSize: '1.1rem',
              }}
            >
              Enter your new password below
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: '#666666',
                        '&:hover': {
                          color: '#888888',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiInputLabel-root': {
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiInputLabel-root': {
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                },
              }}
            />

            {error && (
              <Typography
                color="error"
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword;
