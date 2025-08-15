import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { SubmissionDetail } from '../submissions/SubmissionDetail';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const renderSubmissionDetail = () => {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/submissions/1']}>
        <Routes>
          <Route path="/submissions/:id" element={<SubmissionDetail />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('SubmissionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders loading state initially', () => {
      renderSubmissionDetail();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders submission details after loading', async () => {
      const mockSubmission = {
        id: '1',
        title: 'Test Assignment',
        status: 'submitted',
        submitted_at: '2024-01-01',
        assignment_title: 'Test Assignment',
        assignment_subject: 'Math',
        assignment_due_date: '2024-01-15',
        score: 85,
        max_score: 100,
        feedback: 'Good work!',
        file_path: 'https://example.com/submission.txt',
        description: 'Test submission content',
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockSubmission });

      renderSubmissionDetail();

      await waitFor(() => {
        // Check title
        const titleElement = screen.getByTestId('submission-title');
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveTextContent(mockSubmission.title);

        // Check status
        const statusChip = screen.getByTestId('chip');
        expect(statusChip).toBeInTheDocument();
        expect(statusChip).toHaveAttribute('label', mockSubmission.status);

        // Check submission date
        const dateText = new Date(mockSubmission.submitted_at).toLocaleDateString();
        expect(screen.getByText(`Submitted on ${dateText}`)).toBeInTheDocument();

        // Check assignment details
        expect(screen.getByText('Assignment Details')).toBeInTheDocument();
        const assignmentParagraph = screen.getByText(/Assignment:/).closest('p');
        expect(assignmentParagraph).toBeInTheDocument();
        expect(assignmentParagraph).toHaveTextContent(mockSubmission.assignment_title);
        expect(screen.getByText(/Subject:/)).toBeInTheDocument();
        expect(screen.getByText(mockSubmission.assignment_subject)).toBeInTheDocument();
        expect(screen.getByText(/Due Date:/)).toBeInTheDocument();
        expect(
          screen.getByText(new Date(mockSubmission.assignment_due_date).toLocaleDateString())
        ).toBeInTheDocument();

        // Check submission details
        expect(screen.getByText('Submission Details')).toBeInTheDocument();
        expect(screen.getByText(/Score:/)).toBeInTheDocument();
        expect(
          screen.getByText(`${mockSubmission.score}/${mockSubmission.max_score}`)
        ).toBeInTheDocument();
        expect(screen.getByText(/Feedback:/)).toBeInTheDocument();
        expect(screen.getByText(mockSubmission.feedback)).toBeInTheDocument();
        expect(screen.getByText(/File:/)).toBeInTheDocument();
        expect(screen.getByText('submission.txt')).toBeInTheDocument();

        // Check description
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText(mockSubmission.description)).toBeInTheDocument();

        // Check action buttons
        expect(screen.getByTestId('DownloadIcon')).toBeInTheDocument();
        expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to submissions/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('renders error message when API call fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch submission'));

      renderSubmissionDetail();

      await waitFor(() => {
        expect(screen.getByText('Failed to load submission')).toBeInTheDocument();
      });
    });
  });

  describe('File Handling', () => {
    it('handles file download', async () => {
      const mockSubmission = {
        id: '1',
        file_path: 'https://example.com/submission.txt',
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockSubmission });

      renderSubmissionDetail();

      await waitFor(() => {
        const downloadButton = screen.getByTestId('DownloadIcon').closest('button');
        expect(downloadButton).toBeInTheDocument();
        fireEvent.click(downloadButton!);
      });

      expect(api.get).toHaveBeenCalledWith(`/submissions/download/${mockSubmission.file_path}`, {
        responseType: 'blob',
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      const mockSubmission = {
        id: '1',
        title: 'Test Assignment',
        status: 'submitted',
        submitted_at: '2024-01-01',
        file_path: 'https://example.com/submission.txt',
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockSubmission });

      renderSubmissionDetail();

      await waitFor(() => {
        expect(screen.getByTestId('DownloadIcon').closest('button')).toBeInTheDocument();
        expect(screen.getByTestId('EditIcon').closest('button')).toBeInTheDocument();
        expect(screen.getByTestId('DeleteIcon').closest('button')).toBeInTheDocument();
      });
    });

    it('shows error alert when API call fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch submission'));

      renderSubmissionDetail();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load submission')).toBeInTheDocument();
      });
    });
  });
});
