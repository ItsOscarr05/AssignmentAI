import { zodResolver } from '@hookform/resolvers/zod';
import {
  Apple,
  CheckCircle,
  Facebook,
  GitHub,
  Google,
  Info,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
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
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { getSocialLoginUrl } from '../../config/socialLogin';
import { useAuth } from '../../contexts/AuthContext';
import { errorShake, fadeIn, pulse, scaleIn, slideIn, successCheck } from '../../styles/animations';
import { responsiveStyles } from '../../styles/breakpoints';
import '../../styles/transitions.css';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

type SocialProvider = 'google' | 'facebook' | 'apple' | 'github';

const SignUpForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
    setError: setFormError,
    clearErrors,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
    },
  });

  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmittingSocial, setIsSubmittingSocial] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<SocialProvider | null>(null);

  const themeConfig = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#ff1a1a',
          },
          background: {
            default: '#ffffff',
            paper: '#ffffff',
          },
        },
      }),
    []
  );

  useEffect(() => {
    clearErrors();
    setError(null);
  }, [clearErrors]);

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (isSubmittingSocial) return;

    try {
      setIsSubmittingSocial(true);
      setCurrentProvider(provider);
      const url = getSocialLoginUrl(provider);
      window.location.href = url;
    } catch (error) {
      setError(`Failed to initiate ${provider} registration. Please try again.`);
    } finally {
      setIsSubmittingSocial(false);
      setCurrentProvider(null);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (!termsAccepted) {
      setFormError('root', { message: 'Please accept the terms and conditions' });
      return;
    }

    try {
      setError(null);
      clearErrors();
      await signUp(data.email, data.password, data.full_name);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = error.message || 'Failed to register. Please try again.';
      setError(errorMessage);
      setFormError('root', { message: errorMessage });

      const form = document.querySelector('form');
      if (form) {
        form.style.animation = 'none';
        form.offsetHeight; // Trigger reflow
        form.style.animation = `${errorShake} 0.5s ease-out`;
      }
    }
  };

  return (
    <ThemeProvider theme={themeConfig}>
      <Box
        component="main"
        className="signup-page"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          animation: `${fadeIn} 0.5s ease-out`,
        }}
        role="main"
        aria-label="Sign up page"
      >
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
                'linear-gradient(135deg, rgba(255,26,26,0.9) 0%, rgba(255,77,77,0.9) 100%)',
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
              Join AssignmentAI
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
              Create your account and get started
            </Typography>
            <Box
              component="img"
              src="/images/register-cover.svg"
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

        {/* Right Side - Sign Up Form */}
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
              id="signup-form-description"
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: 'text.primary',
                mb: 3,
                animation: `${slideIn} 0.5s ease-out 0.2s both`,
              }}
            >
              Create Account
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
              Sign up to get started with AssignmentAI
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
                <Typography color="success.main">Account created! Redirecting...</Typography>
              </Box>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{
                width: '100%',
                maxWidth: 400,
                bgcolor: 'background.paper',
                p: 4,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                zIndex: 1,
                animation: `${fadeIn} 0.5s ease-out`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                },
              }}
              role="form"
              aria-label="Sign up form"
              aria-describedby="signup-form-description"
            >
              <FormControl error={!!errors.email}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  margin="normal"
                  required
                  autoComplete="email"
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  inputProps={{
                    'aria-autocomplete': 'none',
                  }}
                  InputProps={{
                    endAdornment: watch('email') && (
                      <InputAdornment position="end">
                        <Tooltip title="Enter your email address">
                          <Info sx={{ color: errors.email ? 'error.main' : 'action.active' }} />
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
              </FormControl>

              <FormControl error={!!errors.full_name}>
                <TextField
                  fullWidth
                  label="Full Name"
                  {...register('full_name')}
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                  margin="normal"
                  required
                  autoComplete="name"
                  aria-label="Full name"
                  aria-required="true"
                  aria-invalid={!!errors.full_name}
                  aria-describedby={errors.full_name ? 'full-name-error' : undefined}
                  inputProps={{
                    'aria-autocomplete': 'none',
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
                    animation: `${fadeIn} 0.5s ease-out 0.8s both`,
                    transition: 'all 0.3s ease',
                  }}
                />
              </FormControl>

              <FormControl error={!!errors.password}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  margin="normal"
                  required
                  autoComplete="new-password"
                  aria-label="Password"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          sx={{
                            color: '#ff1a1a',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
                    animation: `${fadeIn} 0.5s ease-out 1s both`,
                    transition: 'all 0.3s ease',
                  }}
                />
              </FormControl>

              <FormControl error={!!errors.confirmPassword}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  margin="normal"
                  required
                  autoComplete="new-password"
                  aria-label="Confirm password"
                  aria-required="true"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          sx={{
                            color: '#ff1a1a',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
                    animation: `${fadeIn} 0.5s ease-out 1.2s both`,
                    transition: 'all 0.3s ease',
                  }}
                />
              </FormControl>

              {watch('password') && <PasswordStrengthIndicator password={watch('password')} />}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    aria-label="Accept terms and conditions"
                    sx={{
                      color: '#ff1a1a',
                      '&.Mui-checked': {
                        color: '#ff1a1a',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255, 26, 26, 0.04)',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: responsiveStyles.typography.body1.fontSize,
                        color: 'text.secondary',
                      }}
                    >
                      I accept the{' '}
                      <Link
                        href="/terms"
                        sx={{
                          color: '#ff1a1a',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Terms and Conditions
                      </Link>
                    </Typography>
                    <Tooltip title="You must accept the terms and conditions to create an account">
                      <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                }
                sx={{
                  mb: 2,
                  animation: `${fadeIn} 0.5s ease-out 1.4s both`,
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting || !isValid || !isDirty || !termsAccepted}
                aria-label="Create account"
                aria-busy={isSubmitting}
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
                  '&:disabled': {
                    bgcolor: 'action.disabled',
                    color: 'text.disabled',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} aria-label="Loading" />
                ) : (
                  'Create Account'
                )}
              </Button>

              <Box
                sx={{
                  width: '100%',
                  my: 2,
                  animation: `${fadeIn} 0.5s ease-out 1.6s both`,
                }}
              >
                <Divider sx={{ '&::before, &::after': { borderColor: '#ddd' } }}>
                  <Typography variant="body2" color="text.secondary">
                    or sign up with
                  </Typography>
                </Divider>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: { xs: 1, sm: 2 },
                  mb: 3,
                  animation: `${fadeIn} 0.5s ease-out 1.8s both`,
                }}
              >
                {(['google', 'facebook', 'apple', 'github'] as SocialProvider[]).map(provider => (
                  <Tooltip
                    key={provider}
                    title={`Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
                    arrow
                  >
                    <IconButton
                      onClick={() => handleSocialLogin(provider)}
                      disabled={isSubmittingSocial}
                      aria-label={`Sign up with ${provider}`}
                      sx={{
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'background.paper',
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          opacity: 0.7,
                        },
                      }}
                    >
                      {isSubmittingSocial && currentProvider === provider ? (
                        <CircularProgress size={24} />
                      ) : (
                        {
                          google: <Google sx={{ color: '#DB4437' }} />,
                          facebook: <Facebook sx={{ color: '#4267B2' }} />,
                          apple: <Apple sx={{ color: '#000000' }} />,
                          github: <GitHub sx={{ color: '#24292e' }} />,
                        }[provider]
                      )}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>

              <Box
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  animation: `${fadeIn} 0.5s ease-out 2s both`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
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

export default SignUpForm;
