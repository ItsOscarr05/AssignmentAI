import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analytics, assignments } from '../../../services/api';
import { Dashboard } from '../Dashboard';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    keyframes: (strings: TemplateStringsArray, ...values: any[]) => {
      return `@keyframes ${strings.join('')}`;
    },
  };
});

// Mock @mui/icons-material
vi.mock('@mui/icons-material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    Add: () => <span data-testid="add-icon" />,
    Refresh: () => <span data-testid="refresh-icon" />,
    Assignment: () => <span data-testid="assignment-icon" />,
    AutoAwesome: () => <span data-testid="auto-awesome-icon" />,
    Assessment: () => <span data-testid="assessment-icon" />,
    TrendingUp: () => <span data-testid="trending-up-icon" />,
    CalendarToday: () => <span data-testid="calendar-icon" />,
    ChevronRight: () => <span data-testid="chevron-right-icon" />,
  };
});

// Mock the API services
vi.mock('../../../services/api', () => ({
  assignments: {
    getAll: vi.fn(),
  },
  analytics: {
    getPerformanceMetrics: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dashboard data after loading', async () => {
    // Mock the API responses
    vi.mocked(assignments.getAll).mockResolvedValueOnce([
      {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        status: 'published',
        type: 'essay',
        gradeLevel: '10th',
        priority: 'high',
        subject: 'Math',
        courseId: 'course-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        allowLateSubmissions: true,
        lateSubmissionPenalty: 10,
      },
    ]);
    vi.mocked(analytics.getPerformanceMetrics).mockResolvedValueOnce({
      overallScore: 85,
      completionRate: 90,
      subjectPerformance: [
        {
          subject: 'Math',
          score: 85,
          trend: 5,
        },
      ],
      weeklyProgress: [
        {
          week: '2024-W01',
          progress: 90,
        },
      ],
    });

    render(<Dashboard />);

    // Wait for loading to complete
    await waitFor(() => {
      const performanceElement = screen.getByRole('region', { name: 'Performance summary' });
      expect(performanceElement).toHaveTextContent('85');

      const assignmentsElement = screen.getByRole('region', { name: 'Recent assignments' });
      expect(assignmentsElement).toHaveTextContent('Test Assignment');
    });
  });

  it('displays error message when API call fails', async () => {
    // Mock the API error
    vi.mocked(assignments.getAll).mockRejectedValueOnce(
      new Error('Failed to fetch dashboard data')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    // Mock the API responses
    vi.mocked(assignments.getAll)
      .mockResolvedValueOnce([
        {
          id: '1',
          title: 'Test Assignment',
          description: 'Test Description',
          status: 'published',
          type: 'essay',
          gradeLevel: '10th',
          priority: 'high',
          subject: 'Math',
          courseId: 'course-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          allowLateSubmissions: true,
          lateSubmissionPenalty: 10,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: '2',
          title: 'Updated Assignment',
          description: 'Updated Description',
          status: 'published',
          type: 'essay',
          gradeLevel: '10th',
          priority: 'high',
          subject: 'Math',
          courseId: 'course-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          allowLateSubmissions: true,
          lateSubmissionPenalty: 10,
        },
      ]);
    vi.mocked(analytics.getPerformanceMetrics)
      .mockResolvedValueOnce({
        overallScore: 85,
        completionRate: 90,
        subjectPerformance: [
          {
            subject: 'Math',
            score: 85,
            trend: 5,
          },
        ],
        weeklyProgress: [
          {
            week: '2024-W01',
            progress: 90,
          },
        ],
      })
      .mockResolvedValueOnce({
        overallScore: 90,
        completionRate: 95,
        subjectPerformance: [
          {
            subject: 'Math',
            score: 90,
            trend: 10,
          },
        ],
        weeklyProgress: [
          {
            week: '2024-W02',
            progress: 95,
          },
        ],
      });

    render(<Dashboard />);

    // Wait for initial data to load
    await waitFor(() => {
      const performanceElement = screen.getByRole('region', { name: 'Performance summary' });
      expect(performanceElement).toHaveTextContent('85');
    });

    // Click refresh button
    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    // Wait for updated data
    await waitFor(() => {
      const performanceElement = screen.getByRole('region', { name: 'Performance summary' });
      expect(performanceElement).toHaveTextContent('90');

      const assignmentsElement = screen.getByRole('region', { name: 'Recent assignments' });
      expect(assignmentsElement).toHaveTextContent('Updated Assignment');
    });
  });

  it('handles navigation to assignment details', async () => {
    // Mock the API responses
    vi.mocked(assignments.getAll).mockResolvedValueOnce([
      {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        status: 'published',
        type: 'essay',
        gradeLevel: '10th',
        priority: 'high',
        subject: 'Math',
        courseId: 'course-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        allowLateSubmissions: true,
        lateSubmissionPenalty: 10,
      },
    ]);
    vi.mocked(analytics.getPerformanceMetrics).mockResolvedValueOnce({
      overallScore: 85,
      completionRate: 90,
      subjectPerformance: [
        {
          subject: 'Math',
          score: 85,
          trend: 5,
        },
      ],
      weeklyProgress: [
        {
          week: '2024-W01',
          progress: 90,
        },
      ],
    });

    render(<Dashboard />);

    // Wait for assignments to load
    await waitFor(() => {
      const assignmentsElement = screen.getByRole('region', { name: 'Recent assignments' });
      expect(assignmentsElement).toHaveTextContent('Test Assignment');
    });

    // Click the view details button for the assignment
    const viewDetailsButton = screen.getByRole('button', {
      name: /view details for test assignment/i,
    });
    fireEvent.click(viewDetailsButton);

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/assignments/1');
  });

  it('displays empty states correctly', async () => {
    // Mock empty API responses
    vi.mocked(assignments.getAll).mockResolvedValueOnce([]);
    vi.mocked(analytics.getPerformanceMetrics).mockResolvedValueOnce({
      overallScore: 0,
      completionRate: 0,
      subjectPerformance: [],
      weeklyProgress: [],
    });

    render(<Dashboard />);

    // Wait for empty states to be displayed
    await waitFor(() => {
      const performanceElement = screen.getByRole('region', { name: 'Performance summary' });
      expect(performanceElement).toHaveTextContent('0');
      expect(screen.getByText('Recent Assignments')).toBeInTheDocument();
    });
  });
});
