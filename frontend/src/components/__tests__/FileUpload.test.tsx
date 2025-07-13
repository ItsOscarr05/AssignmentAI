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
    onDropRejected,
    maxSize,
    accept,
  }: {
    onDrop?: (files: File[]) => void;
    onDropRejected?: (fileRejections: any[]) => void;
    maxSize?: number;
    accept?: Record<string, string[]>;
  }) => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: (e: any) => {
        const files = e.dataTransfer.files;
        let rejected = false;
        // Validate file type
        if (accept && files[0]) {
          const fileType = files[0].type;
          const isValid = Object.keys(accept).some(
            type =>
              type === fileType || (type.endsWith('/*') && fileType.startsWith(type.slice(0, -2)))
          );
          if (!isValid) {
            rejected = true;
            onDropRejected?.([{ file: files[0], errors: [{ message: 'Invalid file type' }] }]);
            return;
          }
        }
        // Validate file size
        if (maxSize && files[0] && files[0].size > maxSize) {
          rejected = true;
          onDropRejected?.([{ file: files[0], errors: [{ message: 'File is too large' }] }]);
          return;
        }
        if (!rejected) {
          onDrop?.(files);
        }
      },
    }),
    getInputProps: () => ({
      onChange: (e: any) => {
        const files = e.target.files;
        let rejected = false;
        // Validate file type
        if (accept && files[0]) {
          const fileType = files[0].type;
          const isValid = Object.keys(accept).some(
            type =>
              type === fileType || (type.endsWith('/*') && fileType.startsWith(type.slice(0, -2)))
          );
          if (!isValid) {
            rejected = true;
            onDropRejected?.([{ file: files[0], errors: [{ message: 'Invalid file type' }] }]);
            return;
          }
        }
        // Validate file size
        if (maxSize && files[0] && files[0].size > maxSize) {
          rejected = true;
          onDropRejected?.([{ file: files[0], errors: [{ message: 'File is too large' }] }]);
          return;
        }
        if (!rejected) {
          onDrop?.(files);
        }
      },
      'aria-label': 'Select Files',
    }),
    isDragActive: false,
  }),
}));

// Improved XMLHttpRequest mock
class MockXHR {
  static lastInstance: any;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  upload = {
    onprogress: null as ((event: ProgressEvent) => void) | null,
  };
  status = 200;
  responseText = JSON.stringify({ url: 'https://example.com/test.txt' });
  open = vi.fn();
  send = vi.fn(() => {
    setTimeout(() => {
      if (this.status === 200) {
        this.onload?.();
      } else {
        this.onerror?.();
      }
    }, 10);
    return Promise.resolve();
  });
}
global.XMLHttpRequest = vi.fn(() => {
  const xhr = new MockXHR();
  MockXHR.lastInstance = xhr;
  return xhr;
}) as any;

// Mock data
const mockTextFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
const mockImageFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
const mockLargeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    // Wait for MockXHR instance
    await waitFor(() => {
      if (!MockXHR.lastInstance) throw new Error('No XHR instance yet');
    });
    MockXHR.lastInstance.status = 200;
    MockXHR.lastInstance.responseText = JSON.stringify({ url: 'https://example.com/test.txt' });
    MockXHR.lastInstance.onload = vi.fn();
    MockXHR.lastInstance.onerror = vi.fn();

    // Simulate upload progress
    const progressEvent = new ProgressEvent('progress', {
      loaded: 50,
      total: 100,
    });
    MockXHR.lastInstance.upload.onprogress?.(progressEvent);

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
    // No XHR needed for this test
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
    // No XHR needed for this test
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
    // Wait for MockXHR instance
    await waitFor(() => {
      if (!MockXHR.lastInstance) throw new Error('No XHR instance yet');
    });
    MockXHR.lastInstance.status = 200;
    MockXHR.lastInstance.responseText = JSON.stringify({ url: 'https://example.com/test.txt' });
    MockXHR.lastInstance.onload = vi.fn();
    MockXHR.lastInstance.onerror = vi.fn();

    // Simulate upload progress
    const progressEvent = new ProgressEvent('progress', {
      loaded: 50,
      total: 100,
    });
    MockXHR.lastInstance.upload.onprogress?.(progressEvent);

    await waitFor(
      () => {
        expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles upload errors', async () => {
    const onUploadError = vi.fn();
    render(<FileUpload onUploadComplete={() => {}} onUploadError={onUploadError} />);

    const input = screen.getByLabelText('Select Files');
    fireEvent.change(input, { target: { files: [mockTextFile] } });
    // Wait for MockXHR instance
    await waitFor(() => {
      if (!MockXHR.lastInstance) throw new Error('No XHR instance yet');
    });
    MockXHR.lastInstance.status = 500;
    MockXHR.lastInstance.responseText = 'Server Error';
    MockXHR.lastInstance.onload = vi.fn();
    MockXHR.lastInstance.onerror = vi.fn();

    // Simulate XHR error
    MockXHR.lastInstance.onerror?.();

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

    // Simulate drag and drop
    const root = screen.getByText(/drag & drop files here/i).parentElement;
    const dataTransfer = {
      files: [mockTextFile],
    };
    fireEvent.drop(root!, { dataTransfer });
    // Wait for MockXHR instance
    await waitFor(() => {
      if (!MockXHR.lastInstance) throw new Error('No XHR instance yet');
    });
    MockXHR.lastInstance.status = 200;
    MockXHR.lastInstance.responseText = JSON.stringify({ url: 'https://example.com/test.txt' });
    MockXHR.lastInstance.onload = vi.fn();
    MockXHR.lastInstance.onerror = vi.fn();

    // Simulate upload progress
    const progressEvent = new ProgressEvent('progress', {
      loaded: 50,
      total: 100,
    });
    MockXHR.lastInstance.upload.onprogress?.(progressEvent);

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
    expect(screen.getByText(/maximum file size/i)).toHaveTextContent('Maximum file size: 5MB');
  });

  it('shows accepted file types', () => {
    render(
      <FileUpload
        onUploadComplete={() => {}}
        onUploadError={() => {}}
        acceptedFileTypes={['application/pdf', 'image/*']}
      />
    );
    expect(screen.getByText(/accepted file types/i)).toHaveTextContent(
      'Accepted file types: application/pdf, image/*'
    );
  });
});
