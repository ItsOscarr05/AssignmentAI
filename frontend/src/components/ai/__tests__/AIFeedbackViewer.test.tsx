import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import AIFeedbackViewer from '../AIFeedbackViewer';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  CheckCircle: () => <span data-testid="CheckCircleIcon">CheckCircle</span>,
  Close: () => <span data-testid="CloseIcon">Close</span>,
  Download: () => <span data-testid="DownloadIcon">Download</span>,
  Lightbulb: () => <span data-testid="LightbulbIcon">Lightbulb</span>,
  Print: () => <span data-testid="PrintIcon">Print</span>,
  Share: () => <span data-testid="ShareIcon">Share</span>,
  Warning: () => <span data-testid="WarningIcon">Warning</span>,
}));

// Mock LoadingSpinner component
vi.mock('../common/LoadingSpinner', () => ({
  default: () => (
    <div data-testid="circular-progress" role="progressbar">
      Loading...
    </div>
  ),
}));

// Mock Toast component
vi.mock('../common/Toast', () => ({
  Toast: ({ message, severity }: { message: string; severity: string }) => (
    <div role="alert" data-severity={severity}>
      {message}
    </div>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.print
const mockPrint = vi.fn();
window.print = mockPrint;

// Mock window.navigator.share
const mockShare = vi.fn();
Object.assign(navigator, {
  share: mockShare,
});

describe('AIFeedbackViewer', () => {
  const mockAnalysis = {
    id: '1',
    submissionId: '1',
    score: 85,
    feedback: 'Test feedback content',
    detailedAnalysis: 'Detailed analysis of the submission',
    strengths: ['Good code organization', 'Clear variable names'],
    weaknesses: ['Missing error handling', 'Limited documentation'],
    suggestions: ['Suggestion 1', 'Suggestion 2'],
    createdAt: '2024-03-15T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for feedback endpoint
    mockFetch.mockImplementation(url => {
      if (url === '/api/ai/feedback/1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalysis),
        });
      }
      if (url === '/api/submissions/1/download-feedback') {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' })),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/feedback/1']}>
          <Routes>
            <Route path="/feedback/:id" element={<AIFeedbackViewer />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders feedback viewer correctly', async () => {
    renderComponent();

    // Check for loading state
    expect(screen.getByTestId('circular-progress')).toBeTruthy();

    // Wait for feedback content to load
    await waitFor(() => {
      expect(screen.getByText('Your Score')).toBeTruthy();
    });

    // Check for score
    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText('Pass')).toBeTruthy();

    // Check for strengths
    expect(screen.getByText('Good code organization')).toBeTruthy();
    expect(screen.getByText('Clear variable names')).toBeTruthy();

    // Check for weaknesses
    expect(screen.getByText('Missing error handling')).toBeTruthy();
    expect(screen.getByText('Limited documentation')).toBeTruthy();

    // Check for feedback content
    expect(screen.getByText('Test feedback content')).toBeTruthy();

    // Check for suggestions
    expect(screen.getByText('Suggestion 1')).toBeTruthy();
    expect(screen.getByText('Suggestion 2')).toBeTruthy();
  });

  it('displays loading state while fetching data', () => {
    renderComponent();
    expect(screen.getByTestId('circular-progress')).toBeTruthy();
  });

  it('displays error message when API call fails', async () => {
    // Override the default mock for this test
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Failed to fetch')));

    renderComponent();

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('data-severity')).toBe('error');
      expect(alert.textContent).toBe('Failed to load feedback');
    });
  });

  it('displays "No feedback available" when analysis is null', async () => {
    // Override the default mock for this test
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No feedback available')).toBeTruthy();
    });
  });

  it('opens print dialog when print button is clicked', async () => {
    renderComponent();

    // Wait for feedback content to load
    await waitFor(() => {
      expect(screen.getByText('Your Score')).toBeTruthy();
    });

    const printButton = screen.getByTitle('Print Feedback');
    fireEvent.click(printButton);
    expect(mockPrint).toHaveBeenCalled();
  });

  it('allows sharing feedback when Web Share API is available', async () => {
    renderComponent();

    // Wait for feedback content to load
    await waitFor(() => {
      expect(screen.getByText('Your Score')).toBeTruthy();
    });

    const shareButton = screen.getByTitle('Share Feedback');
    fireEvent.click(shareButton);
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Assignment Feedback',
      text: expect.stringContaining('submission 1'),
      url: expect.any(String),
    });
  });

  it('falls back to clipboard copy when Web Share API is not available', async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn(),
    };
    Object.assign(navigator, {
      clipboard: mockClipboard,
      share: undefined,
    });

    renderComponent();

    // Wait for feedback content to load
    await waitFor(() => {
      expect(screen.getByText('Your Score')).toBeTruthy();
    });

    const shareButton = screen.getByTitle('Share Feedback');
    fireEvent.click(shareButton);
    expect(mockClipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Link copied to clipboard')).toBeTruthy();
  });

  it('handles download feedback', async () => {
    renderComponent();

    // Wait for feedback content to load
    await waitFor(() => {
      expect(screen.getByText('Your Score')).toBeTruthy();
    });

    const downloadButton = screen.getByTitle('Download Feedback');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/submissions/1/download-feedback');
    });
  });
});
