import {
  ArticleOutlined as ArticleIcon,
  AssignmentOutlined as AssignmentIcon,
  AutoAwesomeOutlined,
  CheckCircleOutline as CheckCircleIcon,
  CreateOutlined as CreateIcon,
  ExploreOutlined as ExploreIcon,
  InfoOutlined as InfoOutlinedIcon,
  LightbulbOutlined as LightbulbIcon,
  Pending as PendingIcon,
  PsychologyOutlined as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DashboardPieChart from '../components/dashboard/DashboardPieChart';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { notificationService } from '../services/notification';
import { mapToCoreSubject } from '../services/subjectService';
import { Notification } from '../types';

// Assignment interface to fix TypeScript errors
interface Assignment {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  wordCount: number;
  tokensUsed: number;
  subject?: string;
}

// Helper for random selection
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Core and mapped subjects for variety
const allSubjects = [
  'Math',
  'Fitness',
  'Literature',
  'Business',
  'Science',
  'Career & Technical Ed',
  'Language',
  'History',
  'Technology',
  'Arts',
  'Algebra',
  'Geometry',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'Accounting',
  'Spanish',
  'French',
  'Music',
  'Art',
  'PE',
  'Health',
  'Programming',
  'Robotics',
  'World History',
  'Civics',
  'Drama',
  'Band',
  'Dance',
  'Photography',
  'Engineering',
  'Culinary',
  'Marketing',
  'Finance',
  'IT',
  'Visual Arts',
  'Government',
  'Geography',
  'Astronomy',
  'Earth Science',
  'Writing',
  'Composition',
  'Reading',
  'Entrepreneurship',
  'Manufacturing',
  'Computer Science',
  'Choir',
  'Painting',
  'Drawing',
  'Mandarin',
  'Latin',
  'Japanese',
  'German',
  'Italian',
];
const statuses = ['Completed', 'In Progress', 'Not Started'];

// Generate a random number of mock assignments between 40 and 60 (inclusive) per session
const assignmentCount = Math.floor(Math.random() * (60 - 40 + 1)) + 40;

// Set the monthly token limit (e.g., 30,000 for Free plan)
const MONTHLY_TOKEN_LIMIT = 30000;
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

// Step 1: Generate all assignments with random tokens
let rawExtraAssignments = Array.from({ length: assignmentCount }, (_, i) => {
  const subject = randomFrom(allSubjects);
  const status = randomFrom(statuses);
  const daysAgo = Math.floor(Math.random() * 60);
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1200);
  const wordCount = Math.floor(Math.random() * 1601) + 400;
  const tokensUsed = Math.floor(Math.random() * 1801) + 200;
  return {
    id: `mock-extra-${i}`,
    title: `${subject} Assignment #${i + 1}`,
    status,
    createdAt: createdAt.toISOString(),
    wordCount,
    tokensUsed,
    _createdAtDate: createdAt, // for sorting
  };
});

// Step 2: Sort by date (oldest to newest)
rawExtraAssignments.sort((a, b) => a._createdAtDate.getTime() - b._createdAtDate.getTime());

// Step 3: Cap tokensUsed for current month
let tokensUsedThisMonth = 0;
for (let a of rawExtraAssignments) {
  const d = a._createdAtDate;
  if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
    if (tokensUsedThisMonth + a.tokensUsed > MONTHLY_TOKEN_LIMIT) {
      a.tokensUsed = Math.max(0, MONTHLY_TOKEN_LIMIT - tokensUsedThisMonth);
    }
    tokensUsedThisMonth += a.tokensUsed;
    if (tokensUsedThisMonth > MONTHLY_TOKEN_LIMIT) {
      a.tokensUsed = 0;
    }
  }
}
// Remove helper property
const extraAssignments: Assignment[] = rawExtraAssignments.map(
  ({ _createdAtDate, ...rest }) => rest as Assignment
);

