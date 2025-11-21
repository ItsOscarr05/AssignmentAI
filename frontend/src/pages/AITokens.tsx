import {
  BarChartOutlined as BarChartOutlinedIcon,
  CalculateOutlined as CalculateIcon,
  CheckCircleOutline as CheckCircleIcon,
  Close as CloseIcon,
  CodeOutlined as CodeIcon,
  CreditCard as CreditCardIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  DescriptionOutlined as DescriptionIcon,
  DiamondOutlined as DiamondOutlineIcon,
  EmojiEventsOutlined as EmojiEventsOutlineIcon,
  History as HistoryIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ImageOutlined as ImageIcon,
  InfoOutlined as InfoIcon,
  LocalOfferOutlined as LocalOfferOutlineIcon,
  OpenInNew as OpenInNewIcon,
  RateReviewOutlined as RateReviewIcon,
  ReceiptLongOutlined as ReceiptLongOutlinedIcon,
  ReportOutlined as ReportIcon,
  SchoolOutlined as SchoolIcon,
  StarOutline as StarOutlineIcon,
  TerminalOutlined as TerminalIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import TokenPurchaseForm from '../components/payment/TokenPurchaseForm';
import TransactionsModal from '../components/transactions/TransactionsModal';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { api } from '../services/api';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';
import { formatUTCDistanceToNow, getUserTimezone } from '../utils/timezone';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51RYem5BGydvd9sZlgu1k8rVc5y13Y0uVJ1sTjdDe3Ao2CLwgcSiG03GYxtYBLrz1tjN15d1PK38QAqnkf9YMy3HZ00hap3ZOqt'
);

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  token_limit: number;
  ai_model?: string;
}

