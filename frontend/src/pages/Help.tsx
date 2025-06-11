import {
  ArrowForward,
  Book,
  ContactSupport,
  ExpandMore,
  LiveHelp,
  QuestionAnswer,
  School,
  Search,
  Send,
  VideoLibrary,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HelpSection = ({ title, icon, children }: any) => {
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
        <Typography variant="h5" fontWeight="600" className="page-title">
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
};

const Help: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const faqData = [
    {
      question: 'How do I get started with AssignmentAI?',
      answer:
        'To get started, simply log in to your account and create your first assignment. Our AI will guide you through the process and help you organize your work effectively.',
    },
    {
      question: 'What types of assignments does AssignmentAI support?',
      answer:
        'AssignmentAI supports a wide range of assignments including essays, research papers, code projects, and mathematical problems. Our AI adapts to your specific needs.',
    },
    {
      question: 'How does the AI token system work?',
      answer:
        'AI tokens are credits you use when interacting with our AI. Each interaction costs a certain number of tokens, and you can monitor your usage in the AI Tokens section.',
    },
    {
      question: 'Can I collaborate with others on assignments?',
      answer:
        'Yes! AssignmentAI supports collaboration features. You can share assignments, receive feedback, and work together with classmates or instructors.',
    },
    {
      question: 'Can I change my plan later?',
      answer:
        'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, all paid plans come with a 7-day free trial. No credit card required to start.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and Apple Pay.',
    },
    {
      question: 'Can I get a refund?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans.',
    },
  ];

  const tutorials = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of AssignmentAI and how to make the most of our features.',
      icon: <School />,
    },
    {
      title: 'AI Features Tutorial',
      description: 'Discover how to effectively use our AI-powered tools for better results.',
      icon: <VideoLibrary />,
    },
    {
      title: 'Advanced Tips & Tricks',
      description: 'Master advanced features and optimize your workflow.',
      icon: <Book />,
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        px: 2,
        pb: 4,
      }}
    >
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
        <Typography variant="h4" gutterBottom className="page-title" sx={{ mb: 3 }}>
          Help & Support
        </Typography>
        <TextField
          placeholder="Search for help..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{
            ml: 'auto',
            width: '300px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              '&:hover': {
                '& > fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
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
            <Tab icon={<QuestionAnswer />} label="FAQ" sx={{ gap: 1 }} />
            <Tab icon={<Book />} label="Tutorials" sx={{ gap: 1 }} />
            <Tab icon={<LiveHelp />} label="Live Help" sx={{ gap: 1 }} />
            <Tab icon={<ContactSupport />} label="Contact" sx={{ gap: 1 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          <TabPanel value={tabValue} index={0}>
            <HelpSection title="Frequently Asked Questions" icon={<QuestionAnswer />}>
              {faqData.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    background: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    mb: 2,
                    border: '1px solid',
                    borderColor:
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.02)',
                      borderRadius: 2,
                      '&:hover': {
                        background:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.04)',
                      },
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        color: theme.palette.primary.main,
                        transition: 'transform 0.3s ease',
                      },
                      '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                        transform: 'rotate(180deg)',
                      },
                    }}
                  >
                    <Typography fontWeight="500" sx={{ color: theme.palette.primary.main }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.01)',
                      borderTop: '1px solid',
                      borderColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </HelpSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <HelpSection title="Video Tutorials" icon={<VideoLibrary />}>
              <Grid container spacing={3}>
                {tutorials.map((tutorial, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.02)',
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            background: '#ffffff',
                            color: theme.palette.primary.main,
                          }}
                        >
                          {tutorial.icon}
                        </Box>
                        <Typography variant="h6" fontWeight="500">
                          {tutorial.title}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                        {tutorial.description}
                      </Typography>
                      <Button
                        variant="text"
                        endIcon={<ArrowForward />}
                        sx={{
                          alignSelf: 'flex-start',
                          '&:hover': {
                            background: 'transparent',
                            color: theme.palette.primary.main,
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        Watch Now
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </HelpSection>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <HelpSection title="Live Help" icon={<LiveHelp />}>
              <Typography variant="h6" gutterBottom>
                Chat with our Support Team
              </Typography>
              <Typography color="text.secondary" paragraph>
                Get real-time assistance from our expert support team. We're here to help you 24/7.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Send />}
                sx={{
                  mt: 2,
                  borderRadius: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  boxShadow:
                    '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
                  },
                }}
              >
                Start Chat
              </Button>
            </HelpSection>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <HelpSection title="Contact Support" icon={<ContactSupport />}>
              <Typography variant="h6" gutterBottom>
                Send us a Message
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Subject"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  sx={{
                    alignSelf: 'flex-start',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    boxShadow:
                      '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
                    },
                  }}
                >
                  Send Message
                </Button>
              </Stack>
            </HelpSection>
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default Help;
