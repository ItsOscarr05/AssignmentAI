import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { theme } from '../../../theme';
import { SubmissionForm } from '../SubmissionForm';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Delete: () => <span data-testid="delete-icon">Delete</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
}));

// Mock the API client
vi.mock('../../../services/api', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  },
}));

describe('SubmissionForm', () => {
  const mockAssignment = {
    id: '1',
    title: 'Test Assignment',
    description: 'Test Description\nRequirements:\n- Requirement 1\n- Requirement 2',
    type: 'homework' as const,
    status: 'published' as const,
    dueDate: '2024-03-15T00:00:00Z',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    subject: 'Computer Science',
    gradeLevel: 'Undergraduate',
    priority: 'medium' as const,
    progress: 0,
    allowLateSubmissions: true,
    lateSubmissionPenalty: 10,
    courseId: 'course-1',
  };

  const mockSubmission = {
    id: '1',
    assignmentId: '1',
    studentId: 'user1',
    content: 'Test submission content',
    comments: 'Test comments',
    attachments: [
      {
        id: '1',
        name: 'submission.pdf',
        url: 'https://example.com/submission1.pdf',
        type: 'application/pdf',
        size: 1024,
      },
    ],
    submittedAt: '2024-03-10T00:00:00Z',
    status: 'submitted',
    submissionCount: 1,
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <SubmissionForm
          assignment={mockAssignment}
          submission={mockSubmission}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          {...props}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for assignments endpoint
    vi.mocked(api.get).mockResolvedValue({
      data: [mockAssignment],
    });
  });

  it('renders the form with all required fields', () => {
    renderComponent();

    const textFields = screen.getAllByTestId('text-field');
    expect(textFields).toHaveLength(2); // Title and Description
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('displays existing submission data when editing', async () => {
    renderComponent();

    const textFields = screen.getAllByTestId('text-field');
    expect(textFields[0]).toHaveValue(mockSubmission.content);
    expect(textFields[1]).toHaveValue(mockSubmission.comments);

    // Wait for assignments to be loaded and check the selected value
    await waitFor(() => {
      expect(screen.getByTestId('select')).toHaveTextContent(mockAssignment.title);
    });
  });

  it('handles successful submission creation', async () => {
    renderComponent({ submission: null });

    // Fill in required fields
    const textFields = screen.getAllByTestId('text-field');
    fireEvent.change(textFields[0], {
      target: { value: 'New submission content' },
    });
    fireEvent.change(textFields[1], {
      target: { value: 'New comments' },
    });

    // Create a mock file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        assignmentId: mockAssignment.id,
        files: [file],
      });
    });
  });

  it('handles successful submission update', async () => {
    renderComponent();

    // Update fields
    const textFields = screen.getAllByTestId('text-field');
    fireEvent.change(textFields[0], {
      target: { value: 'Updated submission content' },
    });
    fireEvent.change(textFields[1], {
      target: { value: 'Updated comments' },
    });

    // Create a mock file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        assignmentId: mockAssignment.id,
        files: [file],
      });
    });
  });

  it('validates required fields', async () => {
    console.log('Starting validates required fields test');
    const { container } = renderComponent({ submission: null });
    console.log('Component rendered with initial state');
    console.log('Initial DOM state:', container.innerHTML);

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    console.log('Found submit button:', submitButton);

    // Submit the form
    const form = container.querySelector('form');
    console.log('Found form:', form);

    fireEvent.submit(form!);
    console.log('Form submitted');
    console.log('DOM state after submit:', container.innerHTML);

    // Check for validation messages
    await waitFor(
      () => {
        console.log('Inside waitFor - Current DOM state:');
        screen.debug();

        const errorAlert = screen.getByTestId('error-alert');
        console.log('Found error alert:', errorAlert);
        console.log('Error alert content:', errorAlert.textContent);
        console.log('Error alert visibility:', errorAlert.style.display);

        expect(errorAlert).toBeVisible();
        expect(errorAlert).toHaveTextContent('At least one file is required');
      },
      { timeout: 3000 }
    );
  });

  it('handles file uploads', async () => {
    renderComponent();

    // Create a mock file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for success message
    await waitFor(() => {
      const uploadAlert = screen.getByTestId('upload-status-alert');
      expect(uploadAlert).toHaveTextContent(/file uploaded/i);
    });
  });

  it('validates file upload requirements', async () => {
    console.log('Starting validates file upload requirements test');
    renderComponent();
    console.log('Component rendered with initial state');

    // Create a mock file that's too large (10MB + 1 byte)
    const file = new File(['x'.repeat(10 * 1024 * 1024 + 1)], 'large.pdf', {
      type: 'application/pdf',
    });
    console.log('Created mock file:', { name: file.name, size: file.size, type: file.type });

    // Try to upload file
    const fileInput = screen.getByTestId('file-input');
    console.log('Found file input:', fileInput);

    fireEvent.change(fileInput, { target: { files: [file] } });
    console.log('Triggered file change event');

    // Check for validation message
    await waitFor(
      () => {
        console.log('Inside waitFor - Current DOM state:');
        screen.debug();

        const errorAlert = screen.getByTestId('error-alert');
        console.log('Found error alert:', errorAlert);
        console.log('Error alert content:', errorAlert.textContent);
        console.log('Error alert visibility:', errorAlert.style.display);

        expect(errorAlert).toBeVisible();
        expect(errorAlert).toHaveTextContent('File too large');
      },
      { timeout: 3000 }
    );
  });

  it('validates file type requirements', async () => {
    renderComponent();

    // Create a mock file with invalid type
    const file = new File(['test'], 'test.exe', {
      type: 'application/x-msdownload',
    });

    // Try to upload file
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check for validation message
    await waitFor(() => {
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveTextContent(/invalid file type/i);
    });
  });

  it('allows removing attachments', async () => {
    renderComponent();

    // Create a mock file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for file to be uploaded
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Find and click remove button for the attachment
    const removeButton = screen.getByRole('button', { name: 'Remove file' });
    fireEvent.click(removeButton);

    // Check that attachment is removed
    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  it('disables submit button during API calls', async () => {
    renderComponent({ loading: true });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays late submission warning when past due date', () => {
    const pastDueAssignment = {
      ...mockAssignment,
      dueDate: '2024-01-01T00:00:00Z', // Past date
    };
    renderComponent({ assignment: pastDueAssignment });

    const lateAlert = screen.getByTestId('late-submission-alert');
    expect(lateAlert).toHaveTextContent(/this assignment is past due/i);
    expect(lateAlert).toHaveTextContent(/late submission penalty: 10%/i);
  });

  it('displays submission count warning when approaching max submissions', () => {
    const submissionWithCount = {
      ...mockSubmission,
      submissionCount: 2,
    };
    const assignmentWithMax = {
      ...mockAssignment,
      maxSubmissions: 3,
    };
    renderComponent({
      submission: submissionWithCount,
      assignment: assignmentWithMax,
    });

    const countAlert = screen.getByTestId('submission-count-alert');
    expect(countAlert).toHaveTextContent(/you have 1 submission remaining/i);
  });

  it('disables submission when max submissions reached', () => {
    const submissionWithMaxCount = {
      ...mockSubmission,
      submissionCount: 3,
    };
    const assignmentWithMax = {
      ...mockAssignment,
      maxSubmissions: 3,
    };
    renderComponent({
      submission: submissionWithMaxCount,
      assignment: assignmentWithMax,
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays loading state when submitting', () => {
    renderComponent({ loading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when submission fails', () => {
    renderComponent();

    // Simulate an error
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Check for error message
    const errorAlert = screen.getByTestId('error-alert');
    expect(errorAlert).toHaveTextContent(/at least one file is required/i);
  });
});
