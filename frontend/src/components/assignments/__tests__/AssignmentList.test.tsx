vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { api } from '../../../services/api';
import AssignmentList from '../AssignmentList';
import { mockAssignments, setupTest } from './testUtils';

describe('AssignmentList Component', () => {
  const { renderWithRouter } = setupTest();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockClear();
    (api.get as Mock).mockReset();
    queryClient.clear();
    // Reset the mock to return the original mockAssignments
    (api.get as Mock).mockResolvedValue({
      data: { items: mockAssignments, total: mockAssignments.length },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockClear();
    (api.get as Mock).mockReset();
    queryClient.clear();
  });

  const renderComponent = () => {
    return renderWithRouter(<AssignmentList />);
  };

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
  });

  it('renders assignments after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Mathematics Assignment')).toBeInTheDocument();
    });
    expect(screen.getByText('Physics Lab Report')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    // Initial render with all assignments
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: mockAssignments, total: mockAssignments.length },
    });

    renderComponent();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Mathematics Assignment')).toBeInTheDocument();
      expect(screen.getByText('Physics Lab Report')).toBeInTheDocument();
    });

    // Mock the search response before triggering the search
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: [mockAssignments[0]], total: 1 },
    });

    // Trigger search
    const searchInput = screen.getByPlaceholderText(/search assignments/i);
    fireEvent.change(searchInput, { target: { value: 'Mathematics' } });

    // Wait for the search results to be loaded
    await waitFor(
      () => {
        expect(screen.getByText('Mathematics Assignment')).toBeInTheDocument();
        expect(screen.queryByText('Physics Lab Report')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify the API was called with the correct search parameter
    expect(api.get).toHaveBeenCalledWith('/assignments', {
      params: expect.objectContaining({
        search: 'Mathematics',
      }),
    });
  });

  it('handles pagination', async () => {
    // Create a new array of assignments for pagination test
    const manyAssignments = Array.from({ length: 15 }, (_, i) => ({
      ...JSON.parse(JSON.stringify(mockAssignments[0])),
      id: String(i + 1),
      title: `Assignment ${i + 1}`,
    }));

    // Mock the initial page
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: manyAssignments.slice(0, 10), total: manyAssignments.length },
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Mock the next page
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: manyAssignments.slice(10), total: manyAssignments.length },
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Assignment 11')).toBeInTheDocument();
    });
  });

  it('handles sorting', async () => {
    // Create a copy of mockAssignments to avoid mutation
    const assignments = JSON.parse(JSON.stringify(mockAssignments));

    // Mock the initial data
    (api.get as Mock).mockResolvedValueOnce({
      data: { items: assignments, total: assignments.length },
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Mathematics Assignment')).toBeInTheDocument();
    });

    // Mock the sorted response
    const sortedAssignments = [...assignments].sort((a, b) => a.title.localeCompare(b.title));
    (api.get as Mock).mockResolvedValueOnce({
      data: {
        items: sortedAssignments,
        total: sortedAssignments.length,
      },
    });

    // Click the sort button for the Title column
    const sortButtons = screen.getAllByTestId('table-sort-label');
    fireEvent.click(sortButtons[0]);

    // Wait for the sorted data to be displayed
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Skip header row
      const firstDataRow = rows[1];
      expect(firstDataRow).toHaveTextContent('Mathematics Assignment');
    });
  });

  it('handles error state', async () => {
    (api.get as Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/error loading assignments/i)).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    (api.get as Mock).mockResolvedValueOnce({ data: { items: [], total: 0 } });
    renderComponent();
    await waitFor(() => {
      // Check for empty table body
      const tableBody = screen.getByTestId('table-body');
      expect(tableBody).toBeInTheDocument();
      // Optionally, check for no rows
      const rows = screen.getAllByRole('row');
      // There should only be the header row if no assignments
      expect(rows.length).toBe(1);
    });
  });

  it('handles assignment status changes', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Mathematics Assignment')).toBeInTheDocument();
    });
    // Mock the status change response
    (api.put as Mock).mockResolvedValueOnce({
      data: { ...mockAssignments[0], status: 'published' },
    });
    // Mock the next get call to return the updated status
    (api.get as Mock).mockResolvedValueOnce({
      data: {
        items: [{ ...mockAssignments[0], status: 'published' }, mockAssignments[1]],
        total: 2,
      },
    });
    // Find and click the status chip
    const assignmentRow = screen.getByText('Mathematics Assignment').closest('tr') as HTMLElement;
    expect(assignmentRow).not.toBeNull();
    const statusChip = within(assignmentRow).getByTestId('chip');
    expect(statusChip).toHaveAttribute('label', 'draft');
    fireEvent.click(statusChip);
    // Ensure the mock is applied correctly
    await waitFor(() => {
      const updatedStatusChip = within(assignmentRow).getByTestId('chip');
      expect(updatedStatusChip).toHaveAttribute('label', 'published');
    });
  });
});
