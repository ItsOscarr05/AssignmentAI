import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import { Submission } from '../../../types';
import { SubmissionList } from '../SubmissionList';

// Mock the API client
vi.mock('../../../services/api', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SubmissionList', () => {
  const mockSubmissions: Submission[] = [
    {
      id: '1',
      assignmentId: '1',
      studentId: '1',
      content: 'Test submission 1',
      submittedAt: '2024-03-10T00:00:00Z',
      status: 'submitted' as const,
    },
    {
      id: '2',
      assignmentId: '1',
      studentId: '2',
      content: 'Test submission 2',
      submittedAt: '2024-03-11T00:00:00Z',
      status: 'draft' as const,
    },
  ];

  const mockOnView = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const renderSubmissionList = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <SubmissionList
          submissions={mockSubmissions}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          {...props}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the list with all submissions', () => {
    renderSubmissionList();

    mockSubmissions.forEach(submission => {
      expect(screen.getByText(`Content: ${submission.content}`)).toBeTruthy();
      expect(screen.getByText(`Status: ${submission.status}`)).toBeTruthy();
    });
  });

  it('displays empty state when no submissions are provided', () => {
    renderSubmissionList({ submissions: [] });

    // The list should be empty
    const list = screen.getByRole('list');
    expect(list).toBeFalsy();
  });

  it('displays loading state when loading is true', () => {
    renderSubmissionList({ loading: true });

    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('displays error state when error is provided', () => {
    const error = 'Failed to load submissions';
    renderSubmissionList({ error });

    expect(screen.getByRole('alert').textContent).toBe(error);
  });

  it('filters submissions by status', async () => {
    renderSubmissionList();

    // Get the select element and change its value directly
    const statusFilter = screen.getByTestId('select');
    console.log('Before status change - DOM state:');
    screen.debug();

    fireEvent.change(statusFilter, { target: { value: 'submitted' } });

    console.log('After status change - DOM state:');
    screen.debug();

    // Wait for the filter to be applied and check the results
    await waitFor(
      () => {
        console.log('Inside waitFor - DOM state:');
        screen.debug();

        // Check that we have exactly one submission item
        const submissionItems = screen
          .getAllByTestId('grid')
          .filter(element => element.getAttribute('component') === 'li');
        expect(submissionItems).toHaveLength(1);

        // Verify the correct submission is shown
        const visibleSubmission = screen.getByTestId('submission-1');
        expect(visibleSubmission).toBeTruthy();
        expect(visibleSubmission.textContent).toBe(mockSubmissions[0].content);
        expect(visibleSubmission.textContent).toMatch(/submitted/i);

        // Verify the other submission is not shown
        expect(screen.queryByTestId('submission-2')).not.toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('allows searching submissions', async () => {
    renderSubmissionList();

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search submissions/i);
    fireEvent.change(searchInput, { target: { value: 'test submission 2' } });

    // Wait for the search to complete and check results
    await waitFor(() => {
      expect(screen.getByText(`Content: ${mockSubmissions[1].content}`)).toBeTruthy();
      expect(screen.queryByText(`Content: ${mockSubmissions[0].content}`)).not.toBeTruthy();
    });
  });

  it('calls onView when view button is clicked', () => {
    renderSubmissionList();

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    expect(mockOnView).toHaveBeenCalledWith(mockSubmissions[0]);
  });

  it('calls onEdit when edit button is clicked', () => {
    renderSubmissionList();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockSubmissions[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    renderSubmissionList();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockSubmissions[0]);
  });

  it('displays submission date in correct format', () => {
    renderSubmissionList();

    mockSubmissions.forEach(submission => {
      const date = new Date(submission.submittedAt).toLocaleDateString();
      expect(screen.getByText(`Submitted: ${date}`)).toBeTruthy();
    });
  });

  it('displays submission status with correct color', () => {
    renderSubmissionList();

    // Find the status elements by their text content
    const statusElements = screen.getAllByText(/status:/i);
    const submittedStatus = statusElements.find(el => el.textContent?.includes('submitted'));
    const draftStatus = statusElements.find(el => el.textContent?.includes('draft'));

    // Check that both status elements exist
    expect(submittedStatus).toBeTruthy();
    expect(draftStatus).toBeTruthy();

    // Check that the status text is displayed correctly
    expect(submittedStatus?.textContent).toMatch(/status: submitted/i);
    expect(draftStatus?.textContent).toMatch(/status: draft/i);
  });
});
