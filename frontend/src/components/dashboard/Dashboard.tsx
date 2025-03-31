import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DashboardStats, RecentActivity, UpcomingDeadline, QuickAction } from '../../types/dashboard';
import { Toast } from '../common/Toast';
import { LoadingSpinner } from '../common/LoadingSpinner';

const quickActions: QuickAction[] = [
  {
    id: 'create-assignment',
    title: 'Create Assignment',
    description: 'Create a new assignment',
    icon: 'assignment',
    path: '/assignments/new',
    color: 'primary',
  },
  {
    id: 'ai-generator',
    title: 'AI Generator',
    description: 'Generate assignment using AI',
    icon: 'auto_awesome',
    path: '/assignments/ai-generator',
    color: 'secondary',
  },
  {
    id: 'submissions',
    title: 'View Submissions',
    description: 'Check recent submissions',
    icon: 'assessment',
    path: '/submissions',
    color: 'success',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'View performance analytics',
    icon: 'trending_up',
    path: '/analytics',
    color: 'info',
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      const [statsResponse, activityResponse, deadlinesResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-activity'),
        fetch('/api/dashboard/upcoming-deadlines'),
      ]);

      const [statsData, activityData, deadlinesData] = await Promise.all([
        statsResponse.json(),
        activityResponse.json(),
        deadlinesResponse.json(),
      ]);

      setStats(statsData);
      setRecentActivity(activityData);
      setUpcomingDeadlines(deadlinesData);
    } catch (err) {
      setToast({
        open: true,
        message: 'Failed to fetch dashboard data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'submission':
        return <AssignmentIcon />;
      case 'grade':
        return <SchoolIcon />;
      case 'assignment':
        return <AddIcon />;
      case 'feedback':
        return <AssessmentIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getDeadlineStatusColor = (status: UpcomingDeadline['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'success';
      case 'late':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s',
                },
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconButton color={action.color}>
                    {action.icon === 'assignment' && <AssignmentIcon />}
                    {action.icon === 'auto_awesome' && <AutoAwesomeIcon />}
                    {action.icon === 'assessment' && <AssessmentIcon />}
                    {action.icon === 'trending_up' && <TrendingUpIcon />}
                  </IconButton>
                  <Box>
                    <Typography variant="h6">{action.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Total Assignments
              </Typography>
              <Typography variant="h4">{stats.totalAssignments}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pending Submissions
              </Typography>
              <Typography variant="h4">{stats.pendingSubmissions}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Completed Submissions
              </Typography>
              <Typography variant="h4">{stats.completedSubmissions}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Average Grade
              </Typography>
              <Typography variant="h4">{stats.averageGrade}%</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity) => (
                <ListItem
                  key={activity.id}
                  button
                  onClick={() => navigate(`/assignments/${activity.assignmentId}`)}
                >
                  <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {activity.description}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Deadlines
            </Typography>
            <List>
              {upcomingDeadlines.map((deadline) => (
                <ListItem
                  key={deadline.id}
                  button
                  onClick={() => navigate(`/assignments/${deadline.assignmentId}`)}
                >
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={deadline.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Due: {format(new Date(deadline.dueDate), 'MMM d, yyyy')}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={deadline.status}
                            color={getDeadlineStatusColor(deadline.status)}
                            size="small"
                          />
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default Dashboard;
