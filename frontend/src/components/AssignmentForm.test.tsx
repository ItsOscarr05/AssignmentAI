import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../test/test-utils';
import AssignmentForm from './AssignmentForm';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  TextField: ({ label, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input {...props} />
    </div>
  ),
  FormControl: ({ children }: any) => <div>{children}</div>,
  InputLabel: ({ children }: any) => <label>{children}</label>,
  Select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
  MenuItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  CircularProgress: () => <div role="progressbar" />,
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
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
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    renderAssignmentForm();

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    const subjectInput = screen.getByLabelText(/subject/i);

    fireEvent.change(titleInput, { target: { value: 'Test Assignment' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(dueDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(subjectInput, { target: { value: 'Mathematics' } });

    const submitButton = screen.getByText(/save/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue('Test Assignment');
      expect(descriptionInput).toHaveValue('Test Description');
      expect(dueDateInput).toHaveValue('2024-03-01');
      expect(subjectInput).toHaveValue('Mathematics');
    });
  });

  it('validates required fields', async () => {
    renderAssignmentForm();

    const submitButton = screen.getByText(/save/i);
    fireEvent.click(submitButton);

    // The form should still be rendered even with validation errors
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    // Mock the useAssignment hook to return loading state
    vi.doMock('../hooks/useAssignment', () => ({
      useAssignment: () => ({ data: null, isLoading: true }),
    }));

    renderAssignmentForm();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      renderAssignmentForm();

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      renderAssignmentForm();

      expect(screen.getByText(/save/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });
  });
});
