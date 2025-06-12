import {
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
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
  TableRow,
  Typography,
} from '@mui/material';
import React, { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPieChart = React.lazy(() => import('./DashboardPieChart'));

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Notification Logic ---
  const [] = useState([
    {
      id: 1,
      message: 'Math Homework is due soon!',
      type: 'deadline',
      read: false,
      timestamp: '2h ago',
    },
    {
      id: 2,
      message: 'Science Project marked as completed.',
      type: 'success',
      read: false,
      timestamp: '5h ago',
    },
    {
      id: 3,
      message: 'History Essay progress updated.',
      type: 'info',
      read: true,
      timestamp: '1d ago',
    },
    {
      id: 4,
      message: 'New assignment added: English Presentation.',
      type: 'new',
      read: false,
      timestamp: '1d ago',
    },
  ]);
  const [] = useState<null | HTMLElement>(null);

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

  const recentAssignments = [
    {
      title: 'Math Homework',
      dueDate: new Date('2024-03-15'),
      progress: 75,
      status: 'In Progress',
    },
    {
      title: 'Science Project',
      dueDate: new Date('2024-03-20'),
      progress: 100,
      status: 'Completed',
    },
    {
      title: 'History Essay',
      dueDate: new Date('2024-03-10'),
      progress: 30,
      status: 'In Progress',
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
  ];

  const [] = useState(false);
  const [] = useState<Date>(new Date());

  // Gather all subjects from recentAssignments and upcomingDeadlines
  const allAssignments = [
    ...recentAssignments.map(a => ({ subject: a.title.split(' ')[0] })),
    ...upcomingDeadlines.map(a => ({ subject: a.subject })),
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
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard/assignments/create')}
              >
                Start New Assignment
              </Button>
              <Button variant="outlined" color="primary">
                Upload PDF / Paste Text
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
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#D32F2F' }}>
                Recent & Active Assignments
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined">
                  All
                </Button>
                <Button size="small" variant="outlined">
                  In Progress
                </Button>
                <Button size="small" variant="outlined">
                  Completed
                </Button>
                <Button size="small" variant="outlined">
                  Saved
                </Button>
              </Stack>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAssignments.map(assignment => (
                  <TableRow key={assignment.title}>
                    <TableCell>{assignment.title}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          color:
                            assignment.status === 'Completed'
                              ? '#388E3C'
                              : assignment.status === 'In Progress'
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
                    <TableCell>{assignment.dueDate.toLocaleDateString()}</TableCell>
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
              minHeight: 370,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#D32F2F' }}>
              Assignment Distribution
            </Typography>
            <Box sx={{ height: 200, width: '100%' }}>
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
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#D32F2F' }}>
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
                    <AddIcon sx={{ color: '#1976D2', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Assignments generated
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#1976D2', fontWeight: 700 }}>
                      7
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
                    <AssignmentIcon sx={{ color: '#388E3C', mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Word count processed
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#388E3C', fontWeight: 700 }}>
                      12,500
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
                      3.5 hrs
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
                      Plan usage
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#FFA000', fontWeight: 700 }}>
                      3/10
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
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#D32F2F' }}>
              AssignmentAI Suggestions
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary={
                    <span>
                      🪄 Continue where you left off: You started "PHIL 120 Essay" yesterday.{' '}
                      <span style={{ color: '#8E24AA', fontWeight: 600 }}>Resume now?</span>
                    </span>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={
                    <span>
                      📄 Summarize your latest upload: Your recent PDF upload is ready.{' '}
                      <span style={{ color: '#1976D2', fontWeight: 600 }}>Generate summary?</span>
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
