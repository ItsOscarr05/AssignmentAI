import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
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
import { analytics } from '../../services/api';

interface PerformanceData {
  overallScore: number;
  completionRate: number;
  subjectPerformance: Array<{
    subject: string;
    score: number;
    trend: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    progress: number;
  }>;
}

export const PerformanceMetrics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analytics.getPerformanceMetrics();
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h4" component="span" sx={{ mr: 2 }}>
                {data.overallScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={data.overallScore}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Completion Rate
            </Typography>
            <Typography variant="h4" gutterBottom>
              {data.completionRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              of assignments completed on time
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Subject Performance
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8884d8" name="Score" />
              <Bar dataKey="trend" fill="#82ca9d" name="Trend" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Weekly Progress
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="progress" stroke="#8884d8" name="Progress" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};
