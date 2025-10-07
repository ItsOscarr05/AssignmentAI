import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmissionDetail } from '../../components/submissions/SubmissionDetail';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { api } from '../../services/api';

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
      expect(screen.getByRole('progressbar')).toBeTruthy();
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
        expect(titleElement).toBeTruthy();
        expect(titleElement.textContent).toBe(mockSubmission.title);

        // Check status
        const statusChip = screen.getByTestId('chip');
        expect(statusChip).toBeTruthy();
        expect(statusChip.getAttribute('label')).toBe(mockSubmission.status);

        // Check submission date
        const dateText = new Date(mockSubmission.submitted_at).toLocaleDateString();
        expect(screen.getByText(`Submitted on ${dateText}`)).toBeTruthy();

        // Check assignment details
        expect(screen.getByText('Assignment Details')).toBeTruthy();
        const assignmentParagraph = screen.getByText(/Assignment:/).closest('p');
        expect(assignmentParagraph).toBeTruthy();
        expect(assignmentParagraph?.textContent).toBe(mockSubmission.assignment_title);
        expect(screen.getByText(/Subject:/)).toBeTruthy();
        expect(screen.getByText(mockSubmission.assignment_subject)).toBeTruthy();
        expect(screen.getByText(/Due Date:/)).toBeTruthy();
        expect(
          screen.getByText(new Date(mockSubmission.assignment_due_date).toLocaleDateString())
        ).toBeTruthy();

        // Check submission details
        expect(screen.getByText('Submission Details')).toBeTruthy();
        expect(screen.getByText(/Score:/)).toBeTruthy();
        expect(
          screen.getByText(`${mockSubmission.score}/${mockSubmission.max_score}`)
        ).toBeTruthy();
        expect(screen.getByText(/Feedback:/)).toBeTruthy();
        expect(screen.getByText(mockSubmission.feedback)).toBeTruthy();
        expect(screen.getByText(/File:/)).toBeTruthy();
        expect(screen.getByText('submission.txt')).toBeTruthy();

        // Check description
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText(mockSubmission.description)).toBeTruthy();

        // Check action buttons
        expect(screen.getByTestId('DownloadIcon')).toBeTruthy();
        expect(screen.getByTestId('EditIcon')).toBeTruthy();
        expect(screen.getByTestId('DeleteIcon')).toBeTruthy();
        expect(screen.getByRole('button', { name: /back to submissions/i })).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('renders error message when API call fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch submission'));

      renderSubmissionDetail();

      await waitFor(() => {
        expect(screen.getByText('Failed to load submission')).toBeTruthy();
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
        expect(downloadButton).toBeTruthy();
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
        expect(screen.getByTestId('DownloadIcon').closest('button')).toBeTruthy();
        expect(screen.getByTestId('EditIcon').closest('button')).toBeTruthy();
        expect(screen.getByTestId('DeleteIcon').closest('button')).toBeTruthy();
      });
    });

    it('shows error alert when API call fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch submission'));

      renderSubmissionDetail();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('Failed to load submission')).toBeTruthy();
      });
    });
  });
});
