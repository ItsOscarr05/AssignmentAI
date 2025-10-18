import {
  CalendarMonthOutlined,
  CelebrationOutlined,
  CheckCircleOutlined,
  Close,
  EmojiEventsOutlined,
  LibraryBooksOutlined,
  Refresh,
  StorageOutlined,
  TrendingUpOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface AccountInformationDialogProps {
  open: boolean;
  onClose: () => void;
  userData: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  } | null;
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
  } | null;
  dashboardStats: {
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    totalFiles: number;
    storageUsed: number;
    storageLimit: number;
    monthlyUsage: number;
    monthlyLimit: number;
  } | null;
  securitySettings: {
    passwordStrength: string;
    lastPasswordChange: string | null;
    lastSecurityAudit: string | null;
    securityScore: number;
  };
  subscription: {
    plan: string;
  };
  privacySettings: {
    twoFactorAuth: boolean;
  };
  isLoadingUserData: boolean;
  userDataError: string | null;
  onRefresh: () => void;
  formatDateWithPreference: (date: string | Date) => string;
  calculateDaysSinceCreation: (createdAt: string) => number;
}

const AccountInformationDialog: React.FC<AccountInformationDialogProps> = ({
  open,
  onClose,
  userData,
  userProfile,
  dashboardStats,
  securitySettings,
  subscription,
  privacySettings,
  isLoadingUserData,
  userDataError,
  onRefresh,
  formatDateWithPreference,
  calculateDaysSinceCreation,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          border: 2,
          borderColor: 'error.main',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
          position: 'sticky',
          top: 0,
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          zIndex: 2,
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserOutlined />
            Account Information
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={onRefresh}
              disabled={isLoadingUserData}
              size="small"
              sx={{
                color: 'primary.main',
                '&:hover': { backgroundColor: 'primary.light', color: 'white' },
              }}
            >
              {isLoadingUserData ? <CircularProgress size={16} /> : <Refresh />}
            </IconButton>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
        }}
      >
        {isLoadingUserData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {userDataError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {userDataError}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your account details and current status information.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                border: 2,
                borderColor: 'error.main',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: theme.palette.primary.main }}
              >
                Basic Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Username:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {userProfile?.firstName && userProfile?.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : userData?.full_name || 'Loading...'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {userData?.email || 'Loading...'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Account Created:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {userData?.created_at
                      ? formatDateWithPreference(userData.created_at)
                      : 'Loading...'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Last Login:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDateWithPreference(new Date())}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                border: 2,
                borderColor: 'error.main',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: theme.palette.primary.main }}
              >
                Subscription & Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Current Plan:
                  </Typography>
                  <Chip
                    label={subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor:
                        subscription.plan === 'free'
                          ? '#2196f3'
                          : subscription.plan === 'plus'
                          ? '#4caf50'
                          : subscription.plan === 'pro'
                          ? '#9c27b0'
                          : '#ff9800',
                      color:
                        subscription.plan === 'free'
                          ? '#2196f3'
                          : subscription.plan === 'plus'
                          ? '#4caf50'
                          : subscription.plan === 'pro'
                          ? '#9c27b0'
                          : '#ff9800',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Account Status:
                  </Typography>
                  <Chip
                    label={userData?.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: userData?.is_active ? 'success.main' : 'error.main',
                      color: userData?.is_active ? 'success.main' : 'error.main',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Email Verified:
                  </Typography>
                  <Chip
                    label={userData?.is_verified ? 'Verified' : 'Not Verified'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: userData?.is_verified ? 'success.main' : 'warning.main',
                      color: userData?.is_verified ? 'success.main' : 'warning.main',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    2FA Enabled:
                  </Typography>
                  <Chip
                    label={privacySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: privacySettings.twoFactorAuth ? 'success.main' : 'error.main',
                      color: privacySettings.twoFactorAuth ? 'success.main' : 'error.main',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ color: theme.palette.primary.main, mb: 2 }}
            >
              Usage Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={2.4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    border: 2,
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <LibraryBooksOutlined sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                      {dashboardStats?.totalAssignments ?? 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                      sx={{ mb: 2 }}
                    >
                      Assignments
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    {dashboardStats && dashboardStats.totalAssignments > 0 ? (
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((dashboardStats.totalAssignments / 100) * 100, 100)}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    ) : (
                      <Chip
                        label="No Assignments Yet"
                        size="small"
                        variant="outlined"
                        sx={{
                          opacity: 0.7,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          backgroundColor: 'transparent',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    border: 2,
                    borderColor: 'success.main',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <TrendingUpOutlined sx={{ fontSize: 32, color: 'success.main' }} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                      {dashboardStats && dashboardStats.totalAssignments > 0
                        ? Math.round(
                            (dashboardStats.completedAssignments /
                              dashboardStats.totalAssignments) *
                              100
                          )
                        : 0}
                      %
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                      sx={{ mb: 2 }}
                    >
                      Completion Rate
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    {dashboardStats && dashboardStats.totalAssignments > 0 ? (
                      <LinearProgress
                        variant="determinate"
                        value={Math.round(
                          (dashboardStats.completedAssignments / dashboardStats.totalAssignments) *
                            100
                        )}
                        sx={{ height: 4, borderRadius: 2, bgcolor: 'success.light' }}
                        color="success"
                      />
                    ) : (
                      <Chip
                        label="No Data"
                        size="small"
                        variant="outlined"
                        sx={{
                          opacity: 0.7,
                          borderColor: 'success.main',
                          color: 'success.main',
                          backgroundColor: 'transparent',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    border: 2,
                    borderColor: 'info.main',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <VerifiedUserOutlined sx={{ fontSize: 32, color: 'info.main' }} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                      {securitySettings.securityScore}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                      sx={{ mb: 2 }}
                    >
                      Security Score
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    <Chip label="Protected" size="small" color="success" variant="outlined" />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    border: 2,
                    borderColor: 'warning.main',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <CalendarMonthOutlined sx={{ fontSize: 32, color: 'warning.main' }} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{ mb: 1 }}>
                      {dashboardStats?.monthlyUsage ?? 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                      sx={{ mb: 2 }}
                    >
                      Monthly Usage
                    </Typography>
                  </Box>
                  {dashboardStats && (
                    <Box sx={{ mt: 'auto' }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((dashboardStats.monthlyUsage / 25) * 100, 100)}
                        sx={{ height: 4, borderRadius: 2, bgcolor: 'warning.light' }}
                        color="warning"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {dashboardStats.monthlyLimit > 0
                          ? `Limit: ${dashboardStats.monthlyLimit}`
                          : 'Unlimited'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={6} md={2.4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    border: 2,
                    borderColor: 'secondary.main',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <CelebrationOutlined sx={{ fontSize: 32, color: 'secondary.main' }} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h4"
                      color="secondary.main"
                      fontWeight="bold"
                      sx={{ mb: 1 }}
                    >
                      {userData?.created_at ? calculateDaysSinceCreation(userData.created_at) : 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="medium"
                      sx={{ mb: 2 }}
                    >
                      Days Active
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    <Chip
                      label={
                        userData?.created_at && calculateDaysSinceCreation(userData.created_at) > 30
                          ? 'Veteran'
                          : 'New User'
                      }
                      size="small"
                      color={
                        userData?.created_at && calculateDaysSinceCreation(userData.created_at) > 30
                          ? 'secondary'
                          : 'primary'
                      }
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Storage Usage Section */}
          {dashboardStats && (
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Box
                sx={{
                  p: 3,
                  border: 2,
                  borderColor: 'error.main',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      Storage Overview
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Used:{' '}
                          {Math.round((dashboardStats.storageUsed / (1024 * 1024)) * 100) / 100} MB
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Limit:{' '}
                          {Math.round((dashboardStats.storageLimit / (1024 * 1024)) * 100) / 100} MB
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          (dashboardStats.storageUsed / dashboardStats.storageLimit) * 100,
                          100
                        )}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={
                          dashboardStats.storageUsed / dashboardStats.storageLimit > 0.8
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {dashboardStats.storageUsed / dashboardStats.storageLimit > 0.8 ? (
                        '⚠️ Storage space is running low!'
                      ) : (
                        <Box
                          component="span"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <CheckCircleOutlined sx={{ fontSize: 20, color: 'success.main' }} />
                          Plenty of storage space available
                        </Box>
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <StorageOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        {Math.round(
                          ((dashboardStats.storageLimit - dashboardStats.storageUsed) /
                            (1024 * 1024)) *
                            100
                        ) / 100}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        MB Available
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          {/* Achievements Section */}
          {userData?.created_at && calculateDaysSinceCreation(userData.created_at) > 7 && (
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  color: theme.palette.primary.main,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <EmojiEventsOutlined sx={{ fontSize: 20 }} />
                Achievements
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: 2,
                  borderColor: 'warning.main',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  color="warning.main"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                >
                  {userData?.created_at && calculateDaysSinceCreation(userData.created_at) > 30 ? (
                    <>
                      <VerifiedUserOutlined sx={{ fontSize: 24 }} />
                      Veteran User
                    </>
                  ) : (
                    <>
                      <TrendingUpOutlined sx={{ fontSize: 24 }} />
                      Active User
                    </>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userData?.created_at && calculateDaysSinceCreation(userData.created_at) > 30
                    ? `You've been with us for ${calculateDaysSinceCreation(
                        userData.created_at
                      )} days!`
                    : `You've been active for ${calculateDaysSinceCreation(
                        userData.created_at
                      )} days!`}
                </Typography>
                {dashboardStats && dashboardStats.totalAssignments > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${dashboardStats.totalAssignments} Assignments Created`}
                      color="success"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    {dashboardStats.completedAssignments > 0 && (
                      <Chip
                        label={`${dashboardStats.completedAssignments} Completed`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default AccountInformationDialog;
