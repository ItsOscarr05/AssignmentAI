'use client';

import { styled } from '@mui/material/styles';
import React, { lazy, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import HeroParticles from '../components/HeroParticles';
import RedStarField from '../components/RedStarField';
import { getAdminStats } from '../services/AdminService';
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
  AllInclusive,
  AssignmentOutlined,
  AutoAwesomeOutlined,
  AutoFixHighOutlined,
  BarChartOutlined,
  BlockOutlined,
  BoltOutlined,
  CheckCircle,
  CheckCircleOutlineOutlined,
  CodeOutlined,
  DesignServicesOutlined,
  Diamond,
  DiamondOutlined,
  EmailOutlined,
  FormatQuoteOutlined,
  GppGoodOutlined,
  LibraryBooksOutlined,
  MilitaryTechOutlined,
  PaletteOutlined,
  PsychologyOutlined,
  RocketLaunchOutlined,
  SchoolOutlined,
  ScienceOutlined,
  Search,
  SecurityOutlined,
  SmartToyOutlined,
  Speed,
  Spellcheck,
  StyleOutlined,
  TextSnippetOutlined,
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
const EmojiEvents = lazy(() =>
  import('@mui/icons-material/EmojiEvents').then(module => ({
    default: module.default,
  }))
);
const HelpOutline = lazy(() =>
  import('@mui/icons-material/HelpOutline').then(module => ({
    default: module.default,
  }))
);
const LocalOffer = lazy(() =>
  import('@mui/icons-material/LocalOffer').then(module => ({
    default: module.default,
  }))
);
const Star = lazy(() =>
  import('@mui/icons-material/Star').then(module => ({
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
    case 'Standard Response Time':
      return <Speed sx={{ color }} />;
    case 'Basic Templates':
      return <TextSnippetOutlined sx={{ color }} />;
    case 'Advanced Writing Analysis':
      return <ScienceOutlined sx={{ color }} />;
    case 'Style & Tone Suggestions':
      return <PaletteOutlined sx={{ color }} />;
    case 'Priority Response Time':
      return <Speed sx={{ color }} />;
    case 'Extended Templates Library':
      return <LibraryBooksOutlined sx={{ color }} />;
    case 'AI-Powered Research Assistance':
      return <Search sx={{ color }} />;
    case 'Citation & Reference Check':
      return <FormatQuoteOutlined sx={{ color }} />;
    case 'Custom Writing Style Guide':
      return <StyleOutlined sx={{ color }} />;
    case 'Advanced Plagiarism Detection':
      return <GppGoodOutlined sx={{ color }} />;
    case '24/7 Priority Support':
      return <AccessTimeOutlined sx={{ color }} />;
    case 'Unlimited Assignment Analysis':
      return <AllInclusive sx={{ color }} />;
    case 'Advanced Analytics Dashboard':
      return <BarChartOutlined sx={{ color }} />;
    case 'Priority Customer Support':
      return <MilitaryTechOutlined sx={{ color }} />;
    case 'Custom Assignment Templates':
      return <DesignServicesOutlined sx={{ color }} />;
    case 'API Access':
      return <CodeOutlined sx={{ color }} />;
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
    icon: <LocalOffer sx={{ color: '#2196f3' }} />,
    color: '#2196f3',
    features: [
      'Basic Assignment Analysis',
      'Grammar & Spelling Check',
      'Basic Writing Suggestions',
      'Standard Response Time',
      'Basic Templates',
    ],
  },
  {
    name: 'Plus',
    price: 4.99,
    description: 'Enhanced features for more serious students',
    icon: <Star sx={{ color: '#4caf50' }} />,
    color: '#4caf50',
    features: [
      'Everything in Free',
      'Advanced Writing Analysis',
      'Style & Tone Suggestions',
      'Priority Response Time',
      'Extended Templates Library',
      'Ad-Free Experience',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: 9.99,
    description: 'Advanced features for professional students',
    icon: <Diamond sx={{ color: '#9c27b0' }} />,
    color: '#9c27b0',
    features: [
      'Everything in Plus',
      'AI-Powered Research Assistance',
      'Citation & Reference Check',
      'Advanced Plagiarism Detection',
      '24/7 Priority Support',
      'Ad-Free Experience',
    ],
  },
  {
    name: 'Max',
    price: 14.99,
    description: 'Ultimate package for power users',
    icon: <EmojiEvents sx={{ color: '#ff9800' }} />,
    color: '#ff9800',
    features: [
      'Everything in Pro',
      'Unlimited Assignment Analysis',
      'Advanced Analytics Dashboard',
      'Priority Customer Support',
      'Custom Assignment Templates',
      'Ad-Free Experience',
    ],
  },
];

const faqs = [
  {
    question: 'Is there a free version?',
    answer: 'Yes! AssignmentAI offers a robust free plan for all users.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'You can change your plan at any time from your dashboard.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade security to protect your academic work.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'AssignmentAI is fully web-based and works on all modern browsers.',
  },
  {
    question: 'Can I collaborate with others?',
    answer: 'Yes, you can invite classmates or teammates to work together on assignments.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and follow the instructions.',
  },
  {
    question: 'Do you offer customer support?',
    answer: 'Yes, our support team is available 24/7 via email.',
  },
  {
    question: 'Can I use AssignmentAI on my phone?',
    answer: 'Absolutely! The platform is fully responsive and works on all devices.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'You can request account deletion from your profile settings at any time.',
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
  const [totalUsers, setTotalUsers] = useState<number>(0);
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
    const fetchStats = async () => {
      try {
        const stats = await getAdminStats();
        const userCount =
          stats.total_users < 100
            ? stats.total_users
            : stats.total_users < 1000
            ? Math.floor(stats.total_users / 100) * 100
            : Math.floor(stats.total_users / 1000) * 1000;
        setTotalUsers(userCount);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Don't redirect on error, just use default value
        setTotalUsers(10000);
      }
    };

    // Only fetch stats if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchStats();
    } else {
      // Use default value for unauthenticated users
      setTotalUsers(10000);
    }
  }, []);

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
              variant="h4"
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
              mx: { xs: 'auto', sm: 0, md: 0 },
              ml: { xs: 'auto', sm: 'auto', md: 'auto' },
              mr: { xs: '75px', sm: 0, md: 0 },
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
            <Typography variant="h6" sx={{ mb: 3, color: 'white', opacity: 0.92, fontWeight: 400 }}>
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
                    icon: '📚',
                  },
                  {
                    title: 'Grammar Guru',
                    description:
                      'Improve your writing with instant grammar, style, and punctuation suggestions. Ideal for crafting flawless essays and emails.',
                    icon: '✍️',
                  },
                  {
                    title: 'Diagram Maker',
                    description:
                      'Easily generate diagrams and charts to visually represent data and concepts, making complex information clear and engaging.',
                    icon: '📊',
                  },
                  {
                    title: 'Image to Answer',
                    description:
                      'Take a photo of your problem and get the answer instantly – a revolutionary tool for homework and studies.',
                    icon: '📷',
                  },
                  {
                    title: 'AI Detector & Humanizer',
                    description:
                      'AssignmentWriter adds a human touch to AI text, making engaging and relatable content for your audience.',
                    icon: '🤖',
                  },
                  {
                    title: 'Creative Code Generator',
                    description:
                      'Need help with code? Generate unique codes for your projects and seamlessly integrate them into your products.',
                    icon: '💻',
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
                        border: '2.25px solid #D32F2F',
                        borderRadius: 3,
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                        backgroundColor: 'white',
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
                      <Box sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '2.5rem' } }}>
                        {feature.icon}
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
                      }}
                    >
                      AssignmentAI
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <span style={{ fontSize: '1.75rem' }}>🎓</span>
                        </ListItemIcon>
                        <ListItemText
                          primary="Designed for Students & Academia"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <span style={{ fontSize: '1.75rem' }}>🧠</span>
                        </ListItemIcon>
                        <ListItemText
                          primary="Superior AI Model Built for Students & Academia"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <span style={{ fontSize: '1.75rem' }}>📖</span>
                        </ListItemIcon>
                        <ListItemText
                          primary="Enriched with 20+ Academia Use Cases"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <span style={{ fontSize: '1.75rem', color: '#000000' }}>✔</span>
                        </ListItemIcon>
                        <ListItemText
                          primary="Specialized Tools: AI Diagram Maker, Code Generation/Programming, Math Solver"
                          primaryTypographyProps={{
                            fontSize: { xs: '1.0rem', md: '1.15rem' },
                            color: '#000000',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <span style={{ fontSize: '1.75rem' }}>👍</span>
                        </ListItemIcon>
                        <ListItemText
                          primary="Real-Time Reference: Answers with Real-Time References"
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
                      }}
                    >
                      ChatGPT
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <span style={{ fontSize: '1.75rem' }}>🌐</span>
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
                          <span style={{ fontSize: '1.75rem' }}>🤖</span>
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
                          <span style={{ fontSize: '1.75rem' }}>📃</span>
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
                          <span style={{ fontSize: '1.75rem' }}>❌</span>
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
                          <span style={{ fontSize: '1.75rem' }}>👎</span>
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
                    title: 'Quick Photo Answers',
                    description:
                      'Snap a photo of your homework and get the answer right away. No more scratching your head over tough questions!',
                    icon: '📷',
                  },
                  {
                    title: 'Easy Diagram Maker',
                    description:
                      'Create diagrams for your assignments with just a few clicks. No need for drawing or fancy software.',
                    icon: '📊',
                  },
                  {
                    title: 'Math Problem Solver',
                    description:
                      'Stuck on a math problem? AssignmentAI can solve it for free! Simply upload your problem and receive high-quality, precise answers within seconds.',
                    icon: '🔢',
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
                        border: '2.25px solid #D32F2F',
                        borderRadius: 3,
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                        backgroundColor: 'white',
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
                      <Box sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '2.5rem' } }}>
                        {feature.icon}
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
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#000000' }}>
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
                  number:
                    totalUsers < 100
                      ? totalUsers.toLocaleString()
                      : `${totalUsers.toLocaleString()}+`,
                  label: totalUsers === 1 ? 'Student Helped' : 'Students Helped',
                  icon: '👨‍🎓',
                  color: '#2196f3',
                },
                {
                  number: '95%',
                  label: 'Success Rate',
                  icon: '📈',
                  color: '#4caf50',
                },
                {
                  number: '24/7',
                  label: 'AI Support',
                  icon: '🤖',
                  color: '#9c27b0',
                },
                {
                  number: '50+',
                  label: 'Subject Areas',
                  icon: '📚',
                  color: '#ff9800',
                },
              ].map((stat, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: { xs: 2, sm: 3, md: 5 },
                      minHeight: { xs: 160, sm: 180, md: 220 },
                      textAlign: 'center',
                      backgroundColor: 'white',
                      boxShadow: 3,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: '2.25px solid #D32F2F',
                      borderColor: stat.color,
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 0 32px ${stat.color}40, 0 0 64px ${stat.color}30`,
                      },
                    }}
                  >
                    <Typography
                      variant="h2"
                      component="div"
                      sx={{
                        fontWeight: 700,
                        color: stat.color,
                        mb: 1,
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                        lineHeight: 1.2,
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        mb: 1,
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                        lineHeight: 1.2,
                      }}
                    >
                      {stat.icon}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#666666',
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                        lineHeight: 1.2,
                        px: 1,
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
                            30,000 tokens/month
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
                            50,000 tokens/month
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
                            75,000 tokens/month
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
                            100,000 tokens/month
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
                  variant="h6"
                  sx={{
                    color: '#000000',
                    fontSize: { xs: '1rem', md: '1.25rem' },
                  }}
                >
                  support@assignmentai.app
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <AccessTimeOutlined sx={{ color: '#D32F2F' }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: '#000000',
                    fontSize: { xs: '1rem', md: '1.25rem' },
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
                  fontSize: '1.25rem',
                  px: 4.5,
                  py: 2.2,
                  borderRadius: 2,
                  textTransform: 'none',
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
                {/* Newsletter Signup */}
                <Box
                  component="form"
                  action="#"
                  method="post"
                  sx={{ mt: 4, display: 'flex', gap: 1 }}
                >
                  <input
                    type="email"
                    name="newsletter-email"
                    placeholder="Your email for updates"
                    required
                    aria-label="Newsletter email"
                    style={{
                      padding: '10px 14px',
                      border: '1px solid #444',
                      borderRadius: '4px 0 0 4px',
                      fontSize: '1rem',
                      outline: 'none',
                      width: 180,
                      maxWidth: '100%',
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{
                      borderRadius: '0 4px 4px 0',
                      px: 3,
                      fontWeight: 600,
                      height: '42px',
                      bgcolor: '#D32F2F',
                      color: 'white',
                      '&:hover': { bgcolor: '#B71C1C' },
                    }}
                  >
                    Subscribe
                  </Button>
                </Box>
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
