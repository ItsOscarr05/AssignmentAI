import { GitHub as GitHubIcon, Google as GoogleIcon } from '@mui/icons-material';
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
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

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
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
        overflow: 'hidden',
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ height: '100%' }}>
        <Grid
          container
          direction={{ xs: 'column', md: 'row' }}
          sx={{ height: '100%', borderRadius: 0 }}
        >
          {/* Left side - Branding */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              background: 'radial-gradient(circle at center, #FF5252 0%,rgb(84, 8, 8) 100%)',
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              position: 'relative',
              height: '100%',
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
                minHeight: '100%',
                pt: 4,
                pb: 2,
              }}
            >
              <img
                src="/New_AssignmentAI_Logo_Transparent.png"
                alt="Logo"
                style={{
                  height: 450,
                  marginBottom: -20,
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
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  letterSpacing: '-0.02em',
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
                  fontSize: '1.3rem',
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
                  fontSize: '1.1rem',
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
              p: { xs: 3, md: 4 },
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 480,
                py: 2,
                position: 'relative',
              }}
            >
              {/* Back Button - Far right */}
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -100,
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
                  fontSize: { xs: '1.8rem', md: '2.2rem' },
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
                  fontSize: '0.95rem',
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
                      height: '62px',
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
                      height: '62px',
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
                      height: '62px',
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
                      height: '62px',
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                        size="small"
                      >
                        {showPassword ? 'Hide' : 'Show'}
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
                      height: '62px',
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                        size="small"
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
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
                    py: 1.2,
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
                      fontSize: '0.85rem',
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
                    onClick={() => {
                      window.location.href = `${
                        import.meta.env.VITE_API_URL || ''
                      }/api/auth/google/login`;
                    }}
                    sx={{
                      py: 1.2,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      fontSize: '0.9rem',
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
                    onClick={() => {
                      window.location.href = `${
                        import.meta.env.VITE_API_URL || ''
                      }/api/auth/github/login`;
                    }}
                    sx={{
                      py: 1.2,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      fontSize: '0.9rem',
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
                    fontSize: '0.9rem',
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
