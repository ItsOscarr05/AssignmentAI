import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentForm } from '../AssignmentForm';
import { setupTest } from './testUtils';

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true,
  }),
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Delete: () => <span data-testid="delete-icon">Delete</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
}));

// Mock the date picker components
vi.mock('@mui/x-date-pickers', () => ({
  AdapterDateFns: class {
    format = vi.fn();
    parse = vi.fn();
    isValid = vi.fn();
  },
  DatePicker: ({ label, value, onChange, slotProps }: any) => (
    <div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        {...slotProps?.textField}
        aria-label={label}
      />
    </div>
  ),
  LocalizationProvider: ({ children }: any) => <>{children}</>,
}));

// Mock the API client
vi.mock('../../../services/api', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AssignmentForm', () => {
  const { renderWithRouter } = setupTest();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return renderWithRouter(<AssignmentForm onSubmit={vi.fn()} {...props} />);
  };

  it('renders the form with all required fields', () => {
    renderComponent();

    // Check for required form fields
    const textFields = screen.getAllByTestId('text-field');
    expect(textFields[0].getAttribute('label')).toBe('Title');
    expect(textFields[1].getAttribute('label')).toBe('Description');
    expect(screen.getByLabelText('Due Date')).toBeTruthy();
    const selects = screen.getAllByTestId('select');
    expect(selects[0].getAttribute('label')).toBe('Subject');
    expect(selects[1].getAttribute('label')).toBe('Grade Level');
    expect(textFields[2].getAttribute('label')).toBe('Maximum Score');
  });

  it('renders form with initial values', () => {
    const initialData = {
      title: 'Test Assignment',
      description: 'Test Description',
      due_date: new Date('2024-12-29T12:00:00.000Z'),
      subject: 'Mathematics',
      grade_level: '10th Grade',
      max_score: 100,
    };

    renderComponent({ initialData });

    // Check if initial values are displayed
    const textFields = screen.getAllByTestId('text-field');
    expect((textFields[0] as HTMLInputElement).value).toBe('Test Assignment');
    expect((textFields[1] as HTMLInputElement).value).toBe('Test Description');
    expect((screen.getByLabelText('Due Date') as HTMLInputElement).value).toBe('12/29/2024');
    const selects = screen.getAllByTestId('select');
    expect((selects[0] as HTMLSelectElement).value).toBe('Mathematics');
    expect((selects[1] as HTMLSelectElement).value).toBe('10th Grade');
    expect((textFields[2] as HTMLInputElement).value).toBe('100');
  });

  it('calls onSubmit with form data when submitted', async () => {
    const onSubmit = vi.fn();
    renderComponent({ onSubmit });

    // Fill in the form
    const textFields = screen.getAllByTestId('text-field');
    fireEvent.change(textFields[0], {
      target: { value: 'New Assignment' },
    });
    fireEvent.change(textFields[1], {
      target: { value: 'New Description' },
    });
    fireEvent.change(screen.getByLabelText('Due Date'), {
      target: { value: '12/30/2024' },
    });
    const selects = screen.getAllByTestId('select');
    fireEvent.change(selects[0], {
      target: { value: 'Science' },
    });
    fireEvent.change(selects[1], {
      target: { value: '11th Grade' },
    });
    fireEvent.change(textFields[2], {
      target: { value: '100' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create assignment/i }));

    // Check if onSubmit was called with correct data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Assignment',
          description: 'New Description',
          subject: 'Science',
          grade_level: '11th Grade',
          max_score: 100,
          attachments: [],
        }),
        expect.any(Object) // The form event object
      );
    });
  });

  it('validates required fields', async () => {
    renderComponent();

    // Try to submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /create assignment/i }));

    // Check for validation messages
    await waitFor(() => {
      const errorMessages = screen.getAllByTestId('undefined-error');
      expect(errorMessages[0].textContent).toBe('Title is required');
      expect(errorMessages[1].textContent).toBe('Description is required');

      const helperTexts = screen.getAllByTestId('form-helper-text');
      expect(helperTexts[0].textContent).toBe('Subject is required');
      expect(helperTexts[1].textContent).toBe('Grade level is required');
    });
  });
});
