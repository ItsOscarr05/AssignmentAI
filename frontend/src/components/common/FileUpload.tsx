import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  FileCopy as FileCopyIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../../services/api';

interface FileUploadProps {
  // Legacy props (for backward compatibility)
  onFileUpload?: (file: File) => void;
  onFileSelect?: (file: File) => void;
  onFileRemove?: (file: File, index?: number) => void;
  value?: File | File[];
  acceptedFileTypes?: string[];
  // New controlled component props
  files?: File[];
  onChange?: (files: File[]) => void | Promise<void>;
  onUpload?: (files: File[]) => void;
  // Common props
  multiple?: boolean;
  accept?: string | string[];
  maxSize?: number;
  showPreview?: boolean;
  showActions?: boolean;
  autoUpload?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileSelect,
  onFileRemove,
  files: controlledFiles,
  onChange,
  onUpload,
  value,
  acceptedFileTypes,
  multiple = true,
  accept = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  maxSize = 10 * 1024 * 1024, // 10MB
  showActions = true,
  autoUpload = true,
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [internalFiles, setInternalFiles] = useState<File[]>(() => {
    if (controlledFiles !== undefined) {
      return controlledFiles;
    }
    if (value !== undefined) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return [];
  });
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedAccept = useMemo(() => {
    const sources: Array<string | string[] | undefined> = [accept, acceptedFileTypes];
    const rawValues = sources.find(source => source !== undefined) ?? accept;
    const list = Array.isArray(rawValues)
      ? rawValues
      : typeof rawValues === 'string'
      ? rawValues.split(',')
      : [];
    return list.map(item => item.trim()).filter(Boolean);
  }, [accept, acceptedFileTypes]);

  const selectedFiles = controlledFiles ??
    (value !== undefined ? (Array.isArray(value) ? value : value ? [value] : []) : undefined) ??
    internalFiles;

  useEffect(() => {
    if (controlledFiles !== undefined) {
      setInternalFiles(controlledFiles);
      return;
    }
    if (value !== undefined) {
      setInternalFiles(Array.isArray(value) ? value : value ? [value] : []);
    }
  }, [controlledFiles, value]);

  // Load existing files on component mount
  useEffect(() => {
    loadExistingFiles();
  }, []);

  const loadExistingFiles = async () => {
    try {
      const response = await api.get('/files');
      setUploadedFiles(
        response.data.map((file: any) => ({
          ...file,
          status: 'completed' as const,
        }))
      );
    } catch (error) {
      console.error('Failed to load existing files:', error);
    }
  };

  const isFileAccepted = useCallback(
    (file: File) => {
      if (!normalizedAccept.length) return true;
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      return normalizedAccept.some(type => {
        const value = type.toLowerCase();
        if (!value) return false;
        if (value.startsWith('.')) {
          return fileName.endsWith(value);
        }
        if (value.endsWith('/*')) {
          return fileType.startsWith(value.replace('/*', ''));
        }
        return fileType === value || fileType.startsWith(value);
      });
    },
    [normalizedAccept]
  );

  const updateFilesState = useCallback(
    (nextFiles: File[]) => {
      if (controlledFiles !== undefined) {
        onChange?.(nextFiles);
        return;
      }
      if (value !== undefined) {
        onChange?.(nextFiles);
        setInternalFiles(nextFiles);
        return;
      }
      setInternalFiles(nextFiles);
      onChange?.(nextFiles);
    },
    [controlledFiles, onChange, value]
  );

