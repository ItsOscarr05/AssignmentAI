import { ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Analytics from '../../pages/dashboard/Analytics';
import { useAnalyticsStore } from '../../services/AnalyticsService';
import { theme } from '../../theme';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('../../services/AnalyticsService', () => ({
  useAnalyticsStore: vi.fn(),
}));

describe('Analytics Component', () => {
  const mockAnalyticsData = {
    usageMetrics: {
      totalTokens: 15000,
      monthlyTokens: 5000,
      dailyTokens: 200,
      averageTokensPerRequest: 150,
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
    },
    performanceMetrics: {
      averageResponseTime: 2.5,
      maxResponseTime: 5.0,
      minResponseTime: 1.0,
      successRate: 95,
      errorRate: 5,
    },
    userActivity: {
      userId: 'user123',
      lastActive: new Date().toISOString(),
      totalSessions: 25,
      averageSessionDuration: 30,
      favoriteModel: 'gpt-4',
      mostUsedTemplate: 'analysis',
      totalGenerations: 150,
    },
    isLoading: false,
    error: null,
    fetchAnalytics: vi.fn(),
    resetAnalytics: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAnalyticsStore as any).mockImplementation(() => mockAnalyticsData);
  });

  it('renders loading state', () => {
    (useAnalyticsStore as any).mockImplementation(() => ({
      ...mockAnalyticsData,
      isLoading: true,
    }));

    render(
      <ThemeProvider theme={theme}>
        <Analytics />
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useAnalyticsStore as any).mockImplementation(() => ({
      ...mockAnalyticsData,
      error: 'Test error',
    }));

    render(
      <ThemeProvider theme={theme}>
        <Analytics />
      </ThemeProvider>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders analytics data correctly', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Analytics />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      // The other text elements will be in the lazy-loaded components
      // We can't test for them directly as they're not immediately rendered
    });
  });

  it('calls fetchAnalytics on mount', () => {
    const fetchAnalytics = vi.fn();
    (useAnalyticsStore as any).mockImplementation(() => ({
      ...mockAnalyticsData,
      fetchAnalytics,
    }));

    render(
      <ThemeProvider theme={theme}>
        <Analytics />
      </ThemeProvider>
    );

    expect(fetchAnalytics).toHaveBeenCalledTimes(1);
  });
});
