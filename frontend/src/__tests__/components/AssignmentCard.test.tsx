import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Assignment } from '../../types';
import AssignmentCard from '../assignments/AssignmentCard';

const mockAssignment: Assignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  subject: 'Math',
  type: 'essay',
  status: 'published',
  priority: 'medium',
  dueDate: '2025-05-30',
  gradeLevel: '10',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  submissions: 5,
  progress: 0,
  courseId: 'course-1',
  allowLateSubmissions: true,
  lateSubmissionPenalty: 10,
};

const renderAssignmentCard = (props = {}) => {
  return render(
    <ThemeProvider>
      <AssignmentCard assignment={mockAssignment} onDelete={vi.fn()} {...props} />
    </ThemeProvider>
  );
};

describe('AssignmentCard', () => {
  it('renders assignment details', () => {
    renderAssignmentCard();
    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('label', 'published');
    const chips = screen.getAllByTestId('chip');
    expect(chips[1]).toHaveAttribute('label', 'medium');
    expect(screen.getByText(/Due: 5\/29\/2025/)).toBeInTheDocument();
    expect(screen.getByText('5 submissions')).toBeInTheDocument();
  });

  it('renders with custom progress component', () => {
    const CustomProgress = ({ progress }: { progress: number }) => (
      <div data-testid="custom-progress">{progress}%</div>
    );
    renderAssignmentCard({ progressComponent: CustomProgress });
    expect(screen.getByTestId('custom-progress')).toHaveTextContent('0%');
  });

  describe('Action Buttons', () => {
    it('renders delete button', () => {
      renderAssignmentCard();
      expect(screen.getByLabelText('Delete assignment')).toBeInTheDocument();
    });

    it('shows delete confirmation dialog', () => {
      renderAssignmentCard();
      const deleteButton = screen.getByLabelText('Delete assignment');
      fireEvent.click(deleteButton);
      expect(screen.getByText('Delete Assignment')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('handles delete confirmation', () => {
      const onDelete = vi.fn();
      renderAssignmentCard({ onDelete });
      const deleteButton = screen.getByLabelText('Delete assignment');
      fireEvent.click(deleteButton);
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderAssignmentCard();
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', `Assignment: ${mockAssignment.title}`);
    });

    it('announces status changes', () => {
      renderAssignmentCard();
      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles long description', () => {
      const longDescription = 'A'.repeat(1000);
      renderAssignmentCard({
        assignment: { ...mockAssignment, description: longDescription },
      });
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles zero submissions', () => {
      renderAssignmentCard({
        assignment: { ...mockAssignment, submissions: 0 },
      });
      expect(screen.getByText('0 submissions')).toBeInTheDocument();
    });
  });
});
