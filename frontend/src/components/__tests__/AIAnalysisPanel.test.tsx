import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AIAnalysisPanel from '../AIAnalysisPanel';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, sx }: any) => <div data-testid="box">{children}</div>,
  Button: ({ children, onClick, disabled, startIcon }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
      data-disabled={disabled}
      data-loading={children.props?.size === 24}
    >
      {startIcon}
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  Typography: ({ children, variant }: any) => (
    <p data-testid="typography" data-variant={variant}>
      {children}
    </p>
  ),
  Grid: ({ children, container, item, spacing, xs, sm, md }: any) => (
    <div
      data-testid="grid"
      data-container={container}
      data-item={item}
      data-spacing={spacing}
      data-xs={xs}
      data-sm={sm}
      data-md={md}
    >
      {children}
    </div>
  ),
  Tooltip: ({ children, title }: any) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  Alert: ({ children, severity }: any) => (
    <div data-testid="alert" data-severity={severity}>
      {children}
    </div>
  ),
  Divider: () => <hr data-testid="divider" />,
  CircularProgress: ({ size }: any) => <div data-testid="circular-progress" data-size={size} />,
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Assessment: () => <span data-testid="assessment-icon">Assessment</span>,
  CheckCircle: () => <span data-testid="check-circle-icon">CheckCircle</span>,
  Feedback: () => <span data-testid="feedback-icon">Feedback</span>,
  Grade: () => <span data-testid="grade-icon">Grade</span>,
}));

// Types
interface AnalysisResult {
  analysis: string;
  feedback: string;
  raw_response: string;
}

interface PlagiarismResult {
  analysis: string;
  raw_response: string;
  probability: number;
}

interface GradeResult {
  grade_analysis: string;
  raw_response: string;
  score: number;
}

interface FeedbackResult {
  content: string;
  type: string;
  created_at: string;
}

// Mock data
const mockAnalysis: AnalysisResult = {
  analysis: 'Test analysis result',
  feedback: 'Great work!',
  raw_response: 'Raw response data',
};

const mockPlagiarism: PlagiarismResult = {
  analysis: 'Test plagiarism analysis',
  raw_response: 'Raw plagiarism data',
  probability: 15,
};

const mockGrade: GradeResult = {
  grade_analysis: 'Test grade analysis',
  raw_response: 'Raw grade data',
  score: 85,
};

const mockFeedback: FeedbackResult = {
  content: 'Test feedback content',
  type: 'general',
  created_at: '2024-03-20T12:00:00Z',
};

const mockError = {
  message: 'Failed to analyze submission',
  details: 'Server error',
};

// Mock handlers
const handlers = [
  http.post('/api/submissions/:id/analyze', () => {
    return HttpResponse.json(mockAnalysis);
  }),
  http.post('/api/submissions/:id/check-plagiarism', () => {
    return HttpResponse.json(mockPlagiarism);
  }),
  http.post('/api/submissions/:id/smart-grade', () => {
    return HttpResponse.json(mockGrade);
  }),
  http.post('/api/submissions/:id/generate-feedback', () => {
    return HttpResponse.json(mockFeedback);
  }),
];

