import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render as renderWithProviders } from '../../../test/test-utils';
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

    expect(screen.getByText(/analyze feedback/i)).toBeInTheDocument();
    expect(screen.getByText(/submission details/i)).toBeInTheDocument();
    expect(screen.getByText(mockSubmission.content)).toBeInTheDocument();
    expect(screen.getByText(`Grade: ${mockSubmission.grade}`)).toBeInTheDocument();
    expect(screen.getByText(mockSubmission.feedback)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
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
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();

    // Wait for analysis results
    await waitFor(() => {
      expect(screen.getByText(/good code organization/i)).toBeInTheDocument();
      expect(screen.getByText(/missing error handling/i)).toBeInTheDocument();
      expect(screen.getByText(/add try-catch blocks/i)).toBeInTheDocument();
      expect(screen.getByText(/implement input validation/i)).toBeInTheDocument();
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
      expect(screen.getByText(/failed to analyze feedback/i)).toBeInTheDocument();
    });
  });

  it('displays submission details correctly', () => {
    renderComponent();

    expect(screen.getByText(mockSubmission.content)).toBeInTheDocument();
    expect(screen.getByText(`Grade: ${mockSubmission.grade}`)).toBeInTheDocument();
    expect(screen.getByText(mockSubmission.feedback)).toBeInTheDocument();
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
    expect(analyzeButton).toBeDisabled();

    // Wait for API call to complete
    await waitFor(() => {
      expect(analyzeButton).not.toBeDisabled();
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
      expect(screen.getByText(/good code organization/i)).toBeInTheDocument();
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
      expect(screen.getByText(/different strength/i)).toBeInTheDocument();
      expect(screen.queryByText(/good code organization/i)).not.toBeInTheDocument();
    });
  });

  it('handles empty feedback gracefully', () => {
    const emptySubmission = {
      ...mockSubmission,
      feedback: '',
    };

    renderWithProviders(<AIFeedbackAnalyzer submission={emptySubmission} />);

    expect(screen.getByText(/no feedback provided/i)).toBeInTheDocument();
  });

  it('handles missing grade gracefully', () => {
    const ungradedSubmission = {
      ...mockSubmission,
      grade: null,
    };

    renderWithProviders(<AIFeedbackAnalyzer submission={ungradedSubmission} />);

    expect(screen.getByText(/not graded yet/i)).toBeInTheDocument();
  });
});
