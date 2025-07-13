import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { Alert, Box, Button, LinearProgress, Paper, Typography } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUploadComplete: (fileUrls: string[]) => void;
  onUploadError: (error: string) => void;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['application/pdf', 'image/*', 'text/*'],
  multiple = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i];
          const formData = new FormData();
          formData.append('file', file);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/files/upload', true);

          // Track upload progress
          xhr.upload.onprogress = event => {
            if (event.lengthComputable) {
              const fileProgress = (event.loaded / event.total) * 100;
              const totalProgress = ((i + fileProgress / 100) / acceptedFiles.length) * 100;
              setProgress(totalProgress);
            }
          };

          // Handle upload completion
          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              uploadedUrls.push(response.url);
            } else {
              throw new Error(`Failed to upload ${file.name}`);
            }
          };

          // Handle upload error
          xhr.onerror = () => {
            throw new Error(`Failed to upload ${file.name}`);
          };

          // Send the file
          xhr.send(formData);

          // Wait for upload to complete
          await new Promise((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status === 200) {
                resolve(xhr.responseText);
              } else {
                reject(new Error(`Failed to upload ${file.name}`));
              }
            };
            xhr.onerror = () => reject(new Error(`Failed to upload ${file.name}`));
          });
        }

        onUploadComplete(uploadedUrls);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during upload';
        setError(errorMessage);
        onUploadError(errorMessage);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onUploadComplete, onUploadError]
  );

  // Handle rejected files (type/size validation)
  const onDropRejected = useCallback(
    (fileRejections: any[]) => {
      let errorMsg = 'File rejected: ';
      if (fileRejections && fileRejections.length > 0) {
        const reasons = fileRejections[0].errors.map((e: any) => e.message).join(', ');
        errorMsg += reasons;
      } else {
        errorMsg += 'Invalid file.';
      }
      setError(errorMsg);
      onUploadError(errorMsg);
    },
    [onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxSize,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple,
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon
          sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
          data-testid="CloudUploadIcon"
        />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          or
        </Typography>
        <Button variant="contained" component="span" disabled={uploading}>
          Select Files
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Maximum file size: {maxSize / (1024 * 1024)}MB
        </Typography>
        <Typography variant="caption" display="block">
          Accepted file types: {acceptedFileTypes.join(', ')}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} data-testid="alert">
          {error}
        </Alert>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} data-testid="linear-progress" />
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            Uploading... {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
