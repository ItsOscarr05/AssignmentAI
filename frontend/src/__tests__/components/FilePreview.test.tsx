import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FilePreview from '../../components/files/FilePreview';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, component, src, alt }: any) => {
    if (component === 'img') {
      return <img src={src} alt={alt} data-testid="preview-image" />;
    }
    if (component === 'iframe') {
      return <iframe src={src} data-testid="pdf-preview" />;
    }
    return <div>{children}</div>;
  },
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-variant={variant}>{children}</div>
  ),
  IconButton: ({
    children,
    onClick,
    title,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    title?: string;
  }) => (
    <button onClick={onClick} title={title}>
      {children}
    </button>
  ),
  Alert: ({ children, severity }: { children: React.ReactNode; severity?: string }) => (
    <div data-severity={severity}>{children}</div>
  ),
  Paper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CircularProgress: () => <div role="progressbar" data-testid="loading-spinner" />,
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Image: () => <span data-testid="ImageIcon">Image</span>,
  PictureAsPdf: () => <span data-testid="PdfIcon">PDF</span>,
  Description: () => <span data-testid="DescriptionIcon">Description</span>,
  Close: () => <span data-testid="CloseIcon">Close</span>,
  Download: () => <span data-testid="DownloadIcon">Download</span>,
}));

// Mock data
const mockFile = {
  fileUrl: 'https://example.com/test.pdf',
  fileName: 'test.pdf',
  fileType: 'application/pdf',
};

// Mock fetch for text files
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a mock Response
const createMockResponse = (data: any) => ({
  ok: true,
  text: () => Promise.resolve(data),
  json: () => Promise.resolve(data),
  clone: () => createMockResponse(data),
});

describe('FilePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('renders file name', () => {
    render(<FilePreview {...mockFile} onClose={() => {}} />);
    expect(screen.getByText('test.pdf')).toBeTruthy();
  });

  it('renders file type icon', () => {
    render(<FilePreview {...mockFile} onClose={() => {}} />);
    expect(screen.getByTestId('pdf-preview')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<FilePreview {...mockFile} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    render(<FilePreview {...mockFile} onClose={() => {}} onDownload={onDownload} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(onDownload).toHaveBeenCalled();
  });

  it('shows loading state while fetching preview', async () => {
    const textFile = {
      ...mockFile,
      fileType: 'text/plain',
      fileUrl: 'https://example.com/test.txt',
    };

    // Mock a delayed response for text file
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(createMockResponse('Sample text content')), 100)
        )
    );

    render(<FilePreview {...textFile} onClose={() => {}} />);

    // Check for loading state immediately
    const loadingSpinner = screen.getByTestId('loading-spinner');
    expect(loadingSpinner).toBeTruthy();
  });

  it('renders file preview for image files', () => {
    const imageFile = {
      ...mockFile,
      fileType: 'image/jpeg',
      fileUrl: 'https://example.com/test.jpg',
    };

    render(<FilePreview {...imageFile} onClose={() => {}} />);
    expect(screen.getByTestId('preview-image').getAttribute('src')).toBe(imageFile.fileUrl);
  });

  it('renders file preview for PDF files', () => {
    render(<FilePreview {...mockFile} onClose={() => {}} />);
    expect(screen.getByTestId('pdf-preview')).toBeTruthy();
  });

  it('renders file preview for text files', async () => {
    const textFile = {
      ...mockFile,
      fileType: 'text/plain',
      fileUrl: 'https://example.com/test.txt',
    };

    // Mock a successful text file response
    mockFetch.mockResolvedValueOnce(createMockResponse('Sample text content'));

    render(<FilePreview {...textFile} onClose={() => {}} />);

    // Wait for loading to complete and content to appear
    const content = await screen.findByText('Sample text content');
    expect(content).toBeTruthy();
  });
});
