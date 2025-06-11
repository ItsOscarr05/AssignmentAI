import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  requirements: string[];
}

interface SubmissionFormProps {
  assignment: Assignment;
  onSubmit: (data: { assignmentId: string; files: File[] }) => Promise<void>;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  assignment,
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large';
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const file = selectedFiles[0];
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
      setFiles(Array.from(selectedFiles));
      setUploadStatus('File uploaded');
      setError(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return false;
      }
      return true;
    });
    setFiles(validFiles);
    setUploadStatus('Files uploaded');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (files.length === 0) {
      setError('At least one file is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        assignmentId: assignment.id,
        files,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (files.length > 0) {
      if (window.confirm('Are you sure you want to discard your changes?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <form
      onSubmit={handleSubmit}
      className={`submission-form ${theme} ${isDragging ? 'drag-active' : ''}`}
      aria-label="Submit Assignment"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="assignment-details">
        <h2>{assignment.title}</h2>
        <p>{assignment.description}</p>
        <p>Due Date: {assignment.dueDate}</p>

        <div className="requirements">
          <h3>Requirements:</h3>
          <ul>
            {assignment.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="file-upload">
        <label htmlFor="files">Upload Files:</label>
        <input
          type="file"
          id="files"
          multiple
          onChange={handleFileChange}
          disabled={disabled || isSubmitting}
          aria-required="true"
        />
        {files.length > 0 && (
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  aria-label={`Remove ${file.name}`}
                  tabIndex={0}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {uploadStatus && (
        <div className="upload-status" role="status">
          {uploadStatus}
        </div>
      )}

      {isPastDue && (
        <div className="warning-message" role="alert">
          This assignment is past due
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={disabled || isSubmitting || loading}
          className="submit-button"
          tabIndex={0}
        >
          {loading || isSubmitting ? (
            <>
              <span className="loading-spinner" role="progressbar" aria-label="Submitting" />
              Submitting...
            </>
          ) : (
            submitText
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={disabled || isSubmitting}
          className="cancel-button"
          tabIndex={0}
        >
          {cancelText}
        </button>
      </div>
    </form>
  );
};
