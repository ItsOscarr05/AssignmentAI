import { Google as GoogleIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import TermsPrivacyModal from '../components/auth/TermsPrivacyModal';
import HeroParticles from '../components/layout/HeroParticles';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Get success message from navigation state (e.g., after account deletion)
  const successMessage = location.state?.message;

  // Password validation requirements
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setPasswordError('At least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('At least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('At least one lowercase letter');
      return false;
    }
    if (!/\d/.test(password)) {
      setPasswordError('At least one number');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError('At least one special character');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword && formData.password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError(''); // Clear previous email error
    return true;
  };

  // Ensure registration starts with a clean slate - no plan information
  useEffect(() => {
    // Only clear plan storage if user is not already logged in (first-time registration)
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Clear any potential plan-related storage when registration page loads for new users
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('planSelection');
      localStorage.removeItem('pricingPlan');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('planSelection');
      sessionStorage.removeItem('pricingPlan');

      // Clear any URL parameters that might contain plan info
      const url = new URL(window.location.href);
      url.searchParams.delete('plan');
      url.searchParams.delete('planId');
      url.searchParams.delete('planName');
      window.history.replaceState({}, '', url.toString());

      console.log('Registration page loaded for new user - cleared any plan-related storage');
    }
  }, []);

  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    }
  }, [location, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Validate password when it changes
    if (name === 'password') {
      validatePassword(value);
      // Also validate confirm password if it has a value
      if (formData.confirmPassword) {
        validateConfirmPassword(formData.confirmPassword);
      }
    }

    // Validate confirm password when it changes
    if (name === 'confirmPassword') {
      validateConfirmPassword(value);
    }
  };

  const handlePasswordBlur = () => {
    validatePassword(formData.password);
  };

  const handleConfirmPasswordBlur = () => {
    validateConfirmPassword(formData.confirmPassword);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.password &&
      formData.confirmPassword
    ) {
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isFirstNameValid = formData.firstName.trim().length > 0;
    const isLastNameValid = formData.lastName.trim().length > 0;
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);

    if (
      isFirstNameValid &&
      isLastNameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    ) {
      setIsLoading(true);
      setError('');
      setSuccess('');

      try {
        await register({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirm_password: formData.confirmPassword,
        });

        setSuccess('Registration successful!');

        // Show terms and privacy modal instead of auto-redirect
        setShowTermsModal(true);
      } catch (error: any) {
        console.error('Registration error:', error);
        setError(error.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show validation error if form is invalid
      setError('Please fix the errors above before submitting.');
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

  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    navigate('/login');
  };

  const handleDeclineTerms = () => {
    setShowTermsModal(false);
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
        overflow: { xs: 'auto', md: 'hidden' },
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ height: { xs: 'auto', md: '100%' } }}>
        <Grid
          container
          direction={{ xs: 'column', md: 'row' }}
          sx={{ height: { xs: 'auto', md: '100%' }, borderRadius: 0 }}
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
              height: { xs: 'auto', md: 'auto' },
              minHeight: { xs: '35vh', md: 'auto' },
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
                minHeight: { xs: 'auto', md: '100%' },
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
                Join the future of academic assistance
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
                Create your account and start transforming your assignments with AI-powered insights
              </Typography>
            </Box>
            <HeroParticles />
          </Grid>

          {/* Right side - Register Form */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              background: 'white',
              p: { xs: 2, md: 3 },
              height: { xs: 'auto', md: '100vh' },
              overflowY: 'auto', // Enable scrolling
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 480,
                pt: { xs: 1, md: 1 },
                pb: { xs: 2, md: 2 },
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                minHeight: 'auto',
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
                  fontSize: { xs: '2.2rem', md: '2.7rem' }, // Increase heading size
                  letterSpacing: '-0.02em',
                  color: '#000000',
                  mb: 2,
                }}
              >
                Create Account
              </Typography>
              <Typography
                sx={{
                  color: '#666666',
                  mb: 4,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  fontSize: '0.85rem', // Reduce supporting text size
                }}
              >
                Join AssignmentAI and transform your academic journey
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
                {successMessage && (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 2,
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      '& .MuiAlert-icon': {
                        color: '#2e7d32',
                      },
                    }}
                  >
                    {successMessage}
                  </Alert>
                )}
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      backgroundColor: '#ffebee',
                      color: '#c62828',
                      '& .MuiAlert-icon': {
                        color: '#c62828',
                      },
                    }}
                    role="alert"
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        color: '#c62828',
                      }}
                    >
                      {error}
                    </Typography>
                  </Alert>
                )}

                {success && (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 3,
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      '& .MuiAlert-icon': {
                        color: '#2e7d32',
                      },
                    }}
                    role="alert"
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        color: '#2e7d32',
                      }}
                    >
                      {success}
                    </Typography>
                  </Alert>
                )}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem', // Reduce input text size
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
                      fontSize: '0.95rem', // Reduce label size
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
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem',
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
                      fontSize: '0.95rem',
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
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem',
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
                      fontSize: '0.95rem',
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

                {/* Password Requirements Display */}
                {formData.password && (
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        fontSize: '0.8rem',
                        mb: 1,
                      }}
                    >
                      Password Requirements
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: passwordRequirements.minLength ? 'success.main' : 'error.main',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: '0.75rem',
                        }}
                      >
                        • At least 8 characters {passwordRequirements.minLength ? '✓' : '✗'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: passwordRequirements.hasUpperCase ? 'success.main' : 'error.main',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: '0.75rem',
                        }}
                      >
                        • At least one uppercase letter{' '}
                        {passwordRequirements.hasUpperCase ? '✓' : '✗'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: passwordRequirements.hasLowerCase ? 'success.main' : 'error.main',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: '0.75rem',
                        }}
                      >
                        • At least one lowercase letter{' '}
                        {passwordRequirements.hasLowerCase ? '✓' : '✗'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: passwordRequirements.hasNumber ? 'success.main' : 'error.main',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: '0.75rem',
                        }}
                      >
                        • At least one number {passwordRequirements.hasNumber ? '✓' : '✗'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: passwordRequirements.hasSpecialChar
                            ? 'success.main'
                            : 'error.main',
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: '0.75rem',
                        }}
                      >
                        • At least one special character{' '}
                        {passwordRequirements.hasSpecialChar ? '✓' : '✗'}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handlePasswordBlur}
                  error={!!passwordError}
                  helperText={passwordError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem',
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
                      fontSize: '0.95rem',
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
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{
                          minWidth: 'auto',
                          p: 0.5,
                          color: 'grey.600',
                          '&:hover': {
                            color: 'grey.800',
                          },
                        }}
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleConfirmPasswordBlur}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem',
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
                      fontSize: '0.95rem',
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
                      <Button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        sx={{
                          minWidth: 'auto',
                          p: 0.5,
                          color: 'grey.600',
                          '&:hover': {
                            color: 'grey.800',
                          },
                        }}
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={
                    isLoading ||
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.email ||
                    !formData.password ||
                    !formData.confirmPassword
                  }
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    textTransform: 'none',
                    backgroundColor: '#d32f2f',
                    '&:hover': {
                      backgroundColor: '#b71c1c',
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#666666',
                    },
                  }}
                  aria-label={isLoading ? 'Creating account...' : 'Register'}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" role="progressbar" />
                  ) : (
                    'Register'
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: '0.875rem',
                    }}
                  >
                    Or register with
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
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    color="primary"
                    underline="hover"
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Terms and Privacy Modal */}
      <TermsPrivacyModal
        open={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    </Box>
  );
};

export default Register;