  const handleUpload = useCallback(
    async (files: File[]) => {
      setUploading(true);

      const newFiles: UploadedFile[] = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        uploadedAt: new Date().toISOString(),
        status: 'uploading' as const,
        progress: 0,
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileIndex = uploadedFiles.length + i;

        try {
          const formData = new FormData();
          formData.append('files', file);

          const response = await api.post('/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent: any) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0;
              setUploadedFiles(prev =>
                prev.map((f, index) => (index === fileIndex ? { ...f, progress } : f))
              );
            },
          });

          setUploadedFiles(prev =>
            prev.map((f, index) =>
              index === fileIndex
                ? { ...f, ...response.data, status: 'completed' as const, progress: 100 }
                : f
            )
          );

          enqueueSnackbar(`${file.name} uploaded successfully`, { variant: 'success' });
          onFileUpload?.(file);
        } catch (error: any) {
          setUploadedFiles(prev =>
            prev.map((f, index) =>
              index === fileIndex
                ? {
                    ...f,
                    status: 'error' as const,
                    error: error.response?.data?.detail || 'Upload failed',
                  }
                : f
            )
          );
          enqueueSnackbar(`Failed to upload ${file.name}`, { variant: 'error' });
        }
      }

      setUploading(false);
      if (controlledFiles === undefined && value === undefined) {
        setInternalFiles([]);
      } else if (onChange) {
        onChange([]);
      }
    },
    [controlledFiles, enqueueSnackbar, onChange, onFileUpload, uploadedFiles.length, value]
  );

  const handleSelectedFiles = useCallback(
    (incoming: File[]) => {
      const filesArray = Array.from(incoming);
      if (!filesArray.length) {
        return;
      }

      const validFiles: File[] = [];
      for (const file of filesArray) {
        if (!isFileAccepted(file)) {
          setErrorMessage('Invalid file type');
          enqueueSnackbar(`Invalid file type: ${file.name}`, { variant: 'error' });
          continue;
        }
        if (file.size > maxSize) {
          setErrorMessage(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB`);
          enqueueSnackbar(
            `File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
            { variant: 'error' }
          );
          continue;
        }
        validFiles.push(file);
      }

      if (!validFiles.length) {
        return;
      }

      setErrorMessage(null);
      validFiles.forEach(file => onFileSelect?.(file));

      const nextFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      updateFilesState(nextFiles);

      if (onUpload) {
        onUpload(nextFiles);
      } else if (autoUpload) {
        handleUpload(validFiles);
      }
    },
    [autoUpload, enqueueSnackbar, handleUpload, isFileAccepted, maxSize, multiple, onFileSelect, onUpload, selectedFiles, updateFilesState]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[] | FileList) => {
      const filesArray = Array.isArray(acceptedFiles)
        ? acceptedFiles
        : Array.from(acceptedFiles);
      handleSelectedFiles(filesArray);
    },
    [handleSelectedFiles]
  );

  const onDropRejected = useCallback(
    (fileRejections: any[]) => {
      if (fileRejections && fileRejections.length > 0) {
        const reasons = fileRejections[0].errors.map((e: any) => e.message).join(', ');
        setErrorMessage(reasons);
        enqueueSnackbar(reasons, { variant: 'error' });
      }
    },
    [enqueueSnackbar]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxSize,
    accept: normalizedAccept.some(value => value.includes('/'))
      ? normalizedAccept.reduce((acc, type) => ({ ...acc, [type]: [] }), {} as Record<string, string[]>)
      : undefined,
    multiple,
  });

  const inputProps = getInputProps();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }
    handleSelectedFiles(Array.from(files));
  };

  const handleDelete = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}`);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      enqueueSnackbar('File deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete file', { variant: 'error' });
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      enqueueSnackbar('Failed to download file', { variant: 'error' });
    }
  };

  const handlePreview = (file: UploadedFile) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleCopyLink = async (file: UploadedFile) => {
    try {
      await navigator.clipboard.writeText(file.url);
      enqueueSnackbar('File link copied to clipboard', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to copy link', { variant: 'error' });
    }
  };

  const removeSelectedFile = (index: number) => {
    const files = selectedFiles;
    if (!files || !files[index]) return;
    const fileToRemove = files[index];
    onFileRemove?.(fileToRemove, index);
    const nextFiles = files.filter((_, i) => i !== index);
    updateFilesState(nextFiles);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type === 'application/pdf') return <PictureAsPdfIcon />;
    if (type.includes('word') || type.includes('document')) return <DescriptionIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const maxSizeInMB = Math.round(maxSize / (1024 * 1024));
  const acceptAttribute = normalizedAccept.length ? normalizedAccept.join(',') : undefined;

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <input
          {...inputProps}
          onChange={handleInputChange}
          aria-label="Upload file"
          accept={acceptAttribute}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        <Typography
          id="file-upload-description"
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 1 }}
        >
          Maximum file size: {maxSizeInMB}MB
        </Typography>
        {normalizedAccept.length > 0 && (
          <Typography variant="caption" color="text.secondary" display="block">
            Accepted file types: {normalizedAccept.join(', ')}
          </Typography>
        )}
      </Paper>

      {errorMessage && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="error" role="alert">
            {errorMessage}
          </Typography>
        </Box>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          {selectedFiles.map((file, index) => (
            <Box
              key={`${file.name}-${index}`}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography data-testid="file-name" sx={{ mr: 2 }}>
                {file.name}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => removeSelectedFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                Remove {file.name}
              </Button>
            </Box>
          ))}
          {!autoUpload && (
            <Button
              variant="contained"
              onClick={() => handleUpload(selectedFiles)}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              sx={{ mt: 2 }}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          )}
        </Box>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Uploaded Files ({uploadedFiles.length})</Typography>
            <Button startIcon={<RefreshIcon />} onClick={loadExistingFiles} size="small">
              Refresh
            </Button>
          </Box>

          <Grid container spacing={2}>
            {uploadedFiles.map(file => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getFileIcon(file.type)}
                      <Typography variant="subtitle2" sx={{ ml: 1, flexGrow: 1 }}>
                        {file.name}
                      </Typography>
                      <Chip
                        label={file.status}
                        size="small"
                        color={
                          file.status === 'completed'
                            ? 'success'
                            : file.status === 'error'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </Typography>

                    {file.status === 'uploading' && file.progress !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress variant="determinate" value={file.progress} />
                        <Typography variant="caption">{file.progress}%</Typography>
                      </Box>
                    )}

                    {file.status === 'error' && (
                      <Typography variant="caption" color="error" display="block">
                        {file.error}
                      </Typography>
                    )}

                    {showActions && file.status === 'completed' && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(file)}
                          title="Preview"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyLink(file)}
                          title="Copy Link"
                        >
                          <FileCopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(file.id)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {previewFile?.name}
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            aria-label="Close preview"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box>
              {previewFile.type.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe
                  src={previewFile.url}
                  width="100%"
                  height="600px"
                  title={previewFile.name}
                />
              ) : (
                <Typography>
                  Preview not available for this file type. Please download to view.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {previewFile && (
            <Button onClick={() => handleDownload(previewFile)} startIcon={<DownloadIcon />}>
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload;
export { FileUpload };
