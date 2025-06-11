import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRubric } from '../../../api/client';
import { Assignment, Rubric } from '../../../types';
import RubricForm from '../RubricForm';

// Create a test theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Mock the API client
vi.mock('../../../api/client', () => ({
  createRubric: vi.fn(),
  updateRubric: vi.fn(),
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="add-icon" />,
  Delete: () => <span data-testid="delete-icon" />,
  ArrowUpward: () => <span data-testid="arrow-up-icon" />,
  ArrowDownward: () => <span data-testid="arrow-down-icon" />,
  ContentCopy: () => <span data-testid="copy-icon" />,
}));

describe('RubricForm', () => {
  const mockAssignment: Assignment = {
    id: '1',
    title: 'Test Assignment',
    description: 'Test Description',
    courseId: '1',
    dueDate: new Date().toISOString(),
    status: 'draft',
    type: 'essay',
    gradeLevel: '12',
    priority: 'medium',
    subject: 'Computer Science',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allowLateSubmissions: true,
    lateSubmissionPenalty: 10,
  };

  const mockRubric: Rubric = {
    id: '1',
    title: 'Test Rubric',
    description: 'Test Description',
    criteria: [
      {
        id: '1',
        name: 'Code Structure',
        description: 'Code organization and structure',
        maxScore: 10,
        weight: 0.3,
        points: 0,
        levels: [],
      },
      {
        id: '2',
        name: 'Functionality',
        description: 'Code functionality and correctness',
        maxScore: 15,
        weight: 0.4,
        points: 0,
        levels: [],
      },
      {
        id: '3',
        name: 'Documentation',
        description: 'Code documentation and comments',
        maxScore: 5,
        weight: 0.3,
        points: 0,
        levels: [],
      },
    ],
    passingScore: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnSubmit = vi.fn();

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <RubricForm assignment={mockAssignment} onSubmit={mockOnSubmit} {...props} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders form with required fields', () => {
    renderComponent();

    expect(screen.getByTestId('name-field')).toBeInTheDocument();
    expect(screen.getByTestId('description-field')).toBeInTheDocument();
    expect(screen.getByTestId('passing-score-field')).toBeInTheDocument();
  });

  it('renders form with existing rubric data', () => {
    renderComponent({ rubric: mockRubric });

    // Use test IDs to find the rubric fields
    const rubricNameInput = screen.getByTestId('name-field');
    const rubricDescriptionInput = screen.getByTestId('description-field');
    const passingScoreInput = screen.getByTestId('passing-score-field');

    expect(rubricNameInput).toHaveValue(mockRubric.title);
    expect(rubricDescriptionInput).toHaveValue(mockRubric.description);
    expect(passingScoreInput).toHaveValue(mockRubric.passingScore);

    // Check criteria fields
    mockRubric.criteria.forEach((criterion, index) => {
      const criterionNameInput = screen.getByTestId(`criterion-name-field-${index}`);
      const criterionDescriptionInput = screen.getByTestId(`criterion-description-field-${index}`);
      const criterionMaxScoreInput = screen.getByTestId(`criterion-max-score-field-${index}`);
      const criterionWeightInput = screen.getByTestId(`criterion-weight-field-${index}`);

      expect(criterionNameInput).toHaveValue(criterion.name);
      expect(criterionDescriptionInput).toHaveValue(criterion.description);
      expect(criterionMaxScoreInput).toHaveValue(criterion.maxScore);
      expect(criterionWeightInput).toHaveValue(criterion.weight * 100);
    });
  });

  it('validates required fields', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('name-field-error')).toHaveTextContent(/name is required/i);
      expect(screen.getByTestId('description-field-error')).toHaveTextContent(
        /description is required/i
      );
    });
  });

  it('validates criterion fields', async () => {
    renderComponent();

    // Add a criterion
    const addButton = screen.getByRole('button', { name: /add criterion/i });
    fireEvent.click(addButton);

    // Try to submit without filling criterion fields
    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('criterion-name-field-0-error')).toHaveTextContent(
        /criterion name is required/i
      );
      expect(screen.getByTestId('criterion-description-field-0-error')).toHaveTextContent(
        /criterion description is required/i
      );
      expect(screen.getByTestId('criterion-max-score-field-0-error')).toHaveTextContent(
        /max score must be greater than 0/i
      );
      expect(screen.getByTestId('criterion-weight-field-0-error')).toHaveTextContent(
        /weight must be between 0 and 100/i
      );
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates unique criterion names', async () => {
    renderComponent();

    // Add two criteria with the same name
    const addButton = screen.getByRole('button', { name: /add criterion/i });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    const nameInputs = screen.getAllByTestId(/criterion-name-field-\d+/);
    fireEvent.change(nameInputs[0], { target: { value: 'Test Criterion' } });
    fireEvent.change(nameInputs[1], { target: { value: 'Test Criterion' } });

    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('criteria-error')).toHaveTextContent(
        /criterion names must be unique/i
      );
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates passing score against total max score', async () => {
    renderComponent();

    // Add a criterion with max score 10
    const addButton = screen.getByRole('button', { name: /add criterion/i });
    fireEvent.click(addButton);

    const maxScoreInput = screen.getByTestId('criterion-max-score-field-0');
    fireEvent.change(maxScoreInput, { target: { value: '10' } });

    // Try to set passing score higher than max score
    const passingScoreInput = screen.getByTestId('passing-score-field');
    fireEvent.change(passingScoreInput, { target: { value: '15' } });

    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('passing-score-error')).toHaveTextContent(
        /passing score cannot exceed total max score/i
      );
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    renderComponent();

    // Fill in required fields
    const nameField = screen.getByTestId('name-field');
    const descriptionField = screen.getByTestId('description-field');
    const passingScoreField = screen.getByTestId('passing-score-field');

    fireEvent.change(nameField, { target: { value: 'Test Rubric' } });
    fireEvent.change(descriptionField, { target: { value: 'Test Description' } });
    fireEvent.change(passingScoreField, { target: { value: '10' } });

    // Add a criterion
    const addButton = screen.getByRole('button', { name: /add criterion/i });
    fireEvent.click(addButton);

    // Fill in criterion fields
    const criterionNameField = screen.getByTestId('criterion-name-field-0');
    const criterionDescriptionField = screen.getByTestId('criterion-description-field-0');
    const criterionMaxScoreField = screen.getByTestId('criterion-max-score-field-0');
    const criterionWeightField = screen.getByTestId('criterion-weight-field-0');

    fireEvent.change(criterionNameField, { target: { value: 'Test Criterion' } });
    fireEvent.change(criterionDescriptionField, { target: { value: 'Test Description' } });
    fireEvent.change(criterionMaxScoreField, { target: { value: '10' } });
    fireEvent.change(criterionWeightField, { target: { value: '100' } });

    // Mock API error
    const mockError = new Error('Failed to save rubric');
    vi.mocked(createRubric).mockRejectedValueOnce(mockError);

    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles failed rubric save', async () => {
    renderComponent();

    // Fill in required fields
    await userEvent.type(screen.getByTestId('name-field'), 'Test Rubric');
    await userEvent.type(screen.getByTestId('description-field'), 'Test Description');
    await userEvent.type(screen.getByTestId('passing-score-field'), '10');

    // Add a criterion
    const addButton = screen.getByRole('button', { name: /add criterion/i });
    fireEvent.click(addButton);

    // Fill in criterion fields
    await userEvent.type(screen.getByTestId('criterion-name-field-0'), 'Test Criterion');
    await userEvent.type(screen.getByTestId('criterion-description-field-0'), 'Test Description');
    await userEvent.type(screen.getByTestId('criterion-max-score-field-0'), '10');
    await userEvent.type(screen.getByTestId('criterion-weight-field-0'), '100');

    // Mock API error
    const mockError = new Error('Failed to save rubric');
    vi.mocked(createRubric).mockRejectedValueOnce(mockError);

    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Failed to save rubric');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('allows copying existing rubric', () => {
    renderComponent({ rubric: mockRubric });

    // Use test IDs to find the rubric fields
    const rubricNameInput = screen.getByTestId('name-field');
    const rubricDescriptionInput = screen.getByTestId('description-field');
    const passingScoreInput = screen.getByTestId('passing-score-field');

    expect(rubricNameInput).toHaveValue(mockRubric.title);
    expect(rubricDescriptionInput).toHaveValue(mockRubric.description);
    expect(passingScoreInput).toHaveValue(mockRubric.passingScore);

    // Check criteria fields
    mockRubric.criteria.forEach((criterion, index) => {
      const criterionNameInput = screen.getByTestId(`criterion-name-field-${index}`);
      const criterionDescriptionInput = screen.getByTestId(`criterion-description-field-${index}`);
      const criterionMaxScoreInput = screen.getByTestId(`criterion-max-score-field-${index}`);
      const criterionWeightInput = screen.getByTestId(`criterion-weight-field-${index}`);

      expect(criterionNameInput).toHaveValue(criterion.name);
      expect(criterionDescriptionInput).toHaveValue(criterion.description);
      expect(criterionMaxScoreInput).toHaveValue(criterion.maxScore);
      expect(criterionWeightInput).toHaveValue(criterion.weight * 100);
    });
  });

  it('submits form with rubric data', async () => {
    renderComponent();

    // Fill in basic form fields
    const nameField = screen.getByTestId('name-field');
    const descriptionField = screen.getByTestId('description-field');
    const passingScoreField = screen.getByTestId('passing-score-field');

    fireEvent.change(nameField, { target: { value: 'Test Rubric' } });
    fireEvent.change(descriptionField, { target: { value: 'Test Description' } });
    fireEvent.change(passingScoreField, { target: { value: '10' } });

    // Add a criterion
    const addCriterionButton = screen.getByRole('button', { name: /add criterion/i });
    fireEvent.click(addCriterionButton);

    // Fill in criterion fields
    const criterionNameField = screen.getByTestId('criterion-name-field-0');
    const criterionDescriptionField = screen.getByTestId('criterion-description-field-0');
    const criterionMaxScoreField = screen.getByTestId('criterion-max-score-field-0');
    const criterionWeightField = screen.getByTestId('criterion-weight-field-0');

    fireEvent.change(criterionNameField, { target: { value: 'Test Criterion' } });
    fireEvent.change(criterionDescriptionField, { target: { value: 'Test Description' } });
    fireEvent.change(criterionMaxScoreField, { target: { value: '10' } });
    fireEvent.change(criterionWeightField, { target: { value: '100' } });

    // Mock successful save
    const mockResponse = { ...mockRubric };
    vi.mocked(createRubric).mockResolvedValueOnce(mockResponse);

    const submitButton = screen.getByRole('button', { name: /save rubric/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createRubric).toHaveBeenCalledWith({
        title: 'Test Rubric',
        description: 'Test Description',
        criteria: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Criterion',
            description: 'Test Description',
            maxScore: 10,
            weight: 1,
          }),
        ]),
        passingScore: 10,
      });
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(mockResponse);
  });
});
