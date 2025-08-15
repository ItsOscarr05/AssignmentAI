import { Insights, Timeline, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { useAnalyticsDashboard } from '../../hooks/useAnalyticsDashboard';

const AdvancedAnalyticsDashboard: React.FC = () => {
  const { analytics, loading, error } = useAnalyticsDashboard();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No analytics data available.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Insights color="primary" />
        Advanced Analytics Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive performance insights and analytics
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Max Plan Benefit:</strong> Advanced analytics are included with your Max plan.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {analytics.metrics.assignmentsCompleted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assignments Completed
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {analytics.metrics.averageScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {analytics.metrics.improvementRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Improvement Rate
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {analytics.metrics.improvementRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Improvement Rate
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trends
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" color="primary" sx={{ mr: 2 }}>
                  {analytics.performance.overall}%
                </Typography>
                {analytics.performance.trend === 'up' ? (
                  <TrendingUp color="success" />
                ) : analytics.performance.trend === 'down' ? (
                  <TrendingDown color="error" />
                ) : (
                  <Timeline color="info" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Overall Performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Subject Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subject Performance
              </Typography>
              <Stack spacing={2}>
                {analytics.subjects.map((subject, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body1">{subject.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${subject.score}%`}
                        color={
                          subject.score >= 90
                            ? 'success'
                            : subject.score >= 80
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                        data-testid="chip"
                      />
                      {subject.trend === 'up' ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : subject.trend === 'down' ? (
                        <TrendingDown color="error" fontSize="small" />
                      ) : (
                        <Timeline color="info" fontSize="small" />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Insights
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Strong Performance in Mathematics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your mathematics scores have improved by 15% this month.
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    English Needs Attention
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Consider spending more time on English assignments.
                  </Typography>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedAnalyticsDashboard;
