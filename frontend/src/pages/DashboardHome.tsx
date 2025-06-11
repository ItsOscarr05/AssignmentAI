import {
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Notifications as NotificationsIcon,
  Pending as PendingIcon,
  Token as TokenIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Popover from '@mui/material/Popover';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import React, { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPieChart = React.lazy(() => import('./DashboardPieChart'));

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Notification Logic ---
  const [notifications, setNotifications] = useState([
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
  const unreadCount = notifications.filter(n => !n.read).length;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleBellClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when opening
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);

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
    {
      title: 'Overdue',
      value: '2',
      icon: <ErrorIcon />,
      color: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
    },
  ];

  const pieChartData = [
    { name: 'Completed', value: 18, color: '#4CAF50' },
    { name: 'In Progress', value: 4, color: '#FFC107' },
    { name: 'Overdue', value: 2, color: '#F44336' },
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

  const recentActivity = [
    {
      action: 'Completed assignment',
      title: 'Math Homework',
      time: '2 hours ago',
    },
    {
      action: 'Started new project',
      title: 'Science Project',
      time: '5 hours ago',
    },
    {
      action: 'Updated progress',
      title: 'History Essay',
      time: '1 day ago',
    },
  ];

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Convert all dueDate strings to Date objects
  const assignmentDueDates = [
    ...recentAssignments.map(a => new Date(a.dueDate)),
    ...upcomingDeadlines.map(d => new Date(d.dueDate)),
  ];
  const assignmentsByDate = [
    ...recentAssignments.map(a => ({ ...a, type: 'recent', dueDate: new Date(a.dueDate) })),
    ...upcomingDeadlines.map(a => ({ ...a, type: 'upcoming', dueDate: new Date(a.dueDate) })),
  ];
  const assignmentsForSelectedDate = assignmentsByDate.filter(
    a => a.dueDate.toDateString() === selectedDate.toDateString()
  );

  // Custom CalendarDay component for red dot
  function CalendarDay(props: PickersDayProps<Date>, dueDates: Date[]) {
    const { day, ...other } = props;
    const isDue = dueDates.some(date => date.toDateString() === day.toDateString());
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <PickersDay day={day} {...other} />
        {isDue && (
          <span
            style={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#D32F2F',
              display: 'block',
            }}
          />
        )}
      </div>
    );
  }

  const CalendarDayWithDueDates = (props: PickersDayProps<Date>) =>
    CalendarDay(props, assignmentDueDates);

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography
              variant="h4"
              gutterBottom
              className="page-title"
              sx={{
                background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontWeight: 'bold',
              }}
            >
              Welcome back, {user?.email?.split('@')[0] || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's an overview of your academic progress and upcoming tasks.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              {/* Notification Bell with Popover */}
              <IconButton color="primary" sx={{ color: 'primary.main' }} onClick={handleBellClick}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { minWidth: 300, p: 1 } }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    px: 2,
                    pt: 1,
                    pb: 1,
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Notifications
                </Typography>
                <Divider />
                {notifications.length === 0 ? (
                  <Typography sx={{ p: 2, color: 'text.secondary' }}>No notifications</Typography>
                ) : (
                  notifications.map(notif => (
                    <Box
                      key={notif.id}
                      sx={{
                        px: 2,
                        py: 1,
                        mb: 0.5,
                        borderRadius: 1,
                        bgcolor: notif.read ? 'grey.50' : '#FFF5F5',
                        borderLeft: notif.read ? '4px solid transparent' : '4px solid #D32F2F',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {!notif.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#D32F2F',
                            mr: 1,
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: notif.read ? 400 : 600,
                            color: notif.read ? 'text.secondary' : '#D32F2F',
                          }}
                        >
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#D32F2F' }}>
                          {notif.timestamp}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Popover>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                onClick={() => navigate('/dashboard/assignments/create')}
              >
                New Assignment
              </Button>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                onClick={() => setCalendarOpen(true)}
              >
                View Calendar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Top Row: Unified Stats Card + Pie Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          {/* Unified Stats Card */}
          <Card
            sx={{
              height: '100%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              mb: 3,
              p: 1.5,
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
            }}
          >
            <CardContent sx={{ p: 0, width: '100%' }}>
              <Grid container spacing={2} justifyContent="center" alignItems="center">
                {stats.map((stat, _idx) => (
                  <Grid item xs={12} sm={6} md={3} key={stat.title}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 1.5,
                        px: 1,
                        background: stat.color,
                        color: '#fff',
                        borderRadius: 2,
                        minHeight: 80,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        transition: 'all 0.3s',
                        mb: 0.5,
                        mx: 0.5,
                        border: '2px solid #fff',
                        '&:hover': {
                          transform: 'scale(1.04)',
                          filter: 'brightness(1.08)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', fontSize: 28 }}>
                        {React.cloneElement(stat.icon, { sx: { fontSize: 28, color: '#fff' } })}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 500, color: '#fff', fontSize: 15 }}
                      >
                        {stat.title}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: '#fff', mt: 0.5, fontSize: 22 }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          {/* Assignment Distribution Chart */}
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              height: '100%',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontWeight: 'bold',
              }}
            >
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

      {/* Second Row: Recent Assignments & Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography
                variant="h6"
                sx={{
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold',
                }}
              >
                Recent Assignments
              </Typography>
              <Button
                variant="text"
                color="primary"
                endIcon={<TrendingUpIcon />}
                sx={{
                  '&:hover': {
                    transform: 'translateX(4px)',
                    transition: 'transform 0.3s ease-in-out',
                    color: '#D32F2F',
                  },
                }}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentAssignments.map((assignment, index) => (
                <React.Fragment key={assignment.title}>
                  <ListItem
                    sx={{
                      transition: 'background-color 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(33, 150, 243, 0.04)',
                        borderRadius: 1,
                      },
                    }}
                  >
                    <ListItemIcon>
                      <AssignmentIcon
                        sx={{
                          color:
                            assignment.progress === 100
                              ? '#C62828'
                              : assignment.progress < 50
                              ? '#F44336'
                              : '#FFD54F',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={assignment.title}
                      secondary={`Due: ${assignment.dueDate.toLocaleDateString()} | Status: ${
                        assignment.status
                      }`}
                    />
                    <Box sx={{ width: '100px', ml: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={assignment.progress}
                        color={
                          assignment.progress === 100
                            ? 'success'
                            : assignment.progress < 50
                            ? 'error'
                            : 'warning'
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          },
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" align="center">
                        {assignment.progress}%
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < recentAssignments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationsIcon
                sx={{
                  mr: 1,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold',
                }}
              >
                Recent Activity
              </Typography>
            </Box>
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.title}>
                  <ListItem
                    sx={{
                      transition: 'background-color 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(33, 150, 243, 0.04)',
                        borderRadius: 1,
                      },
                    }}
                  >
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box
                          component="span"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {activity.action} • {activity.time}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Third Row: AI Tokens & Upcoming Deadlines */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <TokenIcon
                sx={{
                  mr: 1,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold',
                }}
              >
                AI Tokens
              </Typography>
            </Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontWeight: 'bold',
              }}
            >
              1,234
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available tokens for AI assistance
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                boxShadow: '0 3px 5px 2px rgba(211, 47, 47, .15)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #B71C1C 30%, #FF1744 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px 2px rgba(211, 47, 47, .25)',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              Purchase More
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarIcon
                sx={{
                  mr: 1,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold',
                }}
              >
                Upcoming Deadlines
              </Typography>
            </Box>
            <List>
              {upcomingDeadlines.map((deadline, index) => (
                <React.Fragment key={deadline.title}>
                  <ListItem
                    sx={{
                      transition: 'background-color 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(33, 150, 243, 0.04)',
                        borderRadius: 1,
                      },
                    }}
                  >
                    <ListItemText
                      primary={deadline.title}
                      secondary={
                        <Box
                          component="span"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 16 }} />
                          {deadline.dueDate.toLocaleDateString()}
                        </Box>
                      }
                    />
                    <Chip
                      label={deadline.subject}
                      size="small"
                      sx={{
                        background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #B71C1C 30%, #FF1744 90%)',
                        },
                      }}
                    />
                  </ListItem>
                  {index < upcomingDeadlines.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: 22,
          }}
        >
          Calendar
        </DialogTitle>
        <DialogContent>
          <DateCalendar
            value={selectedDate}
            onChange={date => setSelectedDate(date ?? new Date())}
            sx={{
              '& .MuiPickersDay-root': {
                borderRadius: 2,
              },
              '& .Mui-selected': {
                background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                color: '#fff',
              },
            }}
            slots={{ day: CalendarDayWithDueDates }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#D32F2F', mb: 1 }}>
              Assignments Due
            </Typography>
            {assignmentsForSelectedDate.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No assignments due on this day.
              </Typography>
            ) : (
              <List>
                {assignmentsForSelectedDate.map((a, idx) => (
                  <ListItem
                    key={a.title + idx}
                    sx={{
                      borderLeft: '4px solid #D32F2F',
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: '#FFF5F5',
                    }}
                  >
                    <ListItemText
                      primary={a.title}
                      secondary={`Due: ${a.dueDate.toLocaleDateString()}${
                        'subject' in a && a.subject ? ' | ' + a.subject : ''
                      }`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DashboardHome;
