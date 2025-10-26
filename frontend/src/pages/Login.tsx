import {
  ArrowBack as ArrowBackIcon,
  Google as GoogleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import HeroParticles from '../components/HeroParticles';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto-fill email and password if remember me was previously enabled
  useEffect(() => {
    // Use a flag to ensure this only runs once
    let isMounted = true;

    const loadRememberedCredentials = () => {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const rememberedPassword = localStorage.getItem('rememberedPassword');
      const wasRememberMeEnabled = localStorage.getItem('rememberMe') === 'true';

      console.log('Remember Me Debug:', {
        rememberedEmail,
        rememberedPassword,
        wasRememberMeEnabled,
        hasEmail: !!rememberedEmail,
        hasPassword: !!rememberedPassword,
      });

      if (isMounted && wasRememberMeEnabled && rememberedEmail && rememberedPassword) {
        console.log('Auto-filling fields with:', {
          email: rememberedEmail,
          password: rememberedPassword,
        });
        setEmail(rememberedEmail);
        setPassword(rememberedPassword);
        setRememberMe(true);
      } else if (isMounted) {
        console.log('Not auto-filling because:', {
          rememberMeEnabled: wasRememberMeEnabled,
          hasEmail: !!rememberedEmail,
          hasPassword: !!rememberedPassword,
        });
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(loadRememberedCredentials, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

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
        // Pass rememberMe state to the login function
        const response = await login({
          email,
          password,
          rememberMe,
        });

        if (response.requires_2fa) {
          // Redirect to 2FA verification page
          navigate('/verify-2fa');
        } else {
          // Show success feedback before navigation
          console.log('Login successful, rememberMe:', rememberMe);
          // The login function will handle navigation to dashboard
        }
      } catch (error: any) {
        console.error('Login error:', error);
        setError(error.message || 'Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show validation error if form is invalid
      setError('Please fix the errors above before submitting.');
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

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email && password) {
      handleSubmit(e as any);
    }
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
        height: '100vh',
        display: 'flex',
        background: 'white',
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ height: { xs: 'auto', md: '100vh' } }}>
        <Grid
          container
          direction={{ xs: 'column', md: 'row' }}
          sx={{ height: { xs: 'auto', md: '100vh' }, borderRadius: 0 }}
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
              height: { xs: 'auto', md: '100vh' },
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
                justifyContent: 'center',
                height: { xs: 'auto', md: '100vh' },
                pt: { xs: 2, md: 4 },
                pb: { xs: 2, md: 2 },
              }}
            >
              <Box
                component="img"
                src="/scroll_transparent.png"
                alt="Logo"
                sx={{
                  height: { xs: 180, sm: 220, md: 320 },
                  mb: { xs: 0, md: 1 },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
                }}
              />
              <Typography
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: { xs: '2.8rem', sm: '3rem', md: '3.4rem' },
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
              justifyContent: 'center',
              background: 'white',
              position: 'relative',
              minHeight: { xs: '65vh', md: '100vh' },
            }}
          >
            <Box
              sx={{
                maxWidth: 480,
                mx: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
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
                  color: '#000000',
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                sx={{
                  color: '#666666',
                  mb: 4,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  fontSize: '1.1rem',
                }}
              >
                Sign in to continue to AssignmentAI
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiFormControl-root': {
                    mb: 2,
                  },
                }}
              >
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
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#bdbdbd',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: '#666666',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#d32f2f',
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: '#000000',
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
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#bdbdbd',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: '#666666',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#d32f2f',
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: '#000000',
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{
                            color: '#666666',
                            '&:hover': {
                              color: '#888888',
                            },
                          }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Remember Me Checkbox and Forgot Password Link */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        size="small"
                        sx={{
                          color: '#666666',
                          '&.Mui-checked': {
                            color: '#ff1a1a',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666666',
                          fontSize: '0.875rem',
                          letterSpacing: '0.01em',
                        }}
                      >
                        Remember Me
                      </Typography>
                    }
                  />

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
                    Forgot Password?
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
                  disabled={isLoading || !email || !password}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    fontSize: '0.9375rem',
                    backgroundColor: '#d32f2f',
                    '&:hover': {
                      backgroundColor: '#b71c1c',
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#666666',
                    },
                  }}
                  aria-label={isLoading ? 'Signing in...' : 'Sign In'}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" role="progressbar" />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    Or continue with
                  </Typography>
                </Divider>

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
                    mb: 3,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                  }}
                >
                  Google
                </Button>

                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    mt: 3,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    color: '#000000',
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
