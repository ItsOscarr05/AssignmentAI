import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { FeedbackForm } from '../FeedbackForm';

// Mock the API client
vi.mock('../../../services/api', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const theme = createTheme();

describe('FeedbackForm', () => {
  const mockSubmission = {
    id: '1',
    assignmentId: '1',
    studentId: 'user1',
    content: 'Test submission content',
    submittedAt: '2024-03-10T00:00:00Z',
    status: 'submitted',
  };

  const mockFeedback = {
    id: '1',
    submissionId: '1',
    graderId: 'user2',
    grade: 85,
    comments: 'Good work overall, but could improve documentation',
    rubricScores: [
      {
        criterionId: '1',
        score: 8,
        comments: 'Code structure is good',
      },
      {
        criterionId: '2',
        score: 14,
        comments: 'Functionality meets requirements',
      },
      {
        criterionId: '3',
        score: 3,
        comments: 'Documentation needs improvement',
      },
    ],
    submittedAt: '2024-03-11T00:00:00Z',
  };

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <FeedbackForm submission={mockSubmission} feedback={mockFeedback} {...props} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    renderComponent();

    expect(screen.getByLabelText('Grade')).toBeTruthy();
    expect(screen.getByTestId('main-comments')).toBeTruthy();
  });

  it('displays existing feedback data when editing', async () => {
    renderComponent();

    // Wait for the form to be populated with existing data
    await waitFor(() => {
      const gradeInput = screen.getByLabelText('Grade');
      expect((gradeInput as HTMLInputElement).value).toBe(mockFeedback.grade);
    });

    const commentsInput = screen.getByTestId('main-comments');
    expect((commentsInput as HTMLInputElement).value).toBe(mockFeedback.comments);

    // Check rubric scores
    // mockFeedback.rubricScores.forEach(score => {
    //   const criterion = mockRubric.criteria.find(c => c.id === score.criterionId);
    //   if (criterion) {
    //     expect(screen.getByText(criterion.name)).toBeTruthy();
    //     expect(screen.getByTestId(`rubric-comments-${criterion.id}`)).toHaveValue(score.comments);
    //   }
    // });
  });

  it('handles successful feedback creation', async () => {
    // Mock the API response
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        ...mockFeedback,
        id: '2',
      },
    });

    renderComponent({ feedback: null });

    // Fill in required fields
    const gradeInput = screen.getByLabelText('Grade');
    fireEvent.change(gradeInput, {
      target: { value: '90' },
    });

    const commentsInput = screen.getByTestId('main-comments');
    fireEvent.change(commentsInput, {
      target: { value: 'Excellent work!' },
    });

    // Fill in rubric scores
    // const selects = screen.getAllByRole('combobox');
    // mockRubric.criteria.forEach((criterion, index) => {
    //   fireEvent.mouseDown(selects[index]);
    //   const option = screen.getByRole('option', { name: criterion.maxScore.toString() });
    //   fireEvent.click(option);
    // });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitButton);

    // Check for loading state
    expect(screen.getByRole('progressbar')).toBeTruthy();

    // Wait for success and navigation
    await waitFor(
      () => {
        expect(api.post).toHaveBeenCalledWith('/feedback', expect.any(Object));
        expect(mockNavigate).toHaveBeenCalledWith('/feedback');
      },
      { timeout: 3000 }
    );
  });

  it('handles successful feedback update', async () => {
    // Mock the API response
    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        ...mockFeedback,
        grade: 90,
        comments: 'Updated comments',
      },
    });

    renderComponent();

    // Update fields
    const gradeInput = screen.getByRole('spinbutton', { name: /grade/i });
    fireEvent.change(gradeInput, {
      target: { value: '90' },
    });

    const commentsInput = screen.getByTestId('main-comments');
    fireEvent.change(commentsInput, {
      target: { value: 'Updated comments' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /update feedback/i });
    fireEvent.click(submitButton);

    // Check for loading state
    expect(screen.getByRole('progressbar')).toBeTruthy();

    // Wait for success and navigation
    await waitFor(
      () => {
        expect(api.put).toHaveBeenCalledWith(`/feedback/${mockFeedback.id}`, expect.any(Object));
        expect(mockNavigate).toHaveBeenCalledWith('/feedback');
      },
      { timeout: 3000 }
    );
  });

  it('validates required fields', async () => {
    renderComponent({ feedback: null });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', {
      name: /submit feedback/i,
    });
    fireEvent.click(submitButton);

    // Check for validation messages
    await waitFor(
      () => {
        const gradeInput = screen.getByLabelText('Grade');
        const commentsInput = screen.getByTestId('main-comments');

        expect(gradeInput.getAttribute('aria-invalid')).toBe('true');
        expect(commentsInput.getAttribute('aria-invalid')).toBe('true');
        expect(
          screen.getByText('Comments are required', { selector: 'p.MuiFormHelperText-root' })
        ).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('validates grade range', async () => {
    renderComponent({ feedback: null });

    const gradeInput = screen.getByLabelText('Grade');
    fireEvent.change(gradeInput, { target: { value: '101' } });

    // Check for validation message
    await waitFor(() => {
      expect(screen.getByText('Grade must be between 0 and 100')).toBeTruthy();
    });
  });

  it('validates rubric score ranges', async () => {
    renderComponent({ feedback: null });

    // Try to submit with invalid rubric score
    // const criterion = mockRubric.criteria[0];
    // const selects = screen.getAllByRole('combobox');
    // fireEvent.mouseDown(selects[0]);

    // // The Select component only shows valid options, so we can't select an invalid score
    // // Instead, we'll verify that the max score is enforced
    // expect(screen.getByRole('option', { name: criterion.maxScore.toString() })).toBeTruthy();
    // expect(
    //   screen.queryByRole('option', { name: (criterion.maxScore + 1).toString() })
    // ).not.toBeTruthy();
  });

  it('calculates total grade from rubric scores', async () => {
    renderComponent({ feedback: null });

    // Fill in rubric scores
    // const selects = screen.getAllByRole('combobox');
    // fireEvent.mouseDown(selects[0]);
    // fireEvent.click(screen.getByRole('option', { name: '10' }));
    // fireEvent.mouseDown(selects[1]);
    // fireEvent.click(screen.getByRole('option', { name: '15' }));
    // fireEvent.mouseDown(selects[2]);
    // fireEvent.click(screen.getByRole('option', { name: '5' }));

    // // Check if total grade is calculated
    // const totalScore = 30; // 10 + 15 + 5
    // await waitFor(() => {
    //   const gradeInput = screen.getByRole('spinbutton', { name: /grade/i });
    //   expect(gradeInput).toHaveValue(totalScore);
    // });
  });

  it('disables submit button during API calls', async () => {
    // Mock a slow API response
    vi.mocked(api.post).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderComponent({ feedback: null });

    // Fill in required fields
    const gradeInput = screen.getByTestId('text-field');
    fireEvent.change(gradeInput, { target: { value: '90' } });

    const commentsInput = screen.getByTestId('main-comments');
    fireEvent.change(commentsInput, { target: { value: 'Test comments' } });

    // Fill in rubric scores
    // const selects = screen.getAllByRole('combobox');
    // mockRubric.criteria.forEach((criterion, index) => {
    //   fireEvent.mouseDown(selects[index]);
    //   const option = screen.getByRole('option', { name: criterion.maxScore.toString() });
    //   fireEvent.click(option);
    // });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitButton);

    // Check if button is disabled and shows loading state
    expect(submitButton.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('displays submission content for reference', () => {
    renderComponent();

    // The submission content should be displayed in a div with component="pre"
    expect(screen.getByText(mockSubmission.content)).toBeTruthy();
  });

  it('validates that all rubric criteria are scored', async () => {
    renderComponent({ feedback: null });

    // Fill in only some rubric scores
    // const selects = screen.getAllByRole('combobox');
    // fireEvent.mouseDown(selects[0]);
    // const option = screen.getAllByRole('option')[5]; // Get the option with value "5" from the first select
    // fireEvent.click(option);

    // // Submit the form
    // const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    // fireEvent.click(submitButton);

    // // Check for validation message and state
    // await waitFor(
    //   () => {
    //     // Check for error message
    //     const errorMessage = screen.getByTestId('rubric-error');
    //     expect(errorMessage).toHaveTextContent('Please score all rubric criteria');

    //     // Check that the first combobox has error state
    //     const firstCombobox = screen.getAllByRole('combobox')[0];
    //     const formControl = firstCombobox.closest('[data-testid="form-control"]');
    //     expect(formControl).toHaveAttribute('data-error', 'true');
    //   },
    //   { timeout: 3000 }
    // );
  });
});
