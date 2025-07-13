import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { theme } from '../../../theme';
import FeedbackList from '../FeedbackList';

// Mock the API module
vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockFeedback = [
  {
    id: '1',
    submission_id: '1',
    assignment_title: 'Assignment 1',
    student_name: 'John Doe',
    grade: 85,
    status: 'completed',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T11:00:00Z',
    comments: 'Good work overall',
  },
  {
    id: '2',
    submission_id: '2',
    assignment_title: 'Assignment 2',
    student_name: 'Jane Smith',
    grade: 92,
    status: 'in_progress',
    created_at: '2024-03-14T15:30:00Z',
    updated_at: '2024-03-14T16:30:00Z',
    comments: 'Excellent submission',
  },
];

const renderFeedbackList = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <FeedbackList />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('FeedbackList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as any).mockImplementationOnce(() => new Promise(() => {}));
    renderFeedbackList();
    expect(screen.getByText(/loading feedback/i)).toBeInTheDocument();
  });

  it('renders feedback items successfully', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 2 },
    });
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Assignment 2')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Failed to fetch'));
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText(/error loading feedback/i)).toBeInTheDocument();
    });
  });

  it('allows sorting by different columns', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 2 },
    });
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Click on the "Grade" column header
    fireEvent.click(screen.getByText('Grade'));

    expect(api.get).toHaveBeenCalledWith('/feedback', {
      params: expect.objectContaining({
        sort_by: 'grade',
        sort_order: 'asc',
      }),
    });
  });

  it('handles pagination', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 20 },
    });
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Go to next page
    const nextPageButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextPageButton);

    expect(api.get).toHaveBeenCalledWith('/feedback', {
      params: expect.objectContaining({
        page: 2,
      }),
    });
  });

  it('allows changing rows per page', async () => {
    // Mock initial API response
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 20 },
    });

    // Mock the API response after changing rows per page
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 20 },
    });

    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Change rows per page to 25
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '25' } });

    // Wait for the API call with the new limit
    await waitFor(() => {
      // Get the last API call
      const lastCall = (api.get as any).mock.calls[(api.get as any).mock.calls.length - 1];
      expect(lastCall[0]).toBe('/feedback');
      expect(lastCall[1].params.limit).toBe(25);
    });
  });

  it('allows searching feedback', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 2 },
    });
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search feedback/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/feedback', {
        params: expect.objectContaining({
          search: 'John',
        }),
      });
    });
  });

  it('displays feedback status correctly', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 2 },
    });
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });
  });

  it('displays feedback comments correctly', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 2 },
    });
    renderFeedbackList();

    await waitFor(() => {
      expect(screen.getByText('Good work overall')).toBeInTheDocument();
      expect(screen.getByText('Excellent submission')).toBeInTheDocument();
    });
  });

  it('displays timestamps correctly', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { feedback: mockFeedback, total: 2 },
    });
    renderFeedbackList();

    await waitFor(() => {
      // Format dates to match the component's format (MMM d, yyyy)
      const date1 = format(new Date(mockFeedback[0].created_at), 'MMM d, yyyy');
      const date2 = format(new Date(mockFeedback[1].created_at), 'MMM d, yyyy');
      expect(screen.getByText(date1)).toBeInTheDocument();
      expect(screen.getByText(date2)).toBeInTheDocument();
    });
  });
});
