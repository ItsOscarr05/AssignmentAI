'use client';

import { styled } from '@mui/material/styles';
import React, { lazy, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import HeroParticles from '../components/HeroParticles';
import RedStarField from '../components/RedStarField';
// Remove the Next.js Link wrapper and use MUI's styled directly

// For MUI Links that need to use React Router
const RouterMuiLink = styled(RouterLink)({
  textDecoration: 'none',
  color: 'inherit',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    color: '#B71C1C',
  },
});

// Optimize imports
import {
  AccessTimeOutlined,
  AssignmentOutlined,
  AutoAwesomeOutlined,
  AutoFixHighOutlined,
  BarChartOutlined,
  BlockOutlined,
  BoltOutlined,
  BuildOutlined,
  CancelOutlined,
  CheckCircle,
  CheckCircleOutlineOutlined,
  DescriptionOutlined,
  DesignServicesOutlined,
  DiamondOutlined,
  EmailOutlined,
  FormatQuoteOutlined,
  GppGoodOutlined,
  Group,
  LanguageOutlined,
  LibraryBooksOutlined,
  PaletteOutlined,
  PhotoCameraOutlined,
  PsychologyOutlined,
  RocketLaunchOutlined,
  SchoolOutlined,
  ScienceOutlined,
  SecurityOutlined,
  SmartToyOutlined,
  Spellcheck,
  TextSnippetOutlined,
  ThumbDownOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Grid } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MuiLink from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// Lazy load icons
const EmojiEventsOutlined = lazy(() =>
  import('@mui/icons-material/EmojiEventsOutlined').then(module => ({
    default: module.default,
  }))
);
const HelpOutline = lazy(() =>
  import('@mui/icons-material/HelpOutline').then(module => ({
    default: module.default,
  }))
);
const LocalOfferOutlined = lazy(() =>
  import('@mui/icons-material/LocalOfferOutlined').then(module => ({
    default: module.default,
  }))
);
const StarOutline = lazy(() =>
  import('@mui/icons-material/StarOutline').then(module => ({
    default: module.default,
  }))
);
const WorkspacePremiumIcon = lazy(() =>
  import('@mui/icons-material/WorkspacePremium').then(module => ({
    default: module.default,
  }))
);

const getFeatureIcon = (featureName: string, color: string) => {
  switch (featureName) {
    case 'Basic Assignment Analysis':
      return <SchoolOutlined sx={{ color }} />;
    case 'Grammar & Spelling Check':
      return <Spellcheck sx={{ color }} />;
    case 'Basic Writing Suggestions':
      return <AutoFixHighOutlined sx={{ color }} />;
    case 'Basic Templates':
      return <TextSnippetOutlined sx={{ color }} />;
    case 'Advanced Writing Analysis':
      return <ScienceOutlined sx={{ color }} />;
    case 'Style & Tone Suggestions':
      return <PaletteOutlined sx={{ color }} />;
    case 'Extended Templates Library':
      return <LibraryBooksOutlined sx={{ color }} />;
    case 'Citation Management':
      return <FormatQuoteOutlined sx={{ color }} />;
    case 'Basic Plagiarism Check':
      return <GppGoodOutlined sx={{ color }} />;
    case 'Diagram Generation':
      return <DesignServicesOutlined sx={{ color }} />;
    case 'Image Analysis':
      return <SmartToyOutlined sx={{ color }} />;
    case 'Code Analysis':
      return <PsychologyOutlined sx={{ color }} />;
    case 'Data File Analysis':
      return <BarChartOutlined sx={{ color }} />;
    case 'Advanced Research Assistant':
      return <PsychologyOutlined sx={{ color }} />;
    case 'Advanced Analytics Dashboard':
      return <BarChartOutlined sx={{ color }} />;
    case 'Custom Assignment Templates':
      return <DesignServicesOutlined sx={{ color }} />;
    case 'AI-Powered Learning Path':
      return <SchoolOutlined sx={{ color }} />;
    case 'Advanced Content Optimization':
      return <AutoAwesomeOutlined sx={{ color }} />;
    case 'Enterprise Collaboration Tools':
      return <Group sx={{ color }} />;
    case 'Smart Content Summarization':
      return <AutoAwesomeOutlined sx={{ color }} />;
    case 'Ad-Free Experience':
      return <BlockOutlined sx={{ color }} />;
    default:
      return <CheckCircle sx={{ color }} />;
  }
};

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect starting tool with basic assistance',
    icon: <LocalOfferOutlined sx={{ fontSize: 48 }} />,
    color: '#2196f3',
    features: [
      'Basic Assignment Analysis',
      'Grammar & Spelling Check',
      'Basic Writing Suggestions',
      'Basic Templates',
      'Image Analysis',
    ],
  },
  {
    name: 'Plus',
    price: 4.99,
    description: 'Enhanced features for more serious students',
    icon: <StarOutline sx={{ fontSize: 48 }} />,
    color: '#4caf50',
    features: [
      'Advanced Writing Analysis',
      'Style & Tone Suggestions',
      'Extended Templates Library',
      'Code Analysis',
      'Smart Content Summarization',
      'Ad-Free Experience',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: 9.99,
    description: 'Advanced features for professional students',
    icon: <DiamondOutlined sx={{ fontSize: 48 }} />,
    color: '#9c27b0',
    features: [
      'Citation Management',
      'Basic Plagiarism Check',
      'Diagram Generation',
      'Data File Analysis',
      'Advanced Research Assistant',
      'Ad-Free Experience',
    ],
  },
  {
    name: 'Max',
    price: 14.99,
    description: 'Ultimate package for power users',
    icon: <EmojiEventsOutlined sx={{ fontSize: 48 }} />,
    color: '#ff9800',
    features: [
      'Advanced Analytics Dashboard',
      'Custom Assignment Templates',
      'AI-Powered Learning Path',
      'Advanced Content Optimization',
      'Enterprise Collaboration Tools',
      'Ad-Free Experience',
    ],
  },
];

