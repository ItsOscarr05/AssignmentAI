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
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
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
import React, { Suspense, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mapToCoreSubject } from '../services/subjectService';
import DashboardPieChart from './DashboardPieChart';

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

// Generate 20 more mock assignments
const extraAssignments = Array.from({ length: 20 }, (_, i) => {
  const subject = randomFrom(allSubjects);
  const status = randomFrom(statuses);
  const daysAgo = Math.floor(Math.random() * 60);
  // Realistic word count: 400-2000, tokens: 200-2000
  const wordCount = Math.floor(Math.random() * 1601) + 400;
  const tokensUsed = Math.floor(Math.random() * 1801) + 200;
  return {
    id: `mock-extra-${i}`,
    title: `${subject} Assignment #${i + 1}`,
    status,
    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    wordCount,
    tokensUsed,
  };
});

// Existing assignments (for demo)
const baseAssignments = [
  {
    id: '1',
    title: 'Math Homework',
    status: 'Completed',
    createdAt: '2024-03-15T10:00:00Z',
    wordCount: 1200,
    tokensUsed: 800,
  },
  {
    id: '2',
    title: 'Literature Essay',
    status: 'In Progress',
    createdAt: '2024-03-16T12:00:00Z',
    wordCount: 1800,
    tokensUsed: 1200,
  },
  {
    id: '3',
    title: 'Science Project',
    status: 'Not Started',
    createdAt: '2024-03-17T09:00:00Z',
    wordCount: 950,
    tokensUsed: 600,
  },
  {
    id: '4',
    title: 'History Paper',
    status: 'Completed',
    createdAt: '2024-03-18T14:00:00Z',
    wordCount: 1400,
    tokensUsed: 900,
  },
  {
    id: '5',
    title: 'Language Presentation',
    status: 'Completed',
    createdAt: '2024-03-19T11:00:00Z',
    wordCount: 700,
    tokensUsed: 400,
  },
  {
    id: '6',
    title: 'Tech Lab',
    status: 'In Progress',
    createdAt: '2024-03-20T13:00:00Z',
    wordCount: 1100,
    tokensUsed: 700,
  },
  {
    id: '7',
    title: 'Business Plan',
    status: 'Completed',
    createdAt: '2024-03-21T15:00:00Z',
    wordCount: 1600,
    tokensUsed: 1000,
  },
  {
    id: '8',
    title: 'Art Portfolio',
    status: 'Not Started',
    createdAt: '2024-03-22T16:00:00Z',
    wordCount: 800,
    tokensUsed: 500,
  },
  {
    id: '9',
    title: 'Fitness Report',
    status: 'Completed',
    createdAt: '2024-03-23T08:00:00Z',
    wordCount: 600,
    tokensUsed: 350,
  },
  {
    id: '10',
    title: 'Career Project',
    status: 'In Progress',
    createdAt: '2024-03-24T17:00:00Z',
    wordCount: 1300,
    tokensUsed: 850,
  },
];

// Combine base and extra assignments for a seasoned user
export const recentAssignments = [...baseAssignments, ...extraAssignments];

// Calculate AI Activity & Insights stats from mock data
const assignmentsGenerated = recentAssignments.length;
const assignmentsCompletedCount = recentAssignments.filter(a => a.status === 'Completed').length;
const monthlyTokenUsage = recentAssignments
  .filter(a => dayjs(a.createdAt).isSame(dayjs(), 'month'))
  .reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
