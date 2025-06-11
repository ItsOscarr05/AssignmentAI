import { History as HistoryIcon, Info as InfoIcon } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const AITokens: React.FC = () => {
  const theme = useTheme();
  const tokenUsage = {
    total: 1000,
    used: 350,
    remaining: 650,
  };

  const recentTransactions = [
    {
      date: '2024-03-15',
      description: 'Assignment Analysis',
      tokens: -50,
    },
    {
      date: '2024-03-14',
      description: 'Token Purchase',
      tokens: 1000,
    },
    {
      date: '2024-03-13',
      description: 'Essay Review',
      tokens: -100,
    },
  ];

  const usageData = [
    { date: 'Mar 10', tokens: 1000 },
    { date: 'Mar 11', tokens: 950 },
    { date: 'Mar 12', tokens: 850 },
    { date: 'Mar 13', tokens: 750 },
    { date: 'Mar 14', tokens: 1750 },
    { date: 'Mar 15', tokens: 1700 },
  ];

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
      title: 'Code Review',
      tokens: '150 tokens',
      description: 'Detailed review of your code with optimization suggestions',
      features: ['Code quality check', 'Performance optimization', 'Best practices review'],
    },
    {
      title: 'Research Assistance',
      tokens: '200 tokens',
      description: 'AI-powered research help with sources and citations',
      features: ['Source finding', 'Citation generation', 'Literature review'],
    },
    {
      title: 'Math Problem Solving',
      tokens: '75 tokens',
      description: 'Step-by-step solutions for mathematical problems',
      features: ['Solution steps', 'Formula explanations', 'Alternative methods'],
    },
  ];

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
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'error.main', fontWeight: 'normal' }}
            >
              Token Usage
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
                <Typography variant="body1">Remaining Tokens: {tokenUsage.remaining}</Typography>
                <Typography variant="body1" color="text.secondary">
                  {Math.round((tokenUsage.used / tokenUsage.total) * 100)}% Used
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(tokenUsage.used / tokenUsage.total) * 100}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Tokens
                    </Typography>
                    <Typography variant="h5">{tokenUsage.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Used Tokens
                    </Typography>
                    <Typography variant="h5">{tokenUsage.used}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Remaining
                    </Typography>
                    <Typography variant="h5">{tokenUsage.remaining}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'error.main', fontWeight: 'normal' }}
            >
              Usage History
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'error.main', fontWeight: 'normal' }}
            >
              Recent Transactions
            </Typography>
            <List>
              {recentTransactions.map((transaction, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <HistoryIcon color="action" />
                    </ListItemIcon>
                    <ListItemText primary={transaction.description} secondary={transaction.date} />
                    <Typography
                      variant="body1"
                      color={transaction.tokens > 0 ? 'success.main' : 'error.main'}
                    >
                      {transaction.tokens > 0 ? '+' : ''}
                      {transaction.tokens} tokens
                    </Typography>
                  </ListItem>
                  {index < recentTransactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
              Token Usage Guide
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Understand how tokens are used for different AI-powered features
            </Typography>
            <List sx={{ py: 0 }}>
              {tokenUsageInfo.map((info, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      mb: 2,
                      p: 2,
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        borderColor: 'rgba(0, 0, 0, 0.12)',
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
                        <InfoIcon color="error" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {info.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {info.features.map((feature, featureIndex) => (
                        <Chip
                          key={featureIndex}
                          label={feature}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(211, 47, 47, 0.08)',
                            color: 'error.main',
                            fontWeight: 500,
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      ))}
                    </Box>
                  </ListItem>
                  {index < tokenUsageInfo.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AITokens;
