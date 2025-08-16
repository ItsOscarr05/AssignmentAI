import {
  AssignmentOutlined as AssignmentIcon,
  AutoAwesomeOutlined,
  CheckCircleOutline as CheckCircleIcon,
  InfoOutlined as InfoOutlinedIcon,
  LightbulbOutlined,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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
import React, { Suspense, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import DashboardPieChart from '../components/dashboard/DashboardPieChart';
import { useAuth } from '../contexts/AuthContext';
import { type Assignment } from '../data/mockData';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { api } from '../services/api';

import { mapToCoreSubject } from '../services/subjectService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

import { DateFormat, getDefaultDateFormat } from '../utils/dateFormat';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { breakpoint } = useAspectRatio();

  // Get user's date format preference (default to locale-based format if not set)
  const userDateFormat =
    (localStorage.getItem('dateFormat') as DateFormat) ||
    getDefaultDateFormat(navigator.language || 'en-US');

  // Simple date formatting function based on user preference
  const formatDateWithPreference = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    switch (userDateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in progress' | 'completed' | 'not started'>('all');
  const [page, setPage] = useState(0);
  const [distributionFilter, setDistributionFilter] = useState('total');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);

  // Fetch real assignments
  useEffect(() => {
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
  }, []);

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
    const source = assignments;
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
  }, [distributionFilter, assignments]);

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
    <Box
      sx={{
        overflow: 'hidden',
        width: '100%',
        padding: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
      }}
    >
      {/* Top Section: Welcome */}
      <Grid
        container
        spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 2)}
        sx={{ mb: 2, width: '100%' }}
      >
        <Grid item xs={11.5} md={12}>
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              display: 'flex',
              flexDirection: breakpoint === 'tall' ? 'column' : 'row',
              alignItems: breakpoint === 'tall' ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap:
                breakpoint === 'tall'
                  ? 1
                  : breakpoint === 'square'
                  ? 2
                  : breakpoint === 'standard'
                  ? 2
                  : breakpoint === 'wide'
                  ? 6
                  : 8,
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            {/* Welcome Content - Full Width */}
            <Box sx={{ flex: '1 1 100%', textAlign: 'center' }}>
              <Typography
                variant={
                  breakpoint === 'tall'
                    ? 'h5'
                    : breakpoint === 'square'
                    ? 'h4'
                    : breakpoint === 'standard'
                    ? 'h3'
                    : breakpoint === 'wide'
                    ? 'h2'
                    : breakpoint === 'ultra-wide'
                    ? 'h1'
                    : 'h1'
                }
                sx={{
                  fontWeight: 700,
                  color: '#D32F2F',
                  fontSize: getAspectRatioStyle(
                    aspectRatioStyles.typography.h1.fontSize,
                    breakpoint,
                    '1.5rem'
                  ),
                  mb: breakpoint === 'tall' || breakpoint === 'standard' ? 1 : 2,
                }}
              >
                Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: breakpoint === 'tall' || breakpoint === 'standard' ? 1 : 2 }}
              >
                Ready to tackle your assignments?
              </Typography>
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  maxWidth: '80%',
                  mx: 'auto',
                }}
              >
                AI Tip: Try asking me to analyze your assignment structure or suggest improvements!
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Middle Section: Recent & Active Assignments + Pie Chart */}
      <Grid
        container
        spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 3)}
        sx={{ mb: 3, width: '100%' }}
      >
        <Grid item xs={11.5} md={breakpoint === 'standard' ? 12 : 8}>
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box
              display="flex"
              flexDirection={breakpoint === 'tall' || breakpoint === 'standard' ? 'column' : 'row'}
              justifyContent="space-between"
              alignItems={
                breakpoint === 'tall' || breakpoint === 'standard' ? 'flex-start' : 'center'
              }
              mb={
                breakpoint === 'tall'
                  ? 1
                  : breakpoint === 'square'
                  ? 2
                  : breakpoint === 'standard'
                  ? 3
                  : breakpoint === 'wide'
                  ? 4
                  : 5
              }
              gap={
                breakpoint === 'tall'
                  ? 1
                  : breakpoint === 'square'
                  ? 2
                  : breakpoint === 'standard'
                  ? 3
                  : breakpoint === 'wide'
                  ? 4
                  : 5
              }
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#000000'),
                }}
              >
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
            <Box
              sx={{
                minHeight:
                  breakpoint === 'tall'
                    ? 250
                    : breakpoint === 'square'
                    ? 300
                    : breakpoint === 'standard'
                    ? 340
                    : 400,
                overflow: 'hidden',
              }}
            >
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
                        minWidth: { xs: '120px', md: '200px' },
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
                            Start by uploading your first assignment
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
                          {formatDateWithPreference(assignment.createdAt)}
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', md: 'row' },
                              gap: { xs: 0.5, md: 0.5 },
                              flexWrap: 'nowrap',
                              alignItems: { xs: 'flex-start', md: 'center' },
                              minWidth: { md: '180px' },
                            }}
                          >
                            <Button
                              size="small"
                              sx={{
                                color: '#009688',
                                minWidth: 'auto',
                                px: { xs: 1, md: 0.5 },
                                py: { xs: 0.5, md: 0.25 },
                              }}
                              onClick={() => setViewAssignment(assignment)}
                            >
                              <VisibilityOutlinedIcon
                                sx={{ fontSize: 16, mr: { xs: 0, md: 0.25 } }}
                              />
                              <Box
                                sx={{
                                  display: { xs: 'none', md: 'inline' },
                                  fontSize: '0.75rem',
                                }}
                              >
                                View
                              </Box>
                            </Button>
                            {assignment.status === 'Completed' && (
                              <Button
                                size="small"
                                sx={{
                                  color: '#8E24AA',
                                  minWidth: 'auto',
                                  px: { xs: 1, md: 0.5 },
                                  py: { xs: 0.5, md: 0.25 },
                                }}
                                onClick={() =>
                                  navigate('/dashboard/workshop', {
                                    state: { assignment, responseTab: 1 },
                                  })
                                }
                              >
                                <AutorenewOutlinedIcon
                                  sx={{ fontSize: 16, mr: { xs: 0, md: 0.25 } }}
                                />
                                <Box
                                  sx={{
                                    display: { xs: 'none', md: 'inline' },
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Regenerate
                                </Box>
                              </Button>
                            )}
                            {assignment.status === 'In Progress' && (
                              <Button
                                size="small"
                                sx={{
                                  color: '#FFA726',
                                  minWidth: 'auto',
                                  px: { xs: 1, md: 0.5 },
                                  py: { xs: 0.5, md: 0.25 },
                                }}
                                onClick={() =>
                                  navigate('/dashboard/workshop', {
                                    state: { assignment, responseTab: 1 },
                                  })
                                }
                              >
                                <PlayArrowOutlinedIcon
                                  sx={{ fontSize: 16, mr: { xs: 0, md: 0.25 } }}
                                />
                                <Box
                                  sx={{
                                    display: { xs: 'none', md: 'inline' },
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Resume
                                </Box>
                              </Button>
                            )}
                            <Button
                              size="small"
                              sx={{
                                color: '#D32F2F',
                                minWidth: 'auto',
                                px: { xs: 1, md: 0.5 },
                                py: { xs: 0.5, md: 0.25 },
                              }}
                              onClick={() =>
                                setAssignments(prev => prev.filter(a => a.id !== assignment.id))
                              }
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16, mr: { xs: 0, md: 0.25 } }} />
                              <Box
                                sx={{
                                  display: { xs: 'none', md: 'inline' },
                                  fontSize: '0.75rem',
                                }}
                              >
                                Delete
                              </Box>
                            </Button>
                          </Box>
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
        <Grid item xs={11.5} md={breakpoint === 'standard' ? 12 : 4}>
          {/* Assignment Disstribution Pie Chart */}
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              minHeight:
                breakpoint === 'tall'
                  ? 350
                  : breakpoint === 'square'
                  ? 450
                  : breakpoint === 'standard'
                  ? 520
                  : 600,
              height:
                breakpoint === 'tall'
                  ? 400
                  : breakpoint === 'square'
                  ? 500
                  : breakpoint === 'standard'
                  ? 550
                  : 650,
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                }}
              >
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
                height:
                  breakpoint === 'tall'
                    ? 200
                    : breakpoint === 'square'
                    ? 300
                    : breakpoint === 'standard'
                    ? 350
                    : 450,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pieChartData.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <AssignmentOutlinedIcon
                    sx={{ fontSize: 80, color: 'red', mb: 3, opacity: 0.5 }}
                  />
                  <Typography
                    variant="h4"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontWeight: 'normal' }}
                  >
                    No Subjects Yet
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'normal' }}>
                    Start by creating your first assignment
                  </Typography>
                </Box>
              ) : (
                <Suspense fallback={<div>Loading chart...</div>}>
                  <DashboardPieChart
                    data={pieChartData}
                    stats={stats}
                    distributionFilter={distributionFilter}
                  />
                </Suspense>
              )}
            </Box>
            {pieChartData.length > 0 && (
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
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
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
                      '& .MuiSelect-select': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.background.paper
                            : '#ffffff',
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
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section: AI Activity & Insights + AssignmentAI Suggests */}
      <Grid
        container
        spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 3)}
        sx={{ mb: 3, width: '100%' }}
      >
        <Grid item xs={11.5} md={12}>
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
              }}
            >
              AI Activity Insights
            </Typography>
            {mockActivity.assignmentsGenerated === 0 &&
            assignmentsCompletedCount === 0 &&
            (monthlyTokenUsage ?? 0) === 0 &&
            (lifetimeTokenUsage ?? 0) === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 120,
                  width: '100%',
                }}
              >
                <LightbulbOutlined sx={{ fontSize: 60, color: '#D32F2F', mb: 2, opacity: 0.5 }} />
                <Typography
                  variant="h5"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontWeight: 'normal' }}
                >
                  No Insights Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'normal' }}>
                  Start using AI features to see activity insights
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={{ xs: 1, md: 2 }}>
                <Grid item xs={6}>
                  <Paper
                    onClick={() =>
                      navigate('/dashboard/assignments', { state: { rowsPerPage: -1 } })
                    }
                    sx={{
                      p: { xs: 1, md: 2 },
                      textAlign: 'center',
                      boxShadow: 'none',
                      border: '1.5px solid #1976D2',
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
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
                        Assignments Generated
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
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
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
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
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
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
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
        <DialogTitle id="open-workshop-dialog-title">Open in Workshop</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to open <b>{selectedAssignment?.title}</b> in the workshop?
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
            {viewAssignment ? formatDateWithPreference(viewAssignment.createdAt) : ''}
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
