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
import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../../services/api';

interface FileUploadProps {
  // Legacy props (for backward compatibility)
  onFileUpload?: (file: File) => void;
  onFileSelect?: (file: File) => void;
  // New controlled component props
  files?: File[];
  onChange?: (files: File[]) => void | Promise<void>;
  onUpload?: (files: File[]) => void;
  // Common props
  multiple?: boolean;
  accept?: string[];
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
  files: controlledFiles,
  onChange,
  onUpload,
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
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const selectedFiles = controlledFiles !== undefined ? controlledFiles : internalFiles;
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter(file => {
        if (file.size > maxSize) {
          enqueueSnackbar(
            `File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
            { variant: 'error' }
          );
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
        
        // Update controlled or internal state
        if (controlledFiles !== undefined) {
          // Controlled component - call onChange
          if (onChange) {
            onChange(newFiles);
          }
        } else {
          // Uncontrolled component - update internal state
          setInternalFiles(newFiles);
        }

        // Call onFileSelect for each file (legacy support)
        validFiles.forEach(file => onFileSelect?.(file));

        // Handle upload
        if (onUpload) {
          onUpload(newFiles);
        } else if (autoUpload) {
          handleUpload(validFiles);
        }
      }
    },
    [maxSize, multiple, autoUpload, enqueueSnackbar]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple,
    maxSize,
  });

  const handleUpload = async (files: File[]) => {
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
        formData.append('file', file);

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
    if (controlledFiles === undefined) {
      setInternalFiles([]);
    } else if (onChange) {
      onChange([]);
    }
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
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Supported formats: PDF, DOCX, DOC, TXT, Images • Max size: {maxSize / (1024 * 1024)}MB
        </Typography>
      </Paper>

      {/* Selected Files */}
      {selectedFiles.length > 0 && !autoUpload && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.type}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => {
                      const newFiles = selectedFiles.filter((_: File, i: number) => i !== index);
                      if (controlledFiles === undefined) {
                        setInternalFiles(newFiles);
                      } else if (onChange) {
                        onChange(newFiles);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            onClick={() => handleUpload(selectedFiles)}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
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
