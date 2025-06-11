import { Brightness4, Brightness7, CheckCircle, Info } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  errorShake,
  fadeIn,
  loadingSpinner,
  pulse,
  scaleIn,
  slideIn,
  successCheck,
} from '../../styles/animations';
import { responsiveStyles } from '../../styles/breakpoints';

const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, setIsAnimating] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    []
  );

  const themeConfig = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#ff1a1a',
          },
          background: {
            default: mode === 'light' ? '#ffffff' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
      }),
    [mode]
  );

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(email && !emailRegex.test(email) ? 'Please enter a valid email address' : null);
    setIsFormValid(emailRegex.test(email) && !loading && !success);
  }, [email, loading, success]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isFormValid) {
        handleSubmit(new Event('submit') as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
      const form = document.querySelector('form');
      if (form) {
        form.style.animation = 'none';
        form.offsetHeight; // Trigger reflow
        form.style.animation = `${errorShake} 0.5s ease-out`;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={themeConfig}>
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          bgcolor: 'background.default',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Dark Mode Toggle */}
        <IconButton
          onClick={colorMode.toggleColorMode}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: 'background.paper',
              transform: 'scale(1.1)',
            },
          }}
          aria-label="Toggle dark mode"
        >
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {/* Left Side - Cover Image */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: { xs: '30vh', md: '100vh' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ff1a1a',
            position: 'relative',
            overflow: 'hidden',
            animation: `${slideIn} 1s ease-out`,
            order: { xs: 1, md: 1 },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                mode === 'light'
                  ? 'linear-gradient(135deg, rgba(255,26,26,0.9) 0%, rgba(255,77,77,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255,26,26,0.8) 0%, rgba(255,77,77,0.8) 100%)',
              zIndex: 1,
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              color: 'white',
              p: responsiveStyles.container.padding,
              animation: `${fadeIn} 1s ease-out 0.5s both`,
            }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                fontSize: responsiveStyles.typography.h1.fontSize,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              Reset Your Password
            </Typography>
            <Typography
              variant="h2"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontSize: responsiveStyles.typography.h2.fontSize,
                animation: `${fadeIn} 1s ease-out 0.8s both`,
              }}
            >
              We'll help you get back into your account
            </Typography>
            <Box
              component="img"
              src="/images/forgot-password-cover.svg"
              alt="AssignmentAI Platform Illustration"
              sx={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: { xs: '150px', sm: '200px', md: '300px' },
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                animation: `${scaleIn} 1s ease-out 1s both`,
                '&:hover': {
                  animation: `${pulse} 2s infinite`,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right Side - Forgot Password Form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: { xs: 'auto', md: '100vh' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: responsiveStyles.container.padding,
            animation: `${fadeIn} 1s ease-out`,
            bgcolor: 'background.default',
            order: { xs: 2, md: 2 },
          }}
        >
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
                animation: `${slideIn} 0.5s ease-out`,
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
              Forgot Password
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
              Enter your email address and we'll send you a link to reset your password
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
                <Typography color="success.main">
                  Reset link sent! Check your email and return to login.
                </Typography>
              </Box>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: '100%' }}
              aria-label="Forgot password form"
            >
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                error={!!emailError}
                helperText={emailError}
                aria-label="Email address"
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                InputProps={{
                  endAdornment: email && (
                    <InputAdornment position="end">
                      <Tooltip title="Enter your email address">
                        <Info sx={{ color: emailError ? 'error.main' : 'action.active' }} />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#ff1a1a',
                      transition: 'border-color 0.3s ease',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff1a1a',
                      transition: 'border-color 0.3s ease',
                      boxShadow: '0 0 0 2px rgba(255,26,26,0.2)',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#ff1a1a',
                    transition: 'color 0.3s ease',
                  },
                  mb: 2,
                  animation: `${fadeIn} 0.5s ease-out 0.6s both`,
                  transition: 'all 0.3s ease',
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!isFormValid || loading}
                aria-label="Send reset link"
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  fontSize: responsiveStyles.typography.body1.fontSize,
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(255, 26, 26, 0.2)',
                  bgcolor: '#ff1a1a',
                  transition: 'all 0.3s ease',
                  animation: `${fadeIn} 0.5s ease-out 0.8s both`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.5s ease',
                  },
                  '&:hover::after': {
                    transform: 'translateX(100%)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={24}
                    aria-label="Loading"
                    sx={{
                      color: 'white',
                      animation: `${loadingSpinner} 1s linear infinite`,
                    }}
                  />
                ) : success ? (
                  <CheckCircle sx={{ fontSize: 24 }} />
                ) : (
                  <>
                    Send Reset Link
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        right: 16,
                        opacity: 0.7,
                        fontSize: '0.75rem',
                      }}
                    >
                      Ctrl + Enter
                    </Typography>
                  </>
                )}
              </Button>

              <Box
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  animation: `${fadeIn} 0.5s ease-out 1s both`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    sx={{
                      color: '#ff1a1a',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        textDecoration: 'underline',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ForgotPasswordForm;
