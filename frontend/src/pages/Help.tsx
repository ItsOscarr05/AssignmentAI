import {
  ArrowForward,
  ArticleOutlined,
  AttachFile,
  ContactSupportOutlined,
  ExpandMore,
  FeedbackOutlined,
  ForumOutlined,
  HelpOutlineOutlined,
  QuestionAnswerOutlined,
  RateReviewOutlined,
  SearchOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { helpService } from '../services/helpService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps & { breakpoint?: string }) {
  const { children, value, index, breakpoint = 'standard', ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2) }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const HelpSection = ({ title, icon, children, breakpoint = 'standard' }: any) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
        mb: getAspectRatioStyle(aspectRatioStyles.spacing.element.margin, breakpoint, 3),
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
            p: { xs: 1, md: 1.5 },
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
        <Typography
          variant="h5"
          fontWeight="400"
          color="black"
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
};

const Help: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth?.() || {};
  const { breakpoint } = useAspectRatio();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>(t('pages.help.allQuestions'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // FAQ and quick links data
  const faqData = [
    {
      category: t('pages.help.gettingStarted'),
      questions: [
        {
          question: t('pages.help.howToGetStarted'),
          answer: t('pages.help.getStartedAnswer'),
        },
        {
          question: t('pages.help.supportedAssignments'),
          answer: t('pages.help.supportedAssignmentsAnswer'),
        },
        {
          question: t('pages.help.createFirstAssignment'),
          answer: t('pages.help.createFirstAssignmentAnswer'),
        },
      ],
    },
    {
      category: t('pages.help.aiFeatures'),
      questions: [
        {
          question: t('pages.help.aiTokenSystem'),
          answer: t('pages.help.aiTokenSystemAnswer'),
        },
        {
          question: t('pages.help.collaboration'),
          answer: t('pages.help.collaborationAnswer'),
        },
        {
          question: t('pages.help.aiAccuracy'),
          answer: t('pages.help.aiAccuracyAnswer'),
        },
        {
          question: t('pages.help.plagiarismDetection'),
          answer: t('pages.help.plagiarismDetectionAnswer'),
        },
      ],
    },
    {
      category: t('pages.help.accountSettings'),
      questions: [
        {
          question: t('pages.help.changePassword'),
          answer: t('pages.help.changePasswordAnswer'),
        },
        {
          question: t('pages.help.exportAssignments'),
          answer: t('pages.help.exportAssignmentsAnswer'),
        },
        {
          question: t('pages.help.enable2FA'),
          answer: t('pages.help.enable2FAAnswer'),
        },
      ],
    },
    {
      category: t('pages.help.subscriptionBilling'),
      questions: [
        {
          question: t('pages.help.changePlan'),
          answer: t('pages.help.changePlanAnswer'),
        },
        {
          question: t('pages.help.freeTrial'),
          answer: t('pages.help.freeTrialAnswer'),
        },
      ],
    },
  ];

  const quickLinks = [
    {
      title: 'Documentation',
      description: 'Detailed guides and API references',
      icon: <ArticleOutlined />,
      link: '/docs',
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users',
      icon: <ForumOutlined />,
      link: '/forum',
    },
    {
      title: 'Feature Requests',
      description: 'Suggest new features',
      icon: <FeedbackOutlined />,
      link: '/feedback',
    },
    {
      title: 'User Reviews',
      description: 'Read what others say about us',
      icon: <RateReviewOutlined />,
      link: '/reviews',
    },
  ];

  // Category chips
  const allCategories = [t('pages.help.allQuestions'), ...faqData.map(c => c.category)];

  // Filtered FAQ data with category and search
  const filteredFaqData = faqData
    .map(category => ({
      ...category,
      questions: category.questions.filter(
        faq =>
          (selectedCategory === 'All Questions' || category.category === selectedCategory) &&
          (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter(category => category.questions.length > 0);

  // Popular FAQs (first 2 from each category)
  const popularFaqs = faqData.flatMap(cat => cat.questions.slice(0, 2));

  // Expand/collapse all logic
  const handleExpandAll = () => {
    const newState: { [key: string]: boolean } = {};
    filteredFaqData.forEach(cat => {
      cat.questions.forEach(faq => {
        newState[faq.question] = true;
      });
    });
    setExpandedFaqs(newState);
  };
  const handleCollapseAll = () => {
    setExpandedFaqs({});
  };

  // Improved highlight function
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <Box
          key={index}
          component="span"
          sx={{
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.warning.contrastText,
            fontWeight: 'bold',
            borderRadius: 1,
            px: 0.5,
            boxShadow: 1,
          }}
        >
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: '',
    priority: 'medium',
    email: user?.email || '',
    attachment: null as File | null,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleContactFormChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setSnackbar({
        open: true,
        message: t('errors.required'),
        severity: 'error',
      });
      return;
    }

    if (!contactForm.email.trim() || !contactForm.email.includes('@')) {
      setSnackbar({
        open: true,
        message: t('errors.invalidEmail'),
        severity: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit contact form using help service
      await helpService.submitContactForm({
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        category: contactForm.category,
        priority: contactForm.priority as 'low' | 'medium' | 'high' | 'urgent',
      });

      setSnackbar({
        open: true,
        message: t('pages.help.contactForm.messageSent'),
        severity: 'success',
      });

      // Reset form
      setContactForm({
        subject: '',
        message: '',
        category: '',
        priority: 'medium',
        email: '',
        attachment: null,
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t('pages.help.contactForm.sendFailed'),
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        px: { xs: 1, md: 2 },
        pb: 4,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 3 },
          position: 'sticky',
          top: 0,
          zIndex: 10,
          pt: 2,
          pb: 2,
          px: { xs: 1, md: 0 },
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: { xs: '1.75rem', md: '2.125rem' },
          }}
        >
          {t('pages.help.title')}
        </Typography>
        <TextField
          placeholder={t('pages.help.searchHelp')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{
            ml: { xs: 0, md: 'auto' },
            width: { xs: '100%', md: '350px' },
            fontWeight: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontWeight: 600,
              fontSize: { xs: '1rem', md: '1.1rem' },
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
                <SearchOutlined />
              </InputAdornment>
            ),
            inputProps: {
              'aria-label': t('pages.help.searchHelp'),
              autoFocus: true,
            },
          }}
        />
      </Box>
      {/* Category filter chips and controls */}
      <Box sx={{ mb: 3 }}>
        {/* Category filter chips */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', md: '1rem' },
              fontWeight: 500,
            }}
          >
            {t('pages.help.filterByCategory')}
          </Typography>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Grid
              container
              spacing={1}
              sx={{
                maxWidth: '100%',
              }}
            >
              {allCategories.map(cat => (
                <Grid item xs={4} key={cat}>
                  <Chip
                    label={cat}
                    color={selectedCategory === cat ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(cat)}
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      borderRadius: 2,
                      height: { xs: 36, md: 40 },
                      width: '100%',
                      justifyContent: 'center',
                      '& .MuiChip-label': {
                        textAlign: 'center',
                        whiteSpace: 'normal',
                        lineHeight: 1.2,
                      },
                    }}
                    aria-pressed={selectedCategory === cat}
                    tabIndex={0}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'flex-start',
              }}
            >
              {allCategories.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  color={selectedCategory === cat ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{
                    fontWeight: 500,
                    fontSize: '1rem',
                    borderRadius: 2,
                    height: 40,
                  }}
                  aria-pressed={selectedCategory === cat}
                  tabIndex={0}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Expand/Collapse All */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: 'wrap',
              gap: { xs: 0.5, md: 1 },
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleExpandAll}
              aria-label={t('pages.help.expandAll')}
              sx={{
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1.5, md: 2 },
                py: { xs: 0.5, md: 0.75 },
              }}
            >
              {t('pages.help.expandAll')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCollapseAll}
              aria-label={t('pages.help.collapseAll')}
              sx={{
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1.5, md: 2 },
                py: { xs: 0.5, md: 0.75 },
              }}
            >
              {t('pages.help.collapseAll')}
            </Button>
          </Stack>
        </Box>
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
                minHeight: { xs: 60, md: 70 },
                fontSize: { xs: '0.875rem', md: '1rem' },
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
                  padding: { xs: '4px', md: '6px' },
                  borderRadius: '8px',
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
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
            <Tab icon={<QuestionAnswerOutlined />} label={t('pages.help.faq')} sx={{ gap: 1 }} />
            <Tab
              icon={<ContactSupportOutlined />}
              label={t('pages.help.contact')}
              sx={{ gap: 1 }}
            />
          </Tabs>
        </Box>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0} breakpoint={breakpoint}>
            <HelpSection
              title={t('pages.help.popularQuestions')}
              icon={<QuestionAnswerOutlined />}
              breakpoint={breakpoint}
            >
              <Stack spacing={2}>
                {popularFaqs.map((faq, idx) => (
                  <Accordion
                    key={faq.question + idx}
                    expanded={!!expandedFaqs[faq.question]}
                    onChange={() =>
                      setExpandedFaqs(f => ({ ...f, [faq.question]: !f[faq.question] }))
                    }
                    sx={{
                      background: 'transparent',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      mb: 2,
                      border: '1px solid',
                      borderColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.06)',
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
                        {highlightSearchTerm(faq.question, searchQuery)}
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
                        {highlightSearchTerm(faq.answer, searchQuery)}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </HelpSection>
            <HelpSection title={t('pages.help.faq')} icon={<QuestionAnswerOutlined />}>
              {filteredFaqData.length > 0 ? (
                filteredFaqData.map((category, categoryIndex) => (
                  <Box key={categoryIndex} sx={{ mb: 4 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <HelpOutlineOutlined fontSize="small" />
                      {category.category}
                    </Typography>
                    {category.questions.map((faq, index) => (
                      <Accordion
                        key={index}
                        expanded={!!expandedFaqs[faq.question]}
                        onChange={() =>
                          setExpandedFaqs(f => ({ ...f, [faq.question]: !f[faq.question] }))
                        }
                        sx={{
                          background: 'transparent',
                          boxShadow: 'none',
                          '&:before': { display: 'none' },
                          mb: 2,
                          border: '1px solid',
                          borderColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.06)',
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
                            {highlightSearchTerm(faq.question, searchQuery)}
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
                            {highlightSearchTerm(faq.answer, searchQuery)}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                ))
              ) : (
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
                  <SearchOutlined
                    sx={{
                      fontSize: 64,
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  />
                  <Typography variant="h5" color="black" gutterBottom>
                    No Results Found
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                    We couldn't find any help articles matching your search. Try different keywords
                    or browse our categories.
                  </Typography>
                </Box>
              )}
            </HelpSection>
            <HelpSection
              title={t('pages.help.contactForm.quickLinks')}
              icon={<HelpOutlineOutlined />}
            >
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {quickLinks.map((link, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s ease',
                        border: '2px solid',
                        borderColor: 'error.main',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                          borderColor: 'error.dark',
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1, md: 2 },
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              p: { xs: 0.5, md: 1 },
                              borderRadius: 1.5,
                              background: '#ffffff',
                              color: theme.palette.primary.main,
                            }}
                          >
                            {link.icon}
                          </Box>
                          <Typography
                            variant="h6"
                            fontWeight="500"
                            color="black"
                            sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                          >
                            {link.title}
                          </Typography>
                        </Box>
                        <Typography
                          color="text.secondary"
                          sx={{ mb: 2, fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          {link.description}
                        </Typography>
                        <Button
                          variant="text"
                          endIcon={<ArrowForward />}
                          href={link.link}
                          component="a"
                          sx={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            '&:hover': {
                              background: 'transparent',
                              color: theme.palette.primary.main,
                              transform: 'translateX(4px)',
                            },
                          }}
                          aria-label={`Visit ${link.title}`}
                        >
                          Visit
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </HelpSection>
          </TabPanel>

          <TabPanel value={tabValue} index={1} breakpoint={breakpoint}>
            <HelpSection
              title={t('pages.help.contactSupport')}
              icon={<ContactSupportOutlined />}
              breakpoint={breakpoint}
            >
              <Grid container spacing={{ xs: 2, md: 4 }}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                  >
                    {t('pages.help.contactForm.sendMessage')}
                  </Typography>
                  <Box component="form" onSubmit={handleContactSubmit}>
                    <Stack spacing={{ xs: 2, md: 3 }}>
                      <TextField
                        fullWidth
                        label={t('pages.help.contactForm.email')}
                        variant="outlined"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={e => handleContactFormChange('email', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                          },
                        }}
                        inputProps={{ 'aria-label': t('pages.help.contactForm.email') }}
                      />

                      <TextField
                        fullWidth
                        label={t('pages.help.contactForm.subject')}
                        variant="outlined"
                        required
                        value={contactForm.subject}
                        onChange={e => handleContactFormChange('subject', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                          },
                        }}
                        inputProps={{ 'aria-label': t('pages.help.contactForm.subject') }}
                      />

                      <FormControl fullWidth>
                        <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          {t('pages.help.contactForm.category')}
                        </InputLabel>
                        <Select
                          value={contactForm.category}
                          label={t('pages.help.contactForm.category')}
                          onChange={e => handleContactFormChange('category', e.target.value)}
                          sx={{
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                          }}
                          inputProps={{ 'aria-label': t('pages.help.contactForm.category') }}
                        >
                          <MenuItem value="" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('pages.help.contactForm.selectCategory')}
                          </MenuItem>
                          <MenuItem
                            value="technical"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {t('pages.help.contactForm.technical')}
                          </MenuItem>
                          <MenuItem
                            value="billing"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {t('pages.help.contactForm.billing')}
                          </MenuItem>
                          <MenuItem
                            value="feature"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {t('pages.help.contactForm.feature')}
                          </MenuItem>
                          <MenuItem value="bug" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('pages.help.contactForm.bug')}
                          </MenuItem>
                          <MenuItem
                            value="general"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {t('pages.help.contactForm.general')}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          {t('pages.help.contactForm.priority')}
                        </InputLabel>
                        <Select
                          value={contactForm.priority}
                          label={t('pages.help.contactForm.priority')}
                          onChange={e => handleContactFormChange('priority', e.target.value)}
                          sx={{
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                          }}
                          inputProps={{ 'aria-label': t('pages.help.contactForm.priority') }}
                        >
                          <MenuItem value="low" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('pages.help.contactForm.low')}
                          </MenuItem>
                          <MenuItem
                            value="medium"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {t('pages.help.contactForm.medium')}
                          </MenuItem>
                          <MenuItem value="high" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            {t('pages.help.contactForm.high')}
                          </MenuItem>
                          <MenuItem
                            value="urgent"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            {t('pages.help.contactForm.urgent')}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label={t('pages.help.contactForm.message')}
                        multiline
                        rows={4}
                        variant="outlined"
                        required
                        value={contactForm.message}
                        onChange={e => handleContactFormChange('message', e.target.value)}
                        placeholder={t('pages.help.contactForm.message')}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                          },
                        }}
                        inputProps={{
                          maxLength: 1000,
                          'aria-label': t('pages.help.contactForm.message'),
                        }}
                        helperText={`${contactForm.message.length}/1000 characters`}
                      />

                      {/* File attachment */}
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFile />}
                        aria-label={t('pages.help.contactForm.attachment')}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {t('pages.help.contactForm.attachment')}
                        <input
                          type="file"
                          hidden
                          onChange={e =>
                            setContactForm(prev => ({
                              ...prev,
                              attachment: e.target.files?.[0] || null,
                            }))
                          }
                        />
                        {contactForm.attachment && (
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {contactForm.attachment.name}
                          </Typography>
                        )}
                      </Button>

                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={
                            isSubmitting ? <CircularProgress size={20} /> : <SendOutlined />
                          }
                          disabled={isSubmitting}
                          sx={{
                            px: { xs: 3, md: 4 },
                            py: { xs: 1, md: 1.5 },
                            borderRadius: 3,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            boxShadow:
                              '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
                            },
                          }}
                          aria-label={t('pages.help.contactForm.sendMessage')}
                        >
                          {isSubmitting
                            ? t('pages.help.contactForm.sending')
                            : t('pages.help.contactForm.sendMessage')}
                        </Button>

                        {contactForm.priority === 'urgent' && (
                          <Chip
                            label={t('pages.help.contactForm.urgent')}
                            color="error"
                            size="small"
                            icon={<ContactSupportOutlined />}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Box>
                  {/* Confirmation animation/message */}
                  {snackbar.open && snackbar.severity === 'success' && (
                    <Alert severity="success" sx={{ mt: 3, fontWeight: 600, fontSize: '1.1rem' }}>
                      <span role="img" aria-label="check">
                        ✅
                      </span>{' '}
                      {t('pages.help.contactForm.thankYouMessage')}
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.02)',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                      },
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      color="black"
                      sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}
                    >
                      Contact Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          Email
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          {t('pages.help.email')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          {t('pages.help.contactForm.responseTime')}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          {t('pages.help.responseTime')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          {t('pages.help.contactForm.officeHours')}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          {t('pages.help.hours')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontSize: '0.875rem', md: '1rem' }}
                        >
                          {t('pages.help.contactForm.emergencySupport')}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          {t('pages.help.urgentSupport')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </HelpSection>
          </TabPanel>
        </Box>
      </Box>

      {/* Back to Top button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          mb: 2,
          pt: 4,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="contained"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('common.backToTop')}
          sx={{
            px: { xs: 4, md: 6 },
            py: { xs: 1.5, md: 2 },
            fontSize: { xs: '1rem', md: '1.25rem' },
            borderRadius: 3,
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
            },
          }}
        >
          {t('common.backToTop')}
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Help;
