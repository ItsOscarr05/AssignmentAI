import CheckCircle from '@mui/icons-material/CheckCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { errorShake, fadeIn, scaleIn, successCheck } from '../../styles/animations';
import { responsiveStyles } from '../../styles/breakpoints';

const LoginFormContent: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const REMEMBER_ME_KEY = 'assignmentai_remembered_email';

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(email && !emailRegex.test(email) ? 'Please enter a valid email address' : null);
    setPasswordError(
      password && password.length < 8 ? 'Password must be at least 8 characters' : null
    );
    setIsFormValid(emailRegex.test(email) && password.length >= 8 && !loading && !success);
  }, [email, password, loading, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      setSuccess(true);
      toast.success('Login successful! Redirecting to dashboard...');

      const loginPage = document.querySelector('.login-page');
      if (loginPage) {
        loginPage.classList.add('slide-out-left');
      }

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials and try again.');
      const form = document.querySelector('form');
      if (form) {
        form.style.animation = 'none';
        form.offsetHeight;
        form.style.animation = `${errorShake} 0.5s ease-out`;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      component="section"
      elevation={3}
      sx={{
        p: responsiveStyles.container.padding,
        width: '100%',
        maxWidth: { xs: '100%', sm: 480 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        animation: `${scaleIn} 0.5s ease-out`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #ff1a1a, #ff4d4d)',
        },
      }}
    >
      <Typography
        variant="h2"
        component="h2"
        sx={{
          fontWeight: 'bold',
          color: '#ff1a1a',
          mb: 1,
          fontSize: responsiveStyles.typography.h2.fontSize,
          textAlign: 'center',
          animation: `${fadeIn} 0.5s ease-out 0.2s both`,
        }}
      >
        Welcome Back
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mb: 3,
          textAlign: 'center',
          fontSize: responsiveStyles.typography.body1.fontSize,
          animation: `${fadeIn} 0.5s ease-out 0.4s both`,
        }}
      >
        Sign in to continue to your account
      </Typography>

      {error && (
        <Box
          role="alert"
          aria-live="assertive"
          sx={{
            mb: 2,
            p: 1,
            bgcolor: 'error.light',
            borderRadius: 1,
            width: '100%',
            textAlign: 'center',
            animation: `${errorShake} 0.5s ease-out`,
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {success && (
        <Box
          role="alert"
          aria-live="polite"
          sx={{
            mb: 2,
            p: 1,
            bgcolor: 'success.light',
            borderRadius: 1,
            width: '100%',
            textAlign: 'center',
            animation: `${successCheck} 0.5s ease-out`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <CheckCircle color="success" />
          <Typography color="success.main">Login successful! Redirecting...</Typography>
        </Box>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
        }}
        role="form"
        aria-label="Login form"
      >
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          fullWidth
          error={!!emailError}
          helperText={emailError}
          inputProps={{
            'aria-label': 'Email address',
            'aria-required': 'true',
          }}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          fullWidth
          error={!!passwordError}
          helperText={passwordError}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          inputProps={{
            'aria-label': 'Password',
            'aria-required': 'true',
          }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || authLoading}
          aria-label="Submit login form"
        >
          {loading || authLoading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
        <Typography variant="body2" align="center">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register" aria-label="Navigate to registration page">
            Sign up
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default LoginFormContent;
