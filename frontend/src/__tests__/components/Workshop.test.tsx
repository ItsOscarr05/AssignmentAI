import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Workshop from '../../pages/Workshop';
import { useWorkshopStore } from '../../services/WorkshopService';
import { theme } from '../../theme';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    TextField: ({ label, name, type, value, onChange, required, placeholder }: any) => (
      <div>
        <label htmlFor={name}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <input
          id={name}
          name={name}
          type={type || 'text'}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
        />
      </div>
    ),
    Alert: ({ children, severity }: { children: React.ReactNode; severity: string }) => (
      <div role="alert" data-severity={severity}>
        {children}
      </div>
    ),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock @mui/icons-material
vi.mock('@mui/icons-material', () => ({
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  Link: () => <span data-testid="link-icon">Link</span>,
  Send: () => <span data-testid="send-icon">Send</span>,
  History: () => <span data-testid="history-icon">History</span>,
  Lightbulb: () => <span data-testid="lightbulb-icon">Lightbulb</span>,
  Description: () => <span data-testid="description-icon">Description</span>,
  Assessment: () => <span data-testid="assessment-icon">Assessment</span>,
  Analytics: () => <span data-testid="analytics-icon">Analytics</span>,
  Speed: () => <span data-testid="speed-icon">Speed</span>,
  CloudUpload: () => <span data-testid="cloud-upload-icon">CloudUpload</span>,
}));

vi.mock('../../services/WorkshopService', () => ({
  useWorkshopStore: vi.fn(),
}));

describe('Workshop Component', () => {
  const mockGenerateContent = vi.fn();
  const mockAddFile = vi.fn();
  const mockAddLink = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkshopStore as any).mockReturnValue({
      generateContent: mockGenerateContent,
      addFile: mockAddFile,
      addLink: mockAddLink,
      error: null,
      isLoading: false,
    });
  });

  it('renders workshop interface', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('AI Workshop')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useWorkshopStore as any).mockReturnValue({
      generateContent: mockGenerateContent,
      addFile: mockAddFile,
      addLink: mockAddLink,
      error: null,
      isLoading: true,
    });

    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to process request';
    (useWorkshopStore as any).mockReturnValue({
      generateContent: mockGenerateContent,
      addFile: mockAddFile,
      addLink: mockAddLink,
      error: errorMessage,
      isLoading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles content generation', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    const input = screen.getByPlaceholderText('Type your assignment or question here...');
    const submitButton = screen.getByRole('button', { name: /^send send$/i });

    fireEvent.change(input, { target: { value: 'Test content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalledWith('Test content');
    });
  });

  it('handles file upload', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    // Switch to files tab
    fireEvent.click(screen.getByText('Files'));

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Upload Files');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockAddFile).toHaveBeenCalledWith(file);
    });
  });

  it('handles link addition', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    // Switch to links tab
    fireEvent.click(screen.getByText('Links'));

    const urlInput = screen.getByPlaceholderText('Enter URL...');

    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    // Submit the form
    const form = urlInput.closest('form');
    if (!form) throw new Error('Form not found');

    fireEvent.submit(form, {
      target: {
        url: { value: 'https://example.com' },
      },
    });

    await waitFor(() => {
      expect(mockAddLink).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'https://example.com',
        description: 'Link to https://example.com',
      });
    });
  });

  it('displays recent history', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('Recent History')).toBeInTheDocument();
    expect(screen.getByText('Math Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('History Essay Outline')).toBeInTheDocument();
    expect(screen.getByText('Science Project Research')).toBeInTheDocument();
  });

  it('displays AI suggestions', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Start with an outline')).toBeInTheDocument();
    expect(screen.getByText('Use examples')).toBeInTheDocument();
  });

  it('displays supported file types', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('Supported File Types')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
    expect(screen.getByText('TXT')).toBeInTheDocument();
    expect(screen.getByText('RTF')).toBeInTheDocument();
  });

  it('displays document stats', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('Document Stats')).toBeInTheDocument();
    expect(screen.getByText('Word Count')).toBeInTheDocument();
    expect(screen.getByText('Reading Time')).toBeInTheDocument();
    expect(screen.getByText('Complexity')).toBeInTheDocument();
  });

  it('displays AI analysis options', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('AI Analysis Options')).toBeInTheDocument();
    expect(screen.getByText('Grammar & Style')).toBeInTheDocument();
    expect(screen.getByText('Content Analysis')).toBeInTheDocument();
    expect(screen.getByText('Plagiarism Check')).toBeInTheDocument();
  });

  it('displays quick actions', () => {
    render(
      <ThemeProvider theme={theme}>
        <Workshop />
      </ThemeProvider>
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Rewrite')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.getByText('Simplify')).toBeInTheDocument();
  });
});
