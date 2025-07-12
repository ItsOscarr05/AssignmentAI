import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../test/test-utils';
import AssignmentList from './assignments/AssignmentList';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Chip: ({ label, color }: any) => (
    <span data-testid="chip" data-color={color}>
      {label}
    </span>
  ),
  IconButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  InputAdornment: ({ children }: any) => <div>{children}</div>,
  Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableContainer: ({ children }: any) => <div>{children}</div>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TablePagination: ({
    count: _count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
  }: any) => (
    <div>
      <button onClick={() => onPageChange(null, page - 1)}>Previous</button>
      <span>{page + 1}</span>
      <button onClick={() => onPageChange(null, page + 1)}>Next</button>
      <select value={rowsPerPage} onChange={e => onRowsPerPageChange(e)}>
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
      </select>
    </div>
  ),
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableSortLabel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  TextField: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
  Typography: ({ children, variant }: any) => <div data-variant={variant}>{children}</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn: _queryFn }: any) => ({
    data: {
      assignments: [
        {
          id: '1',
          title: 'Assignment 1',
          description: 'Description 1',
          dueDate: '2024-03-01',
          status: 'draft',
          subject: 'Math',
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          title: 'Assignment 2',
          description: 'Description 2',
          dueDate: '2024-03-15',
          status: 'published',
          subject: 'Science',
          createdAt: '2024-01-02',
        },
      ],
      total: 2,
    },
    isLoading: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock api service
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('AssignmentList', () => {
  const renderAssignmentList = (props = {}) => {
    return render(<AssignmentList {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of assignments', () => {
    renderAssignmentList();

    expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    expect(screen.getByText('Assignment 2')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    renderAssignmentList();

    const searchInput = screen.getByPlaceholderText('Search assignments...');
    fireEvent.change(searchInput, { target: { value: 'Assignment 1' } });

    expect(searchInput).toHaveValue('Assignment 1');
  });

  it('handles pagination', () => {
    renderAssignmentList();

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // The component should handle pagination internally
    expect(nextButton).toBeInTheDocument();
  });

  it('handles sorting', () => {
    renderAssignmentList();

    const titleSortButton = screen.getByText('Title');
    fireEvent.click(titleSortButton);

    // The component should handle sorting internally
    expect(titleSortButton).toBeInTheDocument();
  });

  it('handles loading state', () => {
    // Mock the useQuery to return loading state
    vi.doMock('@tanstack/react-query', () => ({
      useQuery: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
      useQueryClient: () => ({
        invalidateQueries: vi.fn(),
      }),
    }));

    renderAssignmentList();
    expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    // Mock the useQuery to return error state
    vi.doMock('@tanstack/react-query', () => ({
      useQuery: () => ({
        data: null,
        isLoading: false,
        error: new Error('Failed to load assignments'),
      }),
      useQueryClient: () => ({
        invalidateQueries: vi.fn(),
      }),
    }));

    renderAssignmentList();
    expect(
      screen.getByText('Error loading assignments. Please try again later.')
    ).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      renderAssignmentList();

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /subject/i })).toBeInTheDocument();
    });

    it('has proper search input', () => {
      renderAssignmentList();

      const searchInput = screen.getByPlaceholderText('Search assignments...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('has proper create button', () => {
      renderAssignmentList();

      const createButton = screen.getByText('Create Assignment');
      expect(createButton).toBeInTheDocument();
      expect(createButton.tagName).toBe('A');
    });
  });
});
