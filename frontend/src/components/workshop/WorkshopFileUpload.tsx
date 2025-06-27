import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Description as DescriptionIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  HourglassEmpty as ProcessingIcon,
  VisibilityOutlined as VisibilityOutlinedIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWorkshopStore } from '../../services/WorkshopService';

const WorkshopFileUpload: React.FC = () => {
  const { files, uploadProgress, addFile, deleteFile } = useWorkshopStore();
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await addFile(file);
      }
    },
    [addFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleDeleteFile = async (fileId: string) => {
    await deleteFile(fileId);
  };

  const handlePreviewFile = (file: any) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return <PdfIcon />;
    if (fileType.includes('word') || fileType.includes('document')) return <DescriptionIcon />;
    return <FileIcon />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlineIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <ProcessingIcon color="primary" />;
      default:
        return <ProcessingIcon color="action" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          border: `2px dashed ${isDragActive ? '#8884d8' : '#e0e0e0'}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'rgba(136, 132, 216, 0.04)' : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: '#8884d8',
            backgroundColor: 'rgba(136, 132, 216, 0.02)',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: '#8884d8', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported formats: PDF, DOCX, DOC, TXT, RTF • Max size: 10MB
        </Typography>
      </Paper>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <List>
            {files.map(file => (
              <ListItem
                key={file.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor:
                    file.status === 'error' ? 'rgba(244, 67, 54, 0.04)' : 'transparent',
                }}
              >
                <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(file.size)} • {file.type}
                      </Typography>
                      {file.status === 'uploading' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={uploadProgress[file.id] || 0}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Uploading... {Math.round(uploadProgress[file.id] || 0)}%
                          </Typography>
                        </Box>
                      )}
                      {file.status === 'processing' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                          <Typography variant="caption" color="text.secondary">
                            Processing file...
                          </Typography>
                        </Box>
                      )}
                      {file.status === 'completed' && file.analysis && (
                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                          ✓ Processed successfully
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(file.status || 'uploading')}
                    {file.status === 'completed' && (
                      <IconButton
                        size="small"
                        onClick={() => handlePreviewFile(file)}
                        title="Preview file"
                      >
                        <VisibilityOutlinedIcon sx={{ color: 'grey.700' }} />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteFile(file.id)}
                      title="Delete file"
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {previewFile?.name}
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box>
              <Typography variant="h6" gutterBottom>
                File Analysis
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewFile.analysis || 'No analysis available.'}
                </Typography>
              </Paper>

              {previewFile.content && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Extracted Content
                  </Typography>
                  <Paper
                    sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 400, overflow: 'auto' }}
                  >
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {previewFile.content.length > 1000
                        ? `${previewFile.content.substring(0, 1000)}...`
                        : previewFile.content}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkshopFileUpload;
