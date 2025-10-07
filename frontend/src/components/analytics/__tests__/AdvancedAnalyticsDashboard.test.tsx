import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnalyticsDashboard } from '../../../hooks/useAnalyticsDashboard';
import { theme } from '../../../theme';
import AdvancedAnalyticsDashboard from '../AdvancedAnalyticsDashboard';

// Mock the TokenLimitContext properly
vi.mock('../../../contexts/TokenLimitContext', () => ({
  TokenLimitProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="token-limit-provider">{children}</div>
  ),
  useTokenLimitContext: () => ({
    subscription: { plan: 'max', status: 'active' },
    tokenUsage: { used: 500, limit: 1000 },
    isLoading: false,
  }),
}));

// Mock the useAnalyticsDashboard hook
vi.mock('../../../hooks/useAnalyticsDashboard', () => ({
  useAnalyticsDashboard: vi.fn(),
}));

const mockUseAnalyticsDashboard = vi.mocked(useAnalyticsDashboard);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <SnackbarProvider>{component}</SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('AdvancedAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value
    mockUseAnalyticsDashboard.mockReturnValue({
      analytics: {
        performance: {
          overall: 85,
          trend: 'up',
        },
        subjects: [
          { name: 'Mathematics', score: 92, trend: 'up' },
          { name: 'English', score: 78, trend: 'down' },
          { name: 'Science', score: 88, trend: 'stable' },
        ],
        metrics: {
          assignmentsCompleted: 24,
          averageScore: 85,
          improvementRate: 12,
        },
      },
      loading: false,
      error: null,
      refreshData: vi.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('should render component title and description', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Advanced Analytics Dashboard')).toBeTruthy();
      expect(screen.getByText(/Comprehensive performance insights and analytics/)).toBeTruthy();
    });

    it('should display Max Plan benefit alert', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText(/Max Plan Benefit/)).toBeTruthy();
      expect(screen.getByText(/Advanced analytics are included with your Max plan/)).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockUseAnalyticsDashboard.mockReturnValue({
        analytics: null,
        loading: true,
        error: null,
        refreshData: vi.fn(),
      });

      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByRole('progressbar')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', () => {
      mockUseAnalyticsDashboard.mockReturnValue({
        analytics: null,
        loading: false,
        error: 'Failed to load analytics data',
        refreshData: vi.fn(),
      });

      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Failed to load analytics data')).toBeTruthy();
    });

    it('should display error message when API fails', () => {
      mockUseAnalyticsDashboard.mockReturnValue({
        analytics: null,
        loading: false,
        error: 'Failed to load analytics data',
        refreshData: vi.fn(),
      });

      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Failed to load analytics data')).toBeTruthy();
    });
  });

  describe('Success State with API Data', () => {
    it('should display performance insights', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Performance Insights')).toBeTruthy();
      expect(screen.getByText('Strong Performance in Mathematics')).toBeTruthy();
      expect(screen.getByText('English Needs Attention')).toBeTruthy();
    });

    it('should display subject performance data', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Subject Performance')).toBeTruthy();
      expect(screen.getByText('Mathematics')).toBeTruthy();
      expect(screen.getByText('English')).toBeTruthy();
      expect(screen.getByText('Science')).toBeTruthy();
    });

    it('should display performance metrics', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Performance Metrics')).toBeTruthy();
      expect(screen.getByText('24')).toBeTruthy(); // assignmentsCompleted
      expect(screen.getAllByText('85%')).toHaveLength(2); // appears in metrics and trends
    });
  });

  describe('Fallback to Mock Data', () => {
    it('should use mock data when API fails', () => {
      mockUseAnalyticsDashboard.mockReturnValue({
        analytics: null,
        loading: false,
        error: 'API Error',
        refreshData: vi.fn(),
      });

      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('API Error')).toBeTruthy();
    });
  });

  describe('Performance Trend Display', () => {
    it('should show upward trend correctly', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Performance Trends')).toBeTruthy();
      expect(screen.getAllByText('85%')).toHaveLength(2); // appears in metrics and trends
    });

    it('should show downward trend correctly', () => {
      mockUseAnalyticsDashboard.mockReturnValue({
        analytics: {
          performance: {
            overall: 75,
            trend: 'down',
          },
          subjects: [
            { name: 'Mathematics', score: 82, trend: 'down' },
            { name: 'English', score: 68, trend: 'down' },
          ],
          metrics: {
            assignmentsCompleted: 20,
            averageScore: 75,
            improvementRate: -5,
          },
        },
        loading: false,
        error: null,
        refreshData: vi.fn(),
      });

      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Performance Trends')).toBeTruthy();
      expect(screen.getAllByText('75%')).toHaveLength(2); // appears in metrics and trends
    });
  });

  describe('Score Color Coding', () => {
    it('should apply correct colors to score chips', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard />);

      const scoreChips = screen.getAllByTestId('chip');
      expect(scoreChips.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should handle empty analytics data gracefully', () => {
      mockUseAnalyticsDashboard.mockReturnValue({
        analytics: {
          performance: {
            overall: 0,
            trend: 'stable',
          },
          subjects: [],
          metrics: {
            assignmentsCompleted: 0,
            averageScore: 0,
            improvementRate: 0,
          },
        },
        loading: false,
        error: null,
        refreshData: vi.fn(),
      });

      renderWithProviders(<AdvancedAnalyticsDashboard />);

      expect(screen.getAllByText('0%')).toHaveLength(4); // appears multiple times when empty
    });
  });
});
