import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentForm } from '../../components/assignments/AssignmentForm';
import { SubmissionDetail } from '../../components/submissions/SubmissionDetail';
import { SubmissionForm } from '../../components/submissions/SubmissionForm';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { Assignment } from '../../types';

const mockSubmission = {
  id: '1',
  assignmentId: '1',
  studentId: '1',
  content: 'Test submission',
  status: 'submitted',
  grade: null,
  feedback: null,
  submittedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock the auth context
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the API calls
vi.mock('../../services/api', () => ({
  createAssignment: vi.fn(),
  getAssignments: vi.fn(),
  submitAssignment: vi.fn(),
  gradeSubmission: vi.fn(),
}));

const mockCreateAssignment = vi.fn();
const mockSubmitAssignment = vi.fn();
const mockGradeSubmission = vi.fn();

const mockTeacher = {
  id: '1',
  email: 'teacher@example.com',
  fullName: 'Test Teacher',
  role: 'teacher',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isVerified: true,
};

const mockStudent = {
  id: '2',
  email: 'student@example.com',
  fullName: 'Test Student',
  role: 'student',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isVerified: true,
};

const mockAssignment: Assignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  courseId: 'course-1',
  type: 'homework',
  status: 'published',
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  subject: 'Math',
  gradeLevel: 'Grade 10',
  priority: 'medium',
  allowLateSubmissions: true,
  lateSubmissionPenalty: 10,
};

describe('Assignment Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>{component}</AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Assignment Creation Flow', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: mockTeacher,
        isAuthenticated: true,
      });
    });

    it('should handle successful assignment creation', async () => {
      mockCreateAssignment.mockResolvedValueOnce(mockAssignment);

      renderWithProviders(
        <AssignmentForm
          onSubmit={mockCreateAssignment}
          initialData={undefined}
          isSubmitting={false}
        />
      );

      // Fill in assignment form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Assignment' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test Description' },
      });
      fireEvent.change(screen.getByLabelText(/due date/i), {
        target: { value: '2024-12-31' },
      });
      fireEvent.change(screen.getByLabelText(/points/i), {
        target: { value: '100' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Verify assignment was created
      await waitFor(() => {
        expect(mockCreateAssignment).toHaveBeenCalledWith({
          title: 'Test Assignment',
          description: 'Test Description',
          dueDate: '2024-12-31',
          points: 100,
        });
      });
    });

    it('should handle validation errors during creation', async () => {
      renderWithProviders(
        <AssignmentForm
          onSubmit={mockCreateAssignment}
          initialData={undefined}
          isSubmitting={false}
        />
      );

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Verify validation messages
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/points is required/i)).toBeInTheDocument();
    });
  });

  describe('Assignment Submission Flow', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: mockStudent,
        isAuthenticated: true,
      });
    });

    it('should handle successful assignment submission', async () => {
      mockSubmitAssignment.mockResolvedValueOnce(mockSubmission);

      renderWithProviders(<SubmissionForm assignment={mockAssignment} />);

      // Upload file
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const input = screen.getByLabelText(/upload file/i);
      fireEvent.change(input, { target: { files: [file] } });

      // Add comment
      fireEvent.change(screen.getByLabelText(/comment/i), {
        target: { value: 'Test comment' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify submission was created
      await waitFor(() => {
        expect(mockSubmitAssignment).toHaveBeenCalledWith({
          assignmentId: mockAssignment.id,
          content: 'Test comment',
          file: file,
        });
      });
    });

    it('should handle file validation during submission', async () => {
      renderWithProviders(<SubmissionForm assignment={mockAssignment} />);

      // Upload invalid file type
      const file = new File(['test content'], 'test.exe', {
        type: 'application/x-msdownload',
      });
      const input = screen.getByLabelText(/upload file/i);
      fireEvent.change(input, { target: { files: [file] } });

      // Verify error message
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });
  });

  describe('Assignment Grading Flow', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: mockTeacher,
        isAuthenticated: true,
      });
    });

    it('should handle successful submission grading', async () => {
      mockGradeSubmission.mockResolvedValueOnce({
        ...mockSubmission,
        grade: 85,
        feedback: 'Good work!',
      });

      renderWithProviders(<SubmissionForm assignment={mockAssignment} />);

      // Enter grade
      fireEvent.change(screen.getByLabelText(/grade/i), {
        target: { value: '85' },
      });

      // Enter feedback
      fireEvent.change(screen.getByLabelText(/feedback/i), {
        target: { value: 'Good work!' },
      });

      // Submit grade
      fireEvent.click(screen.getByRole('button', { name: /submit grade/i }));

      // Verify grade was submitted
      await waitFor(() => {
        expect(mockGradeSubmission).toHaveBeenCalledWith({
          submissionId: mockSubmission.id,
          grade: 85,
          feedback: 'Good work!',
        });
      });
    });

    it('should handle grade validation', async () => {
      // Mock the URL parameter
      const mockId = '123';
      vi.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: mockId });

      // Mock the API response
      const mockSubmission = {
        id: mockId,
        title: 'Test Submission',
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        assignment_title: 'Test Assignment',
        assignment_subject: 'Math',
        assignment_due_date: new Date().toISOString(),
        score: null,
        max_score: 100,
        feedback: null,
        file_path: null,
        description: null,
      };
      const mockApi = {
        get: vi.fn().mockResolvedValue({ data: mockSubmission }),
      };
      vi.spyOn(require('../../services/api'), 'api').mockReturnValue(mockApi);

      renderWithProviders(<SubmissionDetail />);

      // Enter invalid grade
      fireEvent.change(screen.getByLabelText(/grade/i), {
        target: { value: '150' },
      });

      // Submit grade
      fireEvent.click(screen.getByRole('button', { name: /submit grade/i }));

      // Verify error message
      expect(screen.getByText(/grade must be between 0 and 100/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during assignment creation', async () => {
      (useAuth as any).mockReturnValue({
        user: mockTeacher,
        isAuthenticated: true,
      });

      mockCreateAssignment.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <AssignmentForm
          onSubmit={mockCreateAssignment}
          initialData={undefined}
          isSubmitting={false}
        />
      );

      // Fill in and submit form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Assignment' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test Description' },
      });
      fireEvent.change(screen.getByLabelText(/due date/i), {
        target: { value: '2024-12-31' },
      });
      fireEvent.change(screen.getByLabelText(/points/i), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle file upload errors during submission', async () => {
      (useAuth as any).mockReturnValue({
        user: mockStudent,
        isAuthenticated: true,
      });

      mockSubmitAssignment.mockRejectedValueOnce(new Error('Upload failed'));

      renderWithProviders(<SubmissionForm assignment={mockAssignment} />);

      // Upload file and submit
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const input = screen.getByLabelText(/upload file/i);
      fireEvent.change(input, { target: { files: [file] } });
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });
  });
});
