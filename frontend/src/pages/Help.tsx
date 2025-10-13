import {
  AttachFile,
  ContactSupportOutlined,
  ExpandMore,
  HelpOutlineOutlined,
  QuestionAnswerOutlined,
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
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
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
    <Box
      sx={{
        p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
        mb: getAspectRatioStyle(aspectRatioStyles.spacing.element.margin, breakpoint, 3),
        border: '2px solid',
        borderColor: 'error.main',
        borderRadius: 3,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 100%)`
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
            background: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
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
          color={theme => (theme.palette.mode === 'dark' ? 'white' : 'black')}
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
};

const Help: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth?.() || {};
  const { breakpoint } = useAspectRatio();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All Questions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // FAQ and quick links data
  const faqData = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I get started with AssignmentAI?',
          answer:
            'Getting started with AssignmentAI is simple! Create your account using your email or Google account, then navigate to the Workshop page and click "Upload Content" to add your first assignment. Our AI will immediately begin analyzing your work and providing detailed feedback.',
        },
        {
          question: 'What types of assignments are supported?',
          answer:
            'AssignmentAI supports basic academic assignment types including essays, quizzes, projects, and homework. We also support various citation styles (APA, MLA, Chicago, Harvard) and multiple file formats including PDF, DOCX, DOC, TXT, RTF, and more.',
        },
        {
          question: 'How do I create my first assignment?',
          answer:
            'Creating your first assignment is straightforward! Navigate to the Workshop page and click "Upload Content" to either type directly, paste content, or upload files in formats like .docx, .pdf, .txt, or .rtf.',
        },
        {
          question: 'What makes AssignmentAI different from other writing tools?',
          answer:
            'AssignmentAI completes the work for you, instead of you always having to copy and paste or do the work manually. However, you can do the work manually if you choose to. We use advanced AI technology specifically designed for academic writing, understanding academic context and subject-specific terminology.',
        },
      ],
    },
    {
      category: 'AI Features',
      questions: [
        {
          question: 'How does the AI token system work?',
          answer:
            'Our AI token system provides fair access to advanced features, with each AI action consuming tokens based on content complexity and length. Free users receive a monthly token allowance, while premium subscribers get significantly more tokens and access to advanced AI features.',
        },

        {
          question: 'How accurate is the AI analysis?',
          answer:
            'Our AI analysis achieves industry-leading accuracy with 95%+ grammar accuracy, 90%+ style consistency, and 85%+ content structure accuracy. The AI continuously learns from academic writing standards and adapts to specialized subjects.',
        },

        {
          question: 'What AI-powered writing suggestions do you offer?',
          answer:
            'AssignmentAI provides comprehensive AI-powered writing suggestions including Style Enhancement, Clarity Analyzer, Academic Tone Optimization, and Content Expansion tools. All suggestions are contextual and respect your original intent.',
        },
      ],
    },
    {
      category: 'Account & Settings',
      questions: [
        {
          question: 'How do I change my password and manage security?',
          answer:
            'Managing your account security is straightforward through Settings > Privacy & Security. We recommend using strong passwords and enabling two-factor authentication for enhanced security.',
        },
        {
          question: 'Can I export my assignments and data?',
          answer:
            'Yes, AssignmentAI provides comprehensive export options for all your content in multiple formats including .docx, .pdf, .txt, and .rtf. You can also request a complete export of all your data for portability.',
        },
        {
          question: 'How do I enable two-factor authentication?',
          answer:
            'Go to Settings > Privacy & Security and click "Two-Factor Authentication" to choose between SMS, authenticator apps, or hardware security keys. We recommend authenticator apps for enhanced security.',
        },
        {
          question: 'How do I manage my privacy and data settings?',
          answer:
            'AssignmentAI gives you complete control over your privacy and data settings. You can control data collection, visibility settings, and request data deletion at any time.',
        },
      ],
    },
    {
      category: 'Subscription & Billing',
      questions: [
        {
          question: 'How do I change my subscription plan?',
          answer:
            'Changing your subscription plan is simple through the Price Plan page. You can upgrade, downgrade, or switch between monthly and annual billing cycles with immediate effect.',
        },

        {
          question: 'What payment methods do you accept and is billing secure?',
          answer:
            'AssignmentAI accepts all major credit cards, PayPal, and Apple Pay through secure, PCI-compliant payment gateways. We never store your payment information on our servers.',
        },
      ],
    },
    {
      category: 'Technical Support',
      questions: [
        {
          question: 'What browsers and devices are supported?',
          answer:
            'AssignmentAI works seamlessly across all modern browsers (Chrome, Firefox, Safari, Edge) and devices. We offer native mobile apps for iOS and Android with full feature parity.',
        },
        {
          question: 'How do I report bugs or request new features?',
          answer:
            'You can submit bug reports through the Help & Support section or use the "Feature Request" category in our contact form. We review all submissions and respond within 24-48 hours.',
        },
        {
          question: 'What happens if I lose internet connection while working?',
          answer:
            'AssignmentAI saves your work to local storage and maintains offline data persistence. When you reconnect, your changes are automatically synced with the server. However, some features may require an internet connection to function fully.',
        },
      ],
    },
  ];

  // Category chips
  const allCategories = ['All Questions', ...faqData.map(c => c.category)];

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
        message: 'This field is required',
        severity: 'error',
      });
      return;
    }

    if (!contactForm.email.trim() || !contactForm.email.includes('@')) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
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
        message: 'Message sent successfully!',
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
        message: error.response?.data?.message || 'Failed to send message',
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
          Help & Support
        </Typography>
        <TextField
          placeholder="Search help articles..."
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
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
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
              'aria-label': 'Search help articles...',
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
            Filter by Category
          </Typography>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Grid
              container
              spacing={0.5}
              sx={{
                maxWidth: '100%',
              }}
            >
              {allCategories.map(cat => (
                <Grid item xs={4} key={cat}>
                  <Chip
                    label={cat}
                    color={selectedCategory === cat ? 'primary' : 'default'}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? 'All Questions' : cat)
                    }
                    size="small"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                      borderRadius: 2,
                      height: { xs: 28, md: 32 },
                      width: '100%',
                      justifyContent: 'center',
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark'
                          ? selectedCategory === cat
                            ? 'error.main'
                            : 'transparent'
                          : undefined,
                      border: theme => (theme.palette.mode === 'dark' ? '1px solid' : undefined),
                      borderColor: theme =>
                        theme.palette.mode === 'dark' ? 'error.main' : undefined,
                      color: theme =>
                        theme.palette.mode === 'dark'
                          ? selectedCategory === cat
                            ? 'black'
                            : 'error.main'
                          : undefined,
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
              spacing={0.5}
              sx={{
                flexWrap: 'wrap',
                gap: 0.5,
                justifyContent: 'flex-start',
              }}
            >
              {allCategories.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  color={selectedCategory === cat ? 'primary' : 'default'}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? 'All Questions' : cat)
                  }
                  size="small"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    borderRadius: 2,
                    height: 32,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                        ? selectedCategory === cat
                          ? 'error.main'
                          : 'transparent'
                        : undefined,
                    border: theme => (theme.palette.mode === 'dark' ? '1px solid' : undefined),
                    borderColor: theme =>
                      theme.palette.mode === 'dark' ? 'error.main' : undefined,
                    color: theme =>
                      theme.palette.mode === 'dark'
                        ? selectedCategory === cat
                          ? 'black'
                          : 'error.main'
                        : undefined,
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
              aria-label="Expand All"
              sx={{
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1.5, md: 2 },
                py: { xs: 0.5, md: 0.75 },
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
                borderColor: theme =>
                  theme.palette.mode === 'dark' ? 'error.main' : 'rgba(0,0,0,0.2)',
                color: theme => (theme.palette.mode === 'dark' ? 'error.main' : 'black'),
                '&:hover': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderColor: theme =>
                    theme.palette.mode === 'dark' ? 'error.dark' : 'rgba(0,0,0,0.3)',
                },
              }}
            >
              Expand All
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCollapseAll}
              aria-label="Collapse All"
              sx={{
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1.5, md: 2 },
                py: { xs: 0.5, md: 0.75 },
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
                borderColor: theme =>
                  theme.palette.mode === 'dark' ? 'error.main' : 'rgba(0,0,0,0.2)',
                color: theme => (theme.palette.mode === 'dark' ? 'error.main' : 'black'),
                '&:hover': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderColor: theme =>
                    theme.palette.mode === 'dark' ? 'error.dark' : 'rgba(0,0,0,0.3)',
                },
              }}
            >
              Collapse All
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
          border: '2px solid',
          borderColor: 'error.main',
        }}
      >
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<QuestionAnswerOutlined />} label="FAQ" />
            <Tab icon={<ContactSupportOutlined />} label="Contact" />
          </Tabs>
        </Box>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0} breakpoint={breakpoint}>
            {/* Only show Popular Questions when "All Questions" is selected */}
            <Box
              sx={{
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                maxHeight: selectedCategory === 'All Questions' ? '2000px' : '0px',
                opacity: selectedCategory === 'All Questions' ? 1 : 0,
                transform:
                  selectedCategory === 'All Questions' ? 'translateY(0)' : 'translateY(-20px)',
                mb: selectedCategory === 'All Questions' ? 3 : 0,
              }}
            >
              <HelpSection
                title="Popular Questions"
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
                              ? `${theme.palette.background.paper}cc`
                              : 'rgba(0,0,0,0.02)',
                          borderRadius: 2,
                          '&:hover': {
                            background:
                              theme.palette.mode === 'dark'
                                ? `${theme.palette.background.paper}e6`
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
                              ? `${theme.palette.background.paper}99`
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
            </Box>
            <HelpSection title="FAQ" icon={<QuestionAnswerOutlined />}>
              {filteredFaqData.length > 0 ? (
                filteredFaqData.map((category, categoryIndex) => (
                  <Box key={categoryIndex} sx={{ mb: 4 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
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
                                ? `${theme.palette.background.paper}cc`
                                : 'rgba(0,0,0,0.02)',
                            borderRadius: 2,
                            '&:hover': {
                              background:
                                theme.palette.mode === 'dark'
                                  ? `${theme.palette.background.paper}e6`
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
                                ? `${theme.palette.background.paper}99`
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
          </TabPanel>

          <TabPanel value={tabValue} index={1} breakpoint={breakpoint}>
            <HelpSection
              title="Contact Support"
              icon={<ContactSupportOutlined />}
              breakpoint={breakpoint}
            >
              <Grid container spacing={{ xs: 2, md: 4 }}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontSize: { xs: '1.125rem', md: '1.25rem' },
                      color: 'white',
                    }}
                  >
                    Send Message
                  </Typography>
                  <Box component="form" onSubmit={handleContactSubmit}>
                    <Stack spacing={{ xs: 2, md: 3 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        variant="outlined"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={e => handleContactFormChange('email', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            backgroundColor: theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.paper
                                : '#ffffff',
                          },
                        }}
                        inputProps={{ 'aria-label': 'Email' }}
                      />

                      <TextField
                        fullWidth
                        label="Subject"
                        variant="outlined"
                        required
                        value={contactForm.subject}
                        onChange={e => handleContactFormChange('subject', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            backgroundColor: theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.paper
                                : '#ffffff',
                          },
                        }}
                        inputProps={{ 'aria-label': 'Subject' }}
                      />

                      <FormControl fullWidth>
                        <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          Category
                        </InputLabel>
                        <Select
                          value={contactForm.category}
                          label="Category"
                          onChange={e => handleContactFormChange('category', e.target.value)}
                          sx={{
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme =>
                                theme.palette.mode === 'dark'
                                  ? theme.palette.background.paper
                                  : '#ffffff',
                            },
                          }}
                          inputProps={{ 'aria-label': 'Category' }}
                        >
                          <MenuItem value="" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            Select Category
                          </MenuItem>
                          <MenuItem
                            value="technical"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            Technical Issue
                          </MenuItem>
                          <MenuItem
                            value="billing"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            Billing Question
                          </MenuItem>
                          <MenuItem
                            value="feature"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            Feature Request
                          </MenuItem>
                          <MenuItem value="bug" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            Bug Report
                          </MenuItem>
                          <MenuItem
                            value="general"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            General Inquiry
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                          Priority
                        </InputLabel>
                        <Select
                          value={contactForm.priority}
                          label="Priority"
                          onChange={e => handleContactFormChange('priority', e.target.value)}
                          sx={{
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme =>
                                theme.palette.mode === 'dark'
                                  ? theme.palette.background.paper
                                  : '#ffffff',
                            },
                          }}
                          inputProps={{ 'aria-label': 'Priority' }}
                        >
                          <MenuItem value="low" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            Low
                          </MenuItem>
                          <MenuItem
                            value="medium"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            Medium
                          </MenuItem>
                          <MenuItem value="high" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                            High
                          </MenuItem>
                          <MenuItem
                            value="urgent"
                            sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                          >
                            Urgent
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={4}
                        variant="outlined"
                        required
                        value={contactForm.message}
                        onChange={e => handleContactFormChange('message', e.target.value)}
                        placeholder="Message"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            backgroundColor: theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.paper
                                : '#ffffff',
                          },
                        }}
                        inputProps={{
                          maxLength: 1000,
                          'aria-label': 'Message',
                        }}
                        helperText={`${contactForm.message.length}/1000 characters`}
                      />

                      {/* File attachment */}
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFile />}
                        aria-label="Add Attachment"
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Add Attachment
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

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                        }}
                      >
                        {contactForm.priority === 'urgent' && (
                          <Chip
                            label="Urgent"
                            color="error"
                            size="small"
                            icon={<ContactSupportOutlined />}
                            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                          />
                        )}
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={
                            isSubmitting ? <CircularProgress size={24} /> : <SendOutlined />
                          }
                          disabled={isSubmitting}
                          sx={{
                            px: { xs: 4, md: 6 },
                            py: { xs: 1.5, md: 2 },
                            borderRadius: 3,
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            boxShadow:
                              '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
                            },
                          }}
                          aria-label="Send Message"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                  {/* Confirmation animation/message */}
                  {snackbar.open && snackbar.severity === 'success' && (
                    <Alert severity="success" sx={{ mt: 3, fontWeight: 600, fontSize: '1.1rem' }}>
                      <span role="img" aria-label="check">
                        ✅
                      </span>{' '}
                      Thank you for contacting us! We'll get back to you soon.
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: { xs: 2, md: 3 },
                      border: '2px solid',
                      borderColor: 'error.main',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      color={theme => (theme.palette.mode === 'dark' ? 'white' : 'black')}
                      sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' }, mb: 2 }}
                    >
                      Contact Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography
                          color="error.main"
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          Email
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                          }}
                        >
                          support@assignmentai.com
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          color="error.main"
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          Response Time
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                          }}
                        >
                          24-48 hours
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          color="error.main"
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                        >
                          Office Hours
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                          }}
                        >
                          Monday - Friday, 9 AM - 6 PM EST
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          color="error.main"
                          gutterBottom
                          sx={{ fontSize: '0.875rem', md: '1rem' }}
                        >
                          Emergency Support
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                          }}
                        >
                          For urgent issues, please mark your message as urgent.
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
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
        }}
      >
        <Button
          variant="contained"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to Top"
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
          Back to Top
        </Button>
      </Box>

      {/* Snackbar for alerts */}
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