const AITokens: React.FC = () => {
  // All hooks at the top
  const { breakpoint } = useAspectRatio();
  const location = useLocation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = React.useState<'7' | '30'>('7');
  const guideRef = React.useRef<HTMLDivElement>(null);
  const usageHistoryRef = React.useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [popoverContent, setPopoverContent] = React.useState<any>(null);
  const calculateCost = (tokens: number) => tokens / 1000 - 0.01; // $1.00 per 1,000 tokens minus 1 cent
  const [calcTokens, setCalcTokens] = React.useState(1000);
  const [calcCost, setCalcCost] = React.useState(calculateCost(1000));
  const [modalOpen, setModalOpen] = React.useState(false);
  const [showFeaturesConfirmation, setShowFeaturesConfirmation] = React.useState(false);
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [timezoneKey, setTimezoneKey] = useState<string>(getUserTimezone());
  const [tokenPurchaseDialogOpen, setTokenPurchaseDialogOpen] = useState(false);
  const [selectedTokenAmount, setSelectedTokenAmount] = useState(0);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);

  const { totalTokens, usedTokens, remainingTokens } = useTokenUsage(subscription);

  // Fetch usage history from API
  const fetchUsageHistory = async () => {
    try {
      const response = await api.get('/usage/history', {
        params: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          end_date: new Date().toISOString(),
        },
      });
      setUsageHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch usage history:', error);
      setUsageHistory([]);
    }
  };

  // Token purchase handlers
  const handleTokenAmountSelect = (amount: number) => {
    setSelectedTokenAmount(amount);
    setCalcTokens(amount);
    setCalcCost(calculateCost(amount));
  };

  const handleTokenPurchaseClick = async () => {
    if (selectedTokenAmount > 0) {
      setCreatingPaymentIntent(true);
      try {
        // Calculate cost using the new formula: (tokens/1000) - 0.01
        const totalCost = calculateCost(selectedTokenAmount);

        // Create payment intent
        const response = await api.post('/payments/create-payment-intent', {
          token_amount: selectedTokenAmount,
          amount: totalCost,
        });

        setPaymentIntentClientSecret(response.data.client_secret);
        setTokenPurchaseDialogOpen(true);
        setPurchaseSuccess(false);
      } catch (error: any) {
        console.error('Error creating payment intent:', error);
        // Handle error - maybe show a toast or alert
      } finally {
        setCreatingPaymentIntent(false);
      }
    }
  };

  const handleTokenPurchaseSuccess = () => {
    setPurchaseSuccess(true);
    setTokenPurchaseDialogOpen(false);
    // Refresh subscription data
    fetchSubscriptionData();
  };

  const handleTokenPurchaseError = (error: string) => {
    console.error('Token purchase error:', error);
    // You could add a toast notification here
  };

  const handleTokenPurchaseDialogClose = () => {
    setTokenPurchaseDialogOpen(false);
    setPaymentIntentClientSecret(null);
    setCreatingPaymentIntent(false);
  };
  const mapPlanToLimit = (planId?: string): number | undefined => {
    if (!planId) return undefined;
    if (planId === 'price_test_free') return 100000;
    if (planId === 'price_test_plus') return 250000;
    if (planId === 'price_test_pro') return 500000;
    if (planId === 'price_test_max') return 1000000;

    const envPlus = (import.meta as any).env?.VITE_STRIPE_PRICE_PLUS;
    const envPro = (import.meta as any).env?.VITE_STRIPE_PRICE_PRO;
    const envMax = (import.meta as any).env?.VITE_STRIPE_PRICE_MAX;
    const envFree = (import.meta as any).env?.VITE_STRIPE_PRICE_FREE;

    const is = (ids: Array<string | undefined>) => ids.filter(Boolean).includes(planId);

    if (is([envFree])) return 100000;
    if (is([envPlus])) return 250000;
    if (is([envPro])) return 500000;
    if (is([envMax])) return 1000000;

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
    computedTotalTokens,
  });

  // Handle navigation state to set range and scroll to Usage History
  useEffect(() => {
    if (location.state && (location.state as any).range === '30') {
      setRange('30');
      // Scroll to Usage History section after a short delay to ensure it's rendered
      setTimeout(() => {
        if (usageHistoryRef.current) {
          usageHistoryRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    }
    // Also check URL hash
    if (location.hash === '#usage-history') {
      setRange('30');
      setTimeout(() => {
        if (usageHistoryRef.current) {
          usageHistoryRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    }
  }, [location]);

  useEffect(() => {
    fetchSubscriptionData();
    fetchUsageHistory();

    const handler = () => {
      fetchSubscriptionData();
      fetchUsageHistory();
    };
    window.addEventListener('subscription-updated', handler);

    // Fetch real transactions
    console.log('AITokens: fetching transactions from /payments/transactions');
    api
      .get('/payments/transactions')
      .then(res => {
        console.log('AITokens: transactions response:', res.data);
        setTransactions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(error => {
        console.error('AITokens: failed to fetch transactions:', error);
        setTransactions([]);
      });

    return () => window.removeEventListener('subscription-updated', handler);
  }, []);

  // Listen for timezone changes and force re-render
  useEffect(() => {
    const handleTimezoneChange = () => {
      const newTimezone = getUserTimezone();
      if (newTimezone !== timezoneKey) {
        setTimezoneKey(newTimezone);
      }
    };

    // Check for timezone changes every 5 seconds
    const interval = setInterval(handleTimezoneChange, 5000);

    // Also listen for storage changes
    window.addEventListener('storage', e => {
      if (e.key === 'timezone') {
        handleTimezoneChange();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleTimezoneChange);
    };
  }, [timezoneKey]);

  const fetchSubscriptionData = async () => {
    try {
      // Test endpoints are disabled since test users are removed
      const primary = '/payments/subscriptions/current';
      console.log('AITokens: fetching subscription. endpoint=', primary);
      try {
        const response = await api.get<Subscription>(primary);
        console.log('AITokens: subscription response', response.data);
        setSubscription(response.data);
      } catch (primaryErr: any) {
        console.warn(
          'AITokens: primary subscription fetch failed, trying test endpoint. Error=',
          primaryErr?.message || primaryErr
        );
        try {
          const fallback = '/payments/subscriptions/current';
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

  // Listen for subscription updates from other components
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('AITokens: subscription update event received, refreshing data...');
      fetchSubscriptionData();
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);

    // Also listen for custom events from payment success
    window.addEventListener('payment-success', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
      window.removeEventListener('payment-success', handleSubscriptionUpdate);
    };
  }, []);

  // Build chart data from real usage history
  function buildUsageChartFromHistory(usageHistory: any[], days: number = 30) {
    if (!usageHistory.length) return [];

    const today = new Date();
    const chartData = [];

    // Group usage by date
    const usageByDate: { [key: string]: { tokens: number; features: string[] } } = {};

    usageHistory.forEach(usage => {
      const date = new Date(usage.timestamp).toISOString().split('T')[0];
      if (!usageByDate[date]) {
        usageByDate[date] = { tokens: 0, features: [] };
      }
      usageByDate[date].tokens += usage.tokens_used || 0;
      if (!usageByDate[date].features.includes(usage.feature)) {
        usageByDate[date].features.push(usage.feature);
      }
    });

    // Build chart data for the specified number of days with cumulative totals
    let cumulativeTotal = 0;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const usage = usageByDate[dateStr] || { tokens: 0, features: [] };

      // Add today's usage to cumulative total
      cumulativeTotal += usage.tokens;

      chartData.push({
        date: format(date, 'MMM d'),
        tokens: cumulativeTotal, // Show cumulative total instead of daily usage
        used: usage.tokens, // Keep daily usage for tooltip/reference
        description:
          usage.tokens > 0
            ? `Daily: ${usage.tokens} tokens (Total: ${cumulativeTotal})`
            : `Total: ${cumulativeTotal} tokens`,
      });
    }

    return chartData;
  }

  // For 30-day graph, show last 30 days, but only add usage from billing start onward

  // Calculate token usage based on user type
  // Use real token data from API instead of calculated values
  const percentUsed = Math.round((usedTokens / totalTokens) * 100);
  const tokenUsage = {
    label: `Plan (${totalTokens.toLocaleString()} tokens/month)`,
    total: totalTokens,
    used: usedTokens,
    remaining: remainingTokens,
    percentUsed: percentUsed,
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

  // Use real usage history for charts
  const usageData30 = buildUsageChartFromHistory(usageHistory, 30);
  const usageData7 = buildUsageChartFromHistory(usageHistory, 7);
  const handleRangeChange = (_: any, newRange: '7' | '30') => {
    if (newRange) setRange(newRange);
  };
  const displayedUsageData = range === '7' ? usageData7 : usageData30;

  // Token usage info for free tier features
  // Estimates based on typical prompt + response token usage patterns
  const tokenUsageInfo = [
    {
      title: 'Assignment Analysis',
      tokens: '1,200 tokens',
      description: 'Basic analysis of your assignment requirements and structure',
      features: ['Requirements breakdown', 'Structure suggestions', 'Key points identification'],
    },
    {
      title: 'Essay Review',
      tokens: '3,000 tokens',
      description: 'Comprehensive review of your essay with feedback and suggestions',
      features: ['Grammar and style check', 'Content analysis', 'Improvement suggestions'],
    },
    {
      title: 'Image Analysis',
      tokens: '1,200 tokens',
      description: 'Analyze and extract information from images using AI',
      features: ['Object detection', 'Text extraction (OCR)', 'Scene description'],
    },
    {
      title: 'Math Problem Solving',
      tokens: '1,000 tokens',
      description: 'Step-by-step solutions for mathematical problems',
      features: ['Solution steps', 'Formula explanations', 'Alternative methods'],
    },
    {
      title: 'Programming Completion',
      tokens: '1,500 tokens',
      description: 'AI-powered code completion and suggestions for programming tasks',
      features: ['Code generation', 'Syntax suggestions', 'Bug detection'],
    },
    {
      title: 'Science Lab Report',
      tokens: '2,000 tokens',
      description: 'Analysis and formatting of lab experiment data',
      features: ['Data analysis', 'Conclusion generation', 'Format assistance'],
    },
    {
      title: 'History Timeline',
      tokens: '1,800 tokens',
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

  // Group features by category
  const academicFeatures = tokenUsageInfo.filter(info =>
    ['Assignment Analysis', 'Essay Review', 'Image Analysis'].includes(info.title)
  );
  const technicalFeatures = tokenUsageInfo.filter(info =>
    ['Code Review', 'Math Problem Solving', 'Programming Completion', 'Plagiarism Check'].includes(
      info.title
    )
  );
  const handleSeeAllFeatures = () => {
    setShowFeaturesConfirmation(true);
  };

  const handleConfirmFeaturesNavigation = () => {
    setShowFeaturesConfirmation(false);
    if (window.location.pathname === '/') {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#features');
    }
  };

  // Get AI model display name based on subscription
  const getAIModelDisplayName = () => {
    if (!subscription?.ai_model) return 'GPT-4';

    switch (subscription.ai_model) {
      case 'gpt-5-nano':
        return 'GPT-5 Nano';
      case 'gpt-4.1-mini':
        return 'GPT-4.1 Mini';
      case 'gpt-4-turbo':
        return 'GPT-4 Turbo';
      case 'gpt-5':
        return 'GPT-5';
      default:
        return subscription.ai_model;
    }
  };
  const handleCalcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty string for user to clear and retype
    if (inputValue === '') {
      setCalcTokens(0);
      setCalcCost(0);
      setSelectedTokenAmount(0); // Grey out purchase button when empty
      return;
    }

    // Only allow numbers
    const numericValue = inputValue.replace(/[^0-9]/g, '');

    // Prevent typing more than 7 digits
    if (numericValue.length > 7) {
      return; // Don't update state if more than 7 digits
    }

    const value = parseInt(numericValue, 10) || 0;

    // Don't clamp while typing - let user type freely (but respect 7-digit limit)
    setCalcTokens(value);
    setCalcCost(calculateCost(value));
    setSelectedTokenAmount(value); // Update selected amount for purchase button
  };

  const handleCalcBlur = () => {
    // Apply validation only when user is done typing (on blur)
    const minTokens = 1000;
    const maxTokens = 1000000; // 7 figures cap

    // Clamp value between min and max
    const clampedValue = Math.max(minTokens, Math.min(calcTokens, maxTokens));

    setCalcTokens(clampedValue);
    setCalcCost(calculateCost(clampedValue));
    setSelectedTokenAmount(clampedValue); // Update selected amount for purchase button
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

  // Helper functions for transaction display (used in recent transactions section)
  const getTransactionType = (desc: string) => {
    if (/purchase/i.test(desc)) return 'Purchase';
    if (/refund/i.test(desc)) return 'Refund';
    if (/subscription/i.test(desc)) return 'Subscription';
    return 'Purchase';
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.type === 'token_purchase') {
      return <CurrencyBitcoinIcon />;
    }

    if (transaction.type === 'subscription') {
      const planName = transaction.description.replace('Subscription - ', '').toLowerCase();
      switch (planName) {
        case 'free':
          return <LocalOfferOutlineIcon />;
        case 'plus':
          return <StarOutlineIcon />;
        case 'pro':
          return <DiamondOutlineIcon />;
        case 'max':
          return <EmojiEventsOutlineIcon />;
        default:
          return <CreditCardIcon />;
      }
    }

    return <CreditCardIcon />;
  };

  const getTransactionColor = (transaction: any) => {
    if (transaction.type === 'token_purchase') {
      return '#4a148c'; // Dark purple for token purchases
    }

    if (transaction.type === 'subscription') {
      const planName = transaction.description.replace('Subscription - ', '').toLowerCase();
      switch (planName) {
        case 'free':
          return '#2196f3'; // Blue
        case 'plus':
          return '#4caf50'; // Green
        case 'pro':
          return '#9c27b0'; // Purple
        case 'max':
          return '#ff9800'; // Orange
        default:
          return '#757575'; // Grey
      }
    }

    return '#757575'; // Default grey
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
          <Box
            sx={{
              p: 2,
              mb: 2,
              ...redOutline,
              borderRadius: 3,
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  fontWeight: 'normal',
                  mb: 0,
                }}
              >
                Token Usage
              </Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Token Usage Overview
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Track your AI token consumption for this billing cycle. Tokens are used when you interact with AI features like assignment analysis, essay review, and image analysis.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Remaining tokens reset monthly based on your subscription plan
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Usage is tracked automatically for all AI-powered features
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                      Click the progress bar to see detailed usage guide
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <InfoIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                    cursor: 'help',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    mb: 0.5,
                  }}
                />
              </Tooltip>
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
              }}
            >
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
                  <Typography
                    variant="body1"
                    sx={{ color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black') }}
                  >
                    Remaining Tokens: {tokenUsage.remaining.toLocaleString()}
                  </Typography>
                </Tooltip>
                <Tooltip title="Percentage of tokens used this month">
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                    }}
                  >
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
                <Box
                  sx={{
                    ...redOutline,
                    borderRadius: 3,
                    p: 2,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  }}
                >
                  <Box
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
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'text.secondary' : 'black',
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
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      }}
                    >
                      {tokenUsage.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  sx={{
                    ...redOutline,
                    borderRadius: 3,
                    p: 2,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  }}
                >
                  <Box
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
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'text.secondary' : 'black',
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
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      }}
                    >
                      {tokenUsage.used.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  sx={{
                    ...redOutline,
                    borderRadius: 3,
                    p: 2,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  }}
                >
                  <Box
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
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: theme =>
                              theme.palette.mode === 'dark' ? 'text.secondary' : 'black',
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
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      }}
                    >
                      {tokenUsage.remaining.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box
            ref={usageHistoryRef}
            id="usage-history"
            sx={{
              p: 2,
              mb: 2,
              ...redOutline,
              borderRadius: 3,
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  fontWeight: 'normal',
                  mb: 0,
                }}
              >
                Usage History
              </Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Usage History Chart
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Visualize your token usage over time with an interactive line chart. Track daily consumption and cumulative totals for the selected period.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Switch between 7-day and 30-day views using the toggle buttons
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Hover over data points to see detailed information for each day
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Shows daily token usage and cumulative totals
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                      Chart updates automatically as you use AI features
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <InfoIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                    cursor: 'help',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    mb: 0.5,
                  }}
                />
              </Tooltip>
            </Box>
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
                <Typography
                  variant="h5"
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                  }}
                  gutterBottom
                >
                  No Activity Yet
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                  }}
                >
                  Your usage history will appear here once you start using AI services.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 300,
                  width: '100%',
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              >
                <ResponsiveContainer>
                  <LineChart
                    data={displayedUsageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
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
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                boxShadow: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: 'text.primary',
                                  fontWeight: 600,
                                  mb: 0.5,
                                }}
                              >
                                {formattedDate}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  lineHeight: 1.4,
                                }}
                              >
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
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: 'error.main',
                                        fontWeight: 600,
                                      }}
                                    >
                                      Subscription Renewal
                                    </Typography>
                                  </>
                                )}
                              </Typography>
                            </Box>
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
          </Box>

          <Box
            sx={{
              p: 2,
              mb: 2,
              ...redOutline,
              borderRadius: 3,
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  fontWeight: 'normal',
                  mb: 0,
                }}
              >
                Token Cost Calculator
              </Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Token Cost Calculator
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Estimate the cost of purchasing additional tokens. Tokens are priced at $1.00 per 1,000 tokens (minus 1 cent processing fee).
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Enter the number of tokens you want to purchase
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Cost updates automatically as you type
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Purchased tokens are added to your current balance
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                      Minimum purchase: 1,000 tokens
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <InfoIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                    cursor: 'help',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    mb: 0.5,
                  }}
                />
              </Tooltip>
            </Box>
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
                  AI Model: {getAIModelDisplayName()}
                </Typography>
                <TextField
                  label="Custom Token Amount"
                  type="text"
                  value={calcTokens || ''}
                  onChange={handleCalcChange}
                  onBlur={handleCalcBlur}
                  placeholder="1000"
                  helperText="Min: 1,000 tokens | Max: 1,000,000 tokens"
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
                    '& .MuiInputLabel-root': {
                      color: 'red',
                      '&.Mui-focused': {
                        color: 'red',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: theme =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.7)'
                          : 'rgba(0, 0, 0, 0.6)',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                    },
                  }}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
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
                  sx={{
                    minWidth: 120,
                    fontWeight: 700,
                    fontSize: '1rem',
                    mt: 1,
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  }}
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
                  mx: 'auto',
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
                      variant={selectedTokenAmount === amount ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        borderColor: 'red',
                        color: selectedTokenAmount === amount ? 'white' : 'red',
                        backgroundColor: selectedTokenAmount === amount ? 'red' : 'transparent',
                        minWidth: 0,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        width: '100%',
                      }}
                      onClick={() => handleTokenAmountSelect(amount)}
                    >
                      {amount.toLocaleString()}
                    </Button>
                  ))}
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  disabled={selectedTokenAmount < 1000 || creatingPaymentIntent}
                  sx={{
                    mt: 1,
                    width: '100%',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    boxShadow: 2,
                    py: 0.5,
                    maxWidth: { xs: '100%', md: 340 },
                    opacity: selectedTokenAmount === 0 ? 0.5 : 1,
                  }}
                  onClick={handleTokenPurchaseClick}
                >
                  {creatingPaymentIntent
                    ? 'Creating Payment Form...'
                    : selectedTokenAmount > 0
                    ? `Purchase ${selectedTokenAmount.toLocaleString()} Tokens - $${calcCost.toFixed(
                        2
                      )}`
                    : 'Select Token Amount'}
                </Button>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              p: 2,
              mb: 2,
              ...redOutline,
              borderRadius: 3,
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  fontWeight: 'normal',
                  mb: 0,
                }}
              >
                Recent Transactions
              </Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Recent Transactions
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      View your recent token purchases and subscription transactions. Click on any transaction to see more details.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Shows up to 3 most recent transactions
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Includes subscription payments and token purchases
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Click "View All Transactions" to see complete history
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                      Transactions are ordered by most recent first
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <InfoIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                    cursor: 'help',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    mb: 0.5,
                  }}
                />
              </Tooltip>
            </Box>
            {transactions.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 120 }}
              >
                <ReceiptLongOutlinedIcon sx={{ fontSize: 48, color: 'red', mb: 2, opacity: 0.5 }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                  }}
                  gutterBottom
                >
                  No Transactions Yet
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                  }}
                >
                  Your recent transactions will appear here once you start using tokens.
                </Typography>
              </Box>
            ) : (
              <List>
                {transactions
                  .filter(t => /purchase|subscription/i.test(t.description))
                  .slice(0, 3)
                  .map((transaction, index) => {
                    const type = getTransactionType(transaction.description);
                    const transactionIcon = getTransactionIcon(transaction);
                    const transactionColor = getTransactionColor(transaction);
                    return (
                      <React.Fragment key={index}>
                        <ListItem
                          button
                          onClick={e => handleTransactionClick(e, transaction)}
                          sx={{
                            pl: 0,
                            pr: 1,
                            position: 'relative',
                            borderLeft: 'none',
                            background: theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.paper
                                : '#fff',
                            border: `2px solid ${transactionColor}`,
                            transition: 'all 0.2s ease-in-out',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': {
                              boxShadow: theme =>
                                theme.palette.mode === 'dark'
                                  ? '0 4px 12px rgba(255, 255, 255, 0.1)'
                                  : '0 2px 8px rgba(211,47,47,0.08)',
                              transform: 'translateY(-1px)',
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
                              background: transactionColor,
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, pl: 1, flexShrink: 0 }}>
                            {React.cloneElement(transactionIcon, {
                              sx: { color: transactionColor, fontSize: 28 },
                            })}
                          </ListItemIcon>
                          <ListItemText
                            sx={{
                              flex: '1 1 auto',
                              minWidth: 0,
                              mr: 1,
                              overflow: 'hidden',
                            }}
                            primary={
                              <Typography
                                sx={{
                                  color: theme =>
                                    theme.palette.mode === 'dark' ? 'white' : 'black',
                                  fontWeight: 500,
                                  fontSize: '0.95rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {transaction.description}
                              </Typography>
                            }
                            secondaryTypographyProps={{ component: 'span' }}
                            secondary={
                              <>
                                <Chip
                                  label={type}
                                  size="small"
                                  sx={{
                                    backgroundColor: transactionColor,
                                    color: theme =>
                                      theme.palette.mode === 'dark'
                                        ? theme.palette.background.paper
                                        : '#fff',
                                    fontWeight: 600,
                                    mr: 1,
                                  }}
                                />
                                <Typography
                                  component="span"
                                  sx={{
                                    color: theme =>
                                      theme.palette.mode === 'dark'
                                        ? 'text.secondary'
                                        : 'text.secondary',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {formatUTCDistanceToNow(transaction.created_at, {
                                    addSuffix: true,
                                  })}
                                </Typography>
                              </>
                            }
                          />
                          <Chip
                            label={`$${transaction.amount.toFixed(2)}`}
                            size="small"
                            sx={{
                              backgroundColor: 'transparent',
                              color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '1rem',
                              minWidth: 'auto',
                              flexShrink: 0,
                              px: 1,
                            }}
                          />
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
              </List>
            )}
            {transactions.filter(t => /purchase|subscription/i.test(t.description)).length > 3 && (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleModalOpen}
                sx={{
                  mt: 2,
                  borderColor: 'red',
                  color: 'red',
                  fontWeight: 600,
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? 'transparent' : 'transparent',
                  '&:hover': {
                    borderColor: 'red',
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(211, 47, 47, 0.1)'
                        : 'rgba(211, 47, 47, 0.04)',
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
              PaperProps={{
                sx: {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  border: '2px solid red',
                  borderRadius: 2,
                },
              }}
            >
              {popoverContent && (
                <Box sx={{ p: 2, minWidth: 220 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    }}
                  >
                    {popoverContent.description}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme =>
                        theme.palette.mode === 'dark' ? 'text.secondary' : 'text.secondary',
                    }}
                  >
                    {popoverContent.date}
                  </Typography>
                  {popoverContent.assignment && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      }}
                    >
                      Assignment: <b>{popoverContent.assignment}</b>
                    </Typography>
                  )}
                  {popoverContent.summary && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      }}
                    >
                      {popoverContent.summary}
                    </Typography>
                  )}
                  {popoverContent && popoverContent.link && (
                    <Button
                      href={popoverContent.link}
                      target="_blank"
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      sx={{
                        mt: 1,
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'primary.main'),
                        borderColor: theme =>
                          theme.palette.mode === 'dark' ? 'white' : 'primary.main',
                        '&:hover': {
                          backgroundColor: theme =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(211, 47, 47, 0.04)',
                        },
                      }}
                    >
                      View Full Response
                    </Button>
                  )}
                </Box>
              )}
            </Popover>
          </Box>
          <Box sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={breakpoint === 'standard' ? 12 : 4}>
          <Box
            sx={{
              p: 3,
              mb: 4,
              ...redOutline,
              borderRadius: 3,
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
            ref={guideRef}
          >
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
            <Typography
              variant="body2"
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                mb: 3,
              }}
            >
              Understand how tokens are used for different AI-powered features
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SchoolIcon color="primary" />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  }}
                >
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
                        borderRadius: 3,
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
                          <Tooltip
                            title={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {info.title}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {info.description}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  Features:
                                </Typography>
                                <Typography variant="caption" component="div">
                                  {info.features.map((f, idx) => (
                                    <span key={idx}>
                                      • {f}
                                      {idx < info.features.length - 1 && <br />}
                                    </span>
                                  ))}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                                  Estimated: {info.tokens} per request
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <InfoIcon
                              sx={{
                                color: 'text.secondary',
                                fontSize: 18,
                                cursor: 'help',
                                opacity: 0.7,
                                '&:hover': { opacity: 1 },
                              }}
                            />
                          </Tooltip>
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
                          <Tooltip
                            title={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {info.title}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {info.description}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  Features:
                                </Typography>
                                <Typography variant="caption" component="div">
                                  {info.features.map((f, idx) => (
                                    <span key={idx}>
                                      • {f}
                                      {idx < info.features.length - 1 && <br />}
                                    </span>
                                  ))}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                                  Estimated: {info.tokens} per request
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <InfoIcon
                              sx={{
                                color: 'text.secondary',
                                fontSize: 18,
                                cursor: 'help',
                                opacity: 0.7,
                                '&:hover': { opacity: 1 },
                              }}
                            />
                          </Tooltip>
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
          </Box>

          {/* All Transactions Modal */}
          <TransactionsModal
            open={modalOpen}
            onClose={handleModalClose}
            transactions={transactions}
            onTransactionClick={handleTransactionClick}
          />
        </Grid>
      </Grid>

      {/* Features Navigation Confirmation Dialog */}
      {showFeaturesConfirmation && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
          onClick={() => setShowFeaturesConfirmation(false)}
        >
          <Box
            onClick={e => e.stopPropagation()}
            sx={{
              width: { xs: '95vw', sm: '400px' },
              maxWidth: '400px',
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'primary.main',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InfoIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      fontWeight: 600,
                    }}
                  >
                    Leave Dashboard?
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setShowFeaturesConfirmation(false)}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ pt: 3, pb: 1, px: 2 }}>
              <Typography
                variant="body1"
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                  mb: 2,
                }}
              >
                You're about to leave the dashboard and navigate to the AI Features section. Are you
                sure this is what you want to do?
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme => (theme.palette.mode === 'dark' ? 'text.secondary' : 'black'),
                  fontStyle: 'italic',
                }}
              >
                You can always return to the dashboard using the navigation menu.
              </Typography>
            </Box>

            {/* Actions */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                justifyContent: 'center',
                display: 'flex',
              }}
            >
              <Button
                onClick={handleConfirmFeaturesNavigation}
                variant="contained"
                sx={{ minWidth: 120 }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Token Purchase Box */}
      {tokenPurchaseDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
          onClick={handleTokenPurchaseDialogClose}
        >
          <Box
            sx={{
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
              border: '2px solid red',
              borderRadius: 2,
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black') }}
              >
                Purchase {selectedTokenAmount.toLocaleString()} Tokens
              </Typography>
              <IconButton
                aria-label="Close"
                onClick={handleTokenPurchaseDialogClose}
                sx={{
                  color: theme => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2 }}>
              {selectedTokenAmount > 0 && paymentIntentClientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret: paymentIntentClientSecret }}
                >
                  <TokenPurchaseForm
                    tokenAmount={selectedTokenAmount}
                    onSuccess={handleTokenPurchaseSuccess}
                    onError={handleTokenPurchaseError}
                  />
                </Elements>
              )}
              {creatingPaymentIntent && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography>Creating payment form...</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Purchase Success Box */}
      {purchaseSuccess && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setPurchaseSuccess(false)}
        >
          <Box
            sx={{
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
              border: theme => `2px solid ${theme.palette.mode === 'dark' ? '#ff4444' : 'red'}`,
              borderRadius: 2,
              p: 4,
              maxWidth: 400,
              width: '90%',
              textAlign: 'center',
              boxShadow: 3,
            }}
            onClick={e => e.stopPropagation()}
          >
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'green' }} />
              {/* Confetti Animation */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 100,
                  height: 100,
                  pointerEvents: 'none',
                  '& .confetti': {
                    position: 'absolute',
                    width: 8,
                    height: 8,
                    backgroundColor: theme => (theme.palette.mode === 'dark' ? '#ff4444' : 'red'),
                    animation: 'confetti-fall 1.5s ease-out forwards',
                    '&:nth-of-type(1)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0s',
                      backgroundColor: '#ff4444',
                      transform: 'rotate(0deg)',
                    },
                    '&:nth-of-type(2)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.1s',
                      backgroundColor: '#44ff44',
                      transform: 'rotate(45deg)',
                    },
                    '&:nth-of-type(3)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.2s',
                      backgroundColor: '#4444ff',
                      transform: 'rotate(90deg)',
                    },
                    '&:nth-of-type(4)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.3s',
                      backgroundColor: '#ffff44',
                      transform: 'rotate(135deg)',
                    },
                    '&:nth-of-type(5)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.4s',
                      backgroundColor: '#ff44ff',
                      transform: 'rotate(180deg)',
                    },
                    '&:nth-of-type(6)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.5s',
                      backgroundColor: '#44ffff',
                      transform: 'rotate(225deg)',
                    },
                    '&:nth-of-type(7)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.6s',
                      backgroundColor: '#ff8844',
                      transform: 'rotate(270deg)',
                    },
                    '&:nth-of-type(8)': {
                      top: '50%',
                      left: '50%',
                      animationDelay: '0.7s',
                      backgroundColor: '#8844ff',
                      transform: 'rotate(315deg)',
                    },
                  },
                  '@keyframes confetti-fall': {
                    '0%': {
                      transform: 'translate(0, 0) rotate(0deg) scale(1)',
                      opacity: 1,
                    },
                    '100%': {
                      transform:
                        'translate(var(--random-x, 0), var(--random-y, 0)) rotate(720deg) scale(0)',
                      opacity: 0,
                    },
                  },
                }}
              >
                {[...Array(8)].map((_, i) => (
                  <Box
                    key={i}
                    className="confetti"
                    sx={{
                      '--random-x': `${(Math.random() - 0.5) * 200}px`,
                      '--random-y': `${(Math.random() - 0.5) * 200}px`,
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'green'),
              }}
            >
              Purchase Successful!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'inherit'),
              }}
            >
              You have successfully purchased {selectedTokenAmount.toLocaleString()} tokens. Your
              token limit has been updated.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setPurchaseSuccess(false)}
              sx={{ mt: 2 }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AITokens;
