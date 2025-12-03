import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudUpload as CloudUploadIcon,
  ContentCopy as CopyIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  HourglassEmpty as ProcessingIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import PopupApiService, { FileAnalysisResult } from '../../services/popupApi';

interface EnhancedFileAnalysisInterfaceProps {
  file: any;
  onAnalysisComplete?: (results: any) => void;
}

const EnhancedFileAnalysisInterface: React.FC<EnhancedFileAnalysisInterfaceProps> = ({
  file,
  onAnalysisComplete,
}) => {
  const [analysisResults, setAnalysisResults] = useState<FileAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [fileContent, setFileContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | 'json'>('txt');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon sx={{ fontSize: 40, color: '#2196f3' }} />;
      case 'txt':
        return <DescriptionIcon sx={{ fontSize: 40, color: '#4caf50' }} />;
      case 'py':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <DescriptionIcon sx={{ fontSize: 40, color: '#ff9800' }} />;
      case 'csv':
      case 'xlsx':
        return <DescriptionIcon sx={{ fontSize: 40, color: '#4caf50' }} />;
      default:
        return <FileIcon sx={{ fontSize: 40, color: '#757575' }} />;
    }
  };

  // Get file status chip
  const getFileStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleOutlineIcon />}
            label="Analysis Complete"
            color="success"
            size="small"
          />
        );
      case 'processing':
        return (
          <Chip icon={<ProcessingIcon />} label="Processing..." color="warning" size="small" />
        );
      case 'error':
        return <Chip icon={<ErrorIcon />} label="Error" color="error" size="small" />;
      default:
        return (
          <Chip icon={<CloudUploadIcon />} label="Ready to Analyze" color="default" size="small" />
        );
    }
  };

  // Load file content for preview
  const loadFileContent = useCallback(async () => {
    if (!file) return;

    try {
      // In a real implementation, this would fetch the actual file content
      // For now, we'll simulate it
      const content = await PopupApiService.getFileContent(file.id);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file content:', error);
    }
  }, [file]);

  // Real API integration for file analysis
  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Use real API for analysis
      const result = await PopupApiService.analyzeFile(file);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setAnalysisResults(result);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      setSnackbar({
        open: true,
        message: 'File analysis completed successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error analyzing file:', error);
      setSnackbar({
        open: true,
        message: 'Failed to analyze file. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProcessAction = async (action: string) => {
    if (!file || !analysisResults) return;

    try {
      const result = await PopupApiService.processFileAction(file.id, action);

      // Update analysis results with new content
      setAnalysisResults(prev =>
        prev
          ? {
              ...prev,
              analysis: result.result,
            }
          : null
      );

      setSnackbar({
        open: true,
        message: `${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully`,
        severity: 'success',
      });
    } catch (error) {
      console.error(`Error processing ${action}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to ${action} file. Please try again.`,
        severity: 'error',
      });
    }
  };

  const handleCopyAnalysis = async () => {
    if (!analysisResults) return;

    try {
      await navigator.clipboard.writeText(analysisResults.analysis);
      setSnackbar({
        open: true,
        message: 'Analysis copied to clipboard',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to copy analysis',
        severity: 'error',
      });
    }
  };

  const handleExportAnalysis = async () => {
    if (!analysisResults) return;

    try {
      const blob = await PopupApiService.exportResults(exportFormat, analysisResults.analysis);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${file.name}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Analysis exported as ${exportFormat.toUpperCase()}`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export analysis',
        severity: 'error',
      });
    }
  };

  const handleShareAnalysis = async () => {
    if (!analysisResults) return;

    try {
      const shareData = {
        title: `Analysis of ${file.name}`,
        text: analysisResults.analysis.substring(0, 200) + '...',
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(analysisResults.analysis);
        setSnackbar({
          open: true,
          message: 'Analysis copied to clipboard (sharing not supported)',
          severity: 'info',
        });
      }
    } catch (error) {
      console.error('Error sharing analysis:', error);
    }
  };

  // Load file content when component mounts
  useEffect(() => {
    loadFileContent();
  }, [loadFileContent]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* File Preview Area */}
      <Box
        sx={{
          flex: 1,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 2,
          mb: 2,
          minHeight: '300px',
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {file ? (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            {getFileIcon(file.name)}
            <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
              {file.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
            </Typography>
            {getFileStatusChip(file.status || 'ready')}

            <Box
              sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}
            >
              {!analysisResults && !isAnalyzing && (
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  sx={{
                    backgroundColor: 'red',
                    '&:hover': {
                      backgroundColor: 'darkred',
                    },
                  }}
                >
                  Analyze File
                </Button>
              )}

              {fileContent && (
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setShowPreview(true)}
                  sx={{ borderColor: 'red', color: 'red' }}
                >
                  Preview
                </Button>
              )}

              {analysisResults && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => handleProcessAction('analyze')}
                    sx={{ borderColor: 'blue', color: 'blue' }}
                  >
                    Re-analyze
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => setShowExportDialog(true)}
                    sx={{ borderColor: 'green', color: 'green' }}
                  >
                    Export
                  </Button>
                </>
              )}
            </Box>

            {isAnalyzing && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Analyzing file... {analysisProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analysisProgress}
                  sx={{
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'red',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No file selected
          </Typography>
        )}
      </Box>

      {/* AI Analysis Results */}
      {analysisResults && (
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6" sx={{ color: 'red' }}>
              AI Analysis Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Copy analysis">
                <IconButton size="small" onClick={handleCopyAnalysis}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share analysis">
                <IconButton size="small" onClick={handleShareAnalysis}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export analysis">
                <IconButton size="small" onClick={() => setShowExportDialog(true)}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {analysisResults.analysis}
          </Typography>

          {/* Quick Actions */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Quick Actions:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleProcessAction('summarize')}
            >
              Summarize
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleProcessAction('extract')}>
              Extract Key Points
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleProcessAction('rewrite')}>
              Rewrite
            </Button>
          </Box>
        </Box>
      )}

      {/* File Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>File Preview - {file?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {fileContent || 'File content not available'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Analysis</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose export format:
          </Typography>
          <List>
            {[
              { value: 'txt', label: 'Text File (.txt)', description: 'Plain text format' },
              {
                value: 'pdf',
                label: 'PDF Document (.pdf)',
                description: 'Portable document format',
              },
              {
                value: 'docx',
                label: 'Word Document (.docx)',
                description: 'Microsoft Word format',
              },
              { value: 'json', label: 'JSON File (.json)', description: 'Structured data format' },
            ].map(format => (
              <ListItem
                key={format.value}
                button
                onClick={() => setExportFormat(format.value as any)}
                selected={exportFormat === format.value}
              >
                <ListItemText primary={format.label} secondary={format.description} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button onClick={handleExportAnalysis} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedFileAnalysisInterface;
