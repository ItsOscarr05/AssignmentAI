import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  it('renders file upload component', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
      />
    );

    expect(screen.getByText('Drag and drop files here')).toBeTruthy();
    expect(screen.getByText('or click to select files')).toBeTruthy();

    // Check for file size text in the description element
    const description = screen.getByText((_, element) => {
      if (!element) return false;
      const text = element.textContent || '';
      return (
        element.id === 'file-upload-description' &&
        text.includes('Maximum file size:') &&
        text.includes('10') &&
        text.includes('MB')
      );
    });
    expect(description).toBeTruthy();
  });

  it('handles file selection', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload file');

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('handles file removal', () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const { rerender } = render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
      />
    );

    // First select a file
    const input = screen.getByLabelText('Upload file');
    fireEvent.change(input, { target: { files: [file] } });

    // Then rerender with the selected file
    rerender(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
        value={file}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remove test.pdf/i });
    fireEvent.click(removeButton);

    expect(mockOnFileRemove).toHaveBeenCalled();
  });

  it('displays selected file name', () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const { rerender } = render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
      />
    );

    // First select a file
    const input = screen.getByLabelText('Upload file');
    fireEvent.change(input, { target: { files: [file] } });

    // Then rerender with the selected file
    rerender(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
        value={file}
      />
    );

    expect(screen.getByTestId('file-name').textContent).toBe('test.pdf');
  });

  it('validates file type', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        accept=".pdf,.doc,.docx"
      />
    );

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Upload file');

    fireEvent.change(input, { target: { files: [file] } });

    // The component should show an error for invalid file type
    expect(screen.getByText('Invalid file type')).toBeTruthy();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });
});
