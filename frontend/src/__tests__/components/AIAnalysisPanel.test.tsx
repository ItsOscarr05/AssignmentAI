import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenLimitProvider } from '../../contexts/TokenLimitContext';
import AIAnalysisPanel from '../AIAnalysisPanel';

// Mock the TokenLimitContext
vi.mock('../../contexts/TokenLimitContext', () => ({
  TokenLimitProvider: ({ children }: any) => (
    <div data-testid="token-limit-provider">{children}</div>
  ),
  useTokenLimitContext: () => ({
    subscription: { plan: 'basic', tokens: 1000 },
    tokenUsage: { used: 100, remaining: 900 },
    loading: false,
    error: null,
    checkTokenLimit: (tokensNeeded: number) => ({
      hasEnoughTokens: true,
      remainingTokens: 900,
      tokensNeeded,
    }),
    refreshTokenData: vi.fn(),
    hasEnoughTokens: () => true,
  }),
}));

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Button: ({ children, onClick, disabled, startIcon }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
      data-disabled={disabled}
      data-loading={startIcon?.props?.size === 20}
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
  http.post('/api/submissions/:id/plagiarism', () => {
    return HttpResponse.json(mockPlagiarism);
  }),
  http.post('/api/submissions/:id/grade', () => {
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

  const renderWithProvider = (props: any) => {
    return render(
      <TokenLimitProvider>
        <AIAnalysisPanel {...props} />
      </TokenLimitProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all analysis tools', () => {
    renderWithProvider({
      submissionId: 123,
      onAnalysisComplete: mockOnAnalysisComplete,
      onPlagiarismComplete: mockOnPlagiarismComplete,
      onGradeComplete: mockOnGradeComplete,
      onFeedbackComplete: mockOnFeedbackComplete,
    });

    expect(screen.getByText('AI Analysis Tools')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze submission/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check plagiarism/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grade submission/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate feedback/i })).toBeInTheDocument();
  });

  it('handles analyze submission successfully', async () => {
    renderWithProvider({ submissionId: 123, onAnalysisComplete: mockOnAnalysisComplete });

    const analyzeButton = screen.getByRole('button', { name: /analyze submission/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysis);
    });
  });

  it('handles plagiarism check successfully', async () => {
    renderWithProvider({ submissionId: 123, onPlagiarismComplete: mockOnPlagiarismComplete });

    const plagiarismButton = screen.getByRole('button', { name: /check plagiarism/i });
    fireEvent.click(plagiarismButton);

    await waitFor(() => {
      expect(mockOnPlagiarismComplete).toHaveBeenCalledWith(mockPlagiarism);
    });
  });

  it('handles smart grade successfully', async () => {
    renderWithProvider({ submissionId: 123, onGradeComplete: mockOnGradeComplete });

    const gradeButton = screen.getByRole('button', { name: /grade submission/i });
    fireEvent.click(gradeButton);

    await waitFor(() => {
      expect(mockOnGradeComplete).toHaveBeenCalledWith(mockGrade);
    });
  });

  it('handles feedback generation successfully', async () => {
    renderWithProvider({ submissionId: 123, onFeedbackComplete: mockOnFeedbackComplete });

    const feedbackButton = screen.getByRole('button', { name: /generate feedback/i });
    fireEvent.click(feedbackButton);

    await waitFor(() => {
      expect(mockOnFeedbackComplete).toHaveBeenCalledWith(mockFeedback);
    });
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.post('/api/submissions/:id/analyze', () => {
        return HttpResponse.json(mockError, { status: 500 });
      })
    );

    renderWithProvider({ submissionId: 123 });

    const analyzeButton = screen.getByRole('button', { name: /analyze submission/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to analyze submission')).toBeInTheDocument();
    });
  });

  it('disables buttons during loading', async () => {
    renderWithProvider({ submissionId: 123 });

    const analyzeButton = screen.getByRole('button', { name: /analyze submission/i });
    fireEvent.click(analyzeButton);

    // Check if the analyze button is disabled and shows loading state
    expect(analyzeButton).toHaveAttribute('data-disabled', 'true');
    expect(analyzeButton).toHaveAttribute('data-loading', 'true');

    // Other buttons should not be disabled
    expect(screen.getByRole('button', { name: /check plagiarism/i })).toHaveAttribute(
      'data-disabled',
      'false'
    );
    expect(screen.getByRole('button', { name: /grade submission/i })).toHaveAttribute(
      'data-disabled',
      'false'
    );
    expect(screen.getByRole('button', { name: /generate feedback/i })).toHaveAttribute(
      'data-disabled',
      'false'
    );

    await waitFor(() => {
      expect(analyzeButton).toHaveAttribute('data-disabled', 'false');
      expect(analyzeButton).toHaveAttribute('data-loading', 'false');
    });
  });
});
