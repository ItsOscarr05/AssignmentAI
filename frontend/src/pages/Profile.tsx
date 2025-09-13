import {
  AccountCircleOutlined,
  AssignmentOutlined,
  BadgeOutlined,
  EditOutlined,
  EmailOutlined,
  LanguageOutlined,
  LocationOnOutlined,
  LogoutOutlined,
  TimelineOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import EditProfileDialog from '../components/profile/EditProfileDialog';
import { useAuth } from '../contexts/AuthContext';
import { useAssignments } from '../hooks/useApiQuery';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useProfileStore } from '../services/ProfileService';
import { paymentService, Subscription } from '../services/paymentService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps & { breakpoint?: string }) {
  const { children, value, index, breakpoint = 'standard', ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3) }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfileSection = ({ title, icon, children }: any) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        border: '2px solid',
        borderColor: 'error.main',
        borderRadius: 3,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: 'error.dark',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h5" fontWeight="400">
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
};

const StatCard = ({ icon, title, value, color, onClick, sx }: any) => {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background:
          theme.palette.mode === 'dark'
            ? `rgba(${theme.palette.background.paper}, 0.8)`
            : 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'error.main',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: onClick ? 'translateY(-4px) scale(1.03)' : 'translateY(-4px)',
          boxShadow: theme.shadows[4],
          background: onClick ? `rgba(${theme.palette.background.paper}, 0.9)` : undefined,
        },
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          background: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
          color: color || theme.palette.primary.main,
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        {value}
      </Typography>
      <Typography color="text.secondary">{title}</Typography>
    </Box>
  );
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { breakpoint } = useAspectRatio();
  const { profile, isLoading, error, updateProfile, fetchProfile } = useProfileStore();

  const [tabValue, setTabValue] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    institution: '',
    department: '',
  });

  // Load profile data on component mount
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  // Load subscription data on component mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        console.log('Profile: Fetching subscription data...');
        const subscription = await paymentService.getCurrentSubscription();
        console.log('Profile: Subscription data received:', subscription);
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Profile: Failed to fetch subscription:', error);
        // Set default to free plan if subscription fetch fails
        setCurrentSubscription(null);
      }
    };

    fetchSubscription();
  }, []);

  // Listen for subscription updates (e.g., after payment success)
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('Profile: subscription update event received, refreshing subscription data...');
      const fetchSubscription = async () => {
        try {
          const subscription = await paymentService.getCurrentSubscription();
          console.log('Profile: Updated subscription data received:', subscription);
          setCurrentSubscription(subscription);
        } catch (error) {
          console.error('Profile: Failed to fetch updated subscription:', error);
          setCurrentSubscription(null);
        }
      };
      fetchSubscription();
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    window.addEventListener('payment-success', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
      window.removeEventListener('payment-success', handleSubscriptionUpdate);
    };
  }, []);

  // Initialize form with profile data
  useEffect(() => {
    if (profile || user) {
      // Extract first and last name from profile.name if it exists
      let firstName = '';
      let lastName = '';

      if (profile?.name) {
        const nameParts = profile.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else if (user?.name) {
        const nameParts = user.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      setEditForm({
        firstName: firstName,
        lastName: lastName,
        email: profile?.email || user?.email || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        institution: '',
        department: '',
      });
    }
  }, [profile, user]);

  // Fetch real assignments for the logged-in user
  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useAssignments();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditProfile = () => {
    // Extract first and last name from profile.name if it exists
    let firstName = '';
    let lastName = '';

    if (profile?.name) {
      const nameParts = profile.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    } else if (user?.name) {
      const nameParts = user.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Populate form with current data when opening dialog
    setEditForm({
      firstName: firstName,
      lastName: lastName,
      email: profile?.email || user?.email || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      institution: '',
      department: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Combine first and last name into a single name field
      const fullName = `${editForm.firstName} ${editForm.lastName}`.trim();

      // Update profile data in the format expected by the backend
      await updateProfile({
        name: fullName,
        email: editForm.email,
        avatar: profile?.avatarUrl || '', // Required field by backend
        bio: editForm.bio,
        location: editForm.location || undefined,
        website: undefined, // Not implemented in the form yet
      });

      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });

      handleCloseEditDialog();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update profile',
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Calculate stats from real data
  const totalAssignments = assignments.length;

  // Helper function to map plan_id to readable plan name
  const getPlanDisplayName = (planId?: string): string => {
    if (!planId) return 'Free';

    // Map the plan IDs to readable names
    switch (planId) {
      case 'price_test_free':
        return 'Free';
      case 'price_test_plus':
        return 'Plus';
      case 'price_test_pro':
        return 'Pro';
      case 'price_test_max':
        return 'Max';
      default:
        // For real Stripe price IDs, we need to determine the plan based on token limits
        // Since we have access to token_limit in the subscription data, we can use that
        if (currentSubscription?.token_limit) {
          const tokenLimit = currentSubscription.token_limit;
          if (tokenLimit >= 100000) return 'Max';
          if (tokenLimit >= 75000) return 'Pro';
          if (tokenLimit >= 50000) return 'Plus';
          if (tokenLimit >= 30000) return 'Free';
        }

        // Fallback: try to extract the plan name from the price ID
        if (planId.includes('plus')) return 'Plus';
        if (planId.includes('pro')) return 'Pro';
        if (planId.includes('max')) return 'Max';
        return 'Free';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchProfile}>
          Retry
        </Button>
      </Box>
    );
  }

  // Use profile data or fallback to user data
  const profileData = profile || user;
  const displayName = profileData
    ? profile && profile.name
      ? profile.name
      : user && user.name
      ? user.name
      : 'John Doe'
    : 'John Doe';
  const displayEmail = profileData?.email || 'john.doe@example.com';
  // Get member since date from multiple possible sources
  const getMemberSince = (): string | undefined => {
    // Try to get from subscription data first (most reliable)
    if (currentSubscription?.current_period_end) {
      try {
        const periodEnd = new Date(currentSubscription.current_period_end);
        // Calculate approximate start date (subtract 1 month from period end)
        const startDate = new Date(periodEnd);
        startDate.setMonth(startDate.getMonth() - 1);
        return startDate.toLocaleDateString(undefined, {
          year: 'numeric',
          month: '2-digit',
        });
      } catch (error) {
        console.error('Error parsing subscription period:', error);
      }
    }

    // Try to get from profile data
    if (profileData && 'createdAt' in profileData && profileData.createdAt) {
      try {
        return new Date((profileData as any).createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: '2-digit',
        });
      } catch (error) {
        console.error('Error parsing profile createdAt:', error);
      }
    }

    // Try to get from user data
    if (user && 'createdAt' in user && (user as any).createdAt) {
      try {
        return new Date((user as any).createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: '2-digit',
        });
      } catch (error) {
        console.error('Error parsing user createdAt:', error);
      }
    }

    // If no date is available, return undefined
    return undefined;
  };

  const memberSince = getMemberSince();

  // Language label logic
  const language =
    (profileData as any)?.preferences?.language || (user as any)?.preferences?.language || '';
  const languageLabel = !language || language === 'en' ? 'English' : language;

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        px: 2,
        pb: 4,
        minHeight: '100vh',
        background: theme.palette.background.default,
        transition: 'background 0.3s',
      }}
    >
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 3 },
          pt: 2,
          pb: 2,
          px: { xs: 1, md: 0 },
        }}
      >
        <Typography
          variant="h4"
          fontWeight="normal"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            ml: { xs: 0, md: 4 },
            fontSize: { xs: '1.75rem', md: '2.125rem' },
          }}
        >
          Profile
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditOutlined />}
          aria-label="Edit Profile"
          sx={{
            ml: { xs: 0, md: 'auto' },
            px: { xs: 2, md: 4 },
            py: 1.5,
            borderRadius: 3,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
            color: theme.palette.primary.main,
            fontSize: { xs: '0.875rem', md: '1rem' },
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(244,67,54,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5',
              color: theme.palette.primary.dark,
              boxShadow: '0 7px 30px -10px rgba(244,67,54,0.6)',
            },
          }}
          onClick={handleEditProfile}
        >
          Edit Profile
        </Button>
        <Button
          variant="contained"
          startIcon={<LogoutOutlined />}
          aria-label="Logout"
          sx={{
            ml: { xs: 0, md: 2 },
            px: { xs: 3, md: 6 },
            py: 1.5,
            borderRadius: 3,
            backgroundColor: theme.palette.error.main,
            color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#ffffff'),
            fontSize: { xs: '1rem', md: '1.125rem' },
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(244,67,54,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundColor: theme.palette.error.dark,
              color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#ffffff'),
              boxShadow: '0 7px 30px -10px rgba(244,67,54,0.6)',
            },
          }}
          onClick={logout}
        >
          Logout
        </Button>
      </Box>
      <Box
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          border: '2px solid',
          borderColor: 'error.main',
        }}
      >
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<AccountCircleOutlined />} label="Overview" />
            <Tab icon={<TimelineOutlined />} label="Activity" />
            <Tab icon={<BadgeOutlined />} label="Achievements" />
          </Tabs>
        </Box>
        <Box sx={{ p: { xs: 0, md: 4 } }}>
          <TabPanel value={tabValue} index={0} breakpoint={breakpoint}>
            <ProfileSection title="Personal Information" icon={<AccountCircleOutlined />}>
              <Box sx={{ position: 'relative', mb: 4, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: { xs: 80, md: 120 },
                    height: { xs: 80, md: 120 },
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid',
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  }}
                  aria-label="User avatar"
                >
                  <AccountCircleOutlined
                    sx={{ fontSize: { xs: 50, md: 80 }, color: theme.palette.error.main }}
                  />
                </Avatar>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                >
                  {displayName}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  sx={{
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: { xs: 1, md: 1.5 },
                    rowGap: { xs: 1, md: 1.5 },
                  }}
                >
                  <Tooltip title="Email" arrow>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? `rgba(${theme.palette.background.paper}, 0.9)`
                            : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: theme.palette.primary.main,
                        borderRadius: 16,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: 28, md: 32 },
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                        mr: 0.5,
                        cursor: 'default',
                      }}
                      aria-label="User email"
                    >
                      <EmailOutlined
                        aria-label="Email icon"
                        sx={{
                          fontSize: { xs: '1rem', md: '1.25rem' },
                          color: theme.palette.error.main,
                        }}
                      />
                      {displayEmail}
                    </Box>
                  </Tooltip>
                  <Tooltip title="Country" arrow>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? `rgba(${theme.palette.background.paper}, 0.9)`
                            : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: theme.palette.primary.main,
                        borderRadius: 16,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: 28, md: 32 },
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                        cursor: 'default',
                      }}
                      aria-label="User country"
                    >
                      <LocationOnOutlined
                        aria-label="Location icon"
                        sx={{
                          fontSize: { xs: '1rem', md: '1.25rem' },
                          color: theme.palette.error.main,
                        }}
                      />
                      {(profileData as any)?.location ||
                        (user as any)?.location ||
                        'No data available'}
                    </Box>
                  </Tooltip>
                  <Tooltip title="Language" arrow>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? `rgba(${theme.palette.background.paper}, 0.9)`
                            : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: theme.palette.primary.main,
                        borderRadius: 16,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: 28, md: 32 },
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                        cursor: 'default',
                      }}
                      aria-label="User language"
                    >
                      <LanguageOutlined
                        aria-label="Language icon"
                        sx={{
                          fontSize: { xs: '1rem', md: '1.25rem' },
                          color: theme.palette.error.main,
                        }}
                      />
                      {languageLabel}
                    </Box>
                  </Tooltip>
                </Stack>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    icon={<AssignmentOutlined />}
                    title="Total Assignments"
                    value={
                      assignmentsLoading ? (
                        <CircularProgress size={28} />
                      ) : assignmentsError ? (
                        'Error'
                      ) : typeof totalAssignments === 'number' ? (
                        totalAssignments
                      ) : (
                        0
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    icon={<BadgeOutlined />}
                    title="Subscription Type"
                    value={
                      currentSubscription === undefined ? (
                        <CircularProgress size={28} />
                      ) : currentSubscription === null ? (
                        'Free (No subscription)'
                      ) : (
                        (() => {
                          const planName = getPlanDisplayName(currentSubscription?.plan_id);
                          console.log('Profile: Rendering subscription card with:', {
                            currentSubscription,
                            planId: currentSubscription?.plan_id,
                            planName,
                          });
                          return planName;
                        })()
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    icon={<VerifiedOutlined />}
                    title="Member Since"
                    value={
                      currentSubscription === undefined ? (
                        <CircularProgress size={28} />
                      ) : memberSince ? (
                        memberSince
                      ) : (
                        'N/A'
                      )
                    }
                  />
                </Grid>
              </Grid>
            </ProfileSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1} breakpoint={breakpoint}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center',
              }}
            >
              <TimelineOutlined
                sx={{
                  fontSize: 64,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                color={theme => (theme.palette.mode === 'dark' ? 'white' : 'black')}
                gutterBottom
              >
                Coming Soon
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                Activity tracking coming soon
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2} breakpoint={breakpoint}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center',
              }}
            >
              <BadgeOutlined
                sx={{
                  fontSize: 64,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                color={theme => (theme.palette.mode === 'dark' ? 'white' : 'black')}
                gutterBottom
              >
                Coming Soon
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                Achievements coming soon
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Box>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        editForm={editForm}
        onFormChange={handleFormChange}
        onSave={handleSaveProfile}
        profileData={profileData}
        currentSubscription={currentSubscription}
      />

      {/* Snackbar for alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
