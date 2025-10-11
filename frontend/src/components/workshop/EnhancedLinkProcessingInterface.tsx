import {
  Article as ArticleIcon,
  CheckCircleOutlined as CheckIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  PsychologyOutlined,
  SmartToy as RobotIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api/api';

interface LinkData {
  id: string;
  url: string;
  title: string;
  content: string;
  type: string;
  extracted_at: string;
  file_upload_id?: number;
}

interface LinkAnalysis {
  summary: string;
  keyPoints: string[];
  contentType: string;
  credibility: number;
  readingTime: number;
  wordCount: number;
  relatedTopics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  suggestedActions: string[];
}

interface LinkProcessingInterfaceProps {
  link: LinkData;
  onClose: () => void;
  onDelete?: (linkId: string) => void;
}

const EnhancedLinkProcessingInterface: React.FC<LinkProcessingInterfaceProps> = ({
  link,
  onClose,
  onDelete,
}) => {
  const [analysis, setAnalysis] = useState<LinkAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
  >([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Initialize analysis when component mounts
  useEffect(() => {
    if (link && !analysis) {
      performInitialAnalysis();
    }
  }, [link]);

  const performInitialAnalysis = async () => {
    setLoading(true);
    try {
      // Call backend to get comprehensive analysis
      const response = await api.post('/workshop/analyze-link', {
        link_id: link.id,
        url: link.url,
        content: link.content,
      });

      const analysisData: LinkAnalysis = response.data.analysis;
      setAnalysis(analysisData);

      setSnackbar({
        open: true,
        message: 'Link analysis completed successfully!',
        severity: 'success',
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to analyze link',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    const userMessage = message;
    setMessage('');
    setSending(true);

    // Add user message to chat history immediately
    const newChatHistory = [
      ...chatHistory,
      {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ];
    setChatHistory(newChatHistory);

    try {
      // Send message to AI for interactive link enhancement
      const response = await api.post('/workshop/chat-with-link', {
        link_id: link.id,
        message: userMessage,
        content: link.content,
        analysis: analysis,
      });

      // Add AI response to chat history
      setChatHistory([
        ...newChatHistory,
        {
          role: 'assistant' as const,
          content: response.data.response,
          timestamp: new Date().toISOString(),
        },
      ]);

      // If AI suggests new analysis or actions, update the analysis
      if (response.data.updated_analysis) {
        setAnalysis(response.data.updated_analysis);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to process message',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopyAnalysis = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setSnackbar({
        open: true,
        message: 'Content copied to clipboard!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to copy content',
        severity: 'error',
      });
    }
  };

  const handleDownloadAnalysis = () => {
    if (!analysis) return;

    const content = `# Analysis of ${link.title}\n\nURL: ${link.url}\n\n## Summary\n${
      analysis.summary
    }\n\n## Key Points\n${analysis.keyPoints
      .map(point => `- ${point}`)
      .join('\n')}\n\n## Content Type\n${analysis.contentType}\n\n## Credibility Score\n${
      analysis.credibility
    }/10\n\n## Reading Time\n${analysis.readingTime} minutes\n\n## Word Count\n${
      analysis.wordCount
    } words\n\n## Related Topics\n${analysis.relatedTopics.join(', ')}\n\n## Sentiment\n${
      analysis.sentiment
    }\n\n## Suggested Actions\n${analysis.suggestedActions
      .map(action => `- ${action}`)
      .join('\n')}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${link.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: 'Analysis downloaded successfully!',
      severity: 'success',
    });
  };

  const handleOpenLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 8) return '#4caf50'; // Green
    if (score >= 6) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '#4caf50';
      case 'negative':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  return (
    <>
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            border: '3px solid #f44336',
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '3px solid #f44336',
            p: 2,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <LinkIcon sx={{ color: '#f44336', fontSize: '1.5rem' }} />
              <Typography variant="h6">Interactive Link Analysis</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              {analysis && (
                <Chip
                  icon={<PsychologyOutlined />}
                  label={`Credibility: ${analysis.credibility}/10`}
                  size="small"
                  sx={{ bgcolor: getCredibilityColor(analysis.credibility), color: 'white' }}
                />
              )}
              <Tooltip title="Open Original Link">
                <IconButton onClick={handleOpenLink} size="small">
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download Analysis">
                <IconButton onClick={handleDownloadAnalysis} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              {onDelete && (
                <Tooltip title="Delete Link">
                  <IconButton onClick={() => onDelete(link.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: '100%' }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6">Analyzing Link Content...</Typography>
              <LinearProgress sx={{ width: '300px' }} />
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                gap: 2,
                p: 2,
              }}
            >
              {/* Analysis Panel - LEFT (60% width) */}
              <Paper
                elevation={3}
                sx={{
                  flex: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '2px solid #f44336',
                  borderRadius: 3,
                }}
              >
                {/* Analysis Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderBottom: '3px solid #f44336',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {link.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {link.url}
                  </Typography>
                  {analysis && (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        icon={<SpeedIcon />}
                        label={`${analysis.readingTime} min read`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<ArticleIcon />}
                        label={`${analysis.wordCount} words`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<TrendingIcon />}
                        label={analysis.contentType}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<PsychologyOutlined />}
                        label={analysis.sentiment}
                        size="small"
                        sx={{
                          bgcolor: getSentimentColor(analysis.sentiment),
                          color: 'white',
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Analysis Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                  {analysis ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Summary */}
                      <Card sx={{ border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography variant="h6">Summary</Typography>
                            <Tooltip title="Copy Summary">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyAnalysis(analysis.summary)}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography variant="body2">{analysis.summary}</Typography>
                        </CardContent>
                      </Card>

                      {/* Key Points */}
                      <Card sx={{ border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Key Points
                          </Typography>
                          {analysis.keyPoints.map((point, index) => (
                            <Box key={index} display="flex" alignItems="flex-start" gap={1} mb={1}>
                              <CheckIcon sx={{ color: '#4caf50', fontSize: '1rem', mt: 0.2 }} />
                              <Typography variant="body2">{point}</Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Related Topics */}
                      <Card sx={{ border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Related Topics
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {analysis.relatedTopics.map((topic, index) => (
                              <Chip key={index} label={topic} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Suggested Actions */}
                      <Card sx={{ border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Suggested Actions
                          </Typography>
                          {analysis.suggestedActions.map((action, index) => (
                            <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                              <SearchIcon sx={{ color: '#2196f3', fontSize: '1rem' }} />
                              <Typography variant="body2">{action}</Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                      }}
                    >
                      <Alert severity="info">
                        Analysis not available. Please try refreshing the analysis.
                      </Alert>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Interactive Chat Panel - RIGHT (40% width) */}
              <Paper
                elevation={3}
                sx={{
                  flex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '2px solid #f44336',
                  borderRadius: 3,
                }}
              >
                {/* Chat Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderBottom: '3px solid #f44336',
                  }}
                >
                  <Typography variant="h6">Interactive Chat</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask questions about this link or request enhancements
                  </Typography>
                </Box>

                {/* Chat Messages */}
                <Box
                  ref={chatContainerRef}
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {chatHistory.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                          color: 'white',
                        }}
                      >
                        {msg.role === 'user' ? (
                          <UserIcon fontSize="small" />
                        ) : (
                          <RobotIcon fontSize="small" />
                        )}
                      </Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          maxWidth: '75%',
                          bgcolor: msg.role === 'user' ? 'primary.light' : 'background.paper',
                          color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ mt: 1, display: 'block', opacity: 0.7 }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                  {sending && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Chat Input */}
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask about this link, request summaries, or get insights..."
                      disabled={sending}
                      variant="outlined"
                      size="small"
                    />
                    <Button
                      variant="contained"
                      endIcon={<SendIcon sx={{ fontSize: '1.5rem' }} />}
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      sx={{
                        minWidth: '100px',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      Send
                    </Button>
                  </Box>

                  {/* Quick Action Chips */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="Summarize key points"
                      size="small"
                      onClick={() => setMessage('Summarize the key points from this link')}
                      clickable
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label="Find similar content"
                      size="small"
                      onClick={() => setMessage('Find similar content or related articles')}
                      clickable
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label="Generate citations"
                      size="small"
                      onClick={() => setMessage('Generate proper citations for this source')}
                      clickable
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EnhancedLinkProcessingInterface;
