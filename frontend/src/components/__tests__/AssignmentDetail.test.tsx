import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Assignment } from '../../types/assignment';
import AssignmentDetail from '../assignments/AssignmentDetail';

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
    Chip: ({ label, color, ...props }: any) => (
      <div className={`MuiChip-root MuiChip-color${color?.toLowerCase()}`} {...props}>
        {label}
      </div>
    ),
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
    ListItemText: ({ primary, secondary, ...props }: any) => (
      <div {...props}>
        <div data-testid="primary">{primary}</div>
        {secondary && <div data-testid="secondary">{secondary}</div>}
      </div>
    ),
    Divider: (props: any) => <hr {...props} />,
    Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CircularProgress: (props: any) => <div role="progressbar" {...props} />,
    Alert: ({ children, severity, ...props }: any) => (
      <div role="alert" data-severity={severity} {...props}>
        {children}
      </div>
    ),
    Snackbar: ({ children, open, ...props }: any) =>
      open ? (
        <div role="alert" {...props}>
          {children}
        </div>
      ) : null,
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
}));

const mockAssignment: Assignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  subject: 'Math',
  grade_level: '10',
  due_date: '2024-12-31T00:00:00.000Z',
  points: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  status: 'published',
  maxSubmissions: 3,
  allowLateSubmissions: true,
  lateSubmissionPenalty: 10,
  attachments: [
    {
      id: '1',
      name: 'Test Attachment',
      url: 'https://example.com/test.pdf',
      type: 'application/pdf',
      size: 1024,
    },
  ],
  tags: ['math', 'algebra'],
  createdBy: 'user1',
  submissions: [
    {
      id: '1',
      assignmentId: '1',
      userId: 'user1',
      submittedAt: '2024-01-15',
      status: 'submitted',
      attachments: [],
    },
  ],
};

const renderAssignmentDetail = (props = {}) => {
  return render(
    <ThemeProvider>
      <AssignmentDetail
        assignment={mockAssignment}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );
};

