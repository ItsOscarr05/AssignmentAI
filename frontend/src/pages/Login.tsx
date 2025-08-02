import {
  ArrowBack as ArrowBackIcon,
  GitHub as GitHubIcon,
  Google as GoogleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import HeroParticles from '../components/HeroParticles';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, mockLogin } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateForm = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    return isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      setError('');

      try {
        const response = await login({ email, password });

        if (response.requires_2fa) {
          // Redirect to 2FA verification page
          navigate('/verify-2fa');
        }
        // If no 2FA required, the login function will handle navigation to dashboard
      } catch (error: any) {
        setError(error.message || 'Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) {
      validatePassword(e.target.value);
    }
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  const handleGoBack = () => {
    // Try to go back, but if there's no history, go to landing page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'white',
        overflow: 'auto',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          height: 'auto',
        }}
      >
        <Grid
          container
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            minHeight: '100vh',
            borderRadius: 0,
          }}
        >
          {/* Left side - Branding */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              background: 'radial-gradient(circle at center, #FF5252 0%,rgb(84, 8, 8) 100%)',
              p: { xs: 3, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              position: 'relative',
              minHeight: { xs: '35vh', md: '100vh' },
            }}
          >
            <HeroParticles />
            <Box
              sx={{
                position: 'relative',
                textAlign: 'center',
                zIndex: 2,
                width: '100%',
                maxWidth: 480,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minHeight: { xs: 'auto', md: '100vh' },
                pt: { xs: 2, md: 4 },
                pb: { xs: 2, md: 2 },
              }}
            >
              <Box
                component="img"
                src="/scroll_transparent.png"
                alt="Logo"
                sx={{
                  height: { xs: 220, sm: 260, md: 360 },
                  mb: { xs: -1, md: -2.5 },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: { xs: '2.5rem', sm: '2.8rem', md: '3.5rem' },
                  letterSpacing: '0em',
                  mb: 1,
                }}
              >
                AssignmentAI
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  mb: 1.5,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.02em',
                  fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.3rem' },
                }}
              >
                Transform your assignments with AI-powered insights
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.8,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  lineHeight: 1.4,
                  fontSize: { xs: '1.2rem', sm: '1.25rem', md: '1.1rem' },
                }}
              >
                Get personalized feedback, improve your writing, and ace your assignments with our
                intelligent AI assistant.
              </Typography>
            </Box>
            <HeroParticles />
          </Grid>

          {/* Right side - Login Form */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              p: { xs: 4, md: 6 },
              height: { xs: 'auto', md: '100vh' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              background: 'white',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                maxWidth: 480,
                mx: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: 'auto',
                pt: { xs: 1, md: 2 },
              }}
            >
              {/* Back Button - Far right */}
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: { xs: -10, md: -10 },
                  color: '#D32F2F',
                  backgroundColor: 'white',
                  border: '2px solid #D32F2F',
                  borderRadius: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  fontSize: '1rem',
                  py: 1,
                  px: 2,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    border: '2px solid #B71C1C',
                    color: '#B71C1C',
                  },
                }}
              >
                Back
              </Button>

              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: { xs: '2rem', md: '2.4rem' },
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 4,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  fontSize: '1.1rem',
                }}
              >
                Sign in to continue to AssignmentAI
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={!!emailError}
                  helperText={emailError}
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
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={!!passwordError}
                  helperText={passwordError}
                  inputProps={{ 'data-testid': 'password-input' }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ mt: 1, textAlign: 'right' }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      letterSpacing: '0.01em',
                    }}
                    color="primary"
                    underline="hover"
                  >
                    Forgot password?
                  </Link>
                </Box>

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
                  disabled={isLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    fontSize: '0.9375rem',
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" role="progressbar" />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={mockLogin}
                  sx={{ mt: 2 }}
                >
                  Demo Login
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    Or continue with
                  </Typography>
                </Divider>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    onClick={async () => {
                      try {
                        const authService = (
                          await import('../services/authManager')
                        ).AuthManager.getInstance();
                        const response = await authService.getOAuthUrl('google');
                        if (response && response.url) {
                          window.location.href = response.url;
                        } else {
                          console.error('Invalid OAuth response:', response);
                        }
                      } catch (error) {
                        console.error('Google OAuth error:', error);
                        setError('Google OAuth error occurred');
                      }
                    }}
                    sx={{
                      py: 1.5,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Google
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GitHubIcon />}
                    onClick={async () => {
                      try {
                        const authService = (
                          await import('../services/authManager')
                        ).AuthManager.getInstance();
                        const response = await authService.getOAuthUrl('github');
                        if (response && response.url) {
                          window.location.href = response.url;
                        } else {
                          console.error('Invalid OAuth response:', response);
                        }
                      } catch (error) {
                        console.error('GitHub OAuth error:', error);
                        setError('GitHub OAuth error occurred');
                      }
                    }}
                    sx={{
                      py: 1.5,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                    }}
                  >
                    GitHub
                  </Button>
                </Stack>

                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    mt: 3,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    color="primary"
                    underline="hover"
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;
