import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { theme } from '../../theme';
import { AssignmentForm } from '../assignments/AssignmentForm';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock @mui/x-date-pickers
vi.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ value, onChange, label }: any) => (
    <input
      type="date"
      value={value instanceof Date ? value.toISOString().split('T')[0] : ''}
      onChange={e => onChange(new Date(e.target.value))}
      aria-label={label}
    />
  ),
  LocalizationProvider: ({ children }: any) => children,
}));

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Typography: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Paper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Dialog: ({ children, ...props }: any) => (
      <div role="dialog" {...props}>
        {children}
      </div>
    ),
    DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    DialogActions: ({ children, ...props }: any) => (
      <div role="group" {...props}>
        {children}
      </div>
    ),
    List: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    ListItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    ListItemIcon: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ListItemText: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Divider: (props: any) => <hr {...props} />,
    Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CircularProgress: (props: any) => <div role="progressbar" {...props} />,
    CssBaseline: () => null, // Add CssBaseline mock
  };
});

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  AccessTime: () => <span>AccessTime</span>,
  AttachFile: () => <span>AttachFile</span>,
  Delete: () => <span>Delete</span>,
  Description: () => <span>Description</span>,
  Download: () => <span>Download</span>,
  Edit: () => <span>Edit</span>,
  CloudUpload: () => <span>CloudUpload</span>,
  Upload: () => <span>Upload</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Error: () => <span>Error</span>,
  Warning: () => <span>Warning</span>,
  Info: () => <span>Info</span>,
  Close: () => <span>Close</span>,
  UploadIcon: () => <span>Upload</span>, // Add Upload icon with correct name
}));

const mockAssignment = {
  title: 'Test Assignment',
  description: 'Test Description',
  subject: 'Mathematics',
  grade_level: '10th Grade',
  due_date: new Date('2024-12-31'),
  max_score: 100,
  attachments: [],
};

const renderAssignmentForm = (props = {}) => {
  return render(
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AssignmentForm onSubmit={vi.fn()} initialData={mockAssignment} {...props} />
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('AssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the API mock
    (api.post as any).mockReset();
  });

  describe('Basic Rendering', () => {
    it('renders with initial values', () => {
      renderAssignmentForm();
      expect(screen.getByDisplayValue(mockAssignment.title)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockAssignment.description)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.subject)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.grade_level)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockAssignment.max_score)).toBeInTheDocument();
    });

    it('renders empty form when no initial values', () => {
      renderAssignmentForm({ initialData: undefined });
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/grade level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum score/i)).toHaveValue(100);
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const onSubmit = vi.fn();
      renderAssignmentForm({ onSubmit, initialData: undefined });

      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toBeInTheDocument();
        expect(screen.getByTestId('description-error')).toBeInTheDocument();
        expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
        expect(screen.getByText(/grade level is required/i)).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates max score', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      renderAssignmentForm({ onSubmit, initialData: undefined });
      const maxScoreInput = screen.getByLabelText(/maximum score/i);
      const submitButton = screen.getByRole('button', { name: /create assignment/i });

      // Fill in required fields first to avoid other validation errors
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const subjectSelect = screen.getByLabelText(/subject/i);
      const gradeLevelSelect = screen.getByLabelText(/grade level/i);

      await user.type(titleInput, 'Test Title');
      await user.type(descriptionInput, 'Test Description');

      await user.click(subjectSelect);
      const subjectOption = screen.getByRole('option', { name: 'Mathematics' });
      await user.click(subjectOption);

      await user.click(gradeLevelSelect);
      const gradeLevelOption = screen.getByRole('option', { name: '10th Grade' });
      await user.click(gradeLevelOption);

      // Now test max score validation
      await user.clear(maxScoreInput);
      await user.type(maxScoreInput, '-1');
      await user.click(submitButton);

      // Wait for the error message to appear
      await waitFor(() => {
        const errorMessage = screen.getByText(/maximum score must be a positive number/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Verify the form was not submitted
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      (api.post as any).mockResolvedValue({
        data: { urls: ['http://example.com/test.pdf'] },
      });
    });

    it('handles file upload', async () => {
      const onSubmit = vi.fn();
      renderAssignmentForm({ onSubmit });

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-upload');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      expect(api.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });

    it('removes uploaded file', async () => {
      const onSubmit = vi.fn();
      renderAssignmentForm({ onSubmit });

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('file-upload');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('delete-attachment-0');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderAssignmentForm({ onSubmit, initialData: undefined });

      // Fill in all required fields
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const subjectSelect = screen.getByLabelText(/subject/i);
      const gradeLevelSelect = screen.getByLabelText(/grade level/i);
      const maxScoreInput = screen.getByLabelText(/maximum score/i);

      // Fill in the form fields
      await user.clear(titleInput);
      await user.type(titleInput, mockAssignment.title);

      await user.clear(descriptionInput);
      await user.type(descriptionInput, mockAssignment.description);

      // Handle Material-UI Select components
      await user.click(subjectSelect);
      const subjectOption = screen.getByRole('option', { name: mockAssignment.subject });
      await user.click(subjectOption);

      await user.click(gradeLevelSelect);
      const gradeLevelOption = screen.getByRole('option', { name: mockAssignment.grade_level });
      await user.click(gradeLevelOption);

      await user.clear(maxScoreInput);
      await user.type(maxScoreInput, mockAssignment.max_score.toString());

      // Submit the form by clicking the submit button
      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      // Wait for the form submission to complete
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: mockAssignment.title,
            description: mockAssignment.description,
            subject: mockAssignment.subject,
            grade_level: mockAssignment.grade_level,
            max_score: mockAssignment.max_score,
            due_date: expect.any(Date),
            attachments: expect.any(Array),
          }),
          expect.any(Object) // The event object that React passes
        );
      });
    });

    it('disables submit button while submitting', () => {
      renderAssignmentForm({ isSubmitting: true });
      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