const faqs = [
  {
    question: 'How do I get started with AssignmentAI?',
    answer:
      'Create your account with email or Google, then upload your first assignment. Our AI will immediately begin analyzing and providing detailed feedback.',
  },
  {
    question: 'What makes AssignmentAI different from other writing tools?',
    answer:
      'AssignmentAI completes the work for you instead of just suggesting edits. We use advanced AI specifically designed for academic writing and subject-specific terminology.',
  },
  {
    question: 'How accurate is the AI analysis?',
    answer:
      'Industry-leading accuracy: 95%+ grammar, 90%+ style consistency, and 85%+ content structure. Our AI continuously learns from academic standards.',
  },
  {
    question: 'What types of assignments are supported?',
    answer:
      'Essays, quizzes, projects, and homework with support for APA, MLA, Chicago, Harvard citations. File formats: PDF, DOCX, DOC, TXT, RTF.',
  },
  {
    question: 'How do I change my subscription plan?',
    answer:
      'Simple plan changes through the Price Plan page. Upgrade, downgrade, or switch billing cycles with immediate effect.',
  },
  {
    question: 'What payment methods do you accept and is billing secure?',
    answer:
      'All major credit cards, PayPal, and Apple Pay through secure, PCI-compliant gateways. We never store your payment information.',
  },
  {
    question: 'What browsers and devices are supported?',
    answer:
      'Works on all modern browsers (Chrome, Firefox, Safari, Edge) and devices. Native mobile apps for iOS and Android with full features.',
  },
  {
    question: 'Can I export my assignments and data?',
    answer:
      'Yes, export in multiple formats (.docx, .pdf, .txt, .rtf) or request complete data export for portability.',
  },
  {
    question: 'How do I manage my privacy and data settings?',
    answer:
      'Complete control over privacy and data settings. Control data collection, visibility, and request deletion at any time.',
  },
];

const blogPosts = [
  {
    title: '5 Tips to Ace Your Next Assignment',
    summary: 'Discover proven strategies to improve your academic performance.',
    link: 'https://www.burketalent.com/blog/2018/1/31/top-5-tips-to-ace-that-take-home-assignment',
  },
  {
    title: 'How AI is Changing Education',
    summary: 'Explore the impact of artificial intelligence on modern learning.',
    link: 'https://usdla.org/blog/ai-education/',
  },
  {
    title: 'Staying Organized: Tools for Students',
    summary: 'A roundup of the best digital tools to keep you on track.',
    link: 'https://uwaterloo.ca/future-students/missing-manual/high-school/top-10-best-productivity-apps-students',
  },
];

