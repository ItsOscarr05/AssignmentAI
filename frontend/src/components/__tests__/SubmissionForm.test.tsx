import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { SubmissionForm } from '../submission/SubmissionForm';

const mockAssignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  dueDate: '2024-12-31',
  requirements: ['Requirement 1', 'Requirement 2'],
};

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

const renderSubmissionForm = (props = {}) => {
  return render(
    <ThemeProvider>
      <SubmissionForm
        assignment={mockAssignment}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('SubmissionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders assignment details', () => {
      renderSubmissionForm();
      expect(screen.getByText(mockAssignment.title)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.description)).toBeInTheDocument();
      expect(screen.getByText(/due date/i)).toBeInTheDocument();
      expect(screen.getByText(/2024-12-31/)).toBeInTheDocument();
    });

    it('renders requirements', () => {
      renderSubmissionForm();
      mockAssignment.requirements.forEach(req => {
        expect(screen.getByText(req)).toBeInTheDocument();
      });
    });

    it('renders file upload section', () => {
      renderSubmissionForm();
      expect(screen.getByLabelText(/upload files/i)).toBeInTheDocument();
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });

    it('renders with custom button text', () => {
      renderSubmissionForm({
        submitText: 'Turn In',
        cancelText: 'Back',
      });
      expect(screen.getByText('Turn In')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('handles single file upload', async () => {
      renderSubmissionForm();
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const input = screen.getByLabelText(/upload files/i);

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    it('handles multiple file upload', async () => {
      renderSubmissionForm();
      const files = [
        new File(['test1'], 'test1.txt', { type: 'text/plain' }),
        new File(['test2'], 'test2.txt', { type: 'text/plain' }),
      ];
      const input = screen.getByLabelText(/upload files/i);

      fireEvent.change(input, { target: { files } });

      expect(screen.getByText('test1.txt')).toBeInTheDocument();
      expect(screen.getByText('test2.txt')).toBeInTheDocument();
    });

    it('validates file type', async () => {
      renderSubmissionForm();
      const file = new File(['test'], 'test.exe', {
        type: 'application/x-msdownload',
      });
      const input = screen.getByLabelText(/upload files/i);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('validates file size', async () => {
      renderSubmissionForm();
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      });
      const input = screen.getByLabelText(/upload files/i);

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
    });

    it('allows file removal', () => {
      renderSubmissionForm();
      const input = screen.getByLabelText(/upload files/i);
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(input, { target: { files: [file] } });
      const removeButton = screen.getByLabelText(/remove test\.txt/i);
      fireEvent.click(removeButton);

      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('handles successful submission', async () => {
      const onSubmit = vi.fn();
      renderSubmissionForm({ onSubmit });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload files/i);
      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          assignmentId: mockAssignment.id,
          files: [file],
        });
      });
    });

    it('validates required files', async () => {
      renderSubmissionForm();
      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one file is required/i)).toBeInTheDocument();
      });
    });

    it('handles submission error', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      renderSubmissionForm({ onSubmit });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload files/i);
      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Cancel', () => {
    it('handles cancel button click', () => {
      const onCancel = vi.fn();
      renderSubmissionForm({ onCancel });

      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('shows confirmation dialog when files are selected', () => {
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockImplementation(() => true);

      renderSubmissionForm();
      const input = screen.getByLabelText(/upload files/i);
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(input, { target: { files: [file] } });
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to discard your changes?');
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSubmissionForm();
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Submit Assignment');
      expect(screen.getByLabelText(/upload files/i)).toHaveAttribute('aria-required', 'true');
    });

    it('has proper keyboard navigation', () => {
      renderSubmissionForm();
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0');
      });
    });

    it('announces validation errors', async () => {
      renderSubmissionForm();
      const submitButton = screen.getByText(/submit/i);

      fireEvent.click(submitButton);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const errorAlert = alerts.find(alert =>
          alert.textContent?.toLowerCase().includes('at least one file is required')
        );
        expect(errorAlert).toBeInTheDocument();
      });
    });

    it('announces file upload status', async () => {
      renderSubmissionForm();
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload files/i);

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByRole('status')).toHaveTextContent(/file uploaded/i);
    });
  });

  describe('Edge Cases', () => {
    it('handles loading state', () => {
      renderSubmissionForm({ loading: true });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/submit/i)).toBeDisabled();
    });

    it('handles disabled state', () => {
      renderSubmissionForm({ disabled: true });
      expect(screen.getByLabelText(/upload files/i)).toBeDisabled();
      expect(screen.getByText(/submit/i)).toBeDisabled();
    });

    it('handles past due date', () => {
      const pastDueAssignment = {
        ...mockAssignment,
        dueDate: '2023-01-01',
      };
      renderSubmissionForm({ assignment: pastDueAssignment });
      expect(screen.getByText(/assignment is past due/i)).toBeInTheDocument();
    });

    it('handles file drag and drop', () => {
      renderSubmissionForm();
      const dropzone = screen.getByLabelText(/submit assignment/i);
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.dragEnter(dropzone);
      expect(dropzone).toHaveClass('drag-active');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(dropzone).not.toHaveClass('drag-active');
    });
  });
});
