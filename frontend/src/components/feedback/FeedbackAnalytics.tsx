import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface FeedbackMetrics {
  totalFeedback: number;
  averageRating: number;
  responseRate: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  feedbackTrend: {
    date: string;
    count: number;
    averageRating: number;
  }[];
}

const mockData: FeedbackMetrics = {
  totalFeedback: 150,
  averageRating: 4.2,
  responseRate: 85,
  sentimentDistribution: {
    positive: 65,
    neutral: 25,
    negative: 10,
  },
  categoryDistribution: [
    { category: 'UI/UX', count: 45 },
    { category: 'Features', count: 35 },
    { category: 'Performance', count: 25 },
    { category: 'Support', count: 20 },
    { category: 'Other', count: 25 },
  ],
  feedbackTrend: [
    { date: '2024-03-01', count: 5, averageRating: 4.0 },
    { date: '2024-03-02', count: 8, averageRating: 4.2 },
    { date: '2024-03-03', count: 12, averageRating: 4.3 },
    { date: '2024-03-04', count: 7, averageRating: 4.1 },
    { date: '2024-03-05', count: 10, averageRating: 4.4 },
  ],
};

// For testing purposes, allow injection of test data
let testData: FeedbackMetrics | null = null;
let shouldThrowError = false;
let refreshCount = 0;

export const setTestData = (data: FeedbackMetrics | null) => {
  testData = data;
};

export const setShouldThrowError = (value: boolean) => {
  shouldThrowError = value;
};

export const resetTestState = () => {
  testData = null;
  shouldThrowError = false;
  refreshCount = 0;
};

const FeedbackAnalytics: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<FeedbackMetrics | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // For testing purposes
      if (shouldThrowError) {
        throw new Error('Failed to fetch');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use test data if provided, otherwise use mock data
      const data = testData !== null ? testData : mockData;

      // For refresh test, return different data on subsequent calls
      if (refreshCount > 0 && testData === null) {
        const updatedData = {
          ...mockData,
          totalFeedback: 200,
          averageRating: 4.5,
          responseRate: 90,
          sentimentDistribution: {
            positive: 70,
            neutral: 20,
            negative: 10,
          },
        };
        setMetrics(updatedData);
      } else {
        setMetrics(data);
      }

      refreshCount++;
      setLoading(false);
    } catch (err) {
      setError('Failed to load feedback analytics');
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRefresh = () => {
    fetchMetrics();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }} role="alert">
        {error}
      </Alert>
    );
  }

  if (!metrics) {
    return null;
  }

  // Check if data is empty
  const isEmpty =
    metrics.totalFeedback === 0 &&
    metrics.averageRating === 0 &&
    metrics.responseRate === 0 &&
    metrics.categoryDistribution.length === 0 &&
    metrics.feedbackTrend.length === 0;

  if (isEmpty) {
    return (
      <Alert severity="info" sx={{ m: 2 }} role="alert">
        No feedback data available
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Feedback Analytics"
            action={
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Feedback
                    </Typography>
                    <Typography variant="h3">{metrics.totalFeedback}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Average Rating
                    </Typography>
                    <Typography variant="h3">{metrics.averageRating.toFixed(1)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Response Rate
                    </Typography>
                    <Typography variant="h3">{metrics.responseRate}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Feedback Categories" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Feedback Count" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Feedback Trends" />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.feedbackTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="Feedback Count"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="averageRating"
                    stroke="#82ca9d"
                    name="Average Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Sentiment Distribution" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" color="success.main">
                    Positive
                  </Typography>
                  <Typography variant="h4">{metrics.sentimentDistribution.positive}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Neutral
                  </Typography>
                  <Typography variant="h4">{metrics.sentimentDistribution.neutral}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h6" color="error.main">
                    Negative
                  </Typography>
                  <Typography variant="h4">{metrics.sentimentDistribution.negative}%</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FeedbackAnalytics;
