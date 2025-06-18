import {
  Assignment as AssignmentIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalFiles: number;
  storageUsed: number;
  storageLimit: number;
  monthlyUsage: number;
  monthlyLimit: number;
}

interface RecentActivity {
  id: string;
  type: 'assignment_created' | 'assignment_completed' | 'file_uploaded' | 'subscription_updated';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    totalFiles: 0,
    storageUsed: 0,
    storageLimit: 1024 * 1024 * 1024, // 1GB default
    monthlyUsage: 0,
    monthlyLimit: 100,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard statistics
      const statsResponse = await api.get('/dashboard/stats');
      setStats(statsResponse.data);

      // Load recent activity
      const activityResponse = await api.get('/dashboard/activity');
      setRecentActivity(
        activityResponse.data.map((activity: any) => ({
          ...activity,
          icon: getActivityIcon(activity.type),
        }))
      );
    } catch (error) {
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment_created':
        return <AssignmentIcon color="primary" />;
      case 'assignment_completed':
        return <AssignmentIcon color="success" />;
      case 'file_uploaded':
        return <CloudUploadIcon color="info" />;
      case 'subscription_updated':
        return <SettingsIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-assignment',
      title: 'Create Assignment',
      description: 'Start a new assignment',
      icon: <EditIcon />,
      action: () => navigate('/assignments/create'),
      color: theme.palette.primary.main,
    },
    {
      id: 'upload-file',
      title: 'Upload File',
      description: 'Upload documents for processing',
      icon: <CloudUploadIcon />,
      action: () => navigate('/files'),
      color: theme.palette.info.main,
    },
    {
      id: 'view-history',
      title: 'View History',
      description: 'Check your assignment history',
      icon: <HistoryIcon />,
      action: () => navigate('/assignments'),
      color: theme.palette.secondary.main,
    },
    {
      id: 'manage-subscription',
      title: 'Manage Plan',
      description: 'Update your subscription',
      icon: <SettingsIcon />,
      action: () => navigate('/subscription'),
      color: theme.palette.warning.main,
    },
  ];

  const formatStorageSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStorageProgress = () => {
    return (stats.storageUsed / stats.storageLimit) * 100;
  };

  const getUsageProgress = () => {
    return (stats.monthlyUsage / stats.monthlyLimit) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your assignments today.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Assignments
                  </Typography>
                  <Typography variant="h4">{stats.totalAssignments}</Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.completedAssignments}
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Files Uploaded
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.totalFiles}
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Monthly Usage
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.monthlyUsage}/{stats.monthlyLimit}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Quick Actions" titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={2}>
            {quickActions.map(action => (
              <Grid item xs={12} sm={6} md={3} key={action.id}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  onClick={action.action}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: `${action.color}20`,
                        color: action.color,
                        mr: 2,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography variant="subtitle2">{action.title}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {action.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Usage and Storage */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Storage Usage"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2">
                  {formatStorageSize(stats.storageUsed)} / {formatStorageSize(stats.storageLimit)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getStorageProgress()}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {getStorageProgress().toFixed(1)}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Monthly Usage"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="body2">
                  {stats.monthlyUsage} / {stats.monthlyLimit} assignments
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getUsageProgress()}
                sx={{ height: 8, borderRadius: 4 }}
                color={getUsageProgress() > 80 ? 'error' : 'primary'}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {getUsageProgress().toFixed(1)}% of monthly limit used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardHeader
          title="Recent Activity"
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <IconButton onClick={() => navigate('/activity')}>
              <MoreVertIcon />
            </IconButton>
          }
        />
        <CardContent>
          {recentActivity.length > 0 ? (
            <List>
              {recentActivity.slice(0, 5).map(activity => (
                <ListItem key={activity.id} sx={{ px: 0 }}>
                  <ListItemIcon>{activity.icon}</ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No recent activity</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
