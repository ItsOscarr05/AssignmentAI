import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import React, { Suspense, lazy, useEffect } from 'react';
import { useAnalyticsStore } from '../../services/AnalyticsService';
// Lazy load heavy analytics/chart components
const AnalyticsDashboard = lazy(() =>
  import('../../components/analytics/AnalyticsDashboard').then(module => ({
    default: module.AnalyticsDashboard,
  }))
);
const AssignmentAnalytics = lazy(() =>
  import('../../components/analytics/AssignmentAnalytics').then(module => ({
    default: module.AssignmentAnalytics,
  }))
);
const CustomReports = lazy(() =>
  import('../../components/analytics/CustomReports').then(module => ({
    default: module.CustomReports,
  }))
);
const PerformanceMetrics = lazy(() =>
  import('../../components/analytics/PerformanceMetrics').then(module => ({
    default: module.PerformanceMetrics,
  }))
);
const StudentProgress = lazy(() =>
  import('../../components/analytics/StudentProgress').then(module => ({
    default: module.StudentProgress,
  }))
);

const Analytics = () => {
  const { isLoading, error, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Suspense
        fallback={
          <Box p={3}>
            <CircularProgress />
          </Box>
        }
      >
        <Box sx={{ mt: 4 }}>
          <AnalyticsDashboard />
        </Box>
        <Box sx={{ mt: 4 }}>
          <AssignmentAnalytics />
        </Box>
        <Box sx={{ mt: 4 }}>
          <PerformanceMetrics />
        </Box>
        <Box sx={{ mt: 4 }}>
          <StudentProgress />
        </Box>
        <Box sx={{ mt: 4 }}>
          <CustomReports />
        </Box>
      </Suspense>
    </Container>
  );
};

export default React.memo(Analytics);
