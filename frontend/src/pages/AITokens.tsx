import {
  Assignment as AssignmentIcon,
  Autorenew as AutorenewIcon,
  Psychology as BrainIcon,
  CheckCircle as CheckCircleIcon,
  Code as CodeIcon,
  CreditCard as CreditCardIcon,
  Description as DescriptionIcon,
  Diamond as DiamondIcon,
  EmojiEvents as EmojiEventsIcon,
  Functions as FunctionsIcon,
  History as HistoryIcon,
  HourglassEmpty as HourglassEmptyIcon,
  LocalOffer as LocalOfferIcon,
  OpenInNew as OpenInNewIcon,
  Report as ReportIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
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
import { formatDistanceToNow, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { recentAssignments } from './DashboardHome';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  token_limit: number;
}

const AITokens: React.FC = () => {
  const [, setSubscription] = useState<Subscription | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await api.get<Subscription>('/subscriptions/current');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate used tokens from tokensUsed field
  const usedTokens = recentAssignments.reduce((sum, a) => sum + (a.tokensUsed || 500), 0);
  const totalTokens = 30000;
  const remainingTokens = totalTokens - usedTokens;
  const tokenUsage = {
    label: 'Free Plan (30,000 tokens/month)',
    total: totalTokens,
    used: usedTokens,
    remaining: remainingTokens,
    percentUsed: Math.round((usedTokens / totalTokens) * 100),
  };

  // Build accurate usage history for the graph
  const sortedAssignments = [...recentAssignments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  function buildUsageHistory(
    assignments: { tokensUsed?: number; title: string }[],
    total: number,
    range: number
  ) {
    const points: { date: string; tokens: number; description: string }[] = [];
    let runningTotal = total;
    // Only use the last N assignments for the graph
    const recent = assignments.slice(-range);
    // Add initial point (before any usage)
    points.push({ date: `Day 0`, tokens: total, description: 'Starting balance' });
    recent.forEach((a, i) => {
      runningTotal -= a.tokensUsed || 500;
      points.push({
        date: `Day ${i + 1}`,
        tokens: runningTotal,
        description: `Used for: ${a.title}`,
      });
    });
    return points;
  }
  const usageData30 = buildUsageHistory(sortedAssignments, totalTokens, 30);
  const usageData7 = usageData30.slice(-7);
  const [range, setRange] = React.useState<'7' | '30'>('7');
  const handleRangeChange = (_: any, newRange: '7' | '30') => {
    if (newRange) setRange(newRange);
  };
  const displayedUsageData = range === '7' ? usageData7 : usageData30;

  // Generate recent transactions from assignments
  const recentTransactions = [
    {
      date: new Date().toISOString().slice(0, 10),
      description: 'Token Purchase - Free Tier',
      tokens: totalTokens,
      summary: 'Monthly free token allocation',
    },
    ...recentAssignments.slice(-3).map(a => ({
      date: a.createdAt.slice(0, 10),
      description: `${a.title} - ${a.status}`,
      tokens: -(a.tokensUsed || 500),
      assignment: a.title,
      summary: `AI service for assignment: ${a.title}`,
    })),
  ];

  // Token usage info for free tier features
  const tokenUsageInfo = [
    {
      title: 'Assignment Analysis',
      tokens: '50 tokens',
      description: 'Basic analysis of your assignment requirements and structure',
      features: ['Requirements breakdown', 'Structure suggestions', 'Key points identification'],
    },
    {
      title: 'Essay Review',
      tokens: '100 tokens',
      description: 'Comprehensive review of your essay with feedback and suggestions',
      features: ['Grammar and style check', 'Content analysis', 'Improvement suggestions'],
    },
    {
      title: 'Math Problem Solving',
      tokens: '75 tokens',
      description: 'Step-by-step solutions for mathematical problems',
      features: ['Solution steps', 'Formula explanations', 'Alternative methods'],
    },
    {
      title: 'Research Assistance',
      tokens: '100 tokens',
      description: 'AI-powered research help with sources and citations',
      features: ['Source finding', 'Citation generation', 'Literature review'],
    },
    {
      title: 'Science Lab Report',
      tokens: '75 tokens',
      description: 'Analysis and formatting of lab experiment data',
      features: ['Data analysis', 'Conclusion generation', 'Format assistance'],
    },
    {
      title: 'History Timeline',
      tokens: '100 tokens',
      description: 'Create and analyze historical timelines',
      features: ['Event sequencing', 'Source verification', 'Context analysis'],
    },
  ];

  const [plan] = React.useState<'Free' | 'Pro'>('Free');
  const guideRef = React.useRef<HTMLDivElement>(null);
  const handleProgressBarClick = () => {
    if (guideRef.current) {
      guideRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [popoverContent, setPopoverContent] = React.useState<any>(null);
  const handleTransactionClick = (event: React.MouseEvent<HTMLElement>, transaction: any) => {
    setAnchorEl(event.currentTarget);
    setPopoverContent(transaction);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverContent(null);
  };
  const open = Boolean(anchorEl);

  const getTransactionIcon = (desc: string) => {
    if (/purchase/i.test(desc)) return <CreditCardIcon color="primary" />;
    if (/refund/i.test(desc)) return <AutorenewIcon color="success" />;
    return <BrainIcon color="error" />;
  };

  // Group features by category
  const academicFeatures = tokenUsageInfo.filter(info =>
    ['Assignment Analysis', 'Essay Review', 'Research Assistance'].includes(info.title)
  );
  const technicalFeatures = tokenUsageInfo.filter(info =>
    ['Code Review', 'Math Problem Solving', 'Plagiarism Check'].includes(info.title)
  );
  const handleTryIt = (feature: string) => {
    // Prefill Workshop logic (navigate with state or query param)
    window.location.href = `/dashboard/workshop?feature=${encodeURIComponent(feature)}`;
  };
  const handleSeeAllFeatures = () => {
    window.open('https://assignmentai.com/docs/features', '_blank');
  };

  const [calcTokens, setCalcTokens] = React.useState(0);
  const [calcCost, setCalcCost] = React.useState(0);
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
    'Essay Review': { icon: <AssignmentIcon />, color: '#1976d2' }, // blue
    'Research Assistance': { icon: <SearchIcon />, color: '#00897b' }, // teal
    'Code Review': { icon: <CodeIcon />, color: '#388e3c' }, // green
    'Math Problem Solving': { icon: <FunctionsIcon />, color: '#f57c00' }, // orange
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

  // Calculate total used tokens from recent transactions

  // Token usage based on subscription

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        className="page-title"
        sx={{ color: 'error.main', mb: 3 }}
      >
        AI Tokens
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {plan === 'Free' && (
            <Card sx={{ p: 2, mb: 2, ...redOutline }}>
              <CardContent>
                <Grid container spacing={0} wrap="nowrap" sx={{ overflowX: 'auto' }}>
                  <Grid
                    item
                    sx={{
                      minWidth: 150,
                      flex: '1 1 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 1,
                      background: 'none',
                      border: '2px solid #2196f3',
                      borderRadius: 2,
                      mr: 1,
                    }}
                  >
                    <LocalOfferIcon sx={{ color: '#2196f3', fontSize: 36, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2196f3' }}>
                      Free
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Free
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mb: 1 }}
                    >
                      Perfect for getting started with basic writing assistance
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: '#2196f3',
                        color: '#2196f3',
                        fontWeight: 700,
                        pointerEvents: 'none',
                        opacity: 1,
                      }}
                    >
                      Current Plan
                    </Button>
                  </Grid>
                  <Grid
                    item
                    sx={{
                      minWidth: 150,
                      flex: '1 1 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 1,
                      background: 'none',
                      border: '2px solid #4caf50',
                      borderRadius: 2,
                      mx: 1,
                    }}
                  >
                    <StarIcon sx={{ color: '#4caf50', fontSize: 36, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      Plus
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      $4.99
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mb: 1 }}
                    >
                      Enhanced features for more serious students
                    </Typography>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      href="/dashboard/price-plan#plus"
                    >
                      Upgrade
                    </Button>
                  </Grid>
                  <Grid
                    item
                    sx={{
                      minWidth: 150,
                      flex: '1 1 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 1,
                      background: 'none',
                      border: '2px solid #9c27b0',
                      borderRadius: 2,
                      mx: 1,
                    }}
                  >
                    <DiamondIcon sx={{ color: '#9c27b0', fontSize: 36, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                      Pro
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      $9.99
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mb: 1 }}
                    >
                      Unlimited tokens, priority support, advanced features
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      href="/dashboard/price-plan#pro"
                      sx={{ borderColor: '#9c27b0', color: '#9c27b0', fontWeight: 700 }}
                    >
                      Upgrade
                    </Button>
                  </Grid>
                  <Grid
                    item
                    sx={{
                      minWidth: 150,
                      flex: '1 1 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 1,
                      background: 'none',
                      border: '2px solid #ff9800',
                      borderRadius: 2,
                      ml: 1,
                    }}
                  >
                    <EmojiEventsIcon sx={{ color: '#ff9800', fontSize: 36, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      Max
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      $14.99
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mb: 1 }}
                    >
                      Ultimate package for
                      <br />
                      power users
                    </Typography>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      href="/dashboard/price-plan#max"
                    >
                      Upgrade
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'black', fontWeight: 'normal' }}>
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
                    backgroundColor: '#fff',
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
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <HistoryIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                    <Box>
                      <Tooltip title="Total tokens available in your plan per month">
                        <Typography color="textSecondary" gutterBottom>
                          Total Tokens
                        </Typography>
                      </Tooltip>
                      <Typography variant="h5">{tokenUsage.total.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ ...redOutline }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon sx={{ color: '#388e3c', fontSize: 32 }} />
                    <Box>
                      <Tooltip title="Tokens consumed by AI services this month">
                        <Typography color="textSecondary" gutterBottom>
                          Used Tokens
                        </Typography>
                      </Tooltip>
                      <Typography variant="h5">{tokenUsage.used.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ ...redOutline }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <HourglassEmptyIcon sx={{ color: '#FFA000', fontSize: 32 }} />
                    <Box>
                      <Tooltip title="Tokens you have left for this month">
                        <Typography color="textSecondary" gutterBottom>
                          Remaining
                        </Typography>
                      </Tooltip>
                      <Typography variant="h5">{tokenUsage.remaining.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'black', fontWeight: 'normal' }}>
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
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={displayedUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#d32f2f" />
                  <YAxis stroke="#d32f2f" />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const point = payload[0].payload;
                        return (
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2">{label}</Typography>
                            <Typography variant="body2">
                              {point.tokens > 0 ? '+' : ''}
                              {point.tokens} tokens
                              <br />
                              {point.description ? point.description : ''}
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
          </Paper>

          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'black', fontWeight: 'normal' }}>
              Recent Transactions
            </Typography>
            <List>
              {recentTransactions
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
                          pl: 0,
                          position: 'relative',
                          borderLeft: 'none',
                          background: '#fff',
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
                          secondary={
                            <>
                              <Chip
                                label={type}
                                size="small"
                                sx={{
                                  backgroundColor: color,
                                  color: '#fff',
                                  fontWeight: 600,
                                  mr: 1,
                                }}
                              />
                              {formatDistanceToNow(parseISO(transaction.date), { addSuffix: true })}
                            </>
                          }
                        />
                        <Chip
                          label={`${transaction.tokens > 0 ? '+' : ''}${transaction.tokens} tokens`}
                          size="medium"
                          sx={{
                            backgroundColor: '#fff',
                            color: color,
                            border: `2px solid ${color}`,
                            fontWeight: 700,
                            fontSize: '1rem',
                          }}
                        />
                      </ListItem>
                      {index < recentTransactions.length - 1 && (
                        <Divider sx={{ borderColor: color, opacity: 0.5, ml: 1.5 }} />
                      )}
                    </React.Fragment>
                  );
                })}
            </List>
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

          <Paper sx={{ p: 2, mb: 2, ...redOutline }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'black', fontWeight: 'normal' }}>
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
          <Box sx={{ mb: 4 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4, ...redOutline }} ref={guideRef}>
            <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>
              Token Usage Guide
            </Typography>
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'black' }}>
                            {info.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={info.tokens}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1, color: '#000 !important' }}>
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
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewIcon />}
                        onClick={() => handleTryIt(info.title)}
                        sx={{ borderColor: 'red', color: 'red', mt: 1 }}
                      >
                        Try Now
                      </Button>
                    </ListItem>
                    {index < academicFeatures.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CodeIcon color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Technical
                </Typography>
              </Box>
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'black' }}>
                            {info.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={info.tokens}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1, color: '#000 !important' }}>
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
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewIcon />}
                        onClick={() => handleTryIt(info.title)}
                        sx={{ borderColor: 'red', color: 'red', mt: 1 }}
                      >
                        Try Now
                      </Button>
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default AITokens;
