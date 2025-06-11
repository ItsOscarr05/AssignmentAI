import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  Google as GoogleIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { Alert, Box, Button, IconButton, LinearProgress, Paper, Typography } from '@mui/material';
import React, { useRef, useState } from 'react';
import { GoogleDocsIntegration } from '../files/GoogleDocsIntegration';

interface FileUploadProps {
  files?: File[];
  value?: File | File[];
  onChange?: (files: File[]) => void;
  onFileSelect?: (file: File) => void;
  onFileRemove?: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  success?: string;
  reset?: boolean;
  onUpload?: (files: File[]) => void;
  onCancel?: () => void;
  onDrop?: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
}

export const FileUpload: React.FC<
  FileUploadProps & { title?: string; description?: string; buttonText?: string }
> = ({
  files = [],
  value,
  onChange,
  onFileSelect,
  onFileRemove,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  error,
  loading = false,
  success,
  reset = false,
  onUpload,
  onCancel,
  onDrop,
  onDragEnter,
  onDragLeave,
  title,
  description,
  buttonText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [errorState, setErrorState] = useState<string | undefined>(undefined);
  const [showGoogleDocs, setShowGoogleDocs] = useState(false);

  // Use value if provided, otherwise use files, otherwise use internalFiles
  const displayedFiles = value
    ? Array.isArray(value)
      ? value
      : [value]
    : files.length > 0
    ? files
    : internalFiles;

  React.useEffect(() => {
    if (reset) {
      setInternalFiles([]);
      if (onCancel) onCancel();
    }
  }, [reset, onCancel]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
      if (onDragEnter) onDragEnter();
    } else if (e.type === 'dragleave') {
      setDragActive(false);
      if (onDragLeave) onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
    if (onDrop) onDrop(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFiles(Array.from(selectedFiles));
    }
  };

  const isFileTypeValid = (file: File) => {
    if (accept === '*/*') return true;
    const acceptedTypes = accept.split(',').map(type => type.trim());
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.endsWith(type);
      } else if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      } else {
        return file.type === type;
      }
    });
  };

  const handleFiles = (newFiles: File[]) => {
    // First check total size if multiple files are allowed
    if (multiple) {
      const allFiles = [...displayedFiles, ...newFiles];
      const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > maxSize) {
        setErrorState('Total file size exceeds limit');
        if (onChange) {
          onChange([]);
        } else {
          setInternalFiles([]);
        }
        return;
      }
    }

    // Then validate individual files
    let validFiles: File[] = [];
    for (const file of newFiles) {
      if (!isFileTypeValid(file)) {
        setErrorState('Invalid file type');
        return;
      }
      if (file.size > maxSize) {
        setErrorState('File size exceeds limit');
        return;
      }
      validFiles.push(file);
    }

    // Only process files if they're all valid
    if (validFiles.length > 0) {
      setErrorState(undefined);
      if (onFileSelect) {
        onFileSelect(validFiles[0]);
      }
      if (onChange) {
        if (multiple) {
          onChange([...displayedFiles, ...validFiles]);
        } else {
          onChange(validFiles);
        }
      } else {
        setInternalFiles(multiple ? [...displayedFiles, ...validFiles] : validFiles);
      }
      if (onUpload) {
        onUpload(validFiles);
      }
    }
  };

  const handleRemove = (index: number) => {
    let newFiles = [...displayedFiles];
    const removedFile = newFiles.splice(index, 1)[0];
    if (onChange) {
      onChange(newFiles);
    } else {
      setInternalFiles(newFiles);
    }
    if (onFileRemove && removedFile) {
      onFileRemove(removedFile);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 40 }} />;
    }
    return <DescriptionIcon sx={{ fontSize: 40 }} />;
  };

  // Accessibility: announce file selection
  const fileAnnouncement = displayedFiles.length ? displayedFiles.map(f => f.name).join(', ') : '';

  const handleGoogleDocSelect = (file: { id: string; name: string; content: string }) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const googleDocFile = new File([blob], file.name, { type: 'text/plain' });

    if (onFileSelect) {
      onFileSelect(googleDocFile);
    }
    if (onChange) {
      if (multiple) {
        onChange([...displayedFiles, googleDocFile]);
      } else {
        onChange([googleDocFile]);
      }
    } else {
      setInternalFiles(multiple ? [...displayedFiles, googleDocFile] : [googleDocFile]);
    }
    if (onUpload) {
      onUpload([googleDocFile]);
    }
  };

  return (
    <Box>
      {(errorState || error) && (
        <Alert severity="error" sx={{ mt: 2 }} id="file-upload-error">
          {errorState || error}
        </Alert>
      )}
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {description}
        </Typography>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-upload"
        aria-label="Upload file"
        aria-describedby="file-upload-description"
        aria-invalid={!!error || !!errorState}
        aria-errormessage={error || errorState ? 'file-upload-error' : undefined}
        tabIndex={0}
        disabled={disabled || loading}
      />
      <label htmlFor="file-upload">
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            border: 0,
          }}
        >
          Upload file / File input
        </span>
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'grey.300',
            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            opacity: disabled || loading ? 0.7 : 1,
            outline: dragActive ? '2px solid #1976d2' : undefined,
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !loading && fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-disabled={disabled || loading}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop files here
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {buttonText ? buttonText : 'or click to select files'}
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            display="block"
            sx={{ mt: 1 }}
            id="file-upload-description"
          >
            Maximum file size: {maxSize / (1024 * 1024)}MB
          </Typography>
          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress role="progressbar" />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Uploading...
              </Typography>
            </Box>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={e => {
              e.stopPropagation();
              setShowGoogleDocs(true);
            }}
            sx={{ mt: 2 }}
          >
            Import from Google Docs
          </Button>
        </Paper>
      </label>

      <GoogleDocsIntegration
        open={showGoogleDocs}
        onClose={() => setShowGoogleDocs(false)}
        onSelect={handleGoogleDocSelect}
      />

      <div
        aria-live="polite"
        style={{ position: 'absolute', left: -9999, height: 1, width: 1, overflow: 'hidden' }}
      >
        {fileAnnouncement}
      </div>

      {!(errorState || error) &&
        displayedFiles.map((file, index) => (
          <Paper key={index} sx={{ p: 2, mt: 2, display: 'flex', alignItems: 'center' }}>
            {getFileIcon(file)}
            <Box sx={{ ml: 2, flexGrow: 1 }}>
              <Typography variant="body1" aria-live="polite" data-testid="file-name">
                {file.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {(file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
            <IconButton
              onClick={() => handleRemove(index)}
              size="small"
              aria-label={`Remove ${file.name}`}
            >
              <CloseIcon />
            </IconButton>
          </Paper>
        ))}

      {!(errorState || error) && (displayedFiles.length > 0 || success) && (
        <Button
          variant="outlined"
          color="secondary"
          sx={{ mt: 2 }}
          onClick={() => {
            setInternalFiles([]);
            if (onCancel) onCancel();
          }}
          tabIndex={0}
        >
          Reset
        </Button>
      )}
    </Box>
  );
};
