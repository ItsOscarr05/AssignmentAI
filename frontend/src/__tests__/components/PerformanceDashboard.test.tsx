import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import PerformanceDashboard from '../../components/dashboard/PerformanceDashboard';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, sx }: { children: React.ReactNode; sx?: any }) => (
    <div style={sx}>{children}</div>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: ({
    children,
    variant,
    color,
  }: {
    children: React.ReactNode;
    variant?: string;
    color?: string;
  }) => (
    <div data-variant={variant} data-color={color}>
      {children}
    </div>
  ),
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CircularProgress: () => <div role="progressbar" />,
  Alert: ({ children, severity }: { children: React.ReactNode; severity?: string }) => (
    <div role="alert" data-severity={severity}>
      {children}
    </div>
  ),
  LinearProgress: ({ value, variant }: { value?: number; variant?: string }) => (
    <div role="progressbar" data-value={value} data-variant={variant} />
  ),
}));

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

// Types

interface ErrorResponse {
  message: string;
  details: string;
}

// Mock data
const mockMetrics = {
  totalSubmissions: 150,
  averageGrade: 85,
  completionRate: 92,
  plagiarismRate: 5,
  feedbackQuality: 88,
  submissionTrends: [
    { date: 'Jan', submissions: 25, averageGrade: 82 },
    { date: 'Feb', submissions: 30, averageGrade: 84 },
    { date: 'Mar', submissions: 28, averageGrade: 83 },
    { date: 'Apr', submissions: 32, averageGrade: 85 },
    { date: 'May', submissions: 35, averageGrade: 86 },
    { date: 'Jun', submissions: 33, averageGrade: 85 },
  ],
  gradeDistribution: [
    { range: 'A', count: 45 },
    { range: 'B', count: 60 },
    { range: 'C', count: 30 },
    { range: 'D', count: 10 },
    { range: 'F', count: 5 },
  ],
};

const mockError: ErrorResponse = {
  message: 'Failed to fetch performance metrics',
  details: 'Server error',
};

// Mock handlers
const handlers = [
  http.get('/api/analytics/performance', () => {
    return HttpResponse.json(mockMetrics);
  }),

  http.get('/api/performance/trends', () => {
    return HttpResponse.json({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Average Grade',
          data: [82, 84, 83, 85, 86, 85],
        },
      ],
    });
  }),

  http.get('/api/performance/insights', () => {
    return HttpResponse.json({
      insights: [
        {
          type: 'improvement',
          message: 'Student engagement has increased by 15%',
          impact: 'high',
        },
        {
          type: 'warning',
          message: 'Plagiarism rate is above target',
          impact: 'medium',
        },
      ],
    });
  }),

  http.get('/api/performance/recommendations', () => {
    return HttpResponse.json({
      recommendations: [
        {
          action: 'Implement peer review system',
          impact: 'high',
          effort: 'medium',
        },
        {
          action: 'Add more interactive assignments',
          impact: 'medium',
          effort: 'low',
        },
      ],
    });
  }),
];

// Setup MSW server
const server = setupServer(...handlers);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders performance metrics correctly', async () => {
    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Dashboard')).toBeTruthy();
    });

    expect(screen.getByText('Total Submissions')).toBeTruthy();
    expect(screen.getByText('150')).toBeTruthy();
    expect(screen.getByText('Average Grade')).toBeTruthy();
    expect(screen.getByText('85.0%')).toBeTruthy();
    expect(screen.getByText('Completion Rate')).toBeTruthy();
    expect(screen.getByText('92.0%')).toBeTruthy();
    expect(screen.getByText('Plagiarism Rate')).toBeTruthy();
    expect(screen.getByText('5.0%')).toBeTruthy();
  });

  it('renders submission trends chart', async () => {
    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Submission Trends')).toBeTruthy();
    });
  });

  it('renders grade distribution chart', async () => {
    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Grade Distribution')).toBeTruthy();
    });
  });

  it('renders feedback quality', async () => {
    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Quality')).toBeTruthy();
    });
    expect(screen.getByText('88.0%')).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('/api/analytics/performance', () => {
        return HttpResponse.json(mockError, { status: 500 });
      })
    );

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch performance metrics')).toBeTruthy();
    });
  });

  it('handles network errors', async () => {
    server.use(
      http.get('/api/analytics/performance', () => {
        return HttpResponse.error();
      })
    );

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeTruthy();
    });
  });

  it('handles empty states', async () => {
    server.use(
      http.get('/api/analytics/performance', () => {
        return HttpResponse.json(null, { status: 404 });
      })
    );

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch performance metrics')).toBeTruthy();
    });
  });
});
