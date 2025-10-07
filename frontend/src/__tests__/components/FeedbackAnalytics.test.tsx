import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackAnalytics, {
  resetTestState,
  setShouldThrowError,
  setTestData,
} from '../../components/feedback/FeedbackAnalytics';

// Mock the RefreshIcon
vi.mock('@mui/icons-material/Refresh', () => ({
  default: () => <span data-testid="refresh-icon">Refresh</span>,
}));

// Mock the recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div data-testid="card-header">
      {title}
      {action}
    </div>
  ),
  CircularProgress: () => <div role="progressbar" />,
  Typography: ({ children, color }: { children: React.ReactNode; color?: string }) => (
    <div style={{ color }}>{children}</div>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} role="button">
      {children}
    </button>
  ),
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Alert: ({ children, severity }: { children: React.ReactNode; severity?: string }) => (
    <div role="alert" data-severity={severity}>
      {children}
    </div>
  ),
}));

describe('FeedbackAnalytics', () => {
  beforeEach(() => {
    resetTestState();
  });

  it('renders loading state initially', () => {
    render(<FeedbackAnalytics />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('renders all metrics after loading', async () => {
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Total Feedback')).toBeTruthy();
      expect(screen.getByText('Average Rating')).toBeTruthy();
      expect(screen.getByText('Response Rate')).toBeTruthy();
    });
  });

  it('renders feedback categories chart', async () => {
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Categories')).toBeTruthy();
      expect(screen.getByTestId('bar-chart')).toBeTruthy();
    });
  });

  it('renders feedback trends chart', async () => {
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Trends')).toBeTruthy();
      expect(screen.getByTestId('line-chart')).toBeTruthy();
    });
  });

  it('renders sentiment distribution', async () => {
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Sentiment Distribution')).toBeTruthy();
      expect(screen.getByText('Positive')).toBeTruthy();
      expect(screen.getByText('Neutral')).toBeTruthy();
      expect(screen.getByText('Negative')).toBeTruthy();
    });
  });

  it('displays correct metric values', async () => {
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeTruthy(); // Total Feedback
      expect(screen.getByText('4.2')).toBeTruthy(); // Average Rating
      expect(screen.getByText('85%')).toBeTruthy(); // Response Rate
    });
  });

  it('handles error state', async () => {
    setShouldThrowError(true);
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Failed to load feedback analytics');
    });
  });

  it('renders empty state when no data is available', async () => {
    setTestData({
      totalFeedback: 0,
      averageRating: 0,
      responseRate: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      categoryDistribution: [],
      feedbackTrend: [],
    });

    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('No feedback data available');
    });
  });

  it('updates metrics when refresh button is clicked', async () => {
    render(<FeedbackAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeTruthy();
    });

    // Find and click the refresh button
    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('4.5')).toBeTruthy();
      expect(screen.getByText('90%')).toBeTruthy();
    });
  });
});