describe('AssignmentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with assignment data', () => {
      renderAssignmentDetail();
      expect(screen.getByText(mockAssignment.title)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.description)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.subject)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.grade_level)).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.status)).toBeInTheDocument();
    });

    it('renders attachments section', () => {
      renderAssignmentDetail();
      expect(screen.getByText('Attachments')).toBeInTheDocument();
      mockAssignment.attachments.forEach(attachment => {
        expect(screen.getByText(attachment.name)).toBeInTheDocument();
      });
    });

    it('renders submissions section', () => {
      renderAssignmentDetail();
      expect(screen.getByText('Submission Status')).toBeInTheDocument();
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText(mockAssignment.submissions.length.toString())).toBeInTheDocument();
    });

    it('renders dates correctly', () => {
      renderAssignmentDetail();
      const secondaryTexts = screen.getAllByTestId('secondary');

      // Comprehensive debug logging
      console.log('\n=== Debug: Secondary Text Elements ===');
      secondaryTexts.forEach((text, index) => {
        console.log(`\nElement ${index}:`);
        console.log('Text Content:', text.textContent);
        console.log('Raw HTML:', text.innerHTML);
        console.log('Parent Element:', text.parentElement?.outerHTML);
      });
      console.log('\n=== End Debug ===\n');

      // The component formats dates with prefixes and uses toLocaleDateString
      // The actual format will be like "Created: Jan 1, 2024" but the exact format
      // depends on the user's locale and the browser's implementation
      const dateRegex = /Created: [A-Za-z]{3} \d{1,2}, \d{4}/;
      const dueDateRegex = /Due: [A-Za-z]{3} \d{1,2}, \d{4}/;

      expect(secondaryTexts.some(text => dateRegex.test(text.textContent || ''))).toBe(true);
      expect(secondaryTexts.some(text => dueDateRegex.test(text.textContent || ''))).toBe(true);
    });

    it('renders stats correctly', () => {
      renderAssignmentDetail();
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      renderAssignmentDetail({ loading: true });
      expect(screen.getByText('Loading assignment details...')).toBeInTheDocument();
    });
  });

  describe('Status and Difficulty Colors', () => {
    it('renders active status with success color', () => {
      renderAssignmentDetail({
        assignment: { ...mockAssignment, status: 'active' },
      });
      const statusChip = screen.getByText('active');
      expect(statusChip).toHaveClass('MuiChip-colorSuccess');
    });

    it('renders easy difficulty with success color', () => {
      renderAssignmentDetail({
        assignment: { ...mockAssignment, difficulty: 'easy' },
      });
      const difficultyChip = screen.getByText('easy');
      expect(difficultyChip).toHaveClass('MuiChip-colorsuccess');
    });

    it('renders medium difficulty with warning color', () => {
      renderAssignmentDetail({
        assignment: { ...mockAssignment, difficulty: 'medium' },
      });
      const difficultyChip = screen.getByText('medium');
      expect(difficultyChip).toHaveClass('MuiChip-colorwarning');
    });

    it('renders hard difficulty with error color', () => {
      renderAssignmentDetail({
        assignment: { ...mockAssignment, difficulty: 'hard' },
      });
      const difficultyChip = screen.getByText('hard');
      expect(difficultyChip).toHaveClass('MuiChip-colorerror');
    });
  });

  describe('Action Buttons', () => {
    it('handles edit button click', () => {
      const onEdit = vi.fn();
      renderAssignmentDetail({ onEdit });

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockAssignment);
    });

    it('handles delete button click', () => {
      const onDelete = vi.fn();
      renderAssignmentDetail({ onDelete });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      const dialogs = screen.getAllByRole('dialog');
      const deleteDialog = dialogs.find(
        dialog => dialog.querySelector('h2')?.textContent === 'Delete Assignment'
      );
      expect(deleteDialog).toBeDefined();
      expect(deleteDialog).toBeInTheDocument();
    });

    it('handles submit button click', () => {
      renderAssignmentDetail();
      const submitButton = screen.getByRole('button', { name: /submit assignment/i });
      fireEvent.click(submitButton);

      const dialogs = screen.getAllByRole('dialog');
      const submitDialog = dialogs.find(
        dialog => dialog.querySelector('h2')?.textContent === 'Submit Assignment'
      );
      expect(submitDialog).toBeDefined();
      expect(submitDialog).toBeInTheDocument();
    });
  });

  describe('Submission Form', () => {
    it('handles file upload', async () => {
      const onSubmit = vi.fn();
      renderAssignmentDetail({ onSubmit });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload file/i);
      fireEvent.change(input, { target: { files: [file] } });

      // Find the submit button in the submit dialog
      const dialogs = screen.getAllByRole('dialog');
      const submitDialog = dialogs.find(
        dialog => dialog.querySelector('h2')?.textContent === 'Submit Assignment'
      );
      const submitButton = within(submitDialog!).getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith([file]);
      });
    });

    it('validates file size', async () => {
      const onSubmit = vi.fn();
      renderAssignmentDetail({ onSubmit });

      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      });
      const input = screen.getByLabelText(/upload file/i);
      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        const errorMessage = screen.getByText('Total file size exceeds limit');
        expect(errorMessage).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('handles submission error', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      renderAssignmentDetail({ onSubmit });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/upload file/i);
      fireEvent.change(input, { target: { files: [file] } });

      // Find the submit button in the submit dialog
      const dialogs = screen.getAllByRole('dialog');
      const submitDialog = dialogs.find(
        dialog => dialog.querySelector('h2')?.textContent === 'Submit Assignment'
      );
      const submitButton = within(submitDialog!).getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Submission failed');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('[data-severity="error"]')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles error state', () => {
      renderAssignmentDetail({ error: new Error('Failed to load assignment') });
      const errorToast = screen.getByText('Failed to load assignment');
      expect(errorToast).toBeInTheDocument();
      expect(errorToast.closest('[data-severity="error"]')).toBeInTheDocument();
    });

    it('handles missing assignment', () => {
      renderAssignmentDetail({ assignment: undefined });
      expect(screen.getByText('Loading assignment details...')).toBeInTheDocument();
    });

    it('handles long content', () => {
      const longDescription = 'A'.repeat(1000);
      const longAssignment = {
        ...mockAssignment,
        description: longDescription,
      };
      renderAssignmentDetail({ assignment: longAssignment });
      const descriptionElement = screen.getByText(longDescription);
      expect(descriptionElement).toBeInTheDocument();
    });
  });
});
