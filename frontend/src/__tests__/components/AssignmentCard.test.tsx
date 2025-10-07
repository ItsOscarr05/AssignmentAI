import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AssignmentCard from '../../components/assignments/AssignmentCard';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Assignment } from '../../types';

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
    expect(screen.getByText('Test Assignment')).toBeTruthy();
    expect(screen.getByText('Math')).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('label')).toBe('published');
    const chips = screen.getAllByTestId('chip');
    expect(chips[1].getAttribute('label')).toBe('medium');
    expect(screen.getByText(/Due: 5\/29\/2025/)).toBeTruthy();
    expect(screen.getByText('5 submissions')).toBeTruthy();
  });

  it('renders with custom progress component', () => {
    const CustomProgress = ({ progress }: { progress: number }) => (
      <div data-testid="custom-progress">{progress}%</div>
    );
    renderAssignmentCard({ progressComponent: CustomProgress });
    expect(screen.getByTestId('custom-progress').textContent).toBe('0%');
  });

  describe('Action Buttons', () => {
    it('renders delete button', () => {
      renderAssignmentCard();
      expect(screen.getByLabelText('Delete assignment')).toBeTruthy();
    });

    it('shows delete confirmation dialog', () => {
      renderAssignmentCard();
      const deleteButton = screen.getByLabelText('Delete assignment');
      fireEvent.click(deleteButton);
      expect(screen.getByText('Delete Assignment')).toBeTruthy();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeTruthy();
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
      expect(card.getAttribute('aria-label')).toBe(`Assignment: ${mockAssignment.title}`);
    });

    it('announces status changes', () => {
      renderAssignmentCard();
      const statusBadge = screen.getByRole('status');
      expect(statusBadge.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles long description', () => {
      const longDescription = 'A'.repeat(1000);
      renderAssignmentCard({
        assignment: { ...mockAssignment, description: longDescription },
      });
      expect(screen.getByText(longDescription)).toBeTruthy();
    });

    it('handles zero submissions', () => {
      renderAssignmentCard({
        assignment: { ...mockAssignment, submissions: 0 },
      });
      expect(screen.getByText('0 submissions')).toBeTruthy();
    });
  });
});
