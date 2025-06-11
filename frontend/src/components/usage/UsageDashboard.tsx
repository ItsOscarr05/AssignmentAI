import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface UsageLimit {
  id: number;
  plan_id: string;
  feature: string;
  limit_type: string;
  limit_value: number;
  metadata: Record<string, any>;
}

interface UsageSummary {
  [feature: string]: number;
}

const UsageDashboard: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [usageSummary, setUsageSummary] = useState<UsageSummary>({});
  const [usageLimits, setUsageLimits] = useState<UsageLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, [period]);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const [summaryResponse, limitsResponse] = await Promise.all([
        api.get<UsageSummary>(`/usage/summary?period=${period}`),
        api.get<UsageLimit[]>('/usage/limits'),
      ]);
      setUsageSummary(summaryResponse.data);
      setUsageLimits(limitsResponse.data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch usage data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getLimitForFeature = (feature: string): UsageLimit | undefined => {
    return usageLimits.find(limit => limit.feature === feature);
  };

  const getUsagePercentage = (feature: string): number => {
    const limit = getLimitForFeature(feature);
    if (!limit) return 0;
    const usage = usageSummary[feature] || 0;
    return Math.min((usage / limit.limit_value) * 100, 100);
  };

  const formatLimitType = (type: string): string => {
    switch (type) {
      case 'daily':
        return 'per day';
      case 'weekly':
        return 'per week';
      case 'monthly':
        return 'per month';
      default:
        return 'total';
    }
  };

  const formatFeatureName = (feature: string): string => {
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Usage Dashboard</Typography>
        <Select
          value={period}
          onChange={e => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
      </Stack>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {Object.entries(usageSummary).map(([feature, count]) => {
            const limit = getLimitForFeature(feature);
            const percentage = getUsagePercentage(feature);

            return (
              <Grid item xs={12} sm={6} md={4} key={feature}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">{formatFeatureName(feature)}</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Usage: {count} / {limit?.limit_value || '∞'}{' '}
                          {formatLimitType(limit?.limit_type || '')}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                percentage > 90
                                  ? theme.palette.error.main
                                  : theme.palette.primary.main,
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default UsageDashboard;