const lifetimeTokenUsage = recentAssignments.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in progress' | 'completed' | 'not started'>('all');
  const [page, setPage] = useState(0);
  const [distributionFilter, setDistributionFilter] = useState('total');

  const stats = [
    {
      title: 'Total Assignments',
      value: '24',
      icon: <AssignmentIcon />,
      color: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
    },
    {
      title: 'Completed',
      value: '18',
      icon: <CheckCircleIcon />,
      color: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
    },
    {
      title: 'In Progress',
      value: '4',
      icon: <PendingIcon />,
      color: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
    },
  ];

  // Use calculated stats for activity & insights
  const mockActivity = {
    assignmentsGenerated,
  };

  const notStartedAssignments = useMemo(
    () =>
      recentAssignments
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
    () => new Set(recentAssignments.map(a => mapToCoreSubject(a.title))),
    []
  );
  const unusedCoreSubject = useMemo(
    () => coreSubjects.find(s => !usedSubjects.has(s)),
    [usedSubjects]
  );

  const mostFrequentSubject = useMemo(() => {
    const subjectFrequency = recentAssignments.reduce((acc, curr) => {
      const core = mapToCoreSubject(curr.title);
      if (core !== 'Other') {
        acc[core] = (acc[core] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(subjectFrequency).length === 0) return null;

    return Object.entries(subjectFrequency).sort((a, b) => b[1] - a[1])[0][0];
  }, []);

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

    const filteredAssignments =
      distributionFilter === 'total'
        ? recentAssignments
        : recentAssignments.filter(a => {
            const assignmentDate = dayjs(a.createdAt);
            if (distributionFilter === 'daily') return now.isSame(assignmentDate, 'day');
            if (distributionFilter === 'weekly') return now.isSame(assignmentDate, 'week');
            if (distributionFilter === 'monthly') return now.isSame(assignmentDate, 'month');
            if (distributionFilter === 'yearly') return now.isSame(assignmentDate, 'year');
            return true;
          });

    const subjectCounts: Record<string, number> = {};
    filteredAssignments.forEach(assignment => {
      const core = mapToCoreSubject(assignment.title);
      if (rainbowOrder.includes(core)) {
        subjectCounts[core] = (subjectCounts[core] || 0) + 1;
      }
    });

    return rainbowOrder
      .filter(core => subjectCounts[core])
      .map(core => ({ name: core, value: subjectCounts[core] }));
  }, [distributionFilter]);

  // Sort assignments newest to oldest
  const sortedAssignments = [...recentAssignments].sort(
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
    <Box>
      {/* Top Section: Welcome & Quick Start */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              border: '2px solid #D32F2F',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#D32F2F' }}>
                Welcome back, {user?.email?.split('@')[0] || 'User'}!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Ready to tackle your next assignment?
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                "Tip: Use AI to break down big tasks into manageable steps!"
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              border: '2px solid #D32F2F',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black' }}>
                Recent & Active Assignments
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={filter === 'all' ? 'contained' : 'outlined'}
                  color={filter === 'all' ? 'error' : 'inherit'}
                  onClick={() => setFilter('all')}
                  sx={
                    filter === 'all'
                      ? {}
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
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
                      ? {}
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
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
                      ? {}
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
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
                      ? {}
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                        }
                  }
                >
                  Completed
                </Button>
              </Stack>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#D32F2F', fontWeight: 700 }}>Assignment</TableCell>
                  <TableCell sx={{ color: '#D32F2F', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: '#D32F2F', fontWeight: 700 }}>Last Used</TableCell>
                  <TableCell sx={{ color: '#D32F2F', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.slice(page * 5, page * 5 + 5).map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.title}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          color:
                            assignment.status === 'Completed'
                              ? '#388E3C'
                              : assignment.status === 'In Progress'
                              ? '#FFA000'
                              : assignment.status === 'Not Started'
                              ? '#D32F2F'
                              : assignment.status === 'Draft Generated'
                              ? '#1976D2'
                              : '#8E24AA',
                          fontWeight: 600,
                        }}
                      >
                        {assignment.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(assignment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="small" sx={{ color: '#1976D2' }}>
                        📝 View
                      </Button>
                      {assignment.status === 'Completed' && (
                        <Button size="small" sx={{ color: '#8E24AA' }}>
                          🔄 Regenerate
                        </Button>
                      )}
                      {assignment.status === 'In Progress' && (
                        <Button size="small" sx={{ color: '#388E3C' }}>
                          ⏳ Resume
                        </Button>
                      )}
                      <Button size="small" sx={{ color: '#D32F2F' }}>
                        🗑️ Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <Grid item xs={12} md={4}>
          {/* Assignment Disstribution Pie Chart */}
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              border: '2px solid #D32F2F',
              minHeight: 520,
              height: 550,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
                height: 350,
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
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              border: '2px solid #D32F2F',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
              AI Activity & Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  onClick={() => navigate('/dashboard/assignments')}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #1976D2',
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
                    <AssignmentIcon sx={{ color: '#1976D2', mb: 1 }} />
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
                    navigate('/dashboard/assignments', { state: { status: 'Completed' } })
                  }
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #388E3C',
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
                    <CheckCircleIcon sx={{ color: '#388E3C', mb: 1 }} />
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
                    p: 2,
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
                    <TrendingUpIcon sx={{ color: '#8E24AA', mb: 1 }} />
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
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #FFA000',
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
                    <AutoAwesomeOutlined sx={{ color: '#FFA000', mb: 1 }} />
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
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              border: '2px solid #D32F2F',
              minHeight: 340,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
              AssignmentAI Suggestions
            </Typography>
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
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderColor: '#1976D2' }}
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
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderColor: '#388E3C' }}
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;
