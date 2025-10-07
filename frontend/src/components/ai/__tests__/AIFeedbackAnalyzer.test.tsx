import { fireEvent, render as renderWithProviders, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIFeedbackAnalyzer from '../AIFeedbackAnalyzer';
import { mockAnalysis, mockSubmission } from './testUtils';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  AutoAwesome: () => <span data-testid="AutoAwesomeIcon">AutoAwesome</span>,
}));

// Mock Material-UI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    CircularProgress: () => <span data-testid="circular-progress">Loading...</span>,
  };
});

// Mock the API client
vi.mock('../../../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('AIFeedbackAnalyzer', () => {
  const renderComponent = () => {
    return renderWithProviders(<AIFeedbackAnalyzer submission={mockSubmission} />);
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the component with initial state', () => {
    renderComponent();

    expect(screen.getByText(/analyze feedback/i)).toBeTruthy();
    expect(screen.getByText(/submission details/i)).toBeTruthy();
    expect(screen.getByText(mockSubmission.content)).toBeTruthy();
    expect(screen.getByText(`Grade: ${mockSubmission.grade}`)).toBeTruthy();
    expect(screen.getByText(mockSubmission.feedback)).toBeTruthy();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeTruthy();
  });

  it('handles successful analysis', async () => {
    // Mock the API response
    const { api } = await import('../../../services/api');
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockAnalysis,
    });

    renderComponent();

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    // Check for loading state
    expect(screen.getByTestId('circular-progress')).toBeTruthy();

    // Wait for analysis results
    await waitFor(() => {
      expect(screen.getByText(/good code organization/i)).toBeTruthy();
      expect(screen.getByText(/missing error handling/i)).toBeTruthy();
      expect(screen.getByText(/add try-catch blocks/i)).toBeTruthy();
      expect(screen.getByText(/implement input validation/i)).toBeTruthy();
    });
  });

  it('handles API errors during analysis', async () => {
    // Mock the API error
    const { api } = await import('../../../services/api');
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Failed to analyze feedback')
    );

    renderComponent();

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to analyze feedback/i)).toBeTruthy();
    });
  });

  it('displays submission details correctly', () => {
    renderComponent();

    expect(screen.getByText(mockSubmission.content)).toBeTruthy();
    expect(screen.getByText(`Grade: ${mockSubmission.grade}`)).toBeTruthy();
    expect(screen.getByText(mockSubmission.feedback)).toBeTruthy();
  });

  it('disables analyze button during API calls', async () => {
    // Mock the API response with a delay
    const { api } = await import('../../../services/api');
    (api.post as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderComponent();

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    // Check that button is disabled
    expect(analyzeButton.hasAttribute('disabled')).toBe(true);

    // Wait for API call to complete
    await waitFor(() => {
      expect(analyzeButton.hasAttribute('disabled')).toBe(false);
    });
  });

  it('clears previous analysis when resubmitting', async () => {
    // Mock the API response
    const { api } = await import('../../../services/api');
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockAnalysis,
    });

    renderComponent();

    // First analysis
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    // Wait for first analysis results
    await waitFor(() => {
      expect(screen.getByText(/good code organization/i)).toBeTruthy();
    });

    // Mock a different response for second analysis
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        ...mockAnalysis,
        strengths: ['Different strength'],
      },
    });

    // Second analysis
    fireEvent.click(analyzeButton);

    // Wait for second analysis results
    await waitFor(() => {
      expect(screen.getByText(/different strength/i)).toBeTruthy();
      expect(screen.queryByText(/good code organization/i)).not.toBeTruthy();
    });
  });

  it('handles empty feedback gracefully', () => {
    const emptySubmission = {
      ...mockSubmission,
      feedback: '',
    };

    renderWithProviders(<AIFeedbackAnalyzer submission={emptySubmission} />);

    expect(screen.getByText(/no feedback provided/i)).toBeTruthy();
  });

  it('handles missing grade gracefully', () => {
    const ungradedSubmission = {
      ...mockSubmission,
      grade: null,
    };

    renderWithProviders(<AIFeedbackAnalyzer submission={ungradedSubmission} />);

    expect(screen.getByText(/not graded yet/i)).toBeTruthy();
  });
});