// Existing assignments (for demo)
const baseAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Math Homework',
    status: 'Completed',
    createdAt: '2024-03-15T12:00:00Z',
    wordCount: 1200,
    tokensUsed: 800,
    subject: 'Math',
  },
  {
    id: '2',
    title: 'Literature Essay',
    status: 'In Progress',
    createdAt: '2024-03-16T12:00:00Z',
    wordCount: 1800,
    tokensUsed: 1200,
    subject: 'Literature',
  },
  {
    id: '3',
    title: 'Science Project',
    status: 'Not Started',
    createdAt: '2024-03-17T09:00:00Z',
    wordCount: 950,
    tokensUsed: 600,
    subject: 'Science',
  },
  {
    id: '4',
    title: 'History Paper',
    status: 'Completed',
    createdAt: '2024-03-18T14:00:00Z',
    wordCount: 1400,
    tokensUsed: 900,
    subject: 'History',
  },
  {
    id: '5',
    title: 'Language Presentation',
    status: 'Completed',
    createdAt: '2024-03-19T11:00:00Z',
    wordCount: 700,
    tokensUsed: 400,
    subject: 'Language',
  },
  {
    id: '6',
    title: 'Tech Lab',
    status: 'In Progress',
    createdAt: '2024-03-20T13:00:00Z',
    wordCount: 1120,
    tokensUsed: 700,
    subject: 'Technology',
  },
  {
    id: '7',
    title: 'Business Plan',
    status: 'Completed',
    createdAt: '2024-03-21T15:00:00Z',
    wordCount: 1600,
    tokensUsed: 1200,
    subject: 'Business',
  },
  {
    id: '8',
    title: 'Art Portfolio',
    status: 'Not Started',
    createdAt: '2024-03-22T16:00:00Z',
    wordCount: 800,
    tokensUsed: 500,
    subject: 'Arts',
  },
  {
    id: '9',
    title: 'Fitness Report',
    status: 'Completed',
    createdAt: '2024-03-23T08:00:00Z',
    wordCount: 600,
    tokensUsed: 350,
    subject: 'Fitness',
  },
  {
    id: '12',
    title: 'Career Project',
    status: 'In Progress',
    createdAt: '2024-03-24T17:00:00Z',
    wordCount: 1300,
    tokensUsed: 850,
    subject: 'Career & Technical Ed',
  },
];

// Combine base and extra assignments for a seasoned user
export const recentAssignments = [...baseAssignments, ...extraAssignments];

// Ensure all mock assignments have a subject property
const recentAssignmentsWithSubject = recentAssignments.map(a => ({
  ...a,
  subject: a.subject || mapToCoreSubject(a.title),
}));

