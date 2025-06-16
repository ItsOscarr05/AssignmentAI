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
  CircularProgress,
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
  TableRow,
  Typography,
} from '@mui/material';
import React, { Suspense, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assignments } from '../services/api';

const DashboardPieChart = React.lazy(() => import('./DashboardPieChart'));

interface Assignment {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in progress' | 'completed'>('all');

  useEffect(() => {
    const fetchRecentAssignments = async () => {
      try {
        setLoading(true);
        const data = await assignments.getRecent();
        console.log('API Response:', data); // Debug log
        // Ensure data is an array and has createdAt
        const assignmentsArray = Array.isArray(data)
          ? data.map((a: any) => ({
              ...a,
              createdAt: a.createdAt || a.dueDate || new Date().toISOString(),
            }))
          : [];
        setRecentAssignments(assignmentsArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to fetch recent assignments');
        setRecentAssignments([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAssignments();
  }, []);

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
      subject: 'Mathematics',
    },
    {
      title: 'Science Project',
      dueDate: new Date('2024-03-20'),
      subject: 'Science',
    },
    {
      title: 'History Essay',
      dueDate: new Date('2024-03-10'),
      subject: 'History',
    },
    {
      title: 'English Presentation',
      dueDate: new Date('2024-03-22'),
      subject: 'English',
    },
  ];

  // Mock data for activity & insights
  const mockActivity = {
    assignmentsGenerated: 5,
    wordCountProcessed: 18400,
    aiTimeSaved: 2.8, // in hours
    tokenUsage: 13589, // mock tokens used
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
  const subjectColors = [
    '#1976D2', // Math
    '#388E3C', // Science
    '#FBC02D', // History
    '#8E24AA', // English
    '#D32F2F', // Other
  ];
  const pieChartData = Object.entries(subjectCounts).map(([subject, value], idx) => ({
    name: subject,
    value,
    color: subjectColors[idx % subjectColors.length],
  }));

  // Filter assignments based on selected filter
  const filteredAssignments = recentAssignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'in progress') return assignment.status.toLowerCase() === 'in progress';
    if (filter === 'completed') return assignment.status.toLowerCase() === 'completed';
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

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
              <Button variant="outlined" color="secondary">
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
                {filteredAssignments.map(assignment => (
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
                      {mockActivity.wordCountProcessed.toLocaleString()}
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
                      {mockActivity.tokenUsage.toLocaleString()}
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
