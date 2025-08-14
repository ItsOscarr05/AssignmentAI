import {
  AccountCircleOutlined,
  AssignmentOutlined,
  BadgeOutlined,
  CancelOutlined,
  EditOutlined,
  EmailOutlined,
  LanguageOutlined,
  LocationOnOutlined,
  LogoutOutlined,
  PhotoCameraOutlined,
  SaveOutlined,
  TimelineOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAssignments } from '../hooks/useApiQuery';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useProfileStore } from '../services/ProfileService';
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
            ? 'linear-gradient(145deg, rgba(0,8,20,0.9) 0%, rgba(0,8,20,0.9) 100%)'
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
            background: theme => (theme.palette.mode === 'dark' ? '#000814' : '#ffffff'),
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
    <Paper
      onClick={onClick}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: theme.palette.mode === 'dark' ? 'rgba(0,8,20,0.8)' : 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: onClick ? 'translateY(-4px) scale(1.03)' : 'translateY(-4px)',
          boxShadow: theme.shadows[4],
          background: onClick ? 'rgba(0,8,20,0.9)' : undefined,
        },
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          background: theme => (theme.palette.mode === 'dark' ? '#000814' : '#ffffff'),
          color: color || theme.palette.primary.main,
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        {value}
      </Typography>
      <Typography color="text.secondary">{title}</Typography>
    </Paper>
  );
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { breakpoint } = useAspectRatio();
  const { profile, isLoading, error, updateProfile, fetchProfile } = useProfileStore();

  const [tabValue, setTabValue] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
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

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Load profile data on component mount
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

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
    setAvatarPreview('');
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please select an image file',
          severity: 'error',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setSnackbar({
          open: true,
          message: 'Image size must be less than 5MB',
          severity: 'error',
        });
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsAvatarUploading(true);

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
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Calculate stats from real data
  const totalAssignments = assignments.length;

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
  const memberSince =
    profileData && 'createdAt' in profileData && profileData.createdAt
      ? new Date((profileData as any).createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
        })
      : undefined;

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
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundColor: theme => (theme.palette.mode === 'dark' ? '#001122' : '#f5f5f5'),
              color: theme.palette.primary.dark,
              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
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
                    background: theme => (theme.palette.mode === 'dark' ? '#000814' : '#fff'),
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
                {memberSince && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    Member Since {memberSince}
                  </Typography>
                )}
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
                    <Chip
                      icon={<EmailOutlined aria-label="Email icon" />}
                      label={displayEmail}
                      aria-label="User email"
                      sx={{
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(0,8,20,0.9)'
                            : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: theme.palette.primary.main,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: 28, md: 32 },
                        '& .MuiChip-icon': {
                          color: theme.palette.primary.main,
                          fontSize: { xs: '1rem', md: '1.25rem' },
                        },
                        mr: 0.5,
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Country" arrow>
                    <Chip
                      icon={<LocationOnOutlined aria-label="Location icon" />}
                      label={
                        (profileData as any)?.location ||
                        (user as any)?.location ||
                        'No data available'
                      }
                      aria-label="User country"
                      sx={{
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(0,8,20,0.9)'
                            : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: theme.palette.primary.main,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: 28, md: 32 },
                        '& .MuiChip-icon': {
                          color: theme.palette.primary.main,
                          fontSize: { xs: '1rem', md: '1.25rem' },
                        },
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Language" arrow>
                    <Chip
                      icon={<LanguageOutlined aria-label="Language icon" />}
                      label={languageLabel}
                      aria-label="User language"
                      sx={{
                        background: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(0,8,20,0.9)'
                            : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: theme.palette.primary.main,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: 28, md: 32 },
                        '& .MuiChip-icon': {
                          color: theme.palette.primary.main,
                          fontSize: { xs: '1rem', md: '1.25rem' },
                        },
                      }}
                    />
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
                  <StatCard icon={<BadgeOutlined />} title="Subscription Type" value="Free" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    icon={<VerifiedOutlined />}
                    title="Member Since"
                    value={memberSince || 'N/A'}
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
      <Dialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(0,8,20,0.95) 0%, rgba(0,8,20,0.95) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.95) 100%)',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            color: 'white',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <EditOutlined />
            <Typography variant="h6">Edit Profile</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Avatar Section */}
            <Grid item xs={12} sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={
                    avatarPreview || (profileData as any)?.avatarUrl || (profileData as any)?.avatar
                  }
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid',
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <AccountCircleOutlined sx={{ fontSize: 80, color: theme.palette.error.main }} />
                </Avatar>
                <Tooltip title="Change Avatar">
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      border: '2px solid',
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <PhotoCameraOutlined />
                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            {/* Form Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editForm.firstName}
                onChange={e => handleFormChange('firstName', e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editForm.lastName}
                onChange={e => handleFormChange('lastName', e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editForm.email}
                onChange={e => handleFormChange('email', e.target.value)}
                variant="outlined"
                type="email"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={editForm.bio}
                onChange={e => handleFormChange('bio', e.target.value)}
                variant="outlined"
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={editForm.location}
                onChange={e => handleFormChange('location', e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution"
                value={editForm.institution}
                onChange={e => handleFormChange('institution', e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleCloseEditDialog}
            startIcon={<CancelOutlined />}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            startIcon={isAvatarUploading ? <CircularProgress size={20} /> : <SaveOutlined />}
            variant="contained"
            disabled={isAvatarUploading}
            sx={{
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
              '&:hover': {
                boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
              },
            }}
          >
            {isAvatarUploading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
