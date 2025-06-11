import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  AutoAwesome,
  CalendarToday,
  ChevronRight,
  Refresh as RefreshIcon,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analytics, assignments } from '../../services/api';
import { fadeIn, scaleIn, slideIn } from '../../styles/animations';
import { Assignment } from '../../types';
import { QuickAction } from '../../types/dashboard';
import { Toast } from '../common/Toast';
import { RecentActivity as RecentActivityComponent } from './RecentActivity';

const quickActions: QuickAction[] = [
  {
    id: 'create-assignment',
    title: 'Create Assignment',
    description: 'Create a new assignment',
    icon: 'assignment',
    path: '/assignments/create',
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

interface Activity {
  id: string;
  type: 'submission' | 'grade' | 'feedback' | 'assignment';
  title: string;
  description: string;
  timestamp: string;
  assignmentId: string;
}

interface DashboardData {
  recentAssignments: Assignment[];
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
  }>;
  performanceSummary: {
    averageGrade: number;
    completionRate: number;
    improvement: number;
  };
  recentActivity: Activity[];
}

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
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
    setLoading(true);
    setError(null);
    try {
      const [assignmentsData, performanceData] = await Promise.all([
        assignments.getAll(),
        analytics.getPerformanceMetrics(),
      ]);

      const recentAssignments = assignmentsData
        .sort(
          (a: Assignment, b: Assignment) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      const upcomingDeadlines = assignmentsData
        .filter((a: Assignment) => new Date(a.dueDate) > new Date())
        .sort(
          (a: Assignment, b: Assignment) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
        .slice(0, 5);

      const recentActivity: Activity[] = [
        ...recentAssignments.map((a: Assignment) => ({
          id: String(a.id),
          type: 'assignment' as const,
          title: a.title,
          description: 'New assignment created',
          timestamp: a.createdAt,
          assignmentId: String(a.id),
        })),
      ].sort(
        (a: Activity, b: Activity) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setData({
        recentAssignments,
        upcomingDeadlines: upcomingDeadlines.map((a: Assignment) => ({
          id: String(a.id),
          title: a.title,
          dueDate: a.dueDate,
        })),
        performanceSummary: {
          averageGrade: performanceData.overallScore,
          completionRate: performanceData.completionRate,
          improvement: performanceData.subjectPerformance[0]?.trend || 0,
        },
        recentActivity,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
        role="main"
        aria-label="Dashboard"
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
          role="region"
          aria-label="Dashboard header"
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
            }}
          >
            Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/assignments/create')}
            aria-label="Create new assignment"
          >
            New Assignment
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            data-testid="refresh-button"
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                animation: `${slideIn} 0.5s ease-out`,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} md={3} key={action.id}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        animation: `${fadeIn} 0.5s ease-out ${index * 0.1}s both`,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                      onClick={() => navigate(action.path)}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          {action.icon === 'assignment' && (
                            <AssignmentIcon color={action.color as any} />
                          )}
                          {action.icon === 'auto_awesome' && (
                            <AutoAwesome color={action.color as any} />
                          )}
                          {action.icon === 'assessment' && (
                            <AssessmentIcon color={action.color as any} />
                          )}
                          {action.icon === 'trending_up' && (
                            <TrendingUp color={action.color as any} />
                          )}
                          <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {action.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* AI Chat Card */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                animation: `${scaleIn} 0.5s ease-out 0.2s both`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
              onClick={() => navigate('/dashboard/chat')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AutoAwesome sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    AI Chat Assistant
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Get instant help with your assignments, homework, and study questions. Our AI
                  assistant is available 24/7 to provide guidance and support.
                </Typography>
                <Box display="flex" alignItems="center" mt={2}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                    Start Chatting →
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Summary */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              }}
              role="region"
              aria-label="Performance summary"
            >
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Performance
                </Typography>
                <Typography
                  variant="h4"
                  component="p"
                  sx={{ fontWeight: 'bold', color: 'text.primary' }}
                >
                  {data.performanceSummary.averageGrade}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Assignments */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              }}
              role="region"
              aria-label="Recent assignments"
            >
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Recent Assignments
                </Typography>
                <List
                  sx={{
                    width: '100%',
                    bgcolor: 'background.paper',
                  }}
                  aria-label="List of recent assignments"
                >
                  {data.recentAssignments.map(assignment => (
                    <ListItem
                      key={assignment.id}
                      sx={{
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                      role="listitem"
                      aria-label={`Assignment: ${assignment.title}`}
                    >
                      <ListItemText
                        primary={assignment.title}
                        secondary={
                          <Typography variant="body2" color="text.secondary" component="span">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label={`View details for ${assignment.title}`}
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                        >
                          <ChevronRight />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Deadlines */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                animation: `${scaleIn} 0.5s ease-out 0.4s both`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarToday sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Upcoming Deadlines
                  </Typography>
                </Box>
                <List>
                  {data.upcomingDeadlines.map(deadline => (
                    <ListItem
                      key={deadline.id}
                      sx={{
                        animation: `${fadeIn} 0.5s ease-out`,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                        },
                      }}
                      onClick={() => navigate(`/assignments/${deadline.id}`)}
                    >
                      <ListItemIcon>
                        <CalendarToday />
                      </ListItemIcon>
                      <ListItemText
                        primary={deadline.title}
                        secondary={`Due: ${format(new Date(deadline.dueDate), 'MMM d, yyyy')}`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate('/assignments')}
                  sx={{ mt: 2 }}
                >
                  View All Deadlines
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Card
              sx={{
                animation: `${scaleIn} 0.5s ease-out 0.6s both`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssessmentIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Recent Activity
                  </Typography>
                </Box>
                <RecentActivityComponent activities={data.recentActivity} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Container>
  );
};

export default Dashboard;
