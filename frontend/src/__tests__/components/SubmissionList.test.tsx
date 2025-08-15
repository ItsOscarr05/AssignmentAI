import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../services/api';
import { Submission } from '../../types';
import { SubmissionList } from '../submissions/SubmissionList';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock the router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockSubmissions: Submission[] = [
  {
    id: '1',
    assignmentId: '1',
    studentId: '1',
    content: 'Test Assignment 1 submission',
    submittedAt: '2023-12-31T00:00:00.000Z',
    status: 'submitted' as const,
  },
  {
    id: '2',
    assignmentId: '2',
    studentId: '2',
    content: 'Test Assignment 2 submission',
    submittedAt: '2024-01-01T00:00:00.000Z',
    status: 'graded' as const,
  },
];

const renderSubmissionList = (props = {}) => {
  const mockOnView = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  return render(
    <SubmissionList
      submissions={mockSubmissions}
      onView={mockOnView}
      onEdit={mockOnEdit}
      onDelete={mockOnDelete}
      {...props}
    />
  );
};

describe('SubmissionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders loading state initially', () => {
      renderSubmissionList({ loading: true });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders submissions after loading', async () => {
      (api.get as any).mockResolvedValue({ data: mockSubmissions });
      renderSubmissionList();

      await waitFor(() => {
        expect(screen.getByText(/Content: Test Assignment 1 submission/)).toBeInTheDocument();
        expect(screen.getByText(/Content: Test Assignment 2 submission/)).toBeInTheDocument();
        expect(screen.getByText(/Status: submitted/)).toBeInTheDocument();
        expect(screen.getByText(/Status: graded/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('filters submissions by status', async () => {
      renderSubmissionList({
        submissions: mockSubmissions,
      });

      // Find the select element by its data-testid
      const statusFilter = screen.getByTestId('select');

      // Trigger change event directly with the new value
      fireEvent.change(statusFilter, { target: { value: 'submitted' } });

      // Verify filtered results
      expect(screen.getByText(/Content: Test Assignment 1 submission/)).toBeInTheDocument();
      expect(screen.queryByText(/Content: Test Assignment 2 submission/)).not.toBeInTheDocument();
    });

    it('filters submissions by search term', async () => {
      (api.get as any).mockResolvedValue({ data: mockSubmissions });
      renderSubmissionList();

      await waitFor(() => {
        expect(screen.getByText(/Content: Test Assignment 1 submission/)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search submissions/i);
      fireEvent.change(searchInput, { target: { value: 'Assignment 1' } });

      expect(screen.getByText(/Content: Test Assignment 1 submission/)).toBeInTheDocument();
      expect(screen.queryByText(/Content: Test Assignment 2 submission/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders error message when API call fails', () => {
      const errorMessage = 'Failed to fetch submissions';
      renderSubmissionList({ error: errorMessage });
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes in loading state', () => {
      renderSubmissionList({ loading: true });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has proper ARIA attributes in loaded state', () => {
      renderSubmissionList({
        submissions: mockSubmissions,
        onFilterChange: vi.fn(),
      });

      // Check for proper ARIA attributes on form controls
      const searchInput = screen.getByTestId('text-field');
      expect(searchInput).toHaveAttribute('placeholder', 'Search submissions...');

      const statusFilter = screen.getByTestId('select');
      expect(statusFilter).toHaveAttribute('labelid', 'status-filter-label');
      expect(screen.getByTestId('input-label')).toHaveAttribute('id', 'status-filter-label');

      // Check for proper ARIA attributes on the list
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Submissions');
    });
  });
});
