import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  HourglassEmpty as HourglassIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  status: 'Completed' | 'Not Started';
  priority: 'High' | 'Medium' | 'Low';
  description: string;
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
  const [filterPriority, setFilterPriority] = useState<string>('all');

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

  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Math Homework',
      subject: 'Mathematics',
      status: 'Not Started',
      priority: 'High',
      description: 'Complete exercises 1-10 from Chapter 5',
    },
    {
      id: '2',
      title: 'Science Project',
      subject: 'Science',
      status: 'Completed',
      priority: 'Medium',
      description: 'Research and present findings on renewable energy',
    },
    {
      id: '3',
      title: 'History Essay',
      subject: 'History',
      status: 'Not Started',
      priority: 'Low',
      description: 'Write a 2000-word essay on World War II',
    },
    {
      id: '4',
      title: 'Literature Review',
      subject: 'English',
      status: 'Not Started',
      priority: 'Low',
      description: 'Review and analyze "To Kill a Mockingbird"',
    },
  ];

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
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        return 'red';
      case 'science':
        return 'green';
      case 'history':
        return 'blue';
      case 'english':
      case 'literature':
        return '#FFA500'; // orange-yellow
      default:
        return 'inherit';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || assignment.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getAssignmentStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'Completed').length;
    const subjectDistribution = assignments.reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const priorityDistribution = assignments.reduce((acc, curr) => {
      acc[curr.priority] = (acc[curr.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, completed, subjectDistribution, priorityDistribution };
  };

  const stats = getAssignmentStats();

  return (
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

      {/* Cards Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Activity Card */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                Recent Activity
              </Typography>
              {assignments.slice(0, 3).map(assignment => (
                <Box
                  key={assignment.id}
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  {getStatusIcon(assignment.status)}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {assignment.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assignment.subject}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats Card */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                Quick Stats
              </Typography>
              <Accordion sx={{ mb: 1, boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    minHeight: '48px',
                  }}
                >
                  <Typography variant="subtitle2">By Subject</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(stats.subjectDistribution)
                    .sort(([a], [b]) => {
                      // Custom sort order: Mathematics, English, Science, then others alphabetically
                      if (a.toLowerCase() === 'mathematics') return -1;
                      if (b.toLowerCase() === 'mathematics') return 1;
                      if (a.toLowerCase() === 'english') return -1;
                      if (b.toLowerCase() === 'english') return 1;
                      if (a.toLowerCase() === 'science') return -1;
                      if (b.toLowerCase() === 'science') return 1;
                      return a.localeCompare(b);
                    })
                    .map(([subject, count]) => (
                      <Box
                        key={subject}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.5,
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ color: getSubjectColor(subject) }}>
                          {subject}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {count}
                        </Typography>
                      </Box>
                    ))}
                </AccordionDetails>
              </Accordion>
              <Accordion sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    minHeight: '48px',
                  }}
                >
                  <Typography variant="subtitle2">By Priority</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(stats.priorityDistribution).map(([priority, count]) => (
                    <Box
                      key={priority}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                        p: 0.5,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            priority === 'High'
                              ? 'red'
                              : priority === 'Medium'
                              ? '#FFD700'
                              : priority === 'Low'
                              ? 'green'
                              : 'inherit',
                        }}
                      >
                        {priority}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Workshop Integration Card */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                Workshop
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Create and manage your assignments with AI assistance in the Workshop.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/workshop')}
                fullWidth
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                Go to Workshop
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{ ...searchBarStyle, width: '100%', mb: 2 }}
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
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'red' }}>Priority</InputLabel>
            <Select
              value={filterPriority}
              label="Priority"
              onChange={e => setFilterPriority(e.target.value)}
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
              <MenuItem value="High" sx={{ color: 'error.main' }}>
                High
              </MenuItem>
              <MenuItem value="Medium" sx={{ color: 'warning.main' }}>
                Medium
              </MenuItem>
              <MenuItem value="Low" sx={{ color: 'success.main' }}>
                Low
              </MenuItem>
            </Select>
          </FormControl>
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
              <TableCell>Priority</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssignments
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(assignment => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.title}</TableCell>
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
                  <TableCell>
                    <Chip
                      label={assignment.priority}
                      color={getPriorityColor(assignment.priority)}
                      size="small"
                    />
                  </TableCell>
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
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredAssignments.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default Assignments;
