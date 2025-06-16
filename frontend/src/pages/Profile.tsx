import {
  AccountCircleOutlined,
  AssignmentOutlined,
  BadgeOutlined,
  CalendarMonthOutlined,
  EditOutlined,
  EmailOutlined,
  LanguageOutlined,
  LocationOnOutlined,
  SchoolOutlined,
  TimelineOutlined,
  VerifiedOutlined,
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
        border: '2px solid',
        borderColor: 'error.main',
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
          borderColor: 'error.dark',
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
        <Typography variant="h5" fontWeight="400">
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

const ActivityTimelineItem = ({ date, title, description, icon, status }: any) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', mb: 4, position: 'relative' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mr: 2,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: '#ffffff',
            color: theme.palette.primary.main,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            zIndex: 1,
          }}
        >
          {icon}
        </Box>
        <Box
          sx={{
            width: 2,
            flexGrow: 1,
            bgcolor: 'divider',
            my: 1,
          }}
        />
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.02)',
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: -8,
            top: 20,
            width: 16,
            height: 16,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            transform: 'rotate(45deg)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            {title}
          </Typography>
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
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {date}
        </Typography>
        <Typography variant="body2">{description}</Typography>
      </Box>
    </Box>
  );
};

const AchievementCard = ({ title, description, icon, progress, total, unlocked }: any) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        border: '1px solid',
        borderColor: unlocked ? 'success.main' : 'divider',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: unlocked
            ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
            : 'transparent',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: '#ffffff',
            color: unlocked ? 'success.main' : theme.palette.primary.main,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        {unlocked && (
          <Box
            sx={{
              p: 1,
              borderRadius: '50%',
              background: 'success.main',
              color: 'white',
            }}
          >
            <VerifiedOutlined fontSize="small" />
          </Box>
        )}
      </Box>
      <Box sx={{ mt: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress}/{total}
          </Typography>
        </Box>
        <Box
          sx={{
            height: 6,
            bgcolor: 'rgba(0,0,0,0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${(progress / total) * 100}%`,
              bgcolor: unlocked ? 'success.main' : 'primary.main',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const stats = [
    { icon: <AssignmentOutlined />, title: 'Total Assignments', value: '156' },
    { icon: <VerifiedOutlined />, title: 'Completed', value: '134' },
    { icon: <TimelineOutlined />, title: 'In Progress', value: '12' },
    { icon: <CalendarMonthOutlined />, title: 'Overdue', value: '10' },
  ];

  const skills = [
    { name: 'Python', level: 90 },
    { name: 'JavaScript', level: 85 },
    { name: 'Machine Learning', level: 80 },
    { name: 'Data Analysis', level: 75 },
    { name: 'Web Development', level: 85 },
    { name: 'Database Design', level: 70 },
  ];

  const education = [
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'University of Technology',
      year: '2020 - 2024',
      gpa: '3.8/4.0',
    },
    {
      degree: 'Associate Degree in Programming',
      school: 'Community College',
      year: '2018 - 2020',
      gpa: '3.9/4.0',
    },
  ];

  const activityTimeline = [
    {
      date: 'February 15, 2024',
      title: 'Research Paper: Machine Learning',
      description:
        'Working on a comprehensive analysis of machine learning algorithms and their applications in real-world scenarios.',
      icon: <AssignmentOutlined />,
      status: 'In Progress',
    },
    {
      date: 'February 14, 2024',
      title: 'Math Assignment: Calculus II',
      description:
        'Completed the advanced calculus assignment focusing on multivariable calculus and vector analysis.',
      icon: <AssignmentOutlined />,
      status: 'Completed',
    },
    {
      date: 'February 12, 2024',
      title: 'Physics Lab Report',
      description:
        'Conducted experiments on wave mechanics and prepared a detailed lab report with data analysis.',
      icon: <AssignmentOutlined />,
      status: 'Overdue',
    },
    {
      date: 'February 10, 2024',
      title: 'Programming Project: Web Application',
      description:
        'Developed a full-stack web application using React and Node.js for the software engineering course.',
      icon: <AssignmentOutlined />,
      status: 'Completed',
    },
  ];

  const achievements = [
    {
      title: 'Assignment Master',
      description: 'Complete 100 assignments with a grade of A or higher',
      icon: <AssignmentOutlined />,
      progress: 85,
      total: 100,
      unlocked: false,
    },
    {
      title: 'Perfect Streak',
      description: 'Submit 10 assignments on time in a row',
      icon: <TimelineOutlined />,
      progress: 10,
      total: 10,
      unlocked: true,
    },
    {
      title: 'Early Bird',
      description: 'Submit 5 assignments before the deadline',
      icon: <CalendarMonthOutlined />,
      progress: 3,
      total: 5,
      unlocked: false,
    },
    {
      title: 'Research Scholar',
      description: 'Complete 5 research papers',
      icon: <SchoolOutlined />,
      progress: 5,
      total: 5,
      unlocked: true,
    },
    {
      title: 'Team Player',
      description: 'Participate in 10 group projects',
      icon: <BadgeOutlined />,
      progress: 7,
      total: 10,
      unlocked: false,
    },
    {
      title: 'Perfect Score',
      description: 'Get 100% on any assignment',
      icon: <VerifiedOutlined />,
      progress: 1,
      total: 1,
      unlocked: true,
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
          startIcon={<EditOutlined />}
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
            <Tab icon={<AccountCircleOutlined />} label="Overview" sx={{ gap: 1 }} />
            <Tab icon={<TimelineOutlined />} label="Activity" sx={{ gap: 1 }} />
            <Tab icon={<BadgeOutlined />} label="Achievements" sx={{ gap: 1 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          <TabPanel value={tabValue} index={0}>
            <ProfileSection title="Personal Information" icon={<AccountCircleOutlined />}>
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
                    background: '#fff',
                  }}
                >
                  <AccountCircleOutlined sx={{ fontSize: 80, color: theme.palette.error.main }} />
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
                    icon={<EmailOutlined />}
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
                    icon={<LocationOnOutlined />}
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
                    icon={<LanguageOutlined />}
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
                    icon={<SchoolOutlined />}
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

            <ProfileSection title="Skills & Expertise" icon={<TimelineOutlined />}>
              <Grid container spacing={3}>
                {skills.map((skill, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">{skill.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {skill.level}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          bgcolor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${skill.level}%`,
                            bgcolor: theme.palette.primary.main,
                            borderRadius: 4,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </ProfileSection>

            <ProfileSection title="Education" icon={<SchoolOutlined />}>
              <Stack spacing={3}>
                {education.map((edu, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.02)',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {edu.degree}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {edu.school}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Chip size="small" label={edu.year} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }} />
                      <Chip
                        size="small"
                        label={`GPA: ${edu.gpa}`}
                        sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </ProfileSection>

            <ProfileSection title="Recent Activity" icon={<TimelineOutlined />}>
              <Stack spacing={2}>
                {activityTimeline.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </Stack>
            </ProfileSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center',
              }}
            >
              <TimelineOutlined
                sx={{
                  fontSize: 64,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography variant="h5" color="black" gutterBottom>
                Coming Soon
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                We're working on creating a comprehensive activity tracking system to help you
                monitor your progress and achievements. Stay tuned for updates!
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center',
              }}
            >
              <BadgeOutlined
                sx={{
                  fontSize: 64,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              />
              <Typography variant="h5" color="black" gutterBottom>
                Coming Soon
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                We're developing an exciting achievements system to reward your progress and
                milestones. Get ready to earn badges and unlock special features!
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
