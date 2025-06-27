import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
        overflowY: 'auto',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          width: '100vw',
        }}
      >
        <Grid
          container
          component={Paper}
          sx={{
            borderRadius: 0,
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {/* Left side - Branding */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              background: 'radial-gradient(circle at center, #FF5252 0%,rgb(84, 8, 8) 100%)',
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                textAlign: 'center',
                zIndex: 1,
                width: '100%',
                maxWidth: 480,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src="/AssignmentAI_Logo-transparent-white.png"
                alt="Logo"
                style={{
                  height: 320,
                  marginBottom: 32,
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
                  fontSize: { xs: '3rem', md: '4rem' },
                  letterSpacing: '-0.02em',
                  mb: 2,
                }}
              >
                AssignmentAI
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  mb: 3,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.02em',
                  fontSize: '1.5rem',
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
                  fontSize: '1.2rem',
                }}
              >
                Get intelligent help with your assignments using advanced AI technology.
              </Typography>
            </Box>
          </Grid>

          {/* Right side - Forgot Password Form */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              p: { xs: 2, md: 3 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}
          >
            <Box sx={{ maxWidth: 420, mx: 'auto', pb: { xs: 2, md: 3 } }}>
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
                Reset Password
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 2,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  letterSpacing: '0.01em',
                  fontSize: '1rem',
                }}
              >
                Enter your email address and we'll send you a link to reset your password
              </Typography>

              {success ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    color="success.main"
                    sx={{ mb: 2, fontFamily: "'Inter', sans-serif" }}
                  >
                    Check your email
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mb: 3, fontFamily: "'Inter', sans-serif" }}
                  >
                    We've sent password reset instructions to {email}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.2,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Return to Login
                  </Button>
                </Box>
              ) : (
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
                    onChange={e => setEmail(e.target.value)}
                    sx={{
                      mb: 1.5,
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
                      mt: 2,
                      mb: 1.5,
                      py: 1.2,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      mt: 2,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    Remember your password?{' '}
                    <Button
                      component={RouterLink}
                      to="/login"
                      sx={{
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '0.01em',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                      }}
                    >
                      Sign in
                    </Button>
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
