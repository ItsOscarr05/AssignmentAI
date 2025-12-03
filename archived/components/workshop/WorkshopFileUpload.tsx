import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudUploadOutlined as CloudUploadIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  AutoFixHigh as FillIcon,
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
import { FileFillResult, fileProcessingService } from '../../services/fileProcessingService';

interface WorkshopFileUploadProps {
  onFileUploaded?: (file: any) => void;
}

const WorkshopFileUpload: React.FC<WorkshopFileUploadProps> = ({ onFileUploaded }) => {
  const { files, uploadProgress, addFile, deleteFile } = useWorkshopStore();
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiFillingFiles, setAiFillingFiles] = useState<Set<string>>(new Set());
  const [filledFiles, setFilledFiles] = useState<Map<string, FileFillResult>>(new Map());

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log('Files dropped:', acceptedFiles);
      for (const file of acceptedFiles) {
        console.log('Processing file:', file.name);
        await addFile(file);
        console.log('File upload completed');
        if (onFileUploaded) {
          console.log('Calling onFileUploaded callback');
          // Get the uploaded file from the store - wait a bit for the store to update
          setTimeout(() => {
            const uploadedFile = useWorkshopStore
              .getState()
              .files.find(f => f.name === file.name && f.status === 'completed');
            if (uploadedFile) {
              console.log('Found uploaded file for callback:', uploadedFile);
              onFileUploaded(uploadedFile);
            } else {
              console.log('Could not find uploaded file in store');
              console.log('Available files:', useWorkshopStore.getState().files);
            }
          }, 100); // Small delay to ensure store is updated
        }
      }
    },
    [addFile, onFileUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Document formats
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
      // Image formats for analysis
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff'],
      'image/webp': ['.webp'],
      // Code files for analysis
      'text/x-python': ['.py'],
      'text/javascript': ['.js'],
      'text/x-java-source': ['.java'],
      'text/x-c++src': ['.cpp', '.cc'],
      'text/x-csrc': ['.c'],
      'text/html': ['.html', '.htm'],
      'text/css': ['.css'],
      'application/json': ['.json'],
      'text/xml': ['.xml'],
      // Data files
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 25 * 1024 * 1024, // 25MB (increased for images)
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
    if (fileType.includes('image')) return <FileIcon />; // For images
    if (fileType.includes('code')) return <FileIcon />; // For code files
    if (fileType.includes('data')) return <FileIcon />; // For data files
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

  const supportsAiFilling = (fileType: string) => {
    const supportedTypes = [
      // Document formats
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/rtf',
      // Spreadsheet formats
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      // Data formats
      'application/json',
      'application/xml',
      // Code formats
      'text/x-python',
      'text/javascript',
      'text/x-java-source',
      'text/x-c++src',
      'text/x-csrc',
      'text/html',
      'text/css',
      // Image formats (for OCR and text extraction)
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
    ];
    return supportedTypes.includes(fileType);
  };

  const handleAiFill = async (file: any) => {
    if (!supportsAiFilling(file.type)) return;

    setAiFillingFiles(prev => new Set(prev).add(file.id));

    try {
      const result = await fileProcessingService.fillFile(file);
      setFilledFiles(prev => new Map(prev).set(file.id, result));
    } catch (error) {
      console.error('AI filling failed:', error);
    } finally {
      setAiFillingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDownloadFilled = async (file: any) => {
    const filledFile = filledFiles.get(file.id);
    if (!filledFile) return;

    try {
      const result = await fileProcessingService.downloadFilledFile(filledFile.file_id);
      fileProcessingService.downloadFile(result.blob, filledFile.filled_file_name);
    } catch (error) {
      console.error('Download failed:', error);
    }
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
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 2, display: 'block', textAlign: 'center' }}
          >
            Supported formats:
          </Typography>

          {/* Free Plan */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#1976d2',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'block',
                textAlign: 'center',
                mb: 1,
              }}
            >
              FREE
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {['PDF', 'DOCX', 'DOC', 'TXT', 'RTF'].map(format => (
                <Typography
                  key={format}
                  variant="caption"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                >
                  {format}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Plus Plan */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#388e3c',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'block',
                textAlign: 'center',
                mb: 1,
              }}
            >
              PLUS
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {['JPG', 'PNG', 'GIF', 'BMP', 'TIFF', 'CSV', 'XLS', 'XLSX'].map(format => (
                <Typography
                  key={format}
                  variant="caption"
                  sx={{
                    backgroundColor: '#e8f5e8',
                    color: '#388e3c',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                >
                  {format}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Pro Plan */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#7b1fa2',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'block',
                textAlign: 'center',
                mb: 1,
              }}
            >
              PRO
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {['PY', 'JS', 'Java', 'C++', 'HTML', 'CSS', 'JSON', 'XML'].map(format => (
                <Typography
                  key={format}
                  variant="caption"
                  sx={{
                    backgroundColor: '#f3e5f5',
                    color: '#7b1fa2',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                >
                  {format}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Max Plan - All formats */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#ff9800',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'block',
                textAlign: 'center',
                mb: 1,
              }}
            >
              MAX
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {['PDF', 'JPG', 'PY', 'CSV'].map(format => (
                <Typography
                  key={format}
                  variant="caption"
                  sx={{
                    backgroundColor: '#fff3e0',
                    color: '#f57c00',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                >
                  {format}
                </Typography>
              ))}
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: '#fff3e0',
                  color: '#f57c00',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              >
                +more
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'center',
              fontWeight: 600,
              mt: 1,
            }}
          >
            Max size: 25MB
          </Typography>
        </Box>
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
                    <Box component="div">
                      <Box
                        component="span"
                        sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}
                      >
                        {formatFileSize(file.size)} • {file.type}
                      </Box>
                      {file.status === 'uploading' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={uploadProgress[file.id] || 0}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                          <Box
                            component="span"
                            sx={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mt: 0.5,
                            }}
                          >
                            Uploading... {Math.round(uploadProgress[file.id] || 0)}%
                          </Box>
                        </Box>
                      )}
                      {file.status === 'processing' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                          <Box
                            component="span"
                            sx={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mt: 0.5,
                            }}
                          >
                            Processing file...
                          </Box>
                        </Box>
                      )}
                      {aiFillingFiles.has(file.id) && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                          <Box
                            component="span"
                            sx={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mt: 0.5,
                            }}
                          >
                            AI is filling your file...
                          </Box>
                        </Box>
                      )}
                      {file.status === 'completed' && file.analysis && (
                        <Box
                          component="span"
                          sx={{
                            display: 'block',
                            fontSize: '0.875rem',
                            color: 'success.main',
                            mt: 1,
                          }}
                        >
                          ✓ Processed successfully
                        </Box>
                      )}
                      {filledFiles.has(file.id) && (
                        <Box
                          component="span"
                          sx={{
                            display: 'block',
                            fontSize: '0.875rem',
                            color: 'primary.main',
                            mt: 1,
                          }}
                        >
                          ✓ AI filled - Ready to download
                        </Box>
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
                    {file.status === 'completed' &&
                      supportsAiFilling(file.type) &&
                      !filledFiles.has(file.id) && (
                        <IconButton
                          size="small"
                          onClick={() => handleAiFill(file)}
                          title="AI Fill - Let AI complete this file"
                          disabled={aiFillingFiles.has(file.id)}
                          sx={{ color: '#4caf50' }}
                        >
                          <FillIcon />
                        </IconButton>
                      )}
                    {filledFiles.has(file.id) && (
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadFilled(file)}
                        title="Download AI-filled file"
                        sx={{ color: '#2196f3' }}
                      >
                        <DownloadIcon />
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
