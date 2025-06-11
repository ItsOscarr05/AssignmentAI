import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockHooks, mockMuiComponents, render } from '../test/test-utils';
import { AssignmentList } from './AssignmentList';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  ...vi.importActual('@mui/material'),
  ...mockMuiComponents,
}));

// Mock hooks
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  ...mockHooks,
}));

describe('AssignmentList', () => {
  const mockAssignments = [
    {
      id: '1',
      title: 'Assignment 1',
      description: 'Description 1',
      dueDate: '2024-03-01',
      status: 'pending',
    },
    {
      id: '2',
      title: 'Assignment 2',
      description: 'Description 2',
      dueDate: '2024-03-15',
      status: 'submitted',
    },
  ];

  const renderAssignmentList = (props = {}) => {
    return render(<AssignmentList assignments={mockAssignments} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of assignments', () => {
    renderAssignmentList();

    expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    expect(screen.getByText('Assignment 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('handles assignment selection', async () => {
    const onSelect = vi.fn();
    renderAssignmentList({ onSelect });

    const assignment = screen.getByText('Assignment 1');
    fireEvent.click(assignment);

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockAssignments[0]);
    });
  });

  it('handles assignment submission', async () => {
    const onSubmit = vi.fn();
    renderAssignmentList({ onSubmit });

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('handles assignment deletion', async () => {
    const onDelete = vi.fn();
    renderAssignmentList({ onDelete });

    const deleteButton = screen.getByText(/delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
    });
  });

  it('filters assignments by status', async () => {
    renderAssignmentList();

    const filterSelect = screen.getByLabelText(/filter by status/i);
    fireEvent.change(filterSelect, { target: { value: 'submitted' } });

    await waitFor(() => {
      expect(screen.getByText('Assignment 2')).toBeInTheDocument();
      expect(screen.queryByText('Assignment 1')).not.toBeInTheDocument();
    });
  });

  it('sorts assignments by due date', async () => {
    renderAssignmentList();

    const sortButton = screen.getByText(/sort by due date/i);
    fireEvent.click(sortButton);

    const assignments = screen.getAllByTestId('assignment-item');
    expect(assignments[0]).toHaveTextContent('Assignment 1');
    expect(assignments[1]).toHaveTextContent('Assignment 2');
  });

  it('handles empty state', () => {
    renderAssignmentList({ assignments: [] });

    expect(screen.getByText(/no assignments found/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    renderAssignmentList({ loading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', () => {
    renderAssignmentList({ error: 'Failed to load assignments' });

    expect(screen.getByText('Failed to load assignments')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderAssignmentList();

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Assignments');

      const items = screen.getAllByRole('listitem');
      items.forEach((item, index) => {
        expect(item).toHaveAttribute('aria-label', `Assignment ${index + 1}`);
      });
    });

    it('announces status changes to screen readers', async () => {
      renderAssignmentList();

      const filterSelect = screen.getByLabelText(/filter by status/i);
      fireEvent.change(filterSelect, { target: { value: 'submitted' } });

      await waitFor(() => {
        const announcement = screen.getByText(/showing submitted assignments/i);
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('has proper keyboard navigation', () => {
      renderAssignmentList();

      const items = screen.getAllByRole('listitem');
      items.forEach(item => {
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });
  });
});
