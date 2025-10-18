import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  ContentCopy as CopyIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Language as LanguageIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  HourglassEmpty as ProcessingIcon,
  Schedule as ScheduleIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import PopupApiService, { LinkAnalysisResult } from '../../services/popupApi';

interface EnhancedLinkAnalysisInterfaceProps {
  link: {
    url: string;
    title: string;
  };
  onAnalysisComplete?: (results: any) => void;
  onExport?: (content: string, format: string) => void;
}

const EnhancedLinkAnalysisInterface: React.FC<EnhancedLinkAnalysisInterfaceProps> = ({
  link,
  onAnalysisComplete,
  onExport: _onExport,
}) => {
  const [analysisResults, setAnalysisResults] = useState<LinkAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [linkStatus, setLinkStatus] = useState<'ready' | 'processing' | 'completed' | 'error'>(
    'ready'
  );
  const [linkMetadata, setLinkMetadata] = useState<any>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | 'json'>('txt');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Get link status chip
  const getLinkStatusChip = (status: string) => {
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
        return <Chip icon={<LinkIcon />} label="Ready to Analyze" color="default" size="small" />;
    }
  };

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Real API integration for link analysis
  const handleAnalyze = async () => {
    if (!link) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setLinkStatus('processing');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      // Use real API for link analysis
      const result = await PopupApiService.analyzeLink(link.url);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setAnalysisResults(result);
      setLinkStatus('completed');

      // Extract metadata
      setLinkMetadata({
        domain: getDomain(link.url),
        wordCount: result.content.split(' ').length,
        readingTime: Math.ceil(result.content.split(' ').length / 200), // ~200 words per minute
        type: result.type,
        extractedAt: result.extracted_at,
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      setSnackbar({
        open: true,
        message: 'Link analysis completed successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error analyzing link:', error);
      setLinkStatus('error');
      setSnackbar({
        open: true,
        message: 'Failed to analyze link. Please check the URL and try again.',
        severity: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyAnalysis = async () => {
    if (!analysisResults) return;

    try {
      const analysisText =
        typeof analysisResults.analysis === 'string'
          ? analysisResults.analysis
          : JSON.stringify(analysisResults.analysis, null, 2);
      await navigator.clipboard.writeText(analysisText);
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
      a.download = `link-analysis-${getDomain(link.url)}.${exportFormat}`;
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
      const analysisText =
        typeof analysisResults.analysis === 'string'
          ? analysisResults.analysis
          : JSON.stringify(analysisResults.analysis, null, 2);

      const shareData = {
        title: `Analysis of ${link.title}`,
        text: analysisText.substring(0, 200) + '...',
        url: link.url,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(analysisText);
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

  const handleOpenLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Link Preview Area */}
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
        {link ? (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: '#82ca9d',
                mx: 'auto',
                mb: 2,
              }}
            >
              <LanguageIcon sx={{ fontSize: 30 }} />
            </Avatar>

            <Typography variant="h6" sx={{ mb: 1, wordBreak: 'break-word' }}>
              {link.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, wordBreak: 'break-all' }}
            >
              {link.url}
            </Typography>

            {linkMetadata && (
              <Box
                sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}
              >
                <Chip
                  icon={<LanguageIcon />}
                  label={linkMetadata.domain}
                  size="small"
                  color="primary"
                />
                <Chip
                  icon={<DescriptionIcon />}
                  label={`${linkMetadata.wordCount} words`}
                  size="small"
                />
                <Chip
                  icon={<ScheduleIcon />}
                  label={`${linkMetadata.readingTime} min read`}
                  size="small"
                />
              </Box>
            )}

            {getLinkStatusChip(linkStatus)}

            <Box
              sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}
            >
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenLink}
                sx={{
                  borderColor: '#82ca9d',
                  color: '#82ca9d',
                  '&:hover': {
                    borderColor: '#82ca9d',
                    backgroundColor: 'rgba(130, 202, 157, 0.1)',
                  },
                }}
              >
                Open Link
              </Button>

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
                  Analyze Link
                </Button>
              )}

              {analysisResults && (
                <>
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
                  Analyzing content... {analysisProgress}%
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
            No link provided
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

          {/* Analysis Content */}
          {typeof analysisResults.analysis === 'object' &&
          analysisResults.analysis &&
          !Array.isArray(analysisResults.analysis) ? (
            <Box sx={{ mb: 2 }}>
              {/* Summary */}
              {'summary' in analysisResults.analysis && analysisResults.analysis.summary && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Summary
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {analysisResults.analysis.summary}
                  </Typography>
                </Box>
              )}

              {/* Key Points */}
              {'keyPoints' in analysisResults.analysis &&
                analysisResults.analysis.keyPoints &&
                analysisResults.analysis.keyPoints.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      Key Points
                    </Typography>
                    <List dense>
                      {analysisResults.analysis.keyPoints.map((point: string, index: number) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography
                              variant="body2"
                              sx={{ color: 'primary.main', fontWeight: 'bold' }}
                            >
                              {index + 1}.
                            </Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={point}
                            sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

              {/* Analysis Metrics */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Analysis Metrics
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {'contentType' in analysisResults.analysis &&
                    analysisResults.analysis.contentType && (
                      <Chip
                        label={`Type: ${analysisResults.analysis.contentType}`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  {'credibility' in analysisResults.analysis &&
                    analysisResults.analysis.credibility && (
                      <Chip
                        label={`Credibility: ${analysisResults.analysis.credibility}/10`}
                        color={
                          analysisResults.analysis.credibility >= 7
                            ? 'success'
                            : analysisResults.analysis.credibility >= 5
                            ? 'warning'
                            : 'error'
                        }
                        variant="outlined"
                      />
                    )}
                  {'readingTime' in analysisResults.analysis &&
                    analysisResults.analysis.readingTime && (
                      <Chip
                        label={`Reading Time: ${analysisResults.analysis.readingTime} min`}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  {'wordCount' in analysisResults.analysis &&
                    analysisResults.analysis.wordCount && (
                      <Chip
                        label={`Words: ${analysisResults.analysis.wordCount}`}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  {'sentiment' in analysisResults.analysis &&
                    analysisResults.analysis.sentiment && (
                      <Chip
                        label={`Sentiment: ${analysisResults.analysis.sentiment}`}
                        color={
                          analysisResults.analysis.sentiment === 'positive'
                            ? 'success'
                            : analysisResults.analysis.sentiment === 'negative'
                            ? 'error'
                            : 'info'
                        }
                        variant="outlined"
                      />
                    )}
                </Box>
              </Box>

              {/* Related Topics */}
              {'relatedTopics' in analysisResults.analysis &&
                analysisResults.analysis.relatedTopics &&
                analysisResults.analysis.relatedTopics.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      Related Topics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {analysisResults.analysis.relatedTopics.map(
                        (topic: string, index: number) => (
                          <Chip key={index} label={topic} size="small" variant="outlined" />
                        )
                      )}
                    </Box>
                  </Box>
                )}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {typeof analysisResults.analysis === 'string'
                ? analysisResults.analysis
                : 'No analysis available'}
            </Typography>
          )}
        </Box>
      )}

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
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
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

export default EnhancedLinkAnalysisInterface;