const Landing: React.FC = () => {
  const [] = useState<null | HTMLElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Section refs
  const comparisonRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const screenshotsRef = useRef<HTMLDivElement>(null);
  const generateRef = useRef<HTMLDivElement>(null);
  const starredStatsRef = useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);

  // Function to clear any plan-related storage before registration
  const handlePlanRegistration = (planName: string) => {
    // Only clear plan storage if user is not already logged in (first-time registration)
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Clear any potential plan-related storage
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('planSelection');
      localStorage.removeItem('pricingPlan');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('planSelection');
      sessionStorage.removeItem('pricingPlan');

      // Clear any URL parameters that might contain plan info
      const url = new URL(window.location.href);
      url.searchParams.delete('plan');
      url.searchParams.delete('planId');
      url.searchParams.delete('planName');
      window.history.replaceState({}, '', url.toString());

      console.log(`Cleared plan storage for ${planName} registration (new user)`);
    } else {
      console.log(`Existing user clicked ${planName} plan - no storage clearing needed`);
    }
  };

  useEffect(() => {
    const updateHeight = () => {
      if (mainContentRef.current) {
        setContentHeight(mainContentRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'radial-gradient(circle at center, #FF5252 0%,rgb(84, 8, 8) 100%)',
          color: 'white',
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          overflowX: 'hidden',
          width: '100%',
          pt: 0,
          mt: 0,
        }}
      >
        <HeroParticles />
        {/* Navigation Bar at top of hero section */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row', md: 'row' },
            justifyContent: { xs: 'center', sm: 'space-between', md: 'space-between' },
            alignItems: { xs: 'center', sm: 'center', md: 'center' },
            px: { xs: 2, sm: 3, md: 4, lg: 10 },
            pt: { xs: 3, sm: 3 },
            pb: { xs: 2, sm: 0, md: 0 },
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10,
            gap: { xs: 2, sm: 0, md: 0 },
          }}
        >
          {/* Brand/Logo on the left */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginRight: { xs: 0, sm: -10, md: -10 },
              marginLeft: { xs: -1, sm: -1.5, md: 0.5 },
              flexShrink: 0,
              mb: { xs: 1, sm: 0, md: 0 },
            }}
          >
            <Box
              component="img"
              src="/scroll_transparent.png"
              alt="AI Logo"
              sx={{
                height: { xs: '3rem', sm: '4.5rem', md: '5rem' },
                width: 'auto',
                display: 'block',
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: 'common.white',
                letterSpacing: 1,
                fontSize: { xs: '2.5rem', sm: '2.7rem', md: '3rem' },
                textShadow: '0 0 32px rgba(255,255,255,0.25), 0 0 64px rgba(255,255,255,0.18)',
                userSelect: 'none',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              AssignmentAI
            </Typography>
          </Box>
          {/* Navigation links on the right */}
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2, md: 4 }}
            alignItems="center"
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: 'fit-content',
              mx: { xs: 0, sm: 0, md: 0 },
              ml: { xs: 16.5, sm: 'auto', md: 'auto' },
              mr: { xs: 'auto', sm: 0, md: 0 },
            }}
          >
            <MuiLink
              href="#features"
              onClick={e => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                transition: 'all 0.2s ease-in-out',
                whiteSpace: 'nowrap',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: '#FFFFFF',
                },
              }}
            >
              Features
            </MuiLink>
            <MuiLink
              href="#pricing"
              onClick={e => {
                e.preventDefault();
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                transition: 'all 0.2s ease-in-out',
                whiteSpace: 'nowrap',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: '#FFFFFF',
                },
              }}
            >
              Pricing
            </MuiLink>
            <MuiLink
              href="#faq"
              onClick={e => {
                e.preventDefault();
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                transition: 'all 0.2s ease-in-out',
                whiteSpace: 'nowrap',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: '#FFFFFF',
                },
              }}
            >
              FAQ
            </MuiLink>
            <MuiLink
              href="#resources-tips"
              onClick={e => {
                e.preventDefault();
                document.getElementById('resources-tips')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                transition: 'all 0.2s ease-in-out',
                whiteSpace: 'nowrap',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: '#FFFFFF',
                },
              }}
            >
              Resources
            </MuiLink>
          </Stack>
        </Box>
        <Box
          sx={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 4, md: 8, lg: 16 },
            pt: { xs: 14, sm: 10, md: 12 },
            pb: { xs: 6, md: 8 },
            minHeight: '80vh',
          }}
        >
          {/* Left Side: Text Content */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              textAlign: 'left',
              pl: 0, // Hug left edge
              pr: { xs: 0, md: 4 },
              minWidth: 0,
              mt: { xs: 4, sm: 6, md: 8 },
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: {
                  xs: '2.0rem',
                  md: '2.5rem',
                  lg: '3.0rem',
                  xl: '3.2rem',
                },
                letterSpacing: '-0.02em',
                textShadow: '0 0 32px rgba(255,255,255,0.25), 0 0 64px rgba(255,255,255,0.18)',
              }}
            >
              Transform Your
              <br />
              Academic Journey
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                bgcolor: 'white',
                color: '#D32F2F',
                px: 3,
                py: 1.2,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '1.0rem',
                mb: 2,
                fontFamily: '"Mike Sans", "Audiowide", Arial, sans-serif',
                boxShadow: '0 0 24px rgba(255,255,255,0.12)',
                letterSpacing: 0.2,
              }}
            >
              AI-Powered Assignment Creation & Completion
            </Box>
            <Typography
              variant="body1"
              sx={{ mb: 3, color: 'white', opacity: 0.92, fontWeight: 400, fontSize: '1rem' }}
            >
              Get AI–powered assistance for your assignments
              <br />
              and optimize your academic time.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  px: 3.5,
                  py: 1.8,
                  fontWeight: 700,
                  fontSize: '1rem !important',
                  borderRadius: 3,
                  bgcolor: 'white',
                  color: '#D32F2F',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                    color: '#B71C1C',
                    boxShadow: 'none',
                  },
                }}
                component={RouterMuiLink}
                to="/register"
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                sx={{
                  px: 3.5,
                  py: 1.8,
                  fontWeight: 700,
                  fontSize: '1rem !important',
                  borderRadius: 2,
                  borderColor: 'white',
                  color: 'white',
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#F5F5F5',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#F5F5F5',
                    boxShadow: 'none',
                  },
                }}
                component={RouterMuiLink}
                to="/login"
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* All main content sections go here, e.g. features, pricing, faq, etc. */}
      <Box
        ref={mainContentRef}
        sx={{
          bgcolor: 'white',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <RedStarField starCount={2500} contentHeight={contentHeight} />
        {/* What Can You Generate With AssignmentAI? Section */}
        <Container id="features" sx={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <Box ref={generateRef} sx={{ py: 8 }}>
            <Box>
              <Paper
                elevation={0}
                sx={{
                  width: 'fit-content',
                  maxWidth: '100%',
                  margin: '0 auto',
                  p: 3,
                  mb: 8,
                  textAlign: 'center',
                  backgroundColor: 'white',
                  border: '2px solid transparent',
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="h2"
                  component="h2"
                  align="center"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontSize: { xs: '2.0rem', md: '3.0rem' },
                    letterSpacing: 1,
                  }}
                >
                  What Can You Generate With AssignmentAI?
                </Typography>
              </Paper>

              <Grid container spacing={4} mt={4} justifyContent="center">
                {[
                  {
                    title: 'Assignment Expert',
                    description:
                      'Use AssignmentAI for quick and accurate answers to study questions. Essential for students striving for high grades.',
                    icon: <SchoolOutlined sx={{ fontSize: 48 }} />,
                    color: '#D32F2F',
                  },
                  {
                    title: 'File Completion Assistant',
                    description:
                      'Upload any document and let AI complete missing sections, fill in blanks, and enhance your content with intelligent suggestions.',
                    icon: <DescriptionOutlined sx={{ fontSize: 48 }} />,
                    color: '#FFC107',
                  },
                  {
                    title: 'Interactive Workshop',
                    description:
                      'Collaborate with AI in real-time through our interactive workshop interface for brainstorming, editing, and refining your assignments.',
                    icon: <BuildOutlined sx={{ fontSize: 48 }} />,
                    color: '#388E3C',
                  },
                  {
                    title: 'Image Analysis & OCR',
                    description:
                      'Upload images of problems, documents, or diagrams and get instant text extraction, analysis, and solutions powered by AI.',
                    icon: <PhotoCameraOutlined sx={{ fontSize: 48 }} />,
                    color: '#F57C00',
                  },
                  {
                    title: 'Smart Content Optimization',
                    description:
                      'Enhance your writing with AI-powered content optimization, style improvements, and academic tone adjustments.',
                    icon: <AutoAwesomeOutlined sx={{ fontSize: 48 }} />,
                    color: '#7B1FA2',
                  },
                  {
                    title: 'Research Assistant',
                    description:
                      'Get comprehensive research support with fact-checking, source verification, and intelligent content summarization.',
                    icon: <LibraryBooksOutlined sx={{ fontSize: 48 }} />,
                    color: '#0288D1',
                  },
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: { xs: 2, md: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        border: `2.25px solid ${feature.color}`,
                        borderRadius: 3,
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                        backgroundColor: 'white',
                        position: 'relative',
                        zIndex: 1,
                        '&:hover': {
                          transform: 'translateY(-6px) scale(1.03)',
                          boxShadow: `0 0 32px ${feature.color}40, 0 0 64px ${feature.color}30`,
                          borderColor: feature.color,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {React.cloneElement(feature.icon, {
                          sx: {
                            fontSize: { xs: '2.5rem', md: '2.5rem' },
                            color: feature.color,
                          },
                        })}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          fontSize: { xs: '1.4rem', md: '1.6rem' },
                          color: '#000000',
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#666666',
                          fontSize: { xs: '1.0rem', md: '1.15rem' },
                          lineHeight: 1.6,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Container>

        {/* Why AssignmentAI is Better than ChatGPT? Section */}
        <Container sx={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <Box ref={comparisonRef} sx={{ py: 8 }}>
            <Box>
              <Paper
                elevation={0}
                sx={{
                  width: 'fit-content',
                  maxWidth: '100%',
                  margin: '0 auto',
                  p: 3,
                  mb: 8,
                  textAlign: 'center',
                  backgroundColor: 'white',
                  border: '2px solid transparent',
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="h2"
                  component="h2"
                  align="center"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontSize: { xs: '2.0rem', md: '3.0rem' },
                    letterSpacing: 1,
                  }}
                >
                  Why AssignmentAI is Better than ChatGPT?
                </Typography>
              </Paper>
              <Grid container spacing={4} component="div" alignItems="stretch">
                <Grid item xs={12} md={6} sx={{ pl: { md: 4 } }} component="div">
                  <Card
                    sx={{
                      p: { xs: 2, md: 3 },
                      height: '100%',
                      borderRadius: 2,
                      boxShadow: 3,
                      border: '2.25px solid #D32F2F',
                      backgroundColor: 'white',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.03)',
                        boxShadow:
                          '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
                        borderColor: '#B71C1C',
                      },
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{
                        mb: 3,
                        fontWeight: 600,
                        fontSize: { xs: '1.4rem', md: '1.6rem' },
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      AssignmentAI
                      <Box
                        component="img"
                        src="/scroll_transparent.png"
                        alt="AssignmentAI Logo"
                        sx={{
                          height: '2rem',
                          width: 'auto',
                          filter: 'brightness(0)',
                          transform: 'translateY(-3px) translateX(-7px)',
                        }}
                      />
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <SchoolOutlined sx={{ fontSize: '1.75rem', color: '#D32F2F' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Academic-Focused AI Training"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Spellcheck sx={{ fontSize: '1.75rem', color: '#FFC107' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Advanced Grammar & Style Analysis"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <SecurityOutlined sx={{ fontSize: '1.75rem', color: '#388E3C' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Secure Document Processing"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <PsychologyOutlined sx={{ fontSize: '1.75rem', color: '#1976D2' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Multi-Model AI Architecture"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <AccessTimeOutlined sx={{ fontSize: '1.75rem', color: '#7B1FA2' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Instant Feedback & Iteration"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6} component="div">
                  <Card
                    sx={{
                      p: { xs: 2, md: 3 },
                      height: '100%',
                      borderRadius: 2,
                      boxShadow: 3,
                      border: '2.25px solid #D32F2F',
                      backgroundColor: 'white',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.03)',
                        boxShadow:
                          '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
                        borderColor: '#B71C1C',
                      },
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{
                        mb: 3,
                        fontWeight: 600,
                        fontSize: { xs: '1.4rem', md: '1.6rem' },
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      ChatGPT
                      <Box
                        component="img"
                        src="/ChatGPT-Logo.png"
                        alt="ChatGPT Logo"
                        sx={{
                          height: '1.5rem',
                          width: 'auto',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          padding: '2px',
                          transform: 'translateY(-3px) translateX(-5px)',
                        }}
                      />
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <LanguageOutlined sx={{ fontSize: '1.75rem', color: '#666666' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Designed for General-Purpose"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <SmartToyOutlined sx={{ fontSize: '1.75rem', color: '#666666' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="General-Purpose AI Model"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <DescriptionOutlined sx={{ fontSize: '1.75rem', color: '#666666' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Limited Academic Focus"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CancelOutlined sx={{ fontSize: '1.75rem', color: '#666666' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Specialized Tools: N/A"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <ThumbDownOutlined sx={{ fontSize: '1.75rem', color: '#666666' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="References may not be real-time"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>

        {/* Trending Features of AssignmentAI Section */}
        <Container sx={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <Box ref={trendingRef} sx={{ py: 8 }}>
            <Box>
              <Paper
                elevation={0}
                sx={{
                  width: 'fit-content',
                  maxWidth: '100%',
                  margin: '0 auto',
                  p: 3,
                  mb: 8,
                  textAlign: 'center',
                  backgroundColor: 'white',
                  border: '2px solid transparent',
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="h2"
                  component="h2"
                  align="center"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontSize: { xs: '2.0rem', md: '3.0rem' },
                    letterSpacing: 1,
                  }}
                >
                  Trending Features of AssignmentAI
                </Typography>
              </Paper>

              <Grid container spacing={4} mt={4}>
                {[
                  {
                    title: 'Interactive File Completion',
                    description:
                      'Upload any document and collaborate with AI in real-time to complete missing sections, fill blanks, and enhance your content.',
                    icon: <BuildOutlined sx={{ fontSize: 48 }} />,
                    color: '#F57C00',
                  },
                  {
                    title: 'Smart Research Assistant',
                    description:
                      'Get comprehensive research support with fact-checking, source verification, and intelligent content summarization for your assignments.',
                    icon: <PsychologyOutlined sx={{ fontSize: 48 }} />,
                    color: '#388E3C',
                  },
                  {
                    title: 'Advanced Content Optimization',
                    description:
                      'Enhance your writing with AI-powered content optimization, style improvements, and academic tone adjustments.',
                    icon: <Spellcheck sx={{ fontSize: 48 }} />,
                    color: '#1976D2',
                  },
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: { xs: 2, md: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        border: `2.25px solid ${feature.color}`,
                        borderRadius: 3,
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                        backgroundColor: 'white',
                        position: 'relative',
                        zIndex: 1,
                        '&:hover': {
                          transform: 'translateY(-6px) scale(1.03)',
                          boxShadow: `0 0 32px ${feature.color}40, 0 0 64px ${feature.color}30`,
                          borderColor: feature.color,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {React.cloneElement(feature.icon, {
                          sx: {
                            fontSize: { xs: '2.5rem', md: '2.5rem' },
                            color: feature.color,
                          },
                        })}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          fontSize: { xs: '1.4rem', md: '1.6rem' },
                          color: '#000000',
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#666666',
                          fontSize: { xs: '1.0rem', md: '1.15rem' },
                          lineHeight: 1.6,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Container>

        {/* Features Section */}
        {/* App Screenshots Section (now Modern Feature Grid) */}
        <Container sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
          <Box ref={screenshotsRef}>
            <Paper
              elevation={0}
              sx={{
                width: 'fit-content',
                maxWidth: '100%',
                margin: '0 auto',
                p: 3,
                mb: 8,
                textAlign: 'center',
                backgroundColor: 'white',
                border: '2px solid transparent',
                borderRadius: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Typography
                variant="h2"
                component="h2"
                align="center"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: { xs: '2.0rem', md: '3.0rem' },
                  letterSpacing: 1,
                }}
              >
                Why We Love AssignmentAI
              </Typography>
            </Paper>
            <Grid container spacing={4} justifyContent="center">
              {[
                {
                  icon: <AssignmentOutlined sx={{ fontSize: 48, color: '#D32F2F' }} />,
                  color: '#D32F2F',
                  title: 'Instant Assignment Solutions',
                  desc: 'Get accurate, AI-powered answers to your homework and study questions in seconds.',
                },
                {
                  icon: <DiamondOutlined sx={{ fontSize: 48, color: '#FFA000' }} />,
                  color: '#FFA000',
                  title: 'Premium Features',
                  desc: 'Unlock advanced tools like AI diagram maker, code generator, and more.',
                },
                {
                  icon: <BoltOutlined sx={{ fontSize: 48, color: '#FFD600' }} />,
                  color: '#FFD600',
                  title: 'Lightning Fast Feedback',
                  desc: 'Receive instant feedback and suggestions to boost your academic performance.',
                },
                {
                  icon: <PsychologyOutlined sx={{ fontSize: 48, color: '#e91e63' }} />,
                  color: '#e91e63',
                  title: 'Smart Writing Assistance',
                  desc: 'Improve your essays and reports with advanced grammar, style, and structure suggestions.',
                },
                {
                  icon: <SecurityOutlined sx={{ fontSize: 48, color: '#0288d1' }} />,
                  color: '#0288d1',
                  title: 'Secure & Private',
                  desc: 'Your data and assignments are protected with enterprise-grade security.',
                },
                {
                  icon: <CheckCircleOutlineOutlined sx={{ fontSize: 48, color: '#43a047' }} />,
                  color: '#43a047',
                  title: 'Trusted by Students & Teachers',
                  desc: 'Join thousands of students and teachers who rely on AssignmentAI for academic success.',
                },
              ].map((feature, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 3,
                      borderRadius: 4,
                      boxShadow: 3,
                      textAlign: 'center',
                      border: '2.25px solid #D32F2F',
                      borderColor: feature.color,
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      backgroundColor: 'white',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.03)',
                        boxShadow: `0 0 32px ${feature.color}40, 0 0 64px ${feature.color}30`,
                        borderColor: feature.color,
                      },
                    }}
                  >
                    <Box sx={{ mb: 1.5 }}>{feature.icon}</Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: '#000000',
                        fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography sx={{ color: '#666666' }}>{feature.desc}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* Starred Statistics Section */}
        <Box ref={starredStatsRef} sx={{ py: { xs: 6, md: 8 }, position: 'relative', zIndex: 1 }}>
          <Container>
            <Paper
              elevation={0}
              sx={{
                width: 'fit-content',
                maxWidth: '100%',
                margin: '0 auto',
                p: 3,
                mb: 6,
                textAlign: 'center',
                backgroundColor: 'white',
                border: '2px solid transparent',
                borderRadius: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Typography
                variant="h2"
                align="center"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: { xs: '2.0rem', md: '3.0rem' },
                  letterSpacing: 1,
                }}
              >
                Key Statistics
              </Typography>
            </Paper>
            <Grid container spacing={4} justifyContent="center">
              {[
                {
                  number: '4',
                  label: 'AI Models',
                  icon: <PsychologyOutlined sx={{ fontSize: 48 }} />,
                  color: '#D32F2F',
                },
                {
                  number: '95%',
                  label: 'Success Rate',
                  icon: <TrendingUpOutlined sx={{ fontSize: 48 }} />,
                  color: '#FF9800',
                },
                {
                  number: '24/7',
                  label: 'AI Support',
                  icon: <SmartToyOutlined sx={{ fontSize: 48 }} />,
                  color: '#4CAF50',
                },
                {
                  number: '10',
                  label: 'Core Subject Areas',
                  icon: <LibraryBooksOutlined sx={{ fontSize: 48 }} />,
                  color: '#2196F3',
                },
              ].map((stat, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, sm: 4, md: 5 },
                      minHeight: { xs: 180, sm: 200, md: 240 },
                      textAlign: 'center',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      border: `2.25px solid ${stat.color}`,
                      borderRadius: 3.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 8px 32px ${stat.color}40`,
                        borderColor: stat.color,
                      },
                    }}
                  >
                    <Typography
                      variant="h2"
                      component="div"
                      sx={{
                        fontWeight: 800,
                        color: stat.color,
                        mb: 2,
                        fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
                        lineHeight: 1.1,
                        fontFamily: '"Mike Sans", "Audiowide", Arial, sans-serif',
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Box
                      sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: stat.color,
                      }}
                    >
                      {React.cloneElement(stat.icon, {
                        sx: {
                          fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
                          color: stat.color,
                        },
                      })}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#333333',
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                        lineHeight: 1.3,
                        px: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Pricing Preview Section */}
        <Container id="pricing" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
          <Box ref={pricingRef}>
            <Paper
              elevation={0}
              sx={{
                width: 'fit-content',
                maxWidth: '100%',
                margin: '0 auto',
                p: 3,
                mb: 8,
                textAlign: 'center',
                backgroundColor: 'white',
                border: '2px solid transparent',
                borderRadius: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Typography
                variant="h2"
                component="h2"
                align="center"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: { xs: '2.0rem', md: '3.0rem' },
                  letterSpacing: 1,
                }}
              >
                Pricing Plans
              </Typography>
            </Paper>
            <Grid container spacing={4} justifyContent="center">
              {plans.map(plan => (
                <Grid item xs={12} sm={6} md={3} key={plan.name}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      border: '2.25px solid #D32F2F',
                      borderColor: plan.color,
                      borderRadius: 3.5,
                      boxShadow: 3,
                      backgroundColor: 'white',
                      zIndex: 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 8px 24px ${plan.color}40`,
                        borderColor: plan.color,
                      },
                      minWidth: '240px',
                      overflow: 'visible',
                    }}
                  >
                    {plan.popular && (
                      <Chip
                        icon={<WorkspacePremiumIcon />}
                        label="Most Popular"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -18,
                          left: 0,
                          right: 0,
                          mx: 'auto',
                          width: 'fit-content',
                          borderRadius: 2,
                          zIndex: 2,
                          fontSize: '1.05rem',
                          boxShadow: 2,
                          bgcolor: '#D32F2F',
                          color: 'white',
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            color: plan.color,
                          }}
                        >
                          {plan.icon}
                          <Typography variant="h4" fontWeight="bold">
                            {plan.name}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="h2"
                            fontWeight="bold"
                            gutterBottom
                            sx={{
                              fontFamily: '"Mike Sans", "Audiowide", Arial, sans-serif',
                              fontSize: { xs: '2.0rem', md: '2.5rem' },
                              color: '#000000',
                            }}
                          >
                            {plan.price === 0 ? 'Free' : `$${plan.price}`}
                            {plan.price !== 0 && (
                              <Typography
                                component="span"
                                variant="h5"
                                sx={{
                                  color: '#000000',
                                  fontFamily: '"Mike Sans", "Audiowide", Arial, sans-serif',
                                  fontSize: { xs: '1.0rem', md: '1.25rem' },
                                }}
                              >
                                /mo
                              </Typography>
                            )}
                          </Typography>
                          <Typography
                            sx={{
                              color: '#666666',
                              fontSize: { xs: '1.0rem', md: '1.15rem' },
                            }}
                          >
                            {plan.description}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: -1 }}>
                          {plan.name === 'Free' && (
                            <Chip
                              icon={<SmartToyOutlined />}
                              label="GPT-5 Nano"
                              size="small"
                              sx={{
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                border: '1.25px solid #90caf9',
                                fontSize: '0.85rem',
                                px: 0.5,
                                height: 24,
                                minHeight: 20,
                                '& .MuiChip-icon': { color: '#1976d2', fontSize: 18 },
                              }}
                            />
                          )}
                          {plan.name === 'Plus' && (
                            <Chip
                              icon={<PsychologyOutlined />}
                              label="GPT-4.1 Mini"
                              size="small"
                              sx={{
                                backgroundColor: '#e8f5e9',
                                color: '#388e3c',
                                border: '1.25px solid #81c784',
                                fontSize: '0.85rem',
                                px: 0.5,
                                height: 24,
                                minHeight: 20,
                                '& .MuiChip-icon': { color: '#388e3c', fontSize: 18 },
                              }}
                            />
                          )}
                          {plan.name === 'Pro' && (
                            <Chip
                              icon={<AutoAwesomeOutlined />}
                              label="GPT-4 Turbo"
                              size="small"
                              sx={{
                                backgroundColor: '#f3e5f5',
                                color: '#8e24aa',
                                border: '1.25px solid #ce93d8',
                                fontSize: '0.85rem',
                                px: 0.5,
                                height: 24,
                                minHeight: 20,
                                '& .MuiChip-icon': { color: '#8e24aa', fontSize: 18 },
                              }}
                            />
                          )}
                          {plan.name === 'Max' && (
                            <Chip
                              icon={<RocketLaunchOutlined />}
                              label="GPT-5"
                              size="small"
                              sx={{
                                backgroundColor: '#fff3e0',
                                color: '#f57c00',
                                border: '1.25px solid #ffb74d',
                                fontSize: '0.85rem',
                                px: 0.5,
                                height: 24,
                                minHeight: 20,
                                '& .MuiChip-icon': { color: '#f57c00', fontSize: 18 },
                              }}
                            />
                          )}
                        </Box>
                        {plan.name === 'Free' && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            sx={{
                              fontSize: { xs: '0.85rem', md: '0.95rem' },
                              fontWeight: 400,
                              mt: 0.5,
                              mb: 0,
                            }}
                          >
                            100,000 tokens/month
                          </Typography>
                        )}
                        {plan.name === 'Plus' && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            sx={{
                              fontSize: { xs: '0.85rem', md: '0.95rem' },
                              fontWeight: 400,
                              mt: 0.5,
                              mb: 0,
                            }}
                          >
                            250,000 tokens/month
                          </Typography>
                        )}
                        {plan.name === 'Pro' && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            sx={{
                              fontSize: { xs: '0.85rem', md: '0.95rem' },
                              fontWeight: 400,
                              mt: 0.5,
                              mb: 0,
                            }}
                          >
                            500,000 tokens/month
                          </Typography>
                        )}
                        {plan.name === 'Max' && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            sx={{
                              fontSize: { xs: '0.85rem', md: '0.95rem' },
                              fontWeight: 400,
                              mt: 0.5,
                              mb: 0,
                            }}
                          >
                            1,000,000 tokens/month
                          </Typography>
                        )}
                        <Divider />
                        <Stack spacing={1.5}>
                          {plan.name === 'Free' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#000000',
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                                pl: 0.5,
                              }}
                            >
                              Free Features
                            </Typography>
                          )}
                          {plan.name === 'Plus' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#000000',
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                                pl: 0.5,
                              }}
                            >
                              + Everything in Free
                            </Typography>
                          )}
                          {plan.name === 'Pro' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#000000',
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                                pl: 0.5,
                              }}
                            >
                              + Everything in Plus
                            </Typography>
                          )}
                          {plan.name === 'Max' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#000000',
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                                pl: 0.5,
                              }}
                            >
                              + Everything in Pro
                            </Typography>
                          )}
                          {plan.features.map(feature =>
                            feature.startsWith('Everything in') ? (
                              <Typography
                                key={feature}
                                variant="caption"
                                sx={{
                                  color: '#000000',
                                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                                  fontWeight: 500,
                                  pl: 0.5,
                                }}
                              >
                                {feature}
                              </Typography>
                            ) : (
                              <Stack key={feature} direction="row" spacing={1} alignItems="center">
                                {getFeatureIcon(feature, plan.color)}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: { xs: '1.0rem', md: '1.1rem' },
                                    color: '#000000',
                                  }}
                                >
                                  {feature}
                                </Typography>
                              </Stack>
                            )
                          )}
                        </Stack>
                        <Button
                          variant={plan.popular ? 'contained' : 'outlined'}
                          color="primary"
                          size="large"
                          onClick={() => handlePlanRegistration(plan.name)}
                          component={RouterMuiLink}
                          to="/register"
                          sx={{
                            px: 3.5,
                            py: 1.8,
                            fontWeight: 700,
                            fontSize: '1.0rem',
                            borderRadius: 2,
                            ...(plan.popular
                              ? {
                                  bgcolor: '#D32F2F',
                                  color: 'white',
                                  '&:hover': { bgcolor: '#B71C1C' },
                                }
                              : {
                                  borderColor: '#D32F2F',
                                  color: '#D32F2F',
                                  '&:hover': {
                                    borderColor: '#B71C1C',
                                    bgcolor: 'rgba(211, 47, 47, 0.04)',
                                  },
                                }),
                            textTransform: 'none',
                          }}
                        >
                          Get Started
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* FAQ Section */}
        <Container id="faq" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
          <Box ref={faqRef}>
            <Box>
              <Paper
                elevation={0}
                sx={{
                  width: 'fit-content',
                  maxWidth: '100%',
                  margin: '0 auto',
                  p: 3,
                  mb: 8,
                  textAlign: 'center',
                  backgroundColor: 'white',
                  border: '2px solid transparent',
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="h2"
                  component="h2"
                  align="center"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontSize: { xs: '2.0rem', md: '3.0rem' },
                    letterSpacing: 1,
                  }}
                >
                  Frequently Asked Questions
                </Typography>
              </Paper>
              <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                {faqs.map((faq, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx} sx={{ height: '100%' }}>
                    <Paper
                      sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: 4,
                        maxWidth: 700,
                        mx: 'auto',
                        backgroundColor: 'grey.50',
                        boxShadow: 3,
                        textAlign: 'center',
                        border: '2.25px solid #D32F2F',
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        zIndex: 1,
                        '&:hover': {
                          transform: 'translateY(-6px) scale(1.03)',
                          boxShadow:
                            '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
                          borderColor: '#B71C1C',
                        },
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={600}
                        sx={{
                          mb: 1,
                          fontSize: { xs: '1.2rem', md: '1.4rem' },
                          color: '#000000',
                        }}
                      >
                        {faq.question}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#666666',
                          fontSize: { xs: '1.0rem', md: '1.1rem' },
                          lineHeight: 1.5,
                        }}
                      >
                        {faq.answer}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Container>

        {/* Blog/Resources Preview Section */}
        <Container
          id="resources-tips"
          ref={resourcesRef}
          sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Paper
              elevation={0}
              sx={{
                width: 'fit-content',
                maxWidth: '100%',
                margin: '0 auto',
                p: 3,
                mb: 8,
                textAlign: 'center',
                backgroundColor: 'white',
                border: '2px solid transparent',
                borderRadius: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Typography
                variant="h2"
                component="h2"
                align="center"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(45deg, #D32F2F 30%, #FF5252 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: { xs: '2.0rem', md: '3.0rem' },
                  letterSpacing: 1,
                }}
              >
                Resources & Tips
              </Typography>
            </Paper>
            <Grid container spacing={4} justifyContent="center">
              {blogPosts.map((post, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 4,
                      maxWidth: 700,
                      mx: 'auto',
                      backgroundColor: 'grey.50',
                      boxShadow: 3,
                      textAlign: 'center',
                      border: '2.25px solid #D32F2F',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.03)',
                        boxShadow:
                          '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
                        borderColor: '#B71C1C',
                      },
                    }}
                  >
                    <Typography
                      variant="h3"
                      gutterBottom
                      sx={{
                        fontSize: { xs: '1.4rem', md: '1.8rem' },
                        mb: 2,
                        fontWeight: 600,
                        color: '#000000',
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#666666',
                        mb: 2,
                        fontSize: { xs: '1.0rem', md: '1.1rem' },
                        lineHeight: 1.5,
                      }}
                    >
                      {post.summary}
                    </Typography>
                    <Typography component="span">
                      <MuiLink
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#D32F2F',
                          transition: 'all 0.2s ease-in-out',
                          fontSize: '1.0rem',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            color: '#B71C1C',
                          },
                        }}
                      >
                        Read More
                      </MuiLink>
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* Contact Us Section (above footer) */}
        <Container sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
          <Paper
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 4,
              maxWidth: 950,
              mx: 'auto',
              backgroundColor: 'white',
              boxShadow: 3,
              textAlign: 'center',
              border: '2.25px solid #D32F2F',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              position: 'relative',
              zIndex: 1,
              '&:hover': {
                transform: 'translateY(-6px) scale(1.03)',
                boxShadow: '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
              },
            }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                mb: 2,
                fontWeight: 900,
                color: '#D32F2F',
                letterSpacing: 1,
                fontSize: { xs: '2.2rem', md: '3rem' },
              }}
            >
              Contact Us
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                color: '#000000',
                fontWeight: 600,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              We're here to help—reach out anytime!
            </Typography>
            <Divider sx={{ mb: 3, borderColor: 'primary.main', opacity: 0.15 }} />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={4}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 4 }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <EmailOutlined sx={{ color: '#D32F2F' }} />
                <Typography
                  component="span"
                  sx={{
                    color: '#000000',
                    fontSize: '1rem',
                  }}
                >
                  support@assignmentai.app
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <AccessTimeOutlined sx={{ color: '#D32F2F' }} />
                <Typography
                  component="span"
                  sx={{
                    color: '#000000',
                    fontSize: '1rem',
                  }}
                >
                  24/7 Support
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <HelpOutline sx={{ color: '#D32F2F' }} />
                <Typography component="span" sx={{ color: '#000000', fontWeight: 700 }}>
                  <RouterMuiLink
                    to="/about"
                    sx={{
                      color: '#000000',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: '#B71C1C',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    About
                  </RouterMuiLink>
                </Typography>
              </Stack>
            </Stack>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                fontSize: { xs: '1.15rem', md: '1.35rem' },
                color: '#666666',
                fontWeight: 500,
              }}
            >
              Have a question, suggestion, or need support? Our team is here to help you 24/7. Click
              below to reach out and we'll get back to you as soon as possible.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterMuiLink}
              to="/contact"
              sx={{
                px: 4.5,
                py: 2.2,
                fontWeight: 700,
                fontSize: '1.25rem',
                borderRadius: 2,
                bgcolor: '#D32F2F',
                color: 'white',
                textTransform: 'none',
                '&:hover': { bgcolor: '#B71C1C' },
              }}
            >
              Go to Contact Page
            </Button>
          </Paper>
        </Container>

        {/* Back to Top Section */}
        <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'white' }}>
          <Container>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                sx={{
                  bgcolor: '#D32F2F',
                  color: 'white',
                  fontSize: '1.2rem !important',
                  px: 6,
                  py: 2.8,
                  borderRadius: 2,
                  textTransform: 'none',
                  minHeight: '60px',
                  '&:hover': {
                    bgcolor: '#B71C1C',
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Back to Top
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          ref={footerRef}
          component="footer"
          sx={{
            bgcolor: 'grey.900',
            color: 'grey.100',
            py: 6,
            position: 'relative',
            zIndex: 2,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'grey.900',
              zIndex: -1,
            },
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, ml: 1, color: '#E53E3E' }}>
                    AssignmentAI
                  </Typography>
                </Box>
                <Typography variant="body2" color="grey.400">
                  Your AI-powered assignment companion. Helping students excel, one assignment at a
                  time.
                </Typography>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#E53E3E' }}>
                  Company
                </Typography>
                <Stack spacing={1}>
                  <RouterMuiLink
                    to="/about"
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: '#D32F2F',
                        textDecoration: 'underline',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    About
                  </RouterMuiLink>
                  <RouterMuiLink
                    to="/contact"
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: '#D32F2F',
                        textDecoration: 'underline',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Contact
                  </RouterMuiLink>
                </Stack>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#E53E3E' }}>
                  Legal
                </Typography>
                <Stack spacing={1}>
                  <RouterMuiLink
                    to="/privacy"
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: '#D32F2F',
                        textDecoration: 'underline',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Privacy Policy
                  </RouterMuiLink>
                  <RouterMuiLink
                    to="/terms"
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: '#D32F2F',
                        textDecoration: 'underline',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Terms of Service
                  </RouterMuiLink>
                </Stack>
              </Grid>
            </Grid>
            <Box textAlign="center" mt={6} color="grey.500">
              &copy; {new Date().getFullYear()} AssignmentAI. All rights reserved.
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default Landing;
