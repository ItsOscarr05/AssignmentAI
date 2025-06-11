import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FileUpload from '../files/FileUpload';

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div {...props}>{children}</div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Typography: ({
    children,
    variant,
    color,
    align,
    sx,
  }: {
    children: React.ReactNode;
    variant?: string;
    color?: string;
    align?: string;
    sx?: any;
  }) => (
    <div data-variant={variant} data-color={color} data-align={align} style={sx}>
      {children}
    </div>
  ),
  CircularProgress: () => <div role="progressbar" data-testid="circular-progress" />,
  Paper: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div {...props}>{children}</div>
  ),
  Alert: ({ children, severity }: { children: React.ReactNode; severity: string }) => (
    <div role="alert" data-severity={severity} data-testid="alert">
      {children}
    </div>
  ),
  LinearProgress: ({ value }: { value: number }) => (
    <div role="progressbar" data-value={value} data-testid="linear-progress" />
  ),
}));

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({
    onDrop,
    maxSize,
    accept,
    multiple,
  }: {
    onDrop?: (files: File[]) => void;
    maxSize?: number;
    accept?: Record<string, string[]>;
    multiple?: boolean;
  }) => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: (e: any) => {
        const files = e.dataTransfer.files;
        // Validate file type
        if (accept && files[0]) {
          const fileType = files[0].type;
          const isValid = Object.keys(accept).some(
            type =>
              type === fileType || (type.endsWith('/*') && fileType.startsWith(type.slice(0, -2)))
          );
          if (!isValid) {
            onDrop?.([]);
            return;
          }
        }
        // Validate file size
        if (maxSize && files[0] && files[0].size > maxSize) {
          onDrop?.([]);
          return;
        }
        onDrop?.(files);
      },
    }),
    getInputProps: () => ({
      onChange: (e: any) => {
        const files = e.target.files;
        // Validate file type
        if (accept && files[0]) {
          const fileType = files[0].type;
          const isValid = Object.keys(accept).some(
            type =>
              type === fileType || (type.endsWith('/*') && fileType.startsWith(type.slice(0, -2)))
          );
          if (!isValid) {
            onDrop?.([]);
            return;
          }
        }
        // Validate file size
        if (maxSize && files[0] && files[0].size > maxSize) {
          onDrop?.([]);
          return;
        }
        onDrop?.(files);
      },
      'aria-label': 'Select Files',
    }),
    isDragActive: false,
  }),
}));

// Mock XMLHttpRequest
const mockXHR = {
  open: vi.fn(),
  send: vi.fn(() => {
    // Simulate successful upload
    mockXHR.onload?.();
    return Promise.resolve();
  }),
  upload: {
    onprogress: null as ((event: ProgressEvent) => void) | null,
  },
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  status: 200,
  responseText: JSON.stringify({ url: 'https://example.com/test.txt' }),
};

global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

// Mock data
const mockTextFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
const mockImageFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
const mockLargeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockXHR.status = 200;
    mockXHR.responseText = JSON.stringify({ url: 'https://example.com/test.txt' });
    mockXHR.onload = vi.fn();
    mockXHR.onerror = vi.fn();
  });

  it('renders upload button', () => {
    render(<FileUpload onUploadComplete={() => {}} onUploadError={() => {}} />);
    expect(screen.getByRole('button', { name: /select files/i })).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const onUploadComplete = vi.fn();
    render(<FileUpload onUploadComplete={onUploadComplete} onUploadError={() => {}} />);

    const input = screen.getByLabelText('Select Files');
    fireEvent.change(input, { target: { files: [mockTextFile] } });

    // Simulate upload progress
    const progressEvent = new ProgressEvent('progress', {
      loaded: 50,
      total: 100,
    });
    mockXHR.upload.onprogress?.(progressEvent);

    await waitFor(
      () => {
        expect(onUploadComplete).toHaveBeenCalledWith(['https://example.com/test.txt']);
      },
      { timeout: 3000 }
    );
  });

  it('validates file type', async () => {
    const onUploadError = vi.fn();
    render(
      <FileUpload
        onUploadComplete={() => {}}
        onUploadError={onUploadError}
        acceptedFileTypes={['text/plain']}
      />
    );

    const input = screen.getByLabelText('Select Files');
    fireEvent.change(input, { target: { files: [mockImageFile] } });

    await waitFor(
      () => {
        expect(onUploadError).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('validates file size', async () => {
    const onUploadError = vi.fn();
    render(
      <FileUpload
        onUploadComplete={() => {}}
        onUploadError={onUploadError}
        maxSize={10 * 1024 * 1024}
      />
    );

    const input = screen.getByLabelText('Select Files');
    fireEvent.change(input, { target: { files: [mockLargeFile] } });

    await waitFor(
      () => {
        expect(onUploadError).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('shows loading state during upload', async () => {
    render(<FileUpload onUploadComplete={() => {}} onUploadError={() => {}} />);

    const input = screen.getByLabelText('Select Files');
    fireEvent.change(input, { target: { files: [mockTextFile] } });

    // Simulate upload progress
    const progressEvent = new ProgressEvent('progress', {
      loaded: 50,
      total: 100,
    });
    mockXHR.upload.onprogress?.(progressEvent);

    await waitFor(
      () => {
        expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles upload errors', async () => {
    const onUploadError = vi.fn();
    mockXHR.status = 500;
    mockXHR.responseText = 'Server Error';

    render(<FileUpload onUploadComplete={() => {}} onUploadError={onUploadError} />);

    const input = screen.getByLabelText('Select Files');
    fireEvent.change(input, { target: { files: [mockTextFile] } });

    // Simulate XHR error
    mockXHR.onerror?.();

    await waitFor(
      () => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('supports drag and drop', async () => {
    const onUploadComplete = vi.fn();
    render(<FileUpload onUploadComplete={onUploadComplete} onUploadError={() => {}} />);

    const dropZone = screen.getByText(/drag & drop files here/i);
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, { dataTransfer: { files: [mockTextFile] } });

    // Simulate upload progress
    const progressEvent = new ProgressEvent('progress', {
      loaded: 50,
      total: 100,
    });
    mockXHR.upload.onprogress?.(progressEvent);

    await waitFor(
      () => {
        expect(onUploadComplete).toHaveBeenCalledWith(['https://example.com/test.txt']);
      },
      { timeout: 3000 }
    );
  });

  it('shows file size limit', () => {
    render(
      <FileUpload onUploadComplete={() => {}} onUploadError={() => {}} maxSize={5 * 1024 * 1024} />
    );

    expect(screen.getByText(/maximum file size: 5mb/i)).toBeInTheDocument();
  });

  it('shows accepted file types', () => {
    render(
      <FileUpload
        onUploadComplete={() => {}}
        onUploadError={() => {}}
        acceptedFileTypes={['text/plain', 'application/pdf']}
      />
    );

    expect(
      screen.getByText(/accepted file types: text\/plain, application\/pdf/i)
    ).toBeInTheDocument();
  });
});
