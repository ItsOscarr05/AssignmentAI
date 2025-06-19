import {
  AccessTime as AccessTimeIcon,
  AssignmentOutlined as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TextFieldsOutlined as TextIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import React, { Suspense, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
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
  const daysAgo = Math.floor(Math.random() * 60) + 1;
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
const wordCountProcessed = recentAssignments.reduce((sum, a) => sum + (a.wordCount || 0), 0);
const aiTimeSaved = (assignmentsGenerated * 0.12).toFixed(1); // still estimate 0.12 hours per assignment

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [] = useState(false);
  const [error] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in progress' | 'completed'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch subscription token limit from backend
  const [subscriptionTokenLimit, setSubscriptionTokenLimit] = useState<number>(30000); // default
  useEffect(() => {
    async function fetchTokenLimit() {
      try {
        const response = await api.get('/subscriptions/current');
        setSubscriptionTokenLimit(response.data.token_limit);
      } catch (e) {
        setSubscriptionTokenLimit(30000); // fallback
      }
    }
    fetchTokenLimit();
  }, []);

  // Calculate token usage based on mock assignments
  const tokenUsage = recentAssignments.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
  const usedTokens = tokenUsage;

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

  const upcomingDeadlines = [
    {
      title: 'Math Homework',
      dueDate: new Date('2024-03-15'),
      subject: 'Math',
    },
    {
      title: 'Literature Essay',
      dueDate: new Date('2024-03-16'),
      subject: 'Literature',
    },
    {
      title: 'Science Project',
      dueDate: new Date('2024-03-17'),
      subject: 'Science',
    },
    {
      title: 'History Paper',
      dueDate: new Date('2024-03-18'),
      subject: 'History',
    },
    {
      title: 'Language Presentation',
      dueDate: new Date('2024-03-19'),
      subject: 'Language',
    },
    {
      title: 'Tech Lab',
      dueDate: new Date('2024-03-20'),
      subject: 'Technology',
    },
    {
      title: 'Business Plan',
      dueDate: new Date('2024-03-21'),
      subject: 'Business',
    },
    {
      title: 'Art Portfolio',
      dueDate: new Date('2024-03-22'),
      subject: 'Arts',
    },
    {
      title: 'Fitness Report',
      dueDate: new Date('2024-03-23'),
      subject: 'Fitness',
    },
    {
      title: 'Career Project',
      dueDate: new Date('2024-03-24'),
      subject: 'Career & Technical Ed',
    },
  ];

  // Use calculated stats for activity & insights
  const mockActivity = {
    assignmentsGenerated,
    wordCountProcessed,
    aiTimeSaved,
    tokenUsage,
  };

  // Gather all subjects from recentAssignments and upcomingDeadlines
  const normalizeSubject = (subject: string) => {
    if (subject.toLowerCase() === 'math') return 'Mathematics';
    if (subject.toLowerCase() === 'mathematics') return 'Mathematics';
    return subject;
  };
  const allAssignments = [
    ...recentAssignments.map(a => ({ subject: normalizeSubject(a.title.split(' ')[0]) })),
    ...upcomingDeadlines.map(a => ({ subject: normalizeSubject(a.subject) })),
  ];
  const subjectCounts: { [subject: string]: number } = {};
  allAssignments.forEach(a => {
    if (a.subject in subjectCounts) {
      subjectCounts[a.subject] += 1;
    } else {
      subjectCounts[a.subject] = 1;
    }
  });

  // Core subjects and their canonical names
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

  // Map any subject to its core subject
  const mapToCoreSubject = (subject: string): string => {
    const s = subject.toLowerCase();
    if (['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'statistics'].includes(s))
      return 'Math';
    if (['fitness', 'health', 'pe', 'health / pe', 'physical education', 'wellness'].includes(s))
      return 'Fitness';
    if (['literature', 'english', 'writing', 'composition', 'reading'].includes(s))
      return 'Literature';
    if (
      ['business', 'economics', 'accounting', 'finance', 'entrepreneurship', 'marketing'].includes(
        s
      )
    )
      return 'Business';
    if (
      [
        'science',
        'biology',
        'chemistry',
        'physics',
        'earth science',
        'astronomy',
        'environmental science',
      ].includes(s)
    )
      return 'Science';
    if (
      [
        'career & technical ed',
        'cte',
        'vocational',
        'engineering',
        'manufacturing',
        'culinary',
      ].includes(s)
    )
      return 'Career & Technical Ed';
    if (
      [
        'language',
        'foreign language',
        'spanish',
        'french',
        'german',
        'latin',
        'mandarin',
        'japanese',
        'italian',
      ].includes(s)
    )
      return 'Language';
    if (
      [
        'history',
        'social studies',
        'civics',
        'government',
        'geography',
        'politics',
        'world history',
        'us history',
      ].includes(s)
    )
      return 'History';
    if (
      [
        'technology',
        'computer science',
        'computers',
        'coding',
        'programming',
        'it',
        'information technology',
        'robotics',
      ].includes(s)
    )
      return 'Technology';
    if (
      [
        'arts',
        'art',
        'music',
        'theater',
        'drama',
        'visual arts',
        'painting',
        'drawing',
        'choir',
        'band',
        'dance',
        'photography',
      ].includes(s)
    )
      return 'Music & Arts';
    // Default: try to match by partial string
    for (const core of coreSubjects) {
      if (s.includes(core.toLowerCase())) return core;
    }
    return 'Other';
  };

  // Aggregate subject counts into core categories
  const coreSubjectCounts: Record<string, number> = {};
  Object.entries(subjectCounts).forEach(([subject, count]) => {
    const core = mapToCoreSubject(subject);
    if (!coreSubjects.includes(core)) return; // skip 'Other'
    coreSubjectCounts[core] = (coreSubjectCounts[core] || 0) + count;
  });

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

  const pieChartData = rainbowOrder
    .filter(core => coreSubjectCounts[core])
    .map(core => ({ name: core, value: coreSubjectCounts[core] }));

  // Sort assignments newest to oldest
  const sortedAssignments = [...recentAssignments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filteredAssignments = sortedAssignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'in progress') return assignment.status.toLowerCase() === 'in progress';
    if (filter === 'completed') return assignment.status.toLowerCase() === 'completed';
    return true;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
                onClick={() => navigate('/dashboard/workshop')}
              >
                Upload Content
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/dashboard/workshop?summarize=1')}
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
                {filteredAssignments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(assignment => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.title}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            color:
                              assignment.status === 'Completed'
                                ? '#388E3C'
                                : assignment.status === 'In Progress'
                                ? '#D32F2F'
                                : assignment.status === 'Not Started'
                                ? '#FFA000'
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
              rowsPerPageOptions={[5, 10, 25]}
              count={filteredAssignments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
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
              minHeight: 450,
              height: 500,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
              Assignment Distribution
            </Typography>
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
                <DashboardPieChart data={pieChartData} stats={stats} />
              </Suspense>
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
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #1976D2',
                    background: '#fff',
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
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #388E3C',
                    background: '#fff',
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <TextIcon sx={{ color: '#388E3C', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Word count processed
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#388E3C', fontWeight: 700 }}>
                      {(mockActivity.wordCountProcessed ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #8E24AA',
                    background: '#fff',
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <AccessTimeIcon sx={{ color: '#8E24AA', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      AI time saved
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#8E24AA', fontWeight: 700 }}>
                      {mockActivity.aiTimeSaved} hrs
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    boxShadow: 'none',
                    border: '1.5px solid #FFA000',
                    background: '#fff',
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <TrendingUpIcon sx={{ color: '#FFA000', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Token usage
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#FFA000', fontWeight: 700 }}>
                      {(usedTokens ?? 0).toLocaleString()}
                      {subscriptionTokenLimit
                        ? ` / ${(subscriptionTokenLimit ?? 0).toLocaleString()}`
                        : ''}
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
              minHeight: 220,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
              AssignmentAI Suggestions
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary={
                    <span>
                      🪄 Continue where you left off: You started "PHIL 120 Essay" yesterday.{' '}
                      <RouterLink
                        to="/dashboard/workshop"
                        style={{
                          color: '#8E24AA',
                          fontWeight: 600,
                          textDecoration: 'none',
                          borderBottom: '2px solid transparent',
                          transition: 'border-color 0.2s',
                        }}
                        onMouseOver={e =>
                          (e.currentTarget.style.borderBottom = '2px solid #8E24AA')
                        }
                        onMouseOut={e =>
                          (e.currentTarget.style.borderBottom = '2px solid transparent')
                        }
                        onTouchStart={e =>
                          (e.currentTarget.style.borderBottom = '2px solid #8E24AA')
                        }
                        onTouchEnd={e =>
                          (e.currentTarget.style.borderBottom = '2px solid transparent')
                        }
                      >
                        Resume now?
                      </RouterLink>
                    </span>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={
                    <span>
                      📄 Summarize your latest upload: Your recent PDF upload is ready.{' '}
                      <RouterLink
                        to="/dashboard/workshop?summarize=1"
                        style={{
                          color: '#1976D2',
                          fontWeight: 600,
                          textDecoration: 'none',
                          borderBottom: '2px solid transparent',
                          transition: 'border-color 0.2s',
                        }}
                        onMouseOver={e =>
                          (e.currentTarget.style.borderBottom = '2px solid #1976D2')
                        }
                        onMouseOut={e =>
                          (e.currentTarget.style.borderBottom = '2px solid transparent')
                        }
                        onTouchStart={e =>
                          (e.currentTarget.style.borderBottom = '2px solid #1976D2')
                        }
                        onTouchEnd={e =>
                          (e.currentTarget.style.borderBottom = '2px solid transparent')
                        }
                      >
                        Generate summary?
                      </RouterLink>
                    </span>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={
                    <span>
                      💡 AI tip: Try{' '}
                      <span style={{ color: '#388E3C', fontWeight: 600 }}>
                        breaking big tasks into smaller steps
                      </span>{' '}
                      for faster progress!
                    </span>
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;
