import {
  AccountCircleOutlined,
  CancelOutlined,
  Diamond,
  EditOutlined,
  EmailOutlined,
  LightbulbOutlined,
  LocalOffer,
  LocationOnOutlined,
  PersonOutlined,
  PhotoCameraOutlined,
  SaveOutlined,
  Star,
  WorkspacePremium,
} from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

interface EditFormData {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  editForm: EditFormData;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  avatarPreview: string;
  profileData: any;
  isAvatarUploading: boolean;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  editForm,
  onFormChange,
  onSave,
  onAvatarChange,
  avatarPreview,
  profileData,
  isAvatarUploading,
}) => {
  const theme = useTheme();

  // List of countries for the location dropdown
  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Germany',
    'France',
    'Italy',
    'Spain',
    'Netherlands',
    'Belgium',
    'Switzerland',
    'Austria',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Poland',
    'Czech Republic',
    'Hungary',
    'Slovakia',
    'Slovenia',
    'Croatia',
    'Serbia',
    'Bulgaria',
    'Romania',
    'Greece',
    'Turkey',
    'Ukraine',
    'Belarus',
    'Lithuania',
    'Latvia',
    'Estonia',
    'Russia',
    'Japan',
    'South Korea',
    'China',
    'India',
    'Australia',
    'New Zealand',
    'Brazil',
    'Argentina',
    'Chile',
    'Mexico',
    'Colombia',
    'Peru',
    'Venezuela',
    'Ecuador',
    'Bolivia',
    'Paraguay',
    'Uruguay',
    'Guyana',
    'Suriname',
    'South Africa',
    'Egypt',
    'Morocco',
    'Algeria',
    'Tunisia',
    'Libya',
    'Sudan',
    'Ethiopia',
    'Kenya',
    'Uganda',
    'Tanzania',
    'Zambia',
    'Zimbabwe',
    'Botswana',
    'Namibia',
    'Angola',
    'Mozambique',
    'Madagascar',
    'Mauritius',
    'Seychelles',
    'Comoros',
  ];

  // Function to get subscription border color
  const getSubscriptionBorderColor = (subscriptionPlan: string) => {
    switch (subscriptionPlan?.toLowerCase()) {
      case 'max':
        return '#FFD700'; // Gold for max
      case 'pro':
        return '#9C27B0'; // Purple for pro
      case 'plus':
        return '#4CAF50'; // Green for plus
      case 'free':
      default:
        return '#2196F3'; // Blue for free (default)
    }
  };

  const subscriptionPlan = profileData?.subscriptionPlan || 'Free Plan';
  const subscriptionBorderColor = getSubscriptionBorderColor(subscriptionPlan);

  // Calculate profile completion percentage based on filled fields
  const calculateProfileCompletion = () => {
    const fields = [
      editForm.firstName,
      editForm.lastName,
      editForm.email,
      editForm.location,
      avatarPreview || (profileData as any)?.avatarUrl || (profileData as any)?.avatar,
    ];

    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    const totalFields = fields.length;

    return Math.round((filledFields / totalFields) * 100);
  };

  const profileCompletionPercentage = calculateProfileCompletion();

  // Get progress bar color based on completion percentage
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 25) return theme.palette.error.main; // Red for low range
    if (percentage < 50) return theme.palette.warning.main; // Orange for low-mid range
    if (percentage < 75) return '#FFD700'; // Yellow for mid range
    return theme.palette.success.main; // Green for high range
  };

  const progressBarColor = getProgressBarColor(profileCompletionPercentage);

  // Animated percentage for smooth counting
  const [animatedPercentage, setAnimatedPercentage] = useState(profileCompletionPercentage);

  // Confetti animation state
  const [showConfetti, setShowConfetti] = useState(false);
  const hasShownConfetti = useRef(false);

  // Account creation date state
  const [accountCreationDate, setAccountCreationDate] = useState<string | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  // Fetch account creation date
  useEffect(() => {
    const fetchAccountCreationDate = async () => {
      // First check if profileData already has the creation date
      if (profileData?.created_at || profileData?.createdAt || profileData?.registrationDate) {
        const creationDate =
          profileData.created_at || profileData.createdAt || profileData.registrationDate;
        console.log('Using date from profileData:', creationDate);
        setAccountCreationDate(creationDate);
        return;
      }

      // Also check if we can get the date from the user object in localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.created_at || userData.createdAt || userData.registrationDate) {
          const creationDate =
            userData.created_at || userData.createdAt || userData.registrationDate;
          console.log('Using date from localStorage user:', creationDate);
          setAccountCreationDate(creationDate);
          return;
        }
      } catch (e) {
        console.log('Error parsing user from localStorage:', e);
      }

      // Try to get from the working profile endpoint
      try {
        const profileResponse = await fetch('/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Profile endpoint response:', profileData);
          const creationDate =
            profileData.created_at || profileData.createdAt || profileData.registrationDate;
          if (creationDate) {
            console.log('Using date from profile endpoint:', creationDate);
            setAccountCreationDate(creationDate);
            return;
          }
        }
      } catch (e) {
        console.log('Error fetching from profile endpoint:', e);
      }

      try {
        setIsLoadingDate(true);
        console.log('Fetching account creation date from API...');

        // Try to get user account info from the API
        const response = await fetch('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('API Response status:', response.status);
        console.log('API Response headers:', response.headers);

        if (response.ok) {
          const userData = await response.json();
          console.log('API Response data:', userData);
          const creationDate =
            userData.created_at || userData.createdAt || userData.registrationDate;
          if (creationDate) {
            console.log('Setting creation date from API:', creationDate);
            setAccountCreationDate(creationDate);
          } else {
            console.log('No creation date found in API response');
          }
        } else {
          console.log('API Response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.log('API Error response:', errorText);
        }
      } catch (error) {
        console.log('Error fetching account creation date:', error);
      } finally {
        setIsLoadingDate(false);
      }
    };

    fetchAccountCreationDate();
  }, [profileData]);

  useEffect(() => {
    const duration = 100; // Animation duration in milliseconds
    const steps = 15; // Number of steps for smooth animation
    const stepDuration = duration / steps;
    const increment = (profileCompletionPercentage - animatedPercentage) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setAnimatedPercentage(prev => {
        const newValue = prev + increment;
        if (currentStep >= steps) {
          return profileCompletionPercentage; // Ensure we end at exact target
        }
        return newValue;
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [profileCompletionPercentage, animatedPercentage]);

  // Trigger confetti when reaching 100% (only once)
  useEffect(() => {
    if (profileCompletionPercentage === 100 && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      setShowConfetti(true);
      // Hide confetti after animation completes
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [profileCompletionPercentage]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          p: 3,
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CancelOutlined />
        </IconButton>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '50%',
            }}
          >
            <EditOutlined sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="600" sx={{ mb: 0.5 }}>
              Edit Profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Update your personal information and preferences
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* Left Side - Avatar Section */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              p: 4,
              background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.02)',
              borderRight: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                <Avatar
                  src={
                    avatarPreview || (profileData as any)?.avatarUrl || (profileData as any)?.avatar
                  }
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid',
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                >
                  <AccountCircleOutlined sx={{ fontSize: 60, color: theme.palette.primary.main }} />
                </Avatar>

                {/* Upload Button */}
                <Tooltip title="Change Profile Picture" arrow>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      border: '3px solid',
                      borderColor: theme.palette.background.paper,
                      width: 40,
                      height: 40,
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <PhotoCameraOutlined sx={{ fontSize: 18 }} />
                    <input type="file" hidden accept="image/*" onChange={onAvatarChange} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Profile Stats */}
              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    background: theme.palette.background.paper,
                    borderRadius: 2,
                    border: `2px solid ${theme.palette.error.main}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Confetti Animation over Profile Completion Card */}
                  {showConfetti && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        zIndex: 1000,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Confetti pieces */}
                      {[...Array(30)].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            position: 'absolute',
                            width: Math.random() * 6 + 3,
                            height: Math.random() * 6 + 3,
                            background: [
                              '#FF6B6B',
                              '#4ECDC4',
                              '#45B7D1',
                              '#96CEB4',
                              '#FFEAA7',
                              '#DDA0DD',
                              '#98D8C8',
                              '#F7DC6F',
                              '#BB8FCE',
                              '#85C1E9',
                            ][Math.floor(Math.random() * 10)],
                            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                            left: `${Math.random() * 100}%`,
                            top: '-10px',
                            animation: `confetti-fall ${1.5 + Math.random() * 1}s linear forwards`,
                            animationDelay: `${Math.random() * 1}s`,
                            '@keyframes confetti-fall': {
                              '0%': {
                                transform: 'translateY(-10px) rotate(0deg)',
                                opacity: 1,
                              },
                              '100%': {
                                transform: `translateY(120px) rotate(${Math.random() * 360}deg)`,
                                opacity: 0,
                              },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  <Typography variant="body2" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
                    Profile Completion
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: theme.palette.divider,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${animatedPercentage}%`,
                          height: '100%',
                          background: progressBarColor,
                          borderRadius: 3,
                          transition: 'width 0.5s ease-in-out, background-color 0.3s ease-in-out',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color={progressBarColor}
                      sx={{ transition: 'color 0.3s ease-in-out' }}
                    >
                      {Math.round(animatedPercentage)}%
                    </Typography>
                  </Box>
                </Paper>

                {/* Tips Section */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    background: theme.palette.background.paper,
                    borderRadius: 2,
                    border: `2px solid ${theme.palette.error.main}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <LightbulbOutlined sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                      Tips
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      • Add a profile picture to make your profile more personal
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Keep your name and email up to date for better communication
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Update your location to connect with nearby users
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          </Grid>

          {/* Right Side - Form Section */}
          <Grid item xs={12} md={8} sx={{ p: 4 }}>
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ mb: 3, color: theme.palette.text.primary }}
            >
              Personal Information
            </Typography>

            <Grid container spacing={3}>
              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editForm.firstName}
                  onChange={e => onFormChange('firstName', e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <PersonOutlined
                        sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 20 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editForm.lastName}
                  onChange={e => onFormChange('lastName', e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <PersonOutlined
                        sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 20 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={editForm.email}
                  onChange={e => onFormChange('email', e.target.value)}
                  variant="outlined"
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <EmailOutlined
                        sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 20 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={countries}
                  value={editForm.location}
                  onChange={(_, newValue) => onFormChange('location', newValue || '')}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Location"
                      placeholder="United States"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <LocationOnOutlined
                            sx={{ mr: 1, color: theme.palette.primary.main, fontSize: 20 }}
                          />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  )}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>

            {/* Account Information Section */}
            <Box sx={{ mt: 4, mb: 3 }}>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 3, color: theme.palette.text.primary }}
              >
                Account Information
              </Typography>

              <Grid container spacing={3}>
                {/* Subscription Plan */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      background: theme.palette.background.paper,
                      borderRadius: 2,
                      border: `2px solid ${subscriptionBorderColor}`,
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Subscription Plan
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {subscriptionPlan === 'Max Plan' && (
                        <WorkspacePremium sx={{ fontSize: 20, color: subscriptionBorderColor }} />
                      )}
                      {subscriptionPlan === 'Pro Plan' && (
                        <Diamond sx={{ fontSize: 20, color: subscriptionBorderColor }} />
                      )}
                      {subscriptionPlan === 'Plus Plan' && (
                        <Star sx={{ fontSize: 20, color: subscriptionBorderColor }} />
                      )}
                      {subscriptionPlan === 'Free Plan' && (
                        <LocalOffer sx={{ fontSize: 20, color: subscriptionBorderColor }} />
                      )}
                      <Typography variant="body1" fontWeight="600" color={subscriptionBorderColor}>
                        {subscriptionPlan}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Account Created */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      background: theme.palette.background.paper,
                      borderRadius: 2,
                      border: `2px solid ${theme.palette.error.main}`,
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Account Created
                    </Typography>
                    {isLoadingDate ? (
                      <CircularProgress size={20} />
                    ) : accountCreationDate ? (
                      <Typography variant="body1" fontWeight="600" color="text.secondary">
                        {(() => {
                          try {
                            const date = new Date(accountCreationDate);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              });
                            }
                          } catch (e) {
                            console.log('Date parsing error:', e);
                          }
                          return 'Date not available';
                        })()}
                      </Typography>
                    ) : (
                      <Typography variant="body1" fontWeight="600" color="text.secondary">
                        January 1st, 2030 (Placeholder)
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Save Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                onClick={onSave}
                startIcon={isAvatarUploading ? <CircularProgress size={20} /> : <SaveOutlined />}
                variant="contained"
                disabled={isAvatarUploading}
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    boxShadow: '0 6px 25px rgba(0,0,0,0.15)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground,
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isAvatarUploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
