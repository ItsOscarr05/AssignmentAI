import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockHooks, mockMuiComponents, render } from '../test/test-utils';
import { AssignmentForm } from './AssignmentForm';

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

describe('AssignmentForm', () => {
  const renderAssignmentForm = (props = {}) => {
    return render(<AssignmentForm {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    renderAssignmentForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const onSubmit = vi.fn();
    renderAssignmentForm({ onSubmit });

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const gradeLevelInput = screen.getByLabelText(/grade level/i);

    fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(dueDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(subjectInput, { target: { value: 'Mathematics' } });
    fireEvent.change(gradeLevelInput, { target: { value: '10' } });

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: '2024-03-01',
        subject: 'Mathematics',
        gradeLevel: '10',
      });
    });
  });

  it('validates required fields', async () => {
    const onSubmit = vi.fn();
    renderAssignmentForm({ onSubmit });

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/grade level is required/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates due date is in the future', async () => {
    const onSubmit = vi.fn();
    renderAssignmentForm({ onSubmit });

    const dueDateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dueDateInput, { target: { value: '2020-01-01' } });

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('handles file upload', async () => {
    const onFileUpload = vi.fn();
    renderAssignmentForm({ onFileUpload });

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload file/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFileUpload).toHaveBeenCalledWith(file);
    });
  });

  it('validates file type', async () => {
    const onFileUpload = vi.fn();
    renderAssignmentForm({ onFileUpload });

    const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const input = screen.getByLabelText(/upload file/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });
    expect(onFileUpload).not.toHaveBeenCalled();
  });

  it('handles loading state', () => {
    renderAssignmentForm({ loading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/submit/i)).toBeDisabled();
  });

  it('handles error state', () => {
    renderAssignmentForm({ error: 'Failed to submit assignment' });

    expect(screen.getByText('Failed to submit assignment')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderAssignmentForm();

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute('aria-required', 'true');
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveAttribute('aria-required', 'true');
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('announces form errors to screen readers', async () => {
      renderAssignmentForm();

      const submitButton = screen.getByText(/submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/title is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('has proper keyboard navigation', () => {
      renderAssignmentForm();

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('tabindex', '0');
      });
    });
  });
});
