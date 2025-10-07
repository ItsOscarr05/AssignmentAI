import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assignments } from '../../../services/api';
import { theme } from '../../../theme';
import { AssignmentGenerationResponse } from '../../../types/ai';
import AIAssignmentGenerator from '../AIAssignmentGenerator';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="AddIcon">Add</span>,
  AutoAwesome: () => <span data-testid="AutoAwesomeIcon">AutoAwesome</span>,
  Delete: () => <span data-testid="DeleteIcon">Delete</span>,
}));

// Mock the API module first
vi.mock('../../../services/api', () => ({
  assignments: {
    generateAssignment: vi.fn(),
  },
}));

// Then get the mocked functions
const mockGenerateAssignment = vi.mocked(assignments.generateAssignment);

describe('AIAssignmentGenerator', () => {
  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <AIAssignmentGenerator />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    renderComponent();

    expect(screen.getByTestId('assignment-form')).toBeTruthy();
    expect(screen.getByLabelText(/title/i)).toBeTruthy();
    expect(screen.getByLabelText(/description/i)).toBeTruthy();
    expect(screen.getByLabelText(/subject/i)).toBeTruthy();
    expect(screen.getByLabelText(/difficulty level/i)).toBeTruthy();
    expect(screen.getByText(/learning objectives/i)).toBeTruthy();
    expect(screen.getByText(/requirements/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /generate assignment/i })).toBeTruthy();
  });

  it('validates required fields before submission', async () => {
    renderComponent();

    // Submit form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /generate assignment/i }));

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeTruthy();
      expect(screen.getByText(/description is required/i)).toBeTruthy();
      expect(screen.getByText(/subject is required/i)).toBeTruthy();
    });
  });

  it('handles successful assignment generation', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      id: '123',
      content: 'Generated assignment content',
      metadata: {
        wordCount: 500,
        estimatedTime: 30,
        difficulty: 'Intermediate',
        topics: ['Mathematics', 'Algebra'],
      },
      createdAt: new Date().toISOString(),
      success: true,
    };
    mockGenerateAssignment.mockResolvedValue(mockResponse);

    renderComponent();

    // Fill in the form
    const textFields = screen.getAllByTestId('text-field');
    await user.type(textFields[0], 'Test Assignment'); // Title
    await user.type(textFields[1], 'Test Description'); // Description
    await user.type(textFields[2], 'Mathematics'); // Subject
    await user.type(textFields[3], 'Test Requirement'); // Requirement
    await user.type(textFields[4], 'Test Objective'); // Learning Objective

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /generate assignment/i });
    await user.click(generateButton);

    // Wait for the success message
    await waitFor(() => {
      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar.getAttribute('data-severity')).toBe('success');
    });

    expect(mockGenerateAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Assignment',
        description: 'Test Description',
        subject: 'Mathematics',
      })
    );
  });

  it('handles API errors during generation', async () => {
    const user = userEvent.setup();
    mockGenerateAssignment.mockRejectedValue(new Error('API Error'));

    renderComponent();

    // Fill in the form
    const textFields = screen.getAllByTestId('text-field');
    await user.type(textFields[0], 'Test Assignment'); // Title
    await user.type(textFields[1], 'Test Description'); // Description
    await user.type(textFields[2], 'Mathematics'); // Subject
    await user.type(textFields[3], 'Test Requirement'); // Requirement
    await user.type(textFields[4], 'Test Objective'); // Learning Objective

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /generate assignment/i });
    await user.click(generateButton);

    // Wait for error message
    await waitFor(() => {
      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar.getAttribute('data-severity')).toBe('error');
    });
  });

  it('allows adding and removing requirements', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Add a requirement
    await user.click(screen.getByText(/add requirement/i));
    const textFields = screen.getAllByTestId('text-field');
    const requirementFields = textFields.filter(field =>
      field.getAttribute('label')?.includes('Requirement')
    );
    expect(requirementFields).toHaveLength(2);

    // Remove the requirement
    const removeButtons = screen.getAllByTestId('DeleteIcon');
    await user.click(removeButtons[0]);
    const remainingFields = screen.getAllByTestId('text-field');
    const remainingRequirementFields = remainingFields.filter(field =>
      field.getAttribute('label')?.includes('Requirement')
    );
    expect(remainingRequirementFields).toHaveLength(1);
  });

  it('allows adding and removing learning objectives', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Add a learning objective
    await user.click(screen.getByText(/add learning objective/i));
    const textFields = screen.getAllByTestId('text-field');
    const objectiveFields = textFields.filter(field =>
      field.getAttribute('label')?.includes('Learning Objective')
    );
    expect(objectiveFields).toHaveLength(2);

    // Remove the learning objective
    const removeButtons = screen.getAllByTestId('DeleteIcon');
    await user.click(removeButtons[1]);
    const remainingFields = screen.getAllByTestId('text-field');
    const remainingObjectiveFields = remainingFields.filter(field =>
      field.getAttribute('label')?.includes('Learning Objective')
    );
    expect(remainingObjectiveFields).toHaveLength(1);
  });

  it('validates minimum number of requirements and objectives', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Try to submit without any requirements or objectives
    await user.click(screen.getByRole('button', { name: /generate assignment/i }));

    // Check for validation messages
    await waitFor(() => {
      const textFields = screen.getAllByTestId('text-field');
      const requirementField = textFields.find(field =>
        field.getAttribute('label')?.includes('Requirement')
      );
      const objectiveField = textFields.find(field =>
        field.getAttribute('label')?.includes('Learning Objective')
      );

      expect(requirementField).toBeTruthy();
      expect(requirementField!.getAttribute('helpertext')).toBe(
        'At least one requirement is required'
      );
      expect(objectiveField).toBeTruthy();
      expect(objectiveField!.getAttribute('helpertext')).toBe(
        'At least one learning objective is required'
      );
    });
  });

  it('disables the generate button during API calls', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: AssignmentGenerationResponse) => void;
    mockGenerateAssignment.mockImplementation(
      () =>
        new Promise<AssignmentGenerationResponse>(resolve => {
          resolvePromise = resolve;
        })
    );

    renderComponent();

    // Fill in the form
    const textFields = screen.getAllByTestId('text-field');
    await user.type(textFields[0], 'Test Assignment'); // Title
    await user.type(textFields[1], 'Test Description'); // Description
    await user.type(textFields[2], 'Mathematics'); // Subject
    await user.type(textFields[3], 'Test Requirement'); // Requirement
    await user.type(textFields[4], 'Test Objective'); // Learning Objective

    // Submit the form
    const generateButton = screen.getByRole('button', { name: /generate assignment/i });
    await user.click(generateButton);

    // Wait for the loading state to be set and button to be disabled
    await waitFor(() => {
      expect(generateButton.hasAttribute('disabled')).toBe(true);
    });

    // Resolve the promise to clean up
    resolvePromise!({
      id: '123',
      content: 'Generated assignment content',
      metadata: {
        wordCount: 500,
        estimatedTime: 30,
        difficulty: 'Intermediate',
        topics: ['Mathematics', 'Algebra'],
      },
      createdAt: new Date().toISOString(),
      success: true,
    });
  });
});
