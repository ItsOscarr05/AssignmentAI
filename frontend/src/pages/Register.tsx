import {
  GitHub as GitHubIcon,
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
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
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import HeroParticles from '../components/HeroParticles';
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
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields are filled
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('All fields are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
      setSuccess('Registration successful! Please log in with your credentials.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
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
                Your AI-powered assignment companion
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
                Get intelligent help with your assignments using advanced AI technology.
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
              justifyContent: 'center',
              alignItems: 'center',
              background: 'white',
              p: { xs: 2, md: 3 },
              height: { xs: 'auto', md: '100vh' },
              minHeight: { xs: '65vh', md: '100vh' },
              overflowY: 'auto', // Enable scrolling
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 480,
                py: { xs: 2, md: 0 },
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: { xs: 'auto', md: '100%' },
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
                  color: 'text.primary',
                  mb: 2,
                }}
              >
                Create Account
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 4,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  fontSize: '0.85rem', // Reduce supporting text size
                }}
              >
                Join AssignmentAI to start managing your assignments
              </Typography>

              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} role="alert">
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 3 }} role="alert">
                    {success}
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
                      height: '54px', // Reduced height
                      fontSize: '0.95rem', // Reduce input text size
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem', // Reduce label size
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
                      height: '54px',
                      fontSize: '0.95rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem',
                    },
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '54px',
                      fontSize: '0.95rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem',
                    },
                  }}
                />
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '54px',
                      fontSize: '0.95rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem',
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '54px',
                      fontSize: '0.95rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.95rem',
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
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.0, // Reduced vertical padding
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Register'}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: '0.8rem', // Reduce divider text size
                    }}
                  >
                    or register with
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
                        setError('Failed to connect to Google. Please try again.');
                      }
                    }}
                    sx={{
                      py: 1.0, // Reduced vertical padding
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                    size="small"
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
                        setError('Failed to connect to GitHub. Please try again.');
                      }
                    }}
                    sx={{
                      py: 1.0, // Reduced vertical padding
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                    size="small"
                  >
                    GitHub
                  </Button>
                </Stack>

                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    mt: 2,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.9rem', // Reduce already have account text size
                  }}
                >
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    color="primary"
                    underline="hover"
                    sx={{
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9rem', // Reduce sign in link size
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </form>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Register;