const DashboardHome: React.FC = () => {
  const { user, isMockUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in progress' | 'completed' | 'not started'>('all');
  const [page, setPage] = useState(0);
  const [distributionFilter, setDistributionFilter] = useState('total');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);
  // Notification bell menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Token usage/remaining mock notifications
  const tokenLimits = [5000, 12000, 15000, 20000, 25000, 30000];
  const tokenUsed = tokenLimits[Math.floor(Math.random() * tokenLimits.length)];
  const tokenRemaining = 30000 - tokenUsed;
  const tokenNotificationVariants = [
    {
      title: 'Token Usage',
      body: `You have used ${tokenUsed.toLocaleString()} tokens this month.`,
    },
    {
      title: 'Token Remaining',
      body: `You have ${tokenRemaining.toLocaleString()} tokens remaining this month.`,
    },
  ];
  const randomTokenNotification =
    tokenNotificationVariants[Math.floor(Math.random() * tokenNotificationVariants.length)];

  // Token limit threshold notifications for mock users
  const tokenThresholds = [
    { percent: 75, remaining: 22500 },
    { percent: 50, remaining: 15000 },
    { percent: 25, remaining: 7500 },
    { percent: 12, remaining: 3000 },
  ];
  const tokenThresholdNotifications = tokenThresholds.map(t => ({
    title: 'Token Limit Warning',
    body: `You have ${t.remaining.toLocaleString()} tokens (${t.percent}%) remaining this month.`,
  }));

  // Mock notifications for mock users only
  const mockNotificationTemplates = [
    { title: 'Assignment Created', body: 'Your new assignment "Math Homework" was created.' },
    { title: 'Assignment In Progress', body: 'You started working on "Math Homework".' },
    { title: 'Assignment Completed', body: 'You completed "Math Homework". Well done!' },
    { title: 'Ready to Download', body: '"Math Homework" is ready to download.' },
    { title: 'Assignment graded', body: 'Your Math Homework was graded.' },
    { title: 'New assignment', body: 'A new Science Project was assigned.' },
    { title: 'Feedback received', body: 'You received feedback on your essay.' },
    randomTokenNotification,
    ...tokenThresholdNotifications,
    { title: 'Profile updated', body: 'Your profile was updated successfully.' },
    { title: 'AI suggestion', body: 'Try the new AI-powered summary tool!' },
    { title: 'Assignment due soon', body: 'Your Literature Essay is due tomorrow.' },
    { title: 'Welcome!', body: 'Thanks for trying AssignmentAI.' },
  ];
  const mockNotifications = useMemo(() => {
    if (!isMockUser) return [];
    const shuffled = [...mockNotificationTemplates].sort(() => 0.5 - Math.random());
    return shuffled
      .slice(0, Math.floor(Math.random() * 5) + 1)
      .map((n, i) => ({ ...n, id: i + 1 }));
  }, [isMockUser]);

  // Real notifications for real users
  const [realNotifications, setRealNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  useEffect(() => {
    if (!isMockUser) {
      setNotificationsLoading(true);
      notificationService
        .getNotifications({}, 0, 5)
        .then(n => setRealNotifications(n))
        .catch(() => setRealNotifications([]))
        .finally(() => setNotificationsLoading(false));
    }
  }, [isMockUser]);

  // Fetch real assignments if not mock user
  useEffect(() => {
    if (!isMockUser) {
      api
        .get('/assignments')
        .then(res => {
          const data = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.assignments)
            ? res.data.assignments
            : [];
          setAssignments(data);
        })
        .catch(() => {
          setError('Failed to fetch assignments.');
          setAssignments([]);
        });
    } else {
      setAssignments([...recentAssignmentsWithSubject]);
    }
  }, [isMockUser]);

  // Calculate stats from assignments
  const assignmentsGenerated = assignments.length;
  const assignmentsCompletedCount = assignments.filter(a => a.status === 'Completed').length;
  const monthlyTokenUsage = assignments
    .filter(a => dayjs(a.createdAt).isSame(dayjs(), 'month'))
    .reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
  const lifetimeTokenUsage = assignments.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);

  const stats = [
    {
      title: 'Total Assignments',
      value: '24',
      icon: <AssignmentIcon />,
      color: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 120%)',
    },
    {
      title: 'Completed',
      value: '18',
      icon: <CheckCircleIcon />,
      color: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 120%)',
    },
    {
      title: 'In Progress',
      value: '4',
      icon: <PendingIcon />,
      color: 'linear-gradient(135deg, #FFC127 0%, #FFA000 120%)',
    },
  ];

  // Use calculated stats for activity & insights
  const mockActivity = {
    assignmentsGenerated,
  };

  const notStartedAssignments = useMemo(
    () =>
      assignments
        .filter(a => a.status === 'Not Started')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    []
  );
  const suggestionAssignment = notStartedAssignments.length > 0 ? notStartedAssignments[0] : null;

  const coreSubjects = [
    'Math',
    'Fitness',
    'Literature',
    'Business',
    'Science',
    'Career & Technical Ed',
    'Language',
    'History',
    'Technology',
    'Music & Arts',
  ];
  const usedSubjects = useMemo(
    () =>
      isMockUser
        ? new Set(recentAssignmentsWithSubject.map(a => a.subject || mapToCoreSubject(a.title)))
        : new Set(assignments.map(a => a.subject || mapToCoreSubject(a.title))),
    [isMockUser, assignments]
  );
  const unusedCoreSubject = useMemo(
    () => coreSubjects.find(s => !usedSubjects.has(s)),
    [usedSubjects]
  );

  const mostFrequentSubject = useMemo(() => {
    const source = isMockUser ? recentAssignmentsWithSubject : assignments;
    const subjectFrequency = source.reduce((acc, curr) => {
      const core = curr.subject || mapToCoreSubject(curr.title);
      if (core !== 'Other') {
        acc[core] = (acc[core] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(subjectFrequency).length === 0) return null;

    return Object.entries(subjectFrequency).sort((a, b) => b[1] - a[1])[0][0];
  }, [isMockUser, assignments]);

  // Rainbow order for pie chart (counterclockwise, starting with red)
  const rainbowOrder = [
    'Math',
    'Fitness',
    'Literature',
    'Business',
    'Science',
    'Career & Technical Ed',
    'Language',
    'History',
    'Technology',
    'Music & Arts',
  ];

  const pieChartData = useMemo(() => {
    const now = dayjs();
    const source = isMockUser ? recentAssignmentsWithSubject : assignments;
    const filteredAssignments =
      distributionFilter === 'total'
        ? source
        : source.filter(a => {
            const assignmentDate = dayjs(a.createdAt);
            if (distributionFilter === 'daily') return now.isSame(assignmentDate, 'day');
            if (distributionFilter === 'weekly') return now.isSame(assignmentDate, 'week');
            if (distributionFilter === 'monthly') return now.isSame(assignmentDate, 'month');
            if (distributionFilter === 'yearly') return now.isSame(assignmentDate, 'year');
            return true;
          });

    const subjectCounts: Record<string, number> = {};
    filteredAssignments.forEach(assignment => {
      const core = assignment.subject || mapToCoreSubject(assignment.title);
      if (rainbowOrder.includes(core)) {
        subjectCounts[core] = (subjectCounts[core] || 0) + 1;
      }
    });

    return rainbowOrder
      .filter(core => subjectCounts[core])
      .map(core => ({ name: core, value: subjectCounts[core] }));
  }, [distributionFilter, isMockUser, assignments]);

  // Sort assignments newest to oldest
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filteredAssignments = sortedAssignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'in progress') return assignment.status.toLowerCase() === 'in progress';
    if (filter === 'completed') return assignment.status.toLowerCase() === 'completed';
    if (filter === 'not started') return assignment.status.toLowerCase() === 'not started';
    return true;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'hidden', width: '100%' }}>
      {/* Top Section: Welcome & Quick Start */}
      <Grid container spacing={{ xs: 0.5, md: 3 }} sx={{ mb: 2, width: '100%' }}>
        <Grid item xs={11.5} md={12}>
          <Paper
            sx={{
              p: { xs: 1, md: 3 },
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 0.25, md: 3 },
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: '#D32F2F',
                  fontSize: { xs: '1.5rem', md: '2.125rem' },
                }}
              >
                Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Ready to tackle your next assignment?
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                "Tip: Use AI to break down big tasks into manageable steps!"
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <IconButton
                aria-label="notifications"
                onClick={handleBellClick}
                sx={{
                  color: '#D32F2F',
                  mr: { xs: 0, sm: 1 },
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: '#f5f5f5',
                  },
                }}
              >
                <NotificationsNoneOutlinedIcon fontSize="medium" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{ sx: { minWidth: 300, maxWidth: 350, p: 1 } }}
              >
                {isMockUser && mockNotifications.length > 0 ? (
                  mockNotifications.map(n => (
                    <MenuItem key={n.id} onClick={handleMenuClose}>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold" sx={{ color: '#D32F2F' }}>
                            {n.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {n.body}
                          </Typography>
                        }
                      />
                    </MenuItem>
                  ))
                ) : !isMockUser && notificationsLoading ? (
                  <MenuItem disabled>
                    <Box
                      width="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      py={2}
                    >
                      <NotificationsNoneOutlinedIcon
                        sx={{ fontSize: 40, color: 'red', mb: 3, opacity: 0.5 }}
                      />
                      <Typography variant="h6" sx={{ color: '#222' }} gutterBottom>
                        Loading Notifications...
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : !isMockUser && realNotifications.length > 0 ? (
                  realNotifications.map(n => (
                    <MenuItem key={n.id} onClick={handleMenuClose}>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold" sx={{ color: '#D32F2F' }}>
                            {n.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {n.message}
                          </Typography>
                        }
                      />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Box
                      width="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      py={2}
                    >
                      <NotificationsNoneOutlinedIcon
                        sx={{ fontSize: 40, color: 'red', mb: 3, opacity: 0.5 }}
                      />
                      <Typography variant="h6" sx={{ color: '#222' }} gutterBottom>
                        No Notifications Yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#333' }}>
                        You're all caught up!
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
              </Menu>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/dashboard/workshop#upload-content-card')}
              >
                Upload Content
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/dashboard/assignments')}
              >
                Ask AI About an Assignment
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Middle Section: Recent & Active Assignments + Pie Chart */}
      <Grid container spacing={{ xs: 3, md: 3 }} sx={{ mb: 3, width: '100%' }}>
        <Grid item xs={11.5} md={8}>
          <Paper
            sx={{
              p: { xs: 1.5, md: 2 },
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              mb={{ xs: 1, md: 2 }}
              gap={{ xs: 1, md: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black' }}>
                Recent & Active Assignments
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Button
                  size="small"
                  variant={filter === 'all' ? 'contained' : 'outlined'}
                  color={filter === 'all' ? 'error' : 'inherit'}
                  onClick={() => setFilter('all')}
                  sx={
                    filter === 'all'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  All
                </Button>
                <Button
                  size="small"
                  variant={filter === 'not started' ? 'contained' : 'outlined'}
                  color={filter === 'not started' ? 'error' : 'inherit'}
                  onClick={() => setFilter('not started')}
                  sx={
                    filter === 'not started'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  Not Started
                </Button>
                <Button
                  size="small"
                  variant={filter === 'in progress' ? 'contained' : 'outlined'}
                  color={filter === 'in progress' ? 'error' : 'inherit'}
                  onClick={() => setFilter('in progress')}
                  sx={
                    filter === 'in progress'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  In Progress
                </Button>
                <Button
                  size="small"
                  variant={filter === 'completed' ? 'contained' : 'outlined'}
                  color={filter === 'completed' ? 'error' : 'inherit'}
                  onClick={() => setFilter('completed')}
                  sx={
                    filter === 'completed'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  Completed
                </Button>
              </Stack>
            </Box>
            <Box sx={{ minHeight: { xs: 280, md: 340 }, overflow: 'hidden' }}>
              <Table sx={{ width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '40%', md: 'auto' },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      Assignment
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '20%', md: 'auto' },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '20%', md: 'auto' },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      Last Used
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '20%', md: 'auto' },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ p: 0 }}>
                        <Box
                          minHeight={265}
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          height="100%"
                        >
                          <AssignmentOutlinedIcon
                            sx={{ fontSize: 54, color: 'red', mb: 2, opacity: 0.5 }}
                          />
                          <Typography variant="h5" color="text.secondary" gutterBottom>
                            No Assignments Yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Start by uploading content or asking AI about an assignment.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments.slice(page * 5, page * 5 + 5).map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          <span
                            style={{ cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
                            onClick={() => setSelectedAssignment(assignment)}
                            onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {assignment.title}
                          </span>
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          <span
                            style={{
                              color:
                                assignment.status === 'Completed'
                                  ? '#388E3C'
                                  : assignment.status === 'In Progress'
                                  ? '#1976D2'
                                  : assignment.status === 'Not Started'
                                  ? '#FFA726'
                                  : '#8E24AA',
                              fontWeight: 600,
                            }}
                          >
                            {assignment.status}
                          </span>
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          <Button
                            size="small"
                            sx={{ color: '#009688' }}
                            onClick={() => setViewAssignment(assignment)}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18, mr: { xs: 0, md: 0.5 } }} />
                            <Box sx={{ display: { xs: 'none', md: 'inline' } }}>View</Box>
                          </Button>
                          {assignment.status === 'Completed' && (
                            <Button
                              size="small"
                              sx={{ color: '#8E24AA' }}
                              onClick={() =>
                                navigate('/dashboard/workshop', {
                                  state: { assignment, responseTab: 1 },
                                })
                              }
                            >
                              <AutorenewOutlinedIcon
                                sx={{ fontSize: 18, mr: { xs: 0, md: 0.5 } }}
                              />
                              <Box sx={{ display: { xs: 'none', md: 'inline' } }}>Regenerate</Box>
                            </Button>
                          )}
                          {assignment.status === 'In Progress' && (
                            <Button
                              size="small"
                              sx={{ color: '#FFA726' }}
                              onClick={() =>
                                navigate('/dashboard/workshop', {
                                  state: { assignment, responseTab: 1 },
                                })
                              }
                            >
                              <PlayArrowOutlinedIcon
                                sx={{ fontSize: 18, mr: { xs: 0, md: 0.5 } }}
                              />
                              <Box sx={{ display: { xs: 'none', md: 'inline' } }}>Resume</Box>
                            </Button>
                          )}
                          <Button
                            size="small"
                            sx={{ color: '#D32F2F' }}
                            onClick={() =>
                              setAssignments(prev => prev.filter(a => a.id !== assignment.id))
                            }
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18, mr: { xs: 0, md: 0.5 } }} />
                            <Box sx={{ display: { xs: 'none', md: 'inline' } }}>Delete</Box>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              rowsPerPageOptions={[]}
              count={filteredAssignments.length}
              rowsPerPage={5}
              page={page}
              onPageChange={handleChangePage}
            />
          </Paper>
        </Grid>
        <Grid item xs={11.5} md={4}>
          {/* Assignment Disstribution Pie Chart */}
          <Paper
            sx={{
              p: { xs: 3, md: 3 },
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              minHeight: { xs: 400, md: 520 },
              height: { xs: 450, md: 550 },
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black' }}>
                Assignment Distribution
              </Typography>
              <Tooltip title="Select a section to navigate to assignments" arrow>
                <InfoOutlinedIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            </Box>
            <Box
              sx={{
                height: { xs: 250, md: 350 },
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Suspense fallback={<div>Loading chart...</div>}>
                <DashboardPieChart
                  data={pieChartData}
                  stats={stats}
                  distributionFilter={distributionFilter}
                />
              </Suspense>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="distribution-filter-label" sx={{ color: '#D32F2F' }}>
                  Timeframe
                </InputLabel>
                <Select
                  labelId="distribution-filter-label"
                  id="distribution-filter"
                  value={distributionFilter}
                  label="Timeframe"
                  onChange={e => setDistributionFilter(e.target.value)}
                  sx={{
                    color: '#D32F2F',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D32F2F',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D32F2F',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D32F2F',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#D32F2F',
                    },
                  }}
                >
                  <MenuItem value="total">Lifetime</MenuItem>
                  <MenuItem value="yearly">This Year</MenuItem>
                  <MenuItem value="monthly">This Month</MenuItem>
                  <MenuItem value="weekly">This Week</MenuItem>
                  <MenuItem value="daily">Today</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section: AI Activity & Insights + AssignmentAI Suggests */}
      <Grid container spacing={{ xs: 3, md: 3 }} sx={{ mb: 3, width: '100%' }}>
        <Grid item xs={11.5} md={6}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
              AI Activity & Insights
            </Typography>
            <Grid container spacing={{ xs: 1, md: 2 }}>
              <Grid item xs={6}>
                <Paper
                  onClick={() => navigate('/dashboard/assignments', { state: { rowsPerPage: -1 } })}
                  sx={{
                    p: { xs: 1, md: 2 },
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #1976D2',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderColor: '#1565C0',
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <AssignmentIcon sx={{ color: '#1976D2', mb: 3 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Assignments generated
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#1976D2', fontWeight: 700 }}>
                      {mockActivity.assignmentsGenerated}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  onClick={() =>
                    navigate('/dashboard/assignments', {
                      state: { rowsPerPage: -1, status: 'Completed' },
                    })
                  }
                  sx={{
                    p: { xs: 1, md: 2 },
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #388E3C',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderColor: '#2E7D32',
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <CheckCircleIcon sx={{ color: '#388E3C', mb: 3 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Assignments Completed
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#388E3C', fontWeight: 700 }}>
                      {assignmentsCompletedCount}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  onClick={() => navigate('/dashboard/ai-tokens')}
                  sx={{
                    p: { xs: 1, md: 2 },
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #8E24AA',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <TrendingUpIcon sx={{ color: '#8E24AA', mb: 3 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Monthly Token Usage
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#8E24AA', fontWeight: 700 }}>
                      {(monthlyTokenUsage ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  onClick={() => navigate('/dashboard/ai-tokens')}
                  sx={{
                    p: { xs: 1, md: 2 },
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #FFA000',
                    background: '#fff',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <AutoAwesomeOutlined sx={{ color: '#FFA000', mb: 3 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Lifetime Token Usage
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#FFA000', fontWeight: 700 }}>
                      {(lifetimeTokenUsage ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={11.5} md={6}>
          <Paper
            sx={{
              p: { xs: 1.5, md: 3 },
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
              AssignmentAI Suggestions
            </Typography>
            {assignments.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 6 }}
              >
                <LightbulbIcon sx={{ fontSize: 54, color: 'red', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Suggestions Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back later for personalized AI suggestions!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {suggestionAssignment && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderColor: '#8E24AA',
                    }}
                  >
                    <LightbulbIcon sx={{ color: '#8E24AA' }} />
                    <Typography variant="body2">
                      Get a head start on your{' '}
                      <RouterLink
                        to="/dashboard/assignments"
                        state={{ name: suggestionAssignment.title }}
                        style={{ fontWeight: 'bold', color: '#8E24AA', textDecoration: 'none' }}
                        onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {suggestionAssignment.title}
                      </RouterLink>{' '}
                      assignment. It's marked as 'Not Started'.
                    </Typography>
                  </Paper>
                )}
                {unusedCoreSubject && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderColor: '#1976D2',
                    }}
                  >
                    <ExploreIcon sx={{ color: '#1976D2' }} />
                    <Typography variant="body2">
                      Expand your knowledge. Why not start an assignment in{' '}
                      <RouterLink
                        to="/dashboard/assignments"
                        state={{ subject: unusedCoreSubject }}
                        style={{ fontWeight: 'bold', color: '#1976D2', textDecoration: 'none' }}
                        onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {unusedCoreSubject}
                      </RouterLink>
                      ?
                    </Typography>
                  </Paper>
                )}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderColor: '#1976D2',
                  }}
                >
                  <CreateIcon sx={{ color: '#1976D2' }} />
                  <Typography variant="body2">
                    Want to improve your writing? The{' '}
                    <RouterLink
                      to="/dashboard/workshop"
                      state={{ responseTab: 1 }}
                      style={{ fontWeight: 'bold', color: '#1976D2', textDecoration: 'none' }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Rewrite tool
                    </RouterLink>{' '}
                    can help refine your tone.
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderColor: '#388E3C',
                  }}
                >
                  <PsychologyIcon sx={{ color: '#388E3C' }} />
                  <Typography variant="body2">
                    Stuck on a problem? Use the{' '}
                    <RouterLink
                      to="/dashboard/workshop"
                      style={{ fontWeight: 'bold', color: '#388E3C', textDecoration: 'none' }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Workshop
                    </RouterLink>{' '}
                    to ask the AI for hints or explanations.
                  </Typography>
                </Paper>
                {mostFrequentSubject && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderColor: '#FFA000',
                    }}
                  >
                    <ArticleIcon sx={{ color: '#FFA000' }} />
                    <Typography variant="body2">
                      You're an expert in {mostFrequentSubject}. Try{' '}
                      <RouterLink
                        to="/dashboard/workshop"
                        state={{ responseTab: 3 }}
                        style={{ fontWeight: 'bold', color: '#FFA000', textDecoration: 'none' }}
                        onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        summarizing
                      </RouterLink>{' '}
                      your notes to prepare for an exam.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
      {/* Dialog for Open in Workshop */}
      <Dialog
        open={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        aria-labelledby="open-workshop-dialog-title"
      >
        <DialogTitle id="open-workshop-dialog-title">Open in Workshop?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to open <b>{selectedAssignment?.title}</b> in the Workshop?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAssignment(null)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              navigate('/dashboard/workshop', {
                state: {
                  assignment: selectedAssignment,
                  reopen: true,
                },
              });
              setSelectedAssignment(null);
            }}
            color="primary"
            variant="contained"
          >
            Open in Workshop
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add View Assignment Dialog below the Workshop dialog */}
      <Dialog
        open={!!viewAssignment}
        onClose={() => setViewAssignment(null)}
        aria-labelledby="view-assignment-dialog-title"
      >
        <DialogTitle id="view-assignment-dialog-title">Assignment Details</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <b>Title:</b> {viewAssignment?.title}
            <br />
            <b>Status:</b> {viewAssignment?.status}
            <br />
            <b>Created At:</b>{' '}
            {viewAssignment ? new Date(viewAssignment.createdAt).toLocaleString() : ''}
            <br />
            <b>Word Count:</b> {viewAssignment?.wordCount}
            <br />
            <b>Tokens Used:</b> {viewAssignment?.tokensUsed}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAssignment(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardHome;
