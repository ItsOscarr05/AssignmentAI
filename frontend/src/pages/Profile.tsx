import {
  AccountCircle,
  Assignment,
  Badge,
  CalendarMonth,
  Edit,
  Email,
  Language,
  LocationOn,
  School,
  Timeline,
  Verified,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfileSection = ({ title, icon, children }: any) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        borderRadius: 3,
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(50,50,50,0.9) 0%, rgba(40,40,40,0.9) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: '#ffffff',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h5" fontWeight="normal">
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
};

const StatCard = ({ icon, title, value, color }: any) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          background: '#ffffff',
          color: color || theme.palette.primary.main,
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        {value}
      </Typography>
      <Typography color="text.secondary">{title}</Typography>
    </Paper>
  );
};

const ActivityItem = ({ title, date, status, icon }: any) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            background: '#ffffff',
            color: theme.palette.primary.main,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {date}
          </Typography>
        </Box>
        <Chip
          label={status}
          size="small"
          color={
            status === 'Completed'
              ? 'success'
              : status === 'In Progress'
              ? 'warning'
              : status === 'Overdue'
              ? 'error'
              : 'default'
          }
          sx={{ borderRadius: 1 }}
        />
      </Stack>
    </Box>
  );
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const stats = [
    { icon: <Assignment />, title: 'Total Assignments', value: '156' },
    { icon: <Verified />, title: 'Completed', value: '134' },
    { icon: <Timeline />, title: 'In Progress', value: '12' },
    { icon: <CalendarMonth />, title: 'Overdue', value: '10' },
  ];

  const recentActivity = [
    {
      title: 'Research Paper: Machine Learning',
      date: '2 hours ago',
      status: 'In Progress',
      icon: <Assignment />,
    },
    {
      title: 'Math Assignment: Calculus II',
      date: 'Yesterday',
      status: 'Completed',
      icon: <Assignment />,
    },
    {
      title: 'Physics Lab Report',
      date: '3 days ago',
      status: 'Overdue',
      icon: <Assignment />,
    },
  ];

  return (
    <Box sx={{ width: '100%', position: 'relative', px: 2, pb: 4 }}>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          pt: 2,
          pb: 2,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography
          variant="h4"
          fontWeight="normal"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Profile
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          sx={{
            ml: 'auto',
            px: 4,
            py: 1.5,
            borderRadius: 3,
            backgroundColor: '#ffffff',
            color: theme.palette.primary.main,
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundColor: '#f5f5f5',
              color: theme.palette.primary.dark,
              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
            },
          }}
        >
          Edit Profile
        </Button>
      </Box>

      <Box
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[2],
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 70,
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                flex: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSvgIcon-root': {
                  background: '#ffffff',
                  padding: '6px',
                  borderRadius: '8px',
                  fontSize: '1.3rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  color: theme.palette.primary.main,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              },
            }}
          >
            <Tab icon={<AccountCircle />} label="Overview" sx={{ gap: 1 }} />
            <Tab icon={<Timeline />} label="Activity" sx={{ gap: 1 }} />
            <Tab icon={<Badge />} label="Achievements" sx={{ gap: 1 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          <TabPanel value={tabValue} index={0}>
            <ProfileSection title="Personal Information" icon={<AccountCircle />}>
              <Box sx={{ position: 'relative', mb: 4, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid',
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  }}
                >
                  JD
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  John Doe
                </Typography>
                <Typography color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Computer Science Student
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  sx={{
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Chip
                    icon={<Email />}
                    label="john.doe@example.com"
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid',
                      borderColor: theme.palette.primary.main,
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                  <Chip
                    icon={<LocationOn />}
                    label="New York, USA"
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid',
                      borderColor: theme.palette.primary.main,
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                  <Chip
                    icon={<Language />}
                    label="English"
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid',
                      borderColor: theme.palette.primary.main,
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                  <Chip
                    icon={<School />}
                    label="University of Technology"
                    sx={{
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid',
                      borderColor: theme.palette.primary.main,
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Grid container spacing={3}>
                {stats.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <StatCard {...stat} />
                  </Grid>
                ))}
              </Grid>
            </ProfileSection>

            <ProfileSection title="Recent Activity" icon={<Timeline />}>
              <Stack spacing={2}>
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </Stack>
            </ProfileSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ProfileSection title="Activity Timeline" icon={<Timeline />}>
              <Typography variant="h6" gutterBottom>
                Coming Soon
              </Typography>
              <Typography color="text.secondary">
                Detailed activity timeline will be available in the next update.
              </Typography>
            </ProfileSection>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ProfileSection title="Achievements & Badges" icon={<Badge />}>
              <Typography variant="h6" gutterBottom>
                Coming Soon
              </Typography>
              <Typography color="text.secondary">
                Achievement system will be available in the next update.
              </Typography>
            </ProfileSection>
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
