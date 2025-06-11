import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { theme } from '../../../theme';

// Mock data
export const mockSubmission = {
  id: '1',
  assignmentId: '1',
  studentId: 'user1',
  content: "Here's my implementation...",
  status: 'submitted',
  grade: 85,
  feedback: 'Good work!',
  submittedAt: '2024-03-10T00:00:00Z',
  updatedAt: '2024-03-10T00:00:00Z',
};

export const mockAnalysis = {
  score: 85,
  strengths: ['Good code organization', 'Clear variable names'],
  weaknesses: ['Missing error handling', 'Limited documentation'],
  suggestions: [
    'Add try-catch blocks for error handling',
    'Include more inline comments',
    'Consider adding unit tests',
  ],
  improvements: ['Implement input validation', 'Add logging for debugging', 'Optimize performance'],
};

// Test utilities
export const renderWithRouter = (ui: React.ReactElement, { route = '/', path = '/' } = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

// Mock Material-UI components
export const mockMaterialUI = {
  icons: {
    CheckCircle: () => <span data-testid="CheckCircleIcon">CheckCircle</span>,
    CloudUpload: () => <span data-testid="CloudUploadIcon">CloudUpload</span>,
    Lightbulb: () => <span data-testid="LightbulbIcon">Lightbulb</span>,
    Save: () => <span data-testid="SaveIcon">Save</span>,
    Warning: () => <span data-testid="WarningIcon">Warning</span>,
  },
  components: {
    LoadingSpinner: () => (
      <div data-testid="circular-progress" role="progressbar">
        Loading...
      </div>
    ),
    Toast: ({ message, severity }: { message: string; severity: string }) => (
      <div role="alert" data-severity={severity}>
        {message}
      </div>
    ),
    FileUpload: ({ onChange }: { onChange: (files: File[]) => void }) => (
      <div>
        <input
          type="file"
          aria-label="Upload file"
          onChange={e => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            onChange(files);
          }}
        />
      </div>
    ),
  },
};

// Mock fetch responses
export const mockFetchResponses = {
  submissions: {
    ok: true,
    json: () => Promise.resolve([mockSubmission]),
  },
  feedback: {
    ok: true,
    json: () => Promise.resolve({ analysis: mockAnalysis, feedback: 'Test feedback' }),
  },
  analyze: {
    ok: true,
    json: () => Promise.resolve({ analysis: mockAnalysis, feedback: 'Test feedback' }),
  },
  error: {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
  },
};

// Test setup utilities
export const setupTest = () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  return {
    mockFetch,
    renderWithRouter,
    mockMaterialUI,
    mockFetchResponses,
  };
};
