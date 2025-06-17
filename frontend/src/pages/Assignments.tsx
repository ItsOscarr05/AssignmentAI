import {
  AutorenewOutlined as AutorenewIcon,
  CheckCircleOutline as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HourglassEmpty as HourglassIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
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
  Typography,
  useTheme,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recentAssignments } from './DashboardHome';

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
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterName, setFilterName] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [assignmentsList] = useState<Assignment[]>(
    recentAssignments.map((a: any) => ({
      ...a,
      subject: a.subject || (a.title ? a.title.split(' ')[0] : 'Unknown'),
      description: a.description || '',
      attachments: a.attachments || [],
    }))
  );
  const [loading] = useState(false);

  // Custom styles
  const cardStyle = {
    backgroundColor: '#fff',
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

  const searchBarStyle = {
    border: '2px solid red',
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, assignmentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignmentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
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

  const filteredAssignments = assignmentsList.filter(assignment => {
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesName =
      filterName.trim() === '' || assignment.title.toLowerCase().includes(filterName.toLowerCase());
    const matchesSubject = filterSubject === 'all' || assignment.subject === filterSubject;
    const matchesDate = !filterDate || dayjs(assignment.createdAt).isSame(filterDate, 'day');
    return matchesStatus && matchesName && matchesSubject && matchesDate;
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
      <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        {/* Header Section */}
        <Card sx={{ ...cardStyle, mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 400,
                    borderBottom: 'none',
                    pb: 0,
                    display: 'inline-block',
                  }}
                >
                  Assignments
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                  Organize and manage your saved AI-generated work.
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Assignments: {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Assignments: {stats.completed}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value)}
                sx={{
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
          <Grid item xs={12} md={3}>
            <TextField
              placeholder="Filter by name..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              sx={{ ...searchBarStyle, width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Subject</InputLabel>
              <Select
                value={filterSubject}
                label="Subject"
                onChange={e => setFilterSubject(e.target.value)}
                sx={{
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
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Filter by date"
              value={filterDate}
              onChange={setFilterDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { ...searchBarStyle },
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Assignments Table */}
        <TableContainer component={Paper} sx={tableStyle}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1">{assignment.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: getSubjectColor(assignment.subject) }}>
                        {assignment.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(assignment.status)}
                        {assignment.status}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(assignment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={e => handleMenuClick(e, assignment.id)} size="small">
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && selectedAssignment === assignment.id}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={handleMenuClose}>
                          <VisibilityIcon sx={{ mr: 1 }} /> View Assignment
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose}>
                          <RefreshIcon sx={{ mr: 1 }} /> Reopen in Workshop
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose}>
                          <EditIcon sx={{ mr: 1 }} /> Edit Title/Metadata
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
                          <DeleteIcon sx={{ mr: 1 }} /> Delete
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAssignments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
};

export default Assignments;
