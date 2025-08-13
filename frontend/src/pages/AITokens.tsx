import {
  Autorenew as AutorenewIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  Psychology as BrainIcon,
  CalculateOutlined as CalculateIcon,
  CheckCircleOutline as CheckCircleIcon,
  Close as CloseIcon,
  CodeOutlined as CodeIcon,
  CreditCard as CreditCardIcon,
  DescriptionOutlined as DescriptionIcon,
  History as HistoryIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ImageOutlined as ImageIcon,
  InfoOutlined as InfoIcon,
  OpenInNew as OpenInNewIcon,
  RateReviewOutlined as RateReviewIcon,
  ReceiptLongOutlined as ReceiptLongOutlinedIcon,
  ReportOutlined as ReportIcon,
  SchoolOutlined as SchoolIcon,
  TerminalOutlined as TerminalIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { recentAssignmentsWithSubject } from '../data/mockData';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { api } from '../services/api';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  token_limit: number;
}

const AITokens: React.FC = () => {
  // All hooks at the top
  const { breakpoint } = useAspectRatio();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = React.useState<'7' | '30'>('7');
  const guideRef = React.useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [popoverContent, setPopoverContent] = React.useState<any>(null);
  const [calcTokens, setCalcTokens] = React.useState(0);
  const [calcCost, setCalcCost] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isMockUser } = useAuth();
  const [assignments, setAssignments] = useState<any[]>(
    isMockUser ? [...recentAssignmentsWithSubject] : []
  );
  const [transactions, setTransactions] = useState<any[]>([]);

  const { totalTokens, usedTokens, remainingTokens, percentUsed } = useTokenUsage(subscription);
  const mapPlanToLimit = (planId?: string): number | undefined => {
    if (!planId) return undefined;
    if (planId === 'price_test_free') return 30000;
    if (planId === 'price_test_plus') return 50000;
    if (planId === 'price_test_pro') return 75000;
    if (planId === 'price_test_max') return 100000;
    const envPlus = (import.meta as any).env?.VITE_STRIPE_PRICE_PLUS;
    const envPro = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
    const envMax = (import.meta as any).env?.VITE_STRIPE_PRICE_MAX;
    const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;
    const is = (ids: Array<string | undefined>) => ids.filter(Boolean).includes(planId);
    if (is(['price_free', envFree])) return 30000;
    if (is(['price_plus', envPlus])) return 50000;
    if (is(['price_pro', envPro])) return 75000;
    if (is(['price_max', envMax])) return 100000;
    return undefined;
  };
  const mappedLimit = mapPlanToLimit(subscription?.plan_id);
  const computedTotalTokens =
    (subscription?.token_limit && subscription.token_limit > 0
      ? subscription.token_limit
      : mappedLimit) ?? totalTokens;
  console.log('AITokens: mapping debug', {
    planId: subscription?.plan_id,
    mappedLimit,
    subscriptionTokenLimit: subscription?.token_limit,
    totalTokens,
    computedTotalTokens
  });

  useEffect(() => {
    fetchSubscriptionData();
    const handler = () => {
      fetchSubscriptionData();
    };
    window.addEventListener('subscription-updated', handler);
    return () => window.removeEventListener('subscription-updated', handler);
    if (!isMockUser) {
      api
        .get('/assignments')
        .then(res => {
          const data = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.assignments)
            ? res.data.assignments
            : [];
          setAssignments(data);
        })
        .catch(() => setAssignments([]));
      // Fetch real transactions for test/real users
      api
        .get('/transactions')
        .then(res => {
          setTransactions(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setTransactions([]));
    } else {
      setAssignments([...recentAssignmentsWithSubject]);
      // Use mock transactions for mock users
      setTransactions([
        {
          date: new Date().toISOString().slice(0, 10),
          description: 'Token Purchase - Free Tier',
          tokens: totalTokens,
          summary: 'Monthly free token allocation',
        },
        {
          date: '2024-06-01',
          description: 'Token Purchase - Free Tier',
          tokens: totalTokens,
          summary: 'Monthly free token allocation',
        },
        {
          date: '2024-05-01',
          description: 'Token Purchase - Free Tier',
          tokens: totalTokens,
          summary: 'Monthly free token allocation',
        },
        {
          date: '2024-04-01',
          description: 'Token Purchase - Free Tier',
          tokens: totalTokens,
          summary: 'Monthly free token allocation',
        },
        {
          date: '2024-03-01',
          description: 'Token Purchase - Free Tier',
          tokens: totalTokens,
          summary: 'Monthly free token allocation',
        },
        ...assignments.slice(-3).map(a => ({
          date: a.createdAt?.slice(0, 10) || '',
          description: `${a.title} - ${a.status}`,
          tokens: -(a.tokensUsed || 500),
          assignment: a.title,
          summary: `AI service for assignment: ${a.title}`,
        })),
      ]);
    }
  }, [isMockUser]);

  const fetchSubscriptionData = async () => {
    try {
      // Use test endpoint if in mock user mode
      const primary = isMockUser
        ? '/payments/subscriptions/current/test'
        : '/payments/subscriptions/current';
      console.log('AITokens: fetching subscription. isMockUser=', isMockUser, 'endpoint=', primary);
      try {
        const response = await api.get<Subscription>(primary);
        console.log('AITokens: subscription response', response.data);
        setSubscription(response.data);
      } catch (primaryErr: any) {
        console.warn('AITokens: primary subscription fetch failed, trying test endpoint. Error=', primaryErr?.message || primaryErr);
        try {
          const fallback = '/payments/subscriptions/current/test';
          const response2 = await api.get<Subscription>(fallback);
          console.log('AITokens: fallback subscription response', response2.data);
          setSubscription(response2.data);
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  // For 30-day graph, show last 30 days, but only add usage from billing start onward
  function buildLast30DaysChart(
    assignments: { tokensUsed?: number; title: string; createdAt?: string }[],
    total: number
  ) {
    if (!assignments.length) return [];
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 29);

    const currentCycleStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevCycleStart = new Date(currentCycleStart);
    prevCycleStart.setMonth(prevCycleStart.getMonth() - 1);

    const initialTokens = assignments
      .filter(a => {
        const created = new Date(a.createdAt!);
        return created >= prevCycleStart && created < startDate;
      })
      .reduce((sum, a) => sum + (a.tokensUsed || 500), 0);

    const usageByDate: Record<string, { used: number; titles: string[] }> = {};
    assignments.forEach(a => {
      if (!a.createdAt) return;
      const dateStr = format(new Date(a.createdAt), 'yyyy-MM-dd');
      if (!usageByDate[dateStr]) usageByDate[dateStr] = { used: 0, titles: [] };
      usageByDate[dateStr].used += a.tokensUsed || 500;
      usageByDate[dateStr].titles.push(a.title);
    });

    let runningTotalPrev = initialTokens;
    let runningTotalCurrent = 0;
    const points: {
      date: string;
      tokens: number;
      used: number;
      description: string;
      isRenewal: boolean;
    }[] = [];
    const tokenLimit = total;
    let capped = false;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = format(d, 'yyyy-MM-dd');
      let used = usageByDate[key]?.used || 0;
      let description = used > 0 ? `Used for: ${usageByDate[key].titles.join(', ')}` : '';
      const isRenewal = d.getTime() === currentCycleStart.getTime();

      if (d < currentCycleStart) {
        runningTotalPrev += used;
        points.push({
          date: format(d, 'MMM d'),
          tokens: runningTotalPrev,
          used,
          description,
          isRenewal: false,
        });
      } else if (isRenewal) {
        runningTotalCurrent = 0;
        points.push({
          date: format(d, 'MMM d'),
          tokens: 0,
          used: 0,
          description,
          isRenewal: true,
        });
        runningTotalCurrent += used;
        if (used > 0) {
          points[points.length - 1].used = 0;
          points.push({
            date: format(d, 'MMM d'),
            tokens: used > tokenLimit ? tokenLimit : used,
            used: used > tokenLimit ? 0 : used,
            description,
            isRenewal: false,
          });
          runningTotalCurrent = used > tokenLimit ? tokenLimit : used;
          capped = used > tokenLimit;
        }
      } else {
        if (!capped && runningTotalCurrent + used > tokenLimit) {
          used = 0;
          runningTotalCurrent = tokenLimit;
          capped = true;
        } else if (!capped) {
          runningTotalCurrent += used;
          if (runningTotalCurrent > tokenLimit) {
            runningTotalCurrent = tokenLimit;
            capped = true;
          }
        }
        points.push({
          date: format(d, 'MMM d'),
          tokens: runningTotalCurrent,
          used,
          description,
          isRenewal: false,
        });
      }
    }

    const initialDate = new Date(startDate);
    initialDate.setDate(initialDate.getDate() - 1);
    points.unshift({
      date: format(initialDate, 'MMM d'),
      tokens: initialTokens,
      used: 0,
      description: 'Starting balance',
      isRenewal: false,
    });

    return points;
  }

  // For 7-day chart: show last 7 days ending with today, with usage per day
  function buildUsageHistory(
    assignments: { tokensUsed?: number; title: string; createdAt?: string }[],
    total: number,
    range: number
  ) {
    const today = new Date();
    const days: string[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(format(d, 'yyyy-MM-dd'));
    }
    // Map date to assignments
    const usageByDate: Record<string, { used: number; titles: string[] }> = {};
    assignments.forEach(a => {
      if (!a.createdAt) return;
      const dateStr = format(new Date(a.createdAt), 'yyyy-MM-dd');
      if (!usageByDate[dateStr]) usageByDate[dateStr] = { used: 0, titles: [] };
      usageByDate[dateStr].used += a.tokensUsed || 500;
      usageByDate[dateStr].titles.push(a.title);
    });
    let runningTotal = 0;
    const points: { date: string; tokens: number; used: number; description: string }[] = [];
    const tokenLimit = total;
    let capped = false;
    const initialDate = new Date(today);
    initialDate.setDate(today.getDate() - range);
    points.push({
      date: format(initialDate, 'MMM d'),
      tokens: 0,
      used: 0,
      description: 'Starting balance',
    });
    days.forEach(dateStr => {
      let used = usageByDate[dateStr]?.used || 0;
      let description = used > 0 ? `Used for: ${usageByDate[dateStr]?.titles.join(', ')}` : '';
      if (!capped && runningTotal + used > tokenLimit) {
        used = 0;
        runningTotal = tokenLimit;
        capped = true;
      } else if (!capped) {
        runningTotal += used;
        if (runningTotal > tokenLimit) {
          runningTotal = tokenLimit;
          capped = true;
        }
      }
      points.push({
        date: format(parseISO(dateStr), 'MMM d'),
        tokens: runningTotal,
        used,
        description,
      });
    });
    return points;
  }

  // Calculate token usage based on user type
  let usedTokensCalc = usedTokens;
  let remainingTokensCalc = remainingTokens + (computedTotalTokens - totalTokens);
  let percentUsedCalc = Math.round((usedTokensCalc / computedTotalTokens) * 100);
  if (!isMockUser) {
    usedTokensCalc = assignments.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
    remainingTokensCalc = computedTotalTokens - usedTokensCalc;
    percentUsedCalc =
      computedTotalTokens > 0 ? Math.round((usedTokensCalc / computedTotalTokens) * 100) : 0;
  }
  const tokenUsage = {
    label: `Plan (${computedTotalTokens.toLocaleString()} tokens/month)`,
    total: computedTotalTokens,
    used: usedTokensCalc,
    remaining: remainingTokensCalc,
    percentUsed: percentUsedCalc,
  };
  console.log('AITokens: computed token usage', tokenUsage, 'subscription', subscription);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  // Build accurate usage history for the graph
  const sortedAssignmentsAll = [...assignments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // For 30-day chart, use buildLast30DaysChart with all assignments
  const usageData30 = buildLast30DaysChart(sortedAssignmentsAll, totalTokens);
  // For 7-day chart, keep using buildUsageHistory for last 7 assignments (current cycle only)
  const usageData7 = buildUsageHistory(assignments, totalTokens, 7);
  const handleRangeChange = (_: any, newRange: '7' | '30') => {
    if (newRange) setRange(newRange);
  };
  const displayedUsageData = range === '7' ? usageData7 : usageData30;

  // Token usage info for free tier features
  const tokenUsageInfo = [
    {
      title: 'Assignment Analysis',
      tokens: '500 tokens',
      description: 'Basic analysis of your assignment requirements and structure',
      features: ['Requirements breakdown', 'Structure suggestions', 'Key points identification'],
    },
    {
      title: 'Essay Review',
      tokens: '1000 tokens',
      description: 'Comprehensive review of your essay with feedback and suggestions',
      features: ['Grammar and style check', 'Content analysis', 'Improvement suggestions'],
    },
    {
      title: 'Image Analysis',
      tokens: '1500 tokens',
      description: 'Analyze and extract information from images using AI',
      features: ['Object detection', 'Text extraction (OCR)', 'Scene description'],
    },
    {
      title: 'Math Problem Solving',
      tokens: '750 tokens',
      description: 'Step-by-step solutions for mathematical problems',
      features: ['Solution steps', 'Formula explanations', 'Alternative methods'],
    },
    {
      title: 'Programming Completion',
      tokens: '1300 tokens',
      description: 'AI-powered code completion and suggestions for programming tasks',
      features: ['Code generation', 'Syntax suggestions', 'Bug detection'],
    },
    {
      title: 'Science Lab Report',
      tokens: '900 tokens',
      description: 'Analysis and formatting of lab experiment data',
      features: ['Data analysis', 'Conclusion generation', 'Format assistance'],
    },
    {
      title: 'History Timeline',
      tokens: '1100 tokens',
      description: 'Create and analyze historical timelines',
      features: ['Event sequencing', 'Source verification', 'Context analysis'],
    },
  ];

  const handleProgressBarClick = () => {
    if (guideRef.current) {
      guideRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTransactionClick = (event: React.MouseEvent<HTMLElement>, transaction: any) => {
    setAnchorEl(event.currentTarget);
    setPopoverContent(transaction);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverContent(null);
  };
  const handleModalOpen = () => {
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };
  const open = Boolean(anchorEl);

  const getTransactionIcon = (desc: string) => {
    if (/purchase/i.test(desc)) return <CreditCardIcon color="primary" />;
    if (/refund/i.test(desc)) return <AutorenewIcon color="success" />;
    return <BrainIcon color="error" />;
  };

  // Group features by category
  const academicFeatures = tokenUsageInfo.filter(info =>
    ['Assignment Analysis', 'Essay Review', 'Image Analysis'].includes(info.title)
  );
  const technicalFeatures = tokenUsageInfo.filter(info =>
    ['Code Review', 'Math Problem Solving', 'Programming Completion', 'Plagiarism Check'].includes(
      info.title
    )
  );
  const handleTryIt = (feature: string) => {
    // Navigate to workshop page with feature as query parameter
    navigate(`/dashboard/workshop?feature=${encodeURIComponent(feature)}`);
  };
  const handleSeeAllFeatures = () => {
    if (window.location.pathname === '/') {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#features');
    }
  };

  const costPerToken = 1 / 2000; // $1 per 2,000 tokens
  const handleCalcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setCalcTokens(value);
    setCalcCost(value * costPerToken);
  };

  // Red outline style
  const redOutline = { border: '2px solid red' };

  // Icon and color mapping for features
  const featureIcons: Record<string, { icon: JSX.Element; color: string }> = {
    'Assignment Analysis': { icon: <DescriptionIcon />, color: '#8e24aa' }, // purple
    'Essay Review': { icon: <RateReviewIcon />, color: '#1976d2' }, // blue
    'Image Analysis': { icon: <ImageIcon />, color: '#00897b' }, // teal
    'Code Review': { icon: <CodeIcon />, color: '#388e3c' }, // green
    'Math Problem Solving': { icon: <CalculateIcon />, color: '#f57c00' }, // orange
    'Programming Completion': { icon: <TerminalIcon />, color: '#d32f2f' }, // red
    'Plagiarism Check': { icon: <ReportIcon />, color: '#d32f2f' }, // red
  };

  const getTransactionType = (desc: string) => {
    if (/purchase/i.test(desc)) return 'Purchase';
    if (/refund/i.test(desc)) return 'Refund';
    return 'AI Service';
  };
  const getTypeColor = (type: string) => {
    if (type === 'Purchase') return 'success.main';
    if (type === 'Refund') return 'info.main';
    return 'error.main';
  };

  return (
    <Box>
      <Typography
        variant={
          breakpoint === 'tall'
            ? 'h5'
            : breakpoint === 'square'
            ? 'h4'
            : breakpoint === 'standard'
            ? 'h3'
            : breakpoint === 'wide'
            ? 'h2'
            : breakpoint === 'ultra-wide'
            ? 'h1'
            : 'h1'
        }
        gutterBottom
        className="page-title"
        sx={{
          color: 'error.main',
          mb:
            breakpoint === 'tall'
              ? 2
              : breakpoint === 'square'
              ? 3
              : breakpoint === 'standard'
              ? 4
              : breakpoint === 'wide'
              ? 5
              : 6,
          ml:
            breakpoint === 'tall'
              ? 2
              : breakpoint === 'square'
              ? 4
              : breakpoint === 'standard'
              ? 6
              : breakpoint === 'wide'
              ? 8
              : 10,
          fontSize: getAspectRatioStyle(
            aspectRatioStyles.typography.h1.fontSize,
            breakpoint,
            '1.5rem'
          ),
        }}
      >
        AI Tokens
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={breakpoint === 'standard' ? 12 : 8}>
          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                fontWeight: 'normal',
              }}
            >
              Token Usage
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              {tokenUsage.label}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Tooltip title="Tokens remaining in your plan for this month">
                  <Typography variant="body1">
                    Remaining Tokens: {tokenUsage.remaining.toLocaleString()}
                  </Typography>
                </Tooltip>
                <Tooltip title="Percentage of tokens used this month">
                  <Typography variant="body1" color="text.secondary">
                    {tokenUsage.percentUsed}% Used
                  </Typography>
                </Tooltip>
              </Box>
              <Box onClick={handleProgressBarClick} sx={{ cursor: 'pointer' }}>
                <LinearProgress
                  variant="determinate"
                  value={tokenUsage.percentUsed}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    border: '2px solid red',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#d32f2f',
                    },
                  }}
                />
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card sx={{ ...redOutline }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <Tooltip title="Total tokens available in your plan per month">
                        <Typography
                          color="textSecondary"
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          Total Tokens
                        </Typography>
                      </Tooltip>
                      <HistoryIcon
                        sx={{
                          color: '#1976d2',
                          fontSize: 24,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontSize: { xs: '1.1rem', md: '1.5rem' },
                        textAlign: 'center',
                      }}
                    >
                      {tokenUsage.total.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ ...redOutline }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <Tooltip title="Tokens consumed by AI services this month">
                        <Typography
                          color="textSecondary"
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          Used Tokens
                        </Typography>
                      </Tooltip>
                      <CheckCircleIcon
                        sx={{
                          color: '#388e3c',
                          fontSize: 24,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontSize: { xs: '1.1rem', md: '1.5rem' },
                        textAlign: 'center',
                      }}
                    >
                      {tokenUsage.used.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ ...redOutline }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <Tooltip title="Tokens you have left for this month">
                        <Typography
                          color="textSecondary"
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          Remaining Tokens
                        </Typography>
                      </Tooltip>
                      <HourglassEmptyIcon
                        sx={{
                          color: '#FFA000',
                          fontSize: 24,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontSize: { xs: '1.1rem', md: '1.5rem' },
                        textAlign: 'center',
                      }}
                    >
                      {tokenUsage.remaining.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                fontWeight: 'normal',
              }}
            >
              Usage History
            </Typography>
            <ToggleButtonGroup
              value={range}
              exclusive
              onChange={handleRangeChange}
              sx={{ mb: 2 }}
              size="small"
            >
              <ToggleButton
                value="7"
                sx={{
                  border: '2px solid red',
                  color: range === '7' ? '#fff' : 'red',
                  backgroundColor: range === '7' ? 'red' : 'transparent',
                  fontWeight: 700,
                  '&.Mui-selected': {
                    backgroundColor: 'red',
                    color: '#fff',
                    borderColor: 'red',
                  },
                  '&:hover': {
                    backgroundColor: range === '7' ? 'red' : 'rgba(211, 47, 47, 0.04)',
                  },
                }}
              >
                LAST 7 DAYS
              </ToggleButton>
              <ToggleButton
                value="30"
                sx={{
                  border: '2px solid red',
                  color: range === '30' ? '#fff' : 'red',
                  backgroundColor: range === '30' ? 'red' : 'transparent',
                  fontWeight: 700,
                  '&.Mui-selected': {
                    backgroundColor: 'red',
                    color: '#fff',
                    borderColor: 'red',
                  },
                  '&:hover': {
                    backgroundColor: range === '30' ? 'red' : 'rgba(211, 47, 47, 0.04)',
                  },
                }}
              >
                LAST 30 DAYS
              </ToggleButton>
            </ToggleButtonGroup>
            {displayedUsageData.length === 0 ||
            displayedUsageData.every(d => (d.used ?? 0) === 0) ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 220 }}
              >
                <BarChartOutlinedIcon sx={{ fontSize: 54, color: 'red', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Activity Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your usage history will appear here once you start using AI services.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={displayedUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#d32f2f" />
                    <YAxis stroke="#d32f2f" domain={[0, tokenUsage.total]} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const point = payload[0].payload;
                          const isRenewal = point.isRenewal;
                          // Format date as 'MMM d, yyyy'
                          const formattedDate = point.date
                            ? new Date(
                                point.date + ', ' + new Date().getFullYear()
                              ).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '';
                          return (
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="subtitle2">{formattedDate}</Typography>
                              <Typography variant="body2">
                                +{point.used} tokens (used that day)
                                <br />
                                Cumulative: {point.tokens} tokens
                                {point.description && (
                                  <>
                                    <br />
                                    Used for: {point.description.replace('Used for: ', '')}
                                  </>
                                )}
                                {isRenewal && (
                                  <>
                                    <br />
                                    <b style={{ color: 'red' }}>Subscription Renewal</b>
                                  </>
                                )}
                              </Typography>
                            </Paper>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tokens"
                      stroke="#d32f2f"
                      strokeWidth={3}
                      dot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 8, fill: '#82ca9d' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                fontWeight: 'normal',
              }}
            >
              Token Cost Calculator ($1 per 2,000 tokens)
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'center',
                mb: 2,
                mt: 1,
                width: '100%',
                maxWidth: 1200,
                mx: 'auto',
                gap: { xs: 2, md: 8 },
                py: 0,
                minHeight: 'unset',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  minWidth: { xs: 0, md: 320 },
                  width: { xs: '100%', md: 'auto' },
                  mb: { xs: 2, md: 0 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    mb: 2,
                    color: 'red',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                  }}
                >
                  AI Model: GPT 4.1-nano
                </Typography>
                <TextField
                  label="Tokens"
                  type="number"
                  value={calcTokens}
                  onChange={handleCalcChange}
                  sx={{
                    width: { xs: '100%', md: 320 },
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.25rem',
                      height: 48,
                      '& fieldset': {
                        borderColor: 'red',
                      },
                      '&:hover fieldset': {
                        borderColor: 'red',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'red',
                      },
                    },
                  }}
                  inputProps={{
                    min: 0,
                    style: { fontSize: '1.25rem', height: 48, padding: '8px' },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#888' }}>
                          tokens
                        </span>
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{ minWidth: 120, fontWeight: 700, fontSize: '1rem', mt: 1 }}
                >
                  Estimated Cost: <b>${calcCost.toFixed(2)}</b>
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  flex: 1,
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    mb: 2,
                    color: 'red',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                  }}
                >
                  Purchase Tokens in Sets
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(2, 1fr)' },
                    gap: 2,
                    mb: 2,
                    width: '100%',
                  }}
                >
                  {[1000, 2000, 5000, 10000].map(amount => (
                    <Button
                      key={amount}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: 'red',
                        color: 'red',
                        minWidth: 0,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        width: '100%',
                      }}
                      onClick={() => {
                        setCalcTokens(amount);
                        setCalcCost(amount * costPerToken);
                      }}
                    >
                      {amount.toLocaleString()}
                    </Button>
                  ))}
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  sx={{
                    mt: 1,
                    width: '100%',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    boxShadow: 2,
                    py: 0.5,
                    maxWidth: { xs: '100%', md: 340 },
                  }}
                >
                  Purchase
                </Button>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                fontWeight: 'normal',
              }}
            >
              Recent Transactions
            </Typography>
            {transactions.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 120 }}
              >
                <ReceiptLongOutlinedIcon sx={{ fontSize: 48, color: 'red', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Transactions Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your recent transactions will appear here once you start using tokens.
                </Typography>
              </Box>
            ) : (
              <List>
                {transactions
                  .filter(t => /purchase/i.test(t.description))
                  .slice(0, 3)
                  .map((transaction, index) => {
                    const type = getTransactionType(transaction.description);
                    const color = getTypeColor(type);
                    return (
                      <React.Fragment key={index}>
                        <ListItem
                          button
                          onClick={e => handleTransactionClick(e, transaction)}
                          sx={{
                            pl: 0,
                            position: 'relative',
                            borderLeft: 'none',
                            background: theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.paper
                                : '#fff',
                            border: `2px solid ${color}`,
                            transition: 'box-shadow 0.2s',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(211,47,47,0.08)',
                            },
                            mb: 1,
                            borderRadius: 2,
                            '::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '6px',
                              borderTopLeftRadius: '6px',
                              borderBottomLeftRadius: '6px',
                              background:
                                type === 'Purchase'
                                  ? '#388e3c'
                                  : type === 'Refund'
                                  ? '#1976d2'
                                  : '#d32f2f',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, pl: 1 }}>
                            {React.cloneElement(getTransactionIcon(transaction.description), {
                              sx: { color, fontSize: 28 },
                            })}
                          </ListItemIcon>
                          <ListItemText
                            primary={transaction.description}
                            secondaryTypographyProps={{ component: 'span' }}
                            secondary={
                              <>
                                <Chip
                                  label={type}
                                  size="small"
                                  sx={{
                                    backgroundColor: color,
                                    color: theme =>
                                      theme.palette.mode === 'dark'
                                        ? theme.palette.background.paper
                                        : '#fff',
                                    fontWeight: 600,
                                    mr: 1,
                                  }}
                                />
                                {formatDistanceToNow(parseISO(transaction.date), {
                                  addSuffix: true,
                                })}
                              </>
                            }
                          />
                          <Chip
                            label={`${transaction.tokens > 0 ? '+' : ''}${
                              transaction.tokens
                            } tokens`}
                            size="medium"
                            sx={{
                              backgroundColor: theme =>
                                theme.palette.mode === 'dark'
                                  ? theme.palette.background.paper
                                  : '#fff',
                              color: color,
                              border: `2px solid ${color}`,
                              fontWeight: 700,
                              fontSize: '1rem',
                            }}
                          />
                        </ListItem>
                        {index <
                          Math.min(
                            3,
                            transactions.filter(t => /purchase/i.test(t.description)).length
                          ) -
                            1 && <Divider sx={{ borderColor: color, opacity: 0.5, ml: 1.5 }} />}
                      </React.Fragment>
                    );
                  })}
              </List>
            )}
            {transactions.filter(t => /purchase/i.test(t.description)).length > 3 && (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleModalOpen}
                sx={{
                  mt: 2,
                  borderColor: 'red',
                  color: 'red',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'red',
                    backgroundColor: 'rgba(211, 47, 47, 0.04)',
                  },
                }}
              >
                View All Transactions
              </Button>
            )}
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              {popoverContent && (
                <Box sx={{ p: 2, minWidth: 220 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {popoverContent.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {popoverContent.date}
                  </Typography>
                  {popoverContent.assignment && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Assignment: <b>{popoverContent.assignment}</b>
                    </Typography>
                  )}
                  {popoverContent.summary && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {popoverContent.summary}
                    </Typography>
                  )}
                  {popoverContent && popoverContent.link && (
                    <Button
                      href={popoverContent.link}
                      target="_blank"
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      sx={{ mt: 1 }}
                    >
                      View Full Response
                    </Button>
                  )}
                </Box>
              )}
            </Popover>
          </Paper>
          <Box sx={{ mb: 4 }} />
        </Grid>

        <Grid item xs={12} md={breakpoint === 'standard' ? 12 : 4}>
          <Paper sx={{ p: 3, mb: 4, ...redOutline }} ref={guideRef}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography
                variant="h6"
                sx={{ color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black') }}
              >
                Token Usage Guide
              </Typography>
              <Tooltip
                title="Token costs are estimates. Actual usage depends on the complexity and length of your content."
                arrow
                placement="top"
              >
                <InfoIcon sx={{ color: 'text.secondary', fontSize: 20, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Understand how tokens are used for different AI-powered features
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SchoolIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Academic
                </Typography>
              </Box>
              <List sx={{ py: 0 }}>
                {academicFeatures.map((info, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        mb: 2,
                        p: 2,
                        border: '2px solid red',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          borderColor: 'red',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {featureIcons[info.title] &&
                            React.cloneElement(featureIcons[info.title].icon, {
                              sx: { color: featureIcons[info.title].color, fontSize: 28 },
                            })}
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                            }}
                          >
                            {info.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={info.tokens}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            color: featureIcons[info.title]?.color || 'red',
                            borderColor: featureIcons[info.title]?.color || 'red',
                            '& .MuiChip-label': {
                              color: featureIcons[info.title]?.color || 'red',
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          color: theme => (theme.palette.mode === 'dark' ? 'white' : '#000'),
                        }}
                      >
                        {info.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {info.features.map((feature, featureIndex) => (
                          <Chip
                            key={featureIndex}
                            label={feature}
                            size="small"
                            sx={{
                              backgroundColor: `${featureIcons[info.title]?.color}11`, // light tint
                              color: featureIcons[info.title]?.color,
                              border: `1px solid ${featureIcons[info.title]?.color}`,
                              fontWeight: 500,
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        ))}
                      </Box>
                    </ListItem>
                    {index < academicFeatures.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <Box sx={{ mb: 2 }}>
              <List sx={{ py: 0 }}>
                {technicalFeatures.map((info, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        mb: 2,
                        p: 2,
                        border: '2px solid red',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          borderColor: 'red',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {featureIcons[info.title] &&
                            React.cloneElement(featureIcons[info.title].icon, {
                              sx: { color: featureIcons[info.title].color, fontSize: 28 },
                            })}
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                            }}
                          >
                            {info.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={info.tokens}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            color: featureIcons[info.title]?.color || 'red',
                            borderColor: featureIcons[info.title]?.color || 'red',
                            '& .MuiChip-label': {
                              color: featureIcons[info.title]?.color || 'red',
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          color: theme => (theme.palette.mode === 'dark' ? 'white' : '#000'),
                        }}
                      >
                        {info.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {info.features.map((feature, featureIndex) => (
                          <Chip
                            key={featureIndex}
                            label={feature}
                            size="small"
                            sx={{
                              backgroundColor: `${featureIcons[info.title]?.color}11`, // light tint
                              color: featureIcons[info.title]?.color,
                              border: `1px solid ${featureIcons[info.title]?.color}`,
                              fontWeight: 500,
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        ))}
                      </Box>
                    </ListItem>
                    {index < technicalFeatures.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, fontSize: '1rem', py: 1.25, fontWeight: 700 }}
              onClick={handleSeeAllFeatures}
            >
              See All AI Features
            </Button>
          </Paper>

          {/* All Transactions Modal */}
          <Dialog
            open={modalOpen}
            onClose={handleModalClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                border: '2px solid red',
                maxHeight: '80vh',
                width: { xs: '95vw', sm: '90vw', md: 'auto' },
                maxWidth: { xs: '95vw', sm: '90vw', md: 'md' },
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
              },
            }}
          >
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    fontWeight: 'normal',
                  }}
                >
                  All Transactions
                </Typography>
                <IconButton onClick={handleModalClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
              <List sx={{ py: 0, width: '100%' }}>
                {transactions
                  .filter(t => /purchase/i.test(t.description))
                  .map((transaction, index) => {
                    const type = getTransactionType(transaction.description);
                    const color = getTypeColor(type);
                    return (
                      <React.Fragment key={index}>
                        <ListItem
                          button
                          onClick={e => handleTransactionClick(e, transaction)}
                          sx={{
                            pl: 2,
                            pr: 2,
                            position: 'relative',
                            borderLeft: 'none',
                            background: theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.paper
                                : '#fff',
                            border: `2px solid ${color}`,
                            transition: 'box-shadow 0.2s',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(211,47,47,0.08)',
                            },
                            mb: 1,
                            mx: 2,
                            borderRadius: 2,
                            '::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '6px',
                              borderTopLeftRadius: '6px',
                              borderBottomLeftRadius: '6px',
                              background:
                                type === 'Purchase'
                                  ? '#388e3c'
                                  : type === 'Refund'
                                  ? '#1976d2'
                                  : '#d32f2f',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, pl: 1 }}>
                            {React.cloneElement(getTransactionIcon(transaction.description), {
                              sx: { color, fontSize: 28 },
                            })}
                          </ListItemIcon>
                          <ListItemText
                            primary={transaction.description}
                            secondary={
                              <>
                                <Chip
                                  label={type}
                                  size="small"
                                  sx={{
                                    backgroundColor: color,
                                    color: theme =>
                                      theme.palette.mode === 'dark'
                                        ? theme.palette.background.paper
                                        : '#fff',
                                    fontWeight: 600,
                                    mr: 1,
                                  }}
                                />
                                {formatDistanceToNow(parseISO(transaction.date), {
                                  addSuffix: true,
                                })}
                              </>
                            }
                          />
                          <Chip
                            label={`${transaction.tokens > 0 ? '+' : ''}${
                              transaction.tokens
                            } tokens`}
                            size="medium"
                            sx={{
                              backgroundColor: theme =>
                                theme.palette.mode === 'dark'
                                  ? theme.palette.background.paper
                                  : '#fff',
                              color: color,
                              border: `2px solid ${color}`,
                              fontWeight: 700,
                              fontSize: '1rem',
                            }}
                          />
                        </ListItem>
                        {index <
                          transactions.filter(t => /purchase/i.test(t.description)).length - 1 && (
                          <Divider sx={{ borderColor: color, opacity: 0.5, mx: 2 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                onClick={handleModalClose}
                variant="outlined"
                sx={{ borderColor: 'red', color: 'red' }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AITokens;
