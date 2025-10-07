import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import AISubmissionAnalyzer from '../AISubmissionAnalyzer';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Upload: () => <span data-testid="UploadIcon">Upload</span>,
  AutoAwesome: () => <span data-testid="AutoAwesomeIcon">AutoAwesome</span>,
  Feedback: () => <span data-testid="FeedbackIcon">Feedback</span>,
}));

// Mock the LoadingSpinner component
vi.mock('../../common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock the Toast component
vi.mock('../../common/Toast', () => ({
  Toast: ({
    message,
    severity,
    onClose,
  }: {
    message: string;
    severity: string;
    onClose: () => void;
  }) => (
    <div data-testid="toast" data-severity={severity} onClick={onClose}>
      {message}
    </div>
  ),
}));

// Mock the FileUpload component
vi.mock('../../common/FileUpload', () => ({
  FileUpload: ({
    onChange,
    accept,
    maxSize,
  }: {
    onChange: (files: File[]) => void;
    accept?: string;
    maxSize?: number;
  }) => (
    <div data-testid="file-upload">
      <input
        type="file"
        accept={accept}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            if (maxSize && file.size > maxSize) {
              onChange([]);
              return;
            }
            if (accept && !accept.split(',').some(type => file.type.match(type.trim()))) {
              onChange([]);
              return;
            }
            onChange([file]);
          }
        }}
      />
    </div>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AISubmissionAnalyzer', () => {
  const mockSubmissions = [
    {
      id: '1',
      title: 'Test Submission',
      content: 'Test content',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/submissions/1']}>
          <Routes>
            <Route path="/submissions/:id" element={<AISubmissionAnalyzer />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the initial fetch for submissions
    mockFetch.mockImplementation(url => {
      if (url === '/api/submissions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmissions),
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });
  });

  it('renders the component with initial state', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
    });

    // Check for main elements
    expect(screen.getByText(/AI Submission Analyzer/i)).toBeTruthy();
    expect(screen.getByTestId('file-upload')).toBeTruthy();
    expect(screen.getByText(/Upload Submission Files/i)).toBeTruthy();
  });

  it('handles file upload and shows loading state', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
    });

    // Mock file upload
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-upload').querySelector('input');
    if (fileInput) {
      await user.upload(fileInput, file);
    }

    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('handles API errors during analysis', async () => {
    const user = userEvent.setup();

    // Mock the analyze endpoint to fail
    mockFetch.mockImplementation(url => {
      if (url === '/api/submissions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmissions),
        });
      }
      if (url === '/api/submissions/1/analyze') {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });

    renderComponent();

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
    });

    // Mock file upload
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-upload').querySelector('input');
    if (fileInput) {
      await user.upload(fileInput, file);
    }

    // First check that loading spinner appears
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();

    // Then wait for loading to complete and error message
    await waitFor(() => {
      const toast = screen.getByTestId('toast');
      expect(toast.getAttribute('data-severity')).toBe('error');
      expect(toast.textContent).toBe('Failed to analyze submission');
    });

    // Finally verify loading spinner is gone
    expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
  });

  it('handles successful analysis and shows results', async () => {
    const user = userEvent.setup();
    const mockAnalysis = {
      analysis: {
        id: '1',
        submissionId: '123',
        score: 85,
        feedback: 'Good work!',
        strengths: ['Content', 'Structure'],
        weaknesses: ['Grammar'],
        suggestions: ['Improve grammar'],
        createdAt: new Date().toISOString(),
      },
      feedback: 'Good work!',
    };

    // Mock the analyze endpoint to succeed
    mockFetch.mockImplementation(url => {
      if (url === '/api/submissions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmissions),
        });
      }
      if (url === '/api/submissions/1/analyze') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalysis),
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });

    renderComponent();

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
    });

    // Mock file upload
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-upload').querySelector('input');
    if (fileInput) {
      await user.upload(fileInput, file);
    }

    // Wait for loading to complete and results
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
      expect(screen.getByText('85%')).toBeTruthy();
      expect(screen.getByText('Good work!')).toBeTruthy();
      expect(screen.getByText('Content')).toBeTruthy();
      expect(screen.getByText('Grammar')).toBeTruthy();
    });
  });

  it('handles file type validation', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
    });

    // Try to upload an invalid file type
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('file-upload').querySelector('input');
    if (fileInput) {
      await user.upload(fileInput, file);
    }

    // Wait for error message
    await waitFor(() => {
      const toast = screen.getByTestId('toast');
      expect(toast.getAttribute('data-severity')).toBe('error');
      expect(toast.textContent).toBe('Please upload a PDF or Word document');
    });
  });

  it('handles file size validation', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).toBeFalsy();
    });

    // Create a large file (11MB)
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByTestId('file-upload').querySelector('input');
    if (fileInput) {
      await user.upload(fileInput, largeFile);
    }

    // Wait for error message
    await waitFor(() => {
      const toast = screen.getByTestId('toast');
      expect(toast.getAttribute('data-severity')).toBe('error');
      expect(toast.textContent).toBe('File size must be less than 10MB');
    });
  });
});
