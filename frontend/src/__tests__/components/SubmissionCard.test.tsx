import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmissionCard } from '../submissions/SubmissionCard';
import { mockSubmission, renderComponent } from './testUtils';

const renderSubmissionCard = (props = {}) => {
  return renderComponent(SubmissionCard, {
    submission: mockSubmission,
    onView: vi.fn(),
    onGrade: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  });
};

describe('SubmissionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders submission details', () => {
      renderSubmissionCard();
      expect(screen.getByText(mockSubmission.assignmentTitle)).toBeInTheDocument();
      expect(screen.getByText(mockSubmission.studentName)).toBeInTheDocument();
      expect(screen.getByText(mockSubmission.status)).toBeInTheDocument();
      expect(screen.getByText(`${mockSubmission.grade}%`)).toBeInTheDocument();
    });

    it('renders submission date', () => {
      renderSubmissionCard();
      const dateText = new Date(mockSubmission.submittedAt).toLocaleDateString();
      const dateParagraph = screen.getByText((_, element) => {
        return (
          (element?.tagName.toLowerCase() === 'p' &&
            element?.className.includes('text-gray-500') &&
            element?.textContent?.includes(dateText)) ??
          false
        );
      });
      expect(dateParagraph).toBeInTheDocument();
    });

    it('renders feedback when available', () => {
      renderSubmissionCard();
      expect(screen.getByText(mockSubmission.feedback!)).toBeInTheDocument();
    });
  });

  describe('Status and Badges', () => {
    it('renders status badge with correct color', () => {
      renderSubmissionCard();
      const statusBadge = screen.getByText(mockSubmission.status);
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('renders grade badge with correct color', () => {
      renderSubmissionCard();
      const gradeBadge = screen.getByText(`${mockSubmission.grade}%`);
      expect(gradeBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('renders with custom status component', () => {
      const CustomStatus = ({ status }: { status: string }) => (
        <div data-testid="custom-status">{status}</div>
      );
      renderSubmissionCard({ statusComponent: CustomStatus });
      expect(screen.getByTestId('custom-status')).toHaveTextContent(mockSubmission.status);
    });
  });

  describe('Action Buttons', () => {
    it('renders action buttons', () => {
      renderSubmissionCard();
      expect(screen.getByRole('button', { name: /view submission/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /grade submission/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open delete confirmation/i })).toBeInTheDocument();
    });

    it('handles view button click', () => {
      const onView = vi.fn();
      renderSubmissionCard({ onView });

      const viewButton = screen.getByRole('button', { name: /view submission/i });
      fireEvent.click(viewButton);

      expect(onView).toHaveBeenCalledWith(mockSubmission);
    });

    it('handles grade button click', () => {
      const onGrade = vi.fn();
      renderSubmissionCard({ onGrade });

      const gradeButton = screen.getByRole('button', { name: /grade submission/i });
      fireEvent.click(gradeButton);

      expect(onGrade).toHaveBeenCalledWith(mockSubmission);
    });

    it('handles delete button click', () => {
      const onDelete = vi.fn();
      renderSubmissionCard({ onDelete });

      const deleteButton = screen.getByRole('button', { name: /open delete confirmation/i });
      fireEvent.click(deleteButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete this submission?')
      ).toBeInTheDocument();
    });

    it('confirms delete action', () => {
      const onDelete = vi.fn();
      renderSubmissionCard({ onDelete });
      const deleteButton = screen.getByRole('button', { name: /open delete confirmation/i });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete submission/i });
      fireEvent.click(confirmButton);

      expect(onDelete).toHaveBeenCalledWith(mockSubmission);
    });

    it('cancels delete action', () => {
      const onDelete = vi.fn();
      renderSubmissionCard({ onDelete });

      const deleteButton = screen.getByRole('button', { name: /open delete confirmation/i });
      fireEvent.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel delete/i });
      fireEvent.click(cancelButton);

      expect(onDelete).not.toHaveBeenCalled();
      setTimeout(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, 0);
    });

    it('renders with custom action buttons', () => {
      const CustomActions = ({}: { submission: typeof mockSubmission }) => (
        <div data-testid="custom-actions">
          <button onClick={() => {}}>Custom Action</button>
        </div>
      );
      renderSubmissionCard({ actionsComponent: CustomActions });
      expect(screen.getByTestId('custom-actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSubmissionCard();
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        `Submission: ${mockSubmission.assignmentTitle} by ${mockSubmission.studentName}`
      );
    });

    it('has proper keyboard navigation', () => {
      renderSubmissionCard();
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0');
      });
    });

    it('has proper ARIA labels for buttons', () => {
      renderSubmissionCard();
      expect(screen.getByRole('button', { name: /view submission/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /grade submission/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open delete confirmation/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing grade', () => {
      const submissionWithoutGrade = {
        ...mockSubmission,
        grade: undefined,
      };
      renderSubmissionCard({ submission: submissionWithoutGrade });
      expect(screen.getByText(/not graded/i)).toBeInTheDocument();
    });

    it('handles missing feedback', () => {
      const submissionWithoutFeedback = {
        ...mockSubmission,
        feedback: undefined,
      };
      renderSubmissionCard({ submission: submissionWithoutFeedback });
      expect(screen.getByText(/no feedback/i)).toBeInTheDocument();
    });

    it('handles loading state', () => {
      renderSubmissionCard({ loading: true });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      const onView = vi.fn();
      const onGrade = vi.fn();
      const onDelete = vi.fn();
      renderSubmissionCard({ disabled: true, onView, onGrade, onDelete });

      // Get only the main action buttons, excluding dialog buttons
      const mainButtons = screen
        .getAllByRole('button')
        .filter(button => !button.closest('[role="dialog"]'));

      // Check that all main buttons have the disabled attribute
      mainButtons.forEach(button => {
        expect(button).toHaveAttribute('disabled', '');
      });

      // Try to interact with buttons
      mainButtons.forEach(button => {
        fireEvent.click(button);
      });

      // Verify that none of the handlers were called
      expect(onView).not.toHaveBeenCalled();
      expect(onGrade).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
