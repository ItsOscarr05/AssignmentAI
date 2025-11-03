import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Container, Divider, Grid, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import HeroParticles from '../components/layout/HeroParticles';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Try to go back, but if there's no history, go to landing page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

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
        background: 'white',
        overflow: { xs: 'auto', md: 'hidden' },
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          height: { xs: 'auto', md: '100%' },
        }}
      >
        <Grid
          container
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            height: { xs: 'auto', md: '100vh' },
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
              height: { xs: 'auto', md: '100%' },
              minHeight: { xs: '35vh', md: '100%' },
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

          {/* Right side - Forgot Password Form */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: { xs: 'auto', md: '100%' },
              minHeight: { xs: '65vh', md: '100%' },
              background: 'white',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                maxWidth: 420,
                mx: 'auto',
                pb: { xs: 1, md: 0 },
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
                  fontSize: { xs: '2rem', md: '2.4rem' },
                  letterSpacing: '-0.02em',
                  color: '#000000',
                }}
              >
                Reset Password
              </Typography>
              <Typography
                sx={{
                  color: '#666666',
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
                    sx={{
                      color: '#666666',
                      mb: 3,
                      fontFamily: "'Inter', sans-serif",
                    }}
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

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      mt: 1,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: '#000000',
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
