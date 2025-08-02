import {
  AssignmentOutlined as AssignmentOutlinedIcon,
  AutorenewOutlined as AutorenewIcon,
  CheckCircleOutline as CheckCircleIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HourglassEmpty as HourglassIcon,
  InfoOutlined as InfoIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AssignmentEditDialog from '../components/assignments/AssignmentEdit';
import { useAuth } from '../contexts/AuthContext';
import { recentAssignmentsWithSubject } from '../data/mockData';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { assignments } from '../services/api/assignments';
import { mapToCoreSubject } from '../services/subjectService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';
import { DateFormat, getDefaultDateFormat } from '../utils/dateFormat';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  status: string;
  description: string;
  createdAt: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
  }>;
}

const Assignments: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMockUser } = useAuth();
  const { breakpoint } = useAspectRatio();

  // Get user's date format preference (default to locale-based format if not set)
  const userDateFormat =
    (localStorage.getItem('dateFormat') as DateFormat) ||
    getDefaultDateFormat(navigator.language || 'en-US');

  // Simple date formatting function based on user preference
  const formatDateWithPreference = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>(location.state?.status || 'all');
  const [filterName, setFilterName] = useState(location.state?.name || '');
  const [filterSubject, setFilterSubject] = useState(location.state?.subject || 'all');
  const [filterTimeframe, setFilterTimeframe] = useState(location.state?.timeframe || 'total');
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [dateView, setDateView] = useState<'year' | 'month' | 'day'>('year');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (filterTimeframe !== 'total') {
      setFilterDate(null);
    }
  }, [filterTimeframe]);

  useEffect(() => {
    if (filterDate) {
      setFilterTimeframe('total');
    }
  }, [filterDate]);

  useEffect(() => {
    if (location.state?.rowsPerPage !== undefined) {
      setRowsPerPage(location.state.rowsPerPage);
    }
    if (location.state?.status) {
      setFilterStatus(location.state.status);
    }
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    // Scroll to top when navigation state changes (e.g., after clicking dashboard cards)
    window.scrollTo(0, 0);
  }, [location.state]);

  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>(
    isMockUser
      ? recentAssignmentsWithSubject.map((a: any) => ({
          ...a,
          subject: a.subject || (a.title ? mapToCoreSubject(a.title) : 'Unknown'),
          description: a.description || '',
          attachments: a.attachments || [],
        }))
      : []
  );
  const [loading] = useState(false);

  // Custom styles
  const cardStyle = {
    backgroundColor: (theme: any) => (theme.palette.mode === 'dark' ? '#000814' : '#fff'),
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    transition: 'all 0.2s ease-in-out',
    border: '2px solid red',
    '&:hover': {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
  };

  const tableStyle = {
    border: '2px solid red',
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, assignmentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignmentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
  };

  const handleViewAssignment = (assignmentId: string) => {
    handleMenuClose();
    navigate(`/dashboard/assignments/${assignmentId}`);
    toast.success('Opening assignment details...');
  };

  const handleReopenInWorkshop = (assignmentId: string) => {
    handleMenuClose();
    const assignment = assignmentsList.find(a => a.id === assignmentId);
    if (assignment) {
      navigate('/dashboard/workshop', {
        state: {
          assignment: assignment,
          reopen: true,
        },
      });
      toast.success(`Reopening "${assignment.title}" in Workshop...`);
    }
  };

  const handleEditAssignment = (assignmentId: string) => {
    handleMenuClose();
    setEditAssignmentId(assignmentId);
    setEditDialogOpen(true);
    toast.success('Opening assignment editor...');
  };

  const handleDeleteClick = (assignmentId: string) => {
    handleMenuClose();
    const assignment = assignmentsList.find(a => a.id === assignmentId);
    if (assignment) {
      setAssignmentToDelete(assignment);
      setDeleteDialogOpen(true);
    }
  };

  // Define fetchAssignments only once, inside the component
  const fetchAssignments = async () => {
    try {
      const data = await assignments.getAll();
      setAssignmentsList(
        data.map((a: any) => ({
          ...a,
          subject: a.subject || (a.title ? mapToCoreSubject(a.title) : 'Unknown'),
          description: a.description || '',
          attachments: a.attachments || [],
        }))
      );
    } catch (error) {
      toast.error('Failed to fetch assignments.');
    }
  };

  useEffect(() => {
    if (!isMockUser) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMockUser]);

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;
    setDeleteLoading(true);
    try {
      await assignments.delete(assignmentToDelete.id);
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      toast.success(`Assignment "${assignmentToDelete.title}" deleted successfully`);
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditAssignmentId(null);
  };

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'Not Started':
        return <HourglassIcon sx={{ color: 'warning.main' }} />;
      case 'In Progress':
        return <AutorenewIcon sx={{ color: 'info.main' }} />;
      default:
        return null;
    }
  };

  // Subject to color mapping (same as DashboardPieChart)
  const subjectColorMap: Record<string, string> = {
    Math: '#D32F2F',
    Mathematics: '#D32F2F',
    English: '#FFD600',
    Literature: '#FFD600',
    Science: '#388E3C',
    Biology: '#388E3C',
    Chemistry: '#388E3C',
    Physics: '#388E3C',
    History: '#1976D2',
    'Social Studies': '#1976D2',
    Language: '#4FC3F7',
    'Foreign Language': '#4FC3F7',
    Spanish: '#4FC3F7',
    French: '#4FC3F7',
    Technology: '#B39DDB',
    Tech: '#B39DDB',
    'Computer Science': '#B39DDB',
    IT: '#B39DDB',
    Business: '#81C784',
    Economics: '#81C784',
    Accounting: '#81C784',
    Arts: '#8E24AA',
    Art: '#8E24AA',
    Music: '#8E24AA',
    Fitness: '#FFA000',
    Health: '#FFA000',
    PE: '#FFA000',
    'Health / PE': '#FFA000',
    'Career & Technical Ed': '#16A3A6',
    Career: '#16A3A6',
    CTE: '#16A3A6',
    Engineering: '#009688',
    Culinary: '#009688',
    Marketing: '#81C784',
    Finance: '#81C784',
    Drama: '#8E24AA',
    Band: '#8E24AA',
    Dance: '#8E24AA',
    Photography: '#8E24AA',
    Choir: '#8E24AA',
    Painting: '#8E24AA',
    Drawing: '#8E24AA',
    Mandarin: '#4FC3F7',
    Latin: '#4FC3F7',
    Japanese: '#4FC3F7',
    German: '#4FC3F7',
    Italian: '#4FC3F7',
    Algebra: '#D32F2F',
    Geometry: '#D32F2F',
    Civics: '#1976D2',
    Government: '#1976D2',
    Geography: '#1976D2',
    Astronomy: '#388E3C',
    Earth: '#388E3C',
    Writing: '#FFD600',
    Composition: '#FFD600',
    Reading: '#FFD600',
    Robotics: '#B39DDB',
    Visual: '#8E24AA',
    World: '#1976D2',
  };

  const getSubjectColor = (subject: string | undefined) => {
    if (!subject || typeof subject !== 'string') return 'inherit';
    // Try direct match
    if (subjectColorMap[subject]) return subjectColorMap[subject];
    // Try case-insensitive match
    const found = Object.keys(subjectColorMap).find(
      key => key.toLowerCase() === subject.toLowerCase()
    );
    if (found) return subjectColorMap[found];
    // Try partial match
    for (const key of Object.keys(subjectColorMap)) {
      if (subject.toLowerCase().includes(key.toLowerCase())) return subjectColorMap[key];
    }
    return 'inherit';
  };

  // Get unique subjects for dropdown
  const uniqueSubjects = Array.from(new Set(assignmentsList.map(a => a.subject))).sort();

  const filteredAssignments = assignmentsList
    .filter(assignment => {
      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
      const matchesName =
        filterName.trim() === '' ||
        assignment.title.toLowerCase().includes(filterName.toLowerCase());
      const matchesSubject = filterSubject === 'all' || assignment.subject === filterSubject;

      const assignmentDate = dayjs(assignment.createdAt);
      const matchesTimeframe = (() => {
        if (filterTimeframe === 'total') return true;
        const now = dayjs();
        if (filterTimeframe === 'daily') return now.isSame(assignmentDate, 'day');
        if (filterTimeframe === 'weekly') return now.isSame(assignmentDate, 'week');
        if (filterTimeframe === 'monthly') return now.isSame(assignmentDate, 'month');
        if (filterTimeframe === 'yearly') return now.isSame(assignmentDate, 'year');
        return true;
      })();

      const matchesDate =
        !filterDate ||
        (dateView === 'year' && assignmentDate.isSame(filterDate, 'year')) ||
        (dateView === 'month' && assignmentDate.isSame(filterDate, 'month')) ||
        (dateView === 'day' && assignmentDate.isSame(filterDate, 'day'));

      return matchesStatus && matchesName && matchesSubject && matchesDate && matchesTimeframe;
    })
    .sort((a, b) => {
      // If subject filter is "all", sort by date only (newest first)
      if (filterSubject === 'all') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      // If a specific subject is selected, sort by status priority first, then by date
      const statusPriority = {
        Completed: 1,
        'In Progress': 2,
        'Not Started': 3,
      };

      const statusA = statusPriority[a.status as keyof typeof statusPriority] || 4;
      const statusB = statusPriority[b.status as keyof typeof statusPriority] || 4;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // If status is the same, sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getAssignmentStats = () => {
    const total = assignmentsList.length;
    const completed = assignmentsList.filter(a => a.status === 'Completed').length;
    const subjectDistribution = assignmentsList.reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, completed, subjectDistribution };
  };

  const stats = getAssignmentStats();

  const displayedRows =
    rowsPerPage === -1
      ? filteredAssignments.slice(0, 500)
      : filteredAssignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
          backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000814' : '#fafafa'),
          minHeight: '100vh',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Header Section */}
        <Card
          sx={{
            ...cardStyle,
            mb: breakpoint === 'tall' ? 2 : 4,
            p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
          }}
        >
          <CardContent
            sx={{ p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2) }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: breakpoint === 'tall' ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: breakpoint === 'tall' ? 'flex-start' : 'center',
                gap: breakpoint === 'tall' ? 1 : 0,
              }}
            >
              <Box>
                <Typography
                  variant={breakpoint === 'tall' ? 'h5' : breakpoint === 'square' ? 'h4' : 'h3'}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 400,
                    borderBottom: 'none',
                    pb: 0,
                    display: 'inline-block',
                    fontSize: getAspectRatioStyle(
                      aspectRatioStyles.typography.h1.fontSize,
                      breakpoint,
                      '1.5rem'
                    ),
                  }}
                >
                  Assignments
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{
                    mt:
                      breakpoint === 'tall'
                        ? 0.5
                        : breakpoint === 'square'
                        ? 1
                        : breakpoint === 'standard'
                        ? 1.5
                        : breakpoint === 'wide'
                        ? 2
                        : 2.5,
                    fontSize: getAspectRatioStyle(
                      aspectRatioStyles.typography.body1.fontSize,
                      breakpoint,
                      '0.875rem'
                    ),
                  }}
                >
                  Manage and track all your academic assignments in one place
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Total Assignments: {stats.total}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Completed Assignments: {stats.completed}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Grid
          container
          spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 2)}
          sx={{
            mb:
              breakpoint === 'tall'
                ? 2
                : breakpoint === 'square'
                ? 3
                : breakpoint === 'standard'
                ? 4
                : breakpoint === 'wide'
                ? 5
                : 6,
            alignItems: 'center',
          }}
        >
          {/* Search Bar - Full Width on Mobile, First Position */}
          <Grid item xs={12} md={3}>
            <TextField
              placeholder="Filter by name..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000814' : '#ffffff'),
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'red',
                  borderWidth: '2px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'red',
                  borderWidth: '2px',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'red',
                  borderWidth: '2px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {filterName && (
                      <IconButton
                        aria-label="clear filter"
                        onClick={() => setFilterName('')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* 2x2 Grid for Mobile: Status, Subject, Timeframe, Date Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? '#000814' : '#ffffff',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Subject</InputLabel>
              <Select
                value={filterSubject}
                label="Subject"
                onChange={e => setFilterSubject(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? '#000814' : '#ffffff',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {uniqueSubjects.map(subject => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Timeframe</InputLabel>
              <Select
                value={filterTimeframe}
                label="Timeframe"
                onChange={e => setFilterTimeframe(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? '#000814' : '#ffffff',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
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
          </Grid>
          <Grid item xs={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Filter by date"
                value={filterDate}
                onChange={setFilterDate}
                views={['year', 'month', 'day']}
                openTo="year"
                onViewChange={setDateView}
                format={
                  dateView === 'year' ? 'YYYY' : dateView === 'month' ? 'MM/YYYY' : 'MM/DD/YYYY'
                }
                slotProps={{
                  field: { clearable: true, onClear: () => setFilterDate(null) },
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark' ? '#000814' : '#ffffff',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'red',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'red',
                        borderWidth: '2px',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'red',
                        borderWidth: '2px',
                      },
                    },
                    InputLabelProps: {
                      sx: {
                        color: 'red',
                        '&.Mui-focused': {
                          color: 'red',
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        {/* Assignments Table */}
        <TableContainer
          component={Paper}
          sx={{ ...tableStyle, overflow: 'hidden', maxWidth: '100%', width: '100%' }}
        >
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '40%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Title
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '20%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Subject
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '15%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Status
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Status Icons Legend:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                              <Typography variant="body2">Completed</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <AutorenewIcon sx={{ color: 'info.main', fontSize: 16 }} />
                              <Typography variant="body2">In Progress</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                              <Typography variant="body2">Not Started</Typography>
                            </Box>
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '15%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Date Created
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '10%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ p: 0 }}>
                    <Box
                      minHeight={530}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <AssignmentOutlinedIcon
                        sx={{ fontSize: 64, color: 'red', mb: 2, opacity: 0.5 }}
                      />
                      <Typography variant="h4" color="text.secondary" gutterBottom>
                        No Assignments Yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Start by uploading content or asking AI about an assignment.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}
                        >
                          {assignment.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                        >
                          {assignment.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Typography
                        sx={{
                          color: getSubjectColor(assignment.subject),
                          fontSize: { xs: '0.75rem', md: '1rem' },
                        }}
                      >
                        {assignment.subject}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, md: 1 } }}>
                        {getStatusIcon(assignment.status)}
                        <Typography
                          sx={{
                            fontSize: { xs: '0.75rem', md: '1rem' },
                            display: { xs: 'none', md: 'inline' },
                          }}
                        >
                          {assignment.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Typography sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}>
                        {formatDateWithPreference(new Date(assignment.createdAt))}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <IconButton onClick={e => handleMenuClick(e, assignment.id)} size="small">
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && selectedAssignment === assignment.id}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={() => handleViewAssignment(assignment.id)}>
                          <VisibilityIcon sx={{ mr: 1 }} /> View Assignment
                        </MenuItem>
                        <MenuItem onClick={() => handleReopenInWorkshop(assignment.id)}>
                          <RefreshIcon sx={{ mr: 1 }} /> Reopen in Workshop
                        </MenuItem>
                        <MenuItem onClick={() => handleEditAssignment(assignment.id)}>
                          <EditIcon sx={{ mr: 1 }} /> Edit Title/Metadata
                        </MenuItem>
                        <MenuItem
                          onClick={() => handleDeleteClick(assignment.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon sx={{ mr: 1 }} /> Delete
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
            component="div"
            count={filteredAssignments.length}
            rowsPerPage={rowsPerPage}
            page={rowsPerPage === -1 ? 0 : page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={event => {
              const value = parseInt(event.target.value, 10);
              setRowsPerPage(value === -1 ? -1 : value);
              setPage(0);
            }}
          />
        </TableContainer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Delete Assignment</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete "{assignmentToDelete?.title}"? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary" disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteLoading}
            >
              {deleteLoading ? <CircularProgress size={22} color="inherit" /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        <AssignmentEditDialog
          open={editDialogOpen}
          onClose={handleEditDialogClose}
          assignmentId={editAssignmentId || ''}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Assignments;