// Setup MSW server
const server = setupServer(...handlers);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AIAnalysisPanel', () => {
  const mockOnAnalysisComplete = vi.fn();
  const mockOnPlagiarismComplete = vi.fn();
  const mockOnGradeComplete = vi.fn();
  const mockOnFeedbackComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all analysis tools', () => {
    render(
      <AIAnalysisPanel
        submissionId={123}
        onAnalysisComplete={mockOnAnalysisComplete}
        onPlagiarismComplete={mockOnPlagiarismComplete}
        onGradeComplete={mockOnGradeComplete}
        onFeedbackComplete={mockOnFeedbackComplete}
      />
    );

    expect(screen.getByText('AI Analysis Tools')).toBeInTheDocument();
    expect(screen.getByText('Analyze Submission')).toBeInTheDocument();
    expect(screen.getByText('Check Plagiarism')).toBeInTheDocument();
    expect(screen.getByText('Smart Grade')).toBeInTheDocument();
    expect(screen.getByText('Generate Feedback')).toBeInTheDocument();
  });

  it('handles analyze submission successfully', async () => {
    render(<AIAnalysisPanel submissionId={123} onAnalysisComplete={mockOnAnalysisComplete} />);

    fireEvent.click(screen.getByText('Analyze Submission'));

    await waitFor(() => {
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    });

    expect(screen.getByText(mockAnalysis.analysis)).toBeInTheDocument();
    expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysis);
  });

  it('handles plagiarism check successfully', async () => {
    render(<AIAnalysisPanel submissionId={123} onPlagiarismComplete={mockOnPlagiarismComplete} />);

    fireEvent.click(screen.getByText('Check Plagiarism'));

    await waitFor(() => {
      expect(screen.getByText('Plagiarism Check')).toBeInTheDocument();
    });

    expect(screen.getByText(mockPlagiarism.analysis)).toBeInTheDocument();
    expect(
      screen.getByText(`Plagiarism Probability: ${mockPlagiarism.probability}%`)
    ).toBeInTheDocument();
    expect(mockOnPlagiarismComplete).toHaveBeenCalledWith(mockPlagiarism);
  });

  it('handles smart grade successfully', async () => {
    render(<AIAnalysisPanel submissionId={123} onGradeComplete={mockOnGradeComplete} />);

    fireEvent.click(screen.getByText('Smart Grade'));

    await waitFor(() => {
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    const cardContent = screen.getByTestId('card-content');
    expect(cardContent).toHaveTextContent('Smart Grade');
    expect(cardContent).toHaveTextContent('Score: 85');
    expect(cardContent).toHaveTextContent(mockGrade.grade_analysis);
    expect(mockOnGradeComplete).toHaveBeenCalledWith(mockGrade);
  });

  it('handles feedback generation successfully', async () => {
    render(<AIAnalysisPanel submissionId={123} onFeedbackComplete={mockOnFeedbackComplete} />);

    fireEvent.click(screen.getByText('Generate Feedback'));

    await waitFor(() => {
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    const cardContent = screen.getByTestId('card-content');
    expect(cardContent).toHaveTextContent('Generated Feedback');
    expect(cardContent).toHaveTextContent(mockFeedback.content);
    expect(cardContent).toHaveTextContent('Generated on:');
    expect(cardContent).toHaveTextContent(new Date(mockFeedback.created_at).toLocaleString());
    expect(mockOnFeedbackComplete).toHaveBeenCalledWith(mockFeedback);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.post('/api/submissions/:id/analyze', () => {
        return HttpResponse.json(mockError, { status: 500 });
      })
    );

    render(<AIAnalysisPanel submissionId={123} />);

    fireEvent.click(screen.getByText('Analyze Submission'));

    await waitFor(() => {
      expect(screen.getByText('Failed to analyze submission')).toBeInTheDocument();
    });
  });

  it('disables buttons during loading', async () => {
    render(<AIAnalysisPanel submissionId={123} />);

    const analyzeButton = screen.getByText('Analyze Submission');
    fireEvent.click(analyzeButton);

    // Check if the analyze button is disabled and shows loading state
    expect(analyzeButton).toHaveAttribute('data-disabled', 'true');
    expect(analyzeButton).toHaveAttribute('data-loading', 'true');

    // Other buttons should not be disabled
    expect(screen.getByText('Check Plagiarism')).toHaveAttribute('data-disabled', 'false');
    expect(screen.getByText('Smart Grade')).toHaveAttribute('data-disabled', 'false');
    expect(screen.getByText('Generate Feedback')).toHaveAttribute('data-disabled', 'false');

    await waitFor(() => {
      expect(analyzeButton).toHaveAttribute('data-disabled', 'false');
      expect(analyzeButton).toHaveAttribute('data-loading', 'false');
    });
  });
});
