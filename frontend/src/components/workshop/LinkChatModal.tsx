import {
  SmartToy as AIIcon,
  ArticleOutlined as ArticleIcon,
  AssessmentOutlined as AssessmentIcon,
  AutoStoriesOutlined as BookIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as DeleteIcon,
  ExpandMoreOutlined as ExpandMoreIcon,
  LightbulbOutlined as InsightsIcon,
  AddLinkOutlined as LinkIcon,
  OpenInNewOutlined as OpenInNewIcon,
  Psychology as PsychologyIcon,
  ScheduleOutlined as ScheduleIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  StarOutline as StarIcon,
  TrendingUp as TrendingUpIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { streamChatWithLink } from '../../services/api';

interface LinkChatModalProps {
  open: boolean;
  onClose: () => void;
  linkData: any;
  onLinkDeleted?: (linkId: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const LinkChatModal: React.FC<LinkChatModalProps> = ({
  open,
  onClose,
  linkData,
  onLinkDeleted,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showDetailedDistribution, setShowDetailedDistribution] = useState(false);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  // State for content analysis
  const [contentStats, setContentStats] = useState<{
    wordCount: number;
    readingTime: number;
    keyTopics: string[];
    credibilityScore: number;
    complexityScore: number;
    topicDistribution: { [key: string]: number };
    readabilityLevel: string;
    contentQuality: number;
  } | null>(null);

  // Calculate comprehensive content statistics for dashboard
  const calculateContentStats = (content: string) => {
    const wordCount = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

    // Extract key topics from content (simple keyword extraction)
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
      'from',
      'they',
      'she',
      'her',
      'him',
      'his',
      'we',
      'our',
      'us',
      'their',
      'them',
    ]);
    const wordFreq: { [key: string]: number } = {};

    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const keyTopics = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    // Calculate topic distribution percentages (relative to top topics, adds up to 100%)
    const topicDistribution: { [key: string]: number } = {};

    // Get the frequencies for the top topics only
    const topTopicFrequencies = keyTopics.map(topic => {
      const topicLower = topic.toLowerCase();
      return wordFreq[topicLower] || 0;
    });

    // Calculate total frequency of top topics only
    const totalTopTopicFrequency = topTopicFrequencies.reduce((sum, freq) => sum + freq, 0);

    // Calculate relative percentages (will add up to ~100%)
    keyTopics.forEach(topic => {
      const topicLower = topic.toLowerCase();
      if (wordFreq[topicLower] && totalTopTopicFrequency > 0) {
        topicDistribution[topic] = Math.round(
          (wordFreq[topicLower] / totalTopTopicFrequency) * 100
        );
      }
    });

    // Ensure they add up to exactly 100% by adjusting the largest topic if needed
    const totalPercentage = Object.values(topicDistribution).reduce((sum, val) => sum + val, 0);
    if (totalPercentage !== 100 && keyTopics.length > 0) {
      const largestTopic = keyTopics[0]; // First topic is the most frequent
      topicDistribution[largestTopic] += 100 - totalPercentage;
    }

    // Calculate readability level based on average word length and sentence complexity
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = wordCount / sentences.length;

    let readabilityLevel = 'Low';
    if (avgWordLength > 6.5 && avgSentenceLength > 18) {
      readabilityLevel = 'Professional';
    } else if (avgWordLength > 5.5 && avgSentenceLength > 15) {
      readabilityLevel = 'High';
    } else if (avgWordLength > 4.5 && avgSentenceLength > 12) {
      readabilityLevel = 'Medium';
    }

    // Calculate complexity score (0-100)
    const complexityScore = Math.min(
      100,
      Math.round(
        (avgWordLength - 3) * 10 + (avgSentenceLength - 8) * 2 + (wordCount > 1000 ? 20 : 0)
      )
    );

    // Calculate content quality score
    let contentQuality = 50; // Base score
    if (wordCount > 500) contentQuality += 15;
    if (wordCount > 1000) contentQuality += 15;
    if (keyTopics.length > 3) contentQuality += 10;
    if (
      readabilityLevel === 'Medium' ||
      readabilityLevel === 'High' ||
      readabilityLevel === 'Professional'
    )
      contentQuality += 10;

    // Enhanced credibility score based on domain and content analysis
    let credibilityScore = 60; // Base score
    if (content.length > 1000) credibilityScore += 15;
    if (content.length > 3000) credibilityScore += 10;
    if (linkData?.url?.includes('edu') || linkData?.url?.includes('gov')) credibilityScore += 15;
    if (linkData?.url?.includes('wikipedia') || linkData?.url?.includes('khanacademy'))
      credibilityScore += 10;
    if (linkData?.url?.includes('medium.com') || linkData?.url?.includes('dev.to'))
      credibilityScore += 5;
    if (contentQuality > 70) credibilityScore += 10;

    return {
      wordCount,
      readingTime,
      keyTopics,
      credibilityScore: Math.min(100, credibilityScore),
      complexityScore: Math.max(0, complexityScore),
      topicDistribution,
      readabilityLevel,
      contentQuality: Math.min(100, contentQuality),
    };
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isStreamingStartedRef = useRef(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Initialize chat and calculate content stats when modal opens
  useEffect(() => {
    if (open && linkData && chatHistory.length === 0) {
      console.log('Initializing chat modal with linkData:', linkData);

      // Reset content stats to force recalculation
      setContentStats(null);

      // Calculate content statistics
      if (linkData.content) {
        const stats = calculateContentStats(linkData.content);
        setContentStats(stats);
        console.log('Content stats calculated:', stats);
      }

      initializeChat();
    }
  }, [open, linkData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    setChatHistory([]);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        message: 'Copied to clipboard',
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error',
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || thinking || streaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setNewMessage('');
    setSending(true);
    setThinking(true);
    setStreaming(false);
    setStreamingMessage(''); // Reset streaming message before starting new stream
    isStreamingStartedRef.current = false; // Reset streaming flag

    try {
      // Ensure analysis is a proper object
      let analysisData = linkData.analysis || {};
      if (typeof analysisData !== 'object' || Array.isArray(analysisData)) {
        analysisData = {};
      }

      const requestPayload = {
        link_id: linkData.id,
        message: userMessage.content,
        content: linkData.content || '',
        analysis: analysisData,
      };

      console.log('Sending chat message with payload:', requestPayload);

      await streamChatWithLink(
        requestPayload,
        (chunk: string) => {
          console.log('📩 Received chunk in LinkChatModal:', chunk);
          if (!isStreamingStartedRef.current) {
            console.log('✅ First chunk received - switching to streaming mode');
            isStreamingStartedRef.current = true;
            setThinking(false);
            setStreaming(true);
          }
          setStreamingMessage(prev => {
            const newMessage = prev + chunk;
            console.log('📝 Updated streaming message length:', newMessage.length);
            return newMessage;
          });
        },
        (fullResponse: string, updatedAnalysis?: any) => {
          const aiMessage: ChatMessage = {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString(),
          };
          setChatHistory(prev => [...prev, aiMessage]);
          setStreamingMessage('');
          setStreaming(false);
          setThinking(false);
          setSending(false);

          if (updatedAnalysis) {
            console.log('Updated analysis received:', updatedAnalysis);
          }
        },
        (error: string) => {
          console.error('Streaming error:', error);
          setSnackbar({
            open: true,
            message: `Error: ${error}`,
            severity: 'error',
          });
          setStreamingMessage('');
          setStreaming(false);
          setThinking(false);
          setSending(false);
        }
      );
    } catch (error: any) {
      console.error('Error sending message:', error);

      if (error.response?.status === 401) {
        console.log('401 Unauthorized - redirecting to login');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login';
        return;
      }

      let errorMessage = 'Failed to send message';
      if (error.response?.status === 422) {
        errorMessage = 'Validation error. Please check your input.';
        console.log('422 Validation error details:', error.response?.data);
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      setSending(false);
      setThinking(false);
      setStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleDeleteLink = async () => {
    if (!linkData?.id) return;

    try {
      // Add delete functionality here if needed
      console.log('Deleting link:', linkData.id);
      onLinkDeleted?.(linkData.id);
      onClose();
    } catch (error) {
      console.error('Error deleting link:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete link',
        severity: 'error',
      });
    }
  };

  if (!linkData) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
            border: '3px solid #f44336',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Link Analysis & Chat
              </Typography>
              <LinkIcon sx={{ fontSize: 28, color: '#f44336' }} />
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Delete Link">
                <IconButton onClick={handleDeleteLink} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              gap: 2,
              p: 2,
            }}
          >
            {/* Link Content Panel - LEFT (60% width) */}
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
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderBottom: '3px solid #f44336',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${linkData.url}&sz=32`}
                      alt="favicon"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                      }}
                      onError={e => {
                        // Fallback to a generic link icon if favicon fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {linkData.title || 'Link Content'}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Copy URL">
                      <IconButton size="small" onClick={() => copyToClipboard(linkData.url)}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open in New Tab">
                      <IconButton
                        size="small"
                        onClick={() => window.open(linkData.url, '_blank')}
                        sx={{ color: 'primary.main' }}
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {linkData.url}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    bgcolor: 'white',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Comprehensive Dashboard */}
                  <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                    {contentStats && (
                      <>
                        {/* AI Insights Summary */}
                        <Card
                          sx={{
                            p: 3,
                            mb: 3,
                            border: '2px solid #f44336',
                            bgcolor: 'transparent',
                            color: '#f44336',
                          }}
                        >
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="#f44336"
                            sx={{
                              mb: 3,
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1,
                            }}
                          >
                            <InsightsIcon />
                            AI Content Insights
                          </Typography>

                          <Grid container spacing={3}>
                            {/* Topic Distribution Pie Chart - MOVED TO TOP */}
                            {contentStats.keyTopics.length > 0 && (
                              <Grid item xs={12}>
                                <Box
                                  sx={{
                                    p: 2,
                                    border: '1px solid #f44336',
                                    borderRadius: 2,
                                    bgcolor: 'transparent',
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color="#f44336"
                                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                                  >
                                    <StarIcon />
                                    Topic Distribution
                                  </Typography>
                                  {/* Centered Pie Chart */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Box
                                      sx={{ position: 'relative', width: 180, height: 180, mb: 2 }}
                                    >
                                      <svg width="180" height="180" viewBox="0 0 180 180">
                                        {(() => {
                                          const colors = [
                                            '#2196f3',
                                            '#9c27b0',
                                            '#4caf50',
                                            '#ff9800',
                                            '#f44336',
                                            '#00bcd4',
                                            '#ff5722',
                                            '#673ab7',
                                          ];
                                          const allTopics = contentStats.keyTopics;
                                          let currentAngle = 0;

                                          return allTopics.map((topic, index) => {
                                            const percentage =
                                              contentStats.topicDistribution[topic] || 0;
                                            const angle = (percentage / 100) * 360;
                                            const startAngle = currentAngle;
                                            const endAngle = currentAngle + angle;
                                            currentAngle = endAngle;

                                            const startRad = (startAngle - 90) * (Math.PI / 180);
                                            const endRad = (endAngle - 90) * (Math.PI / 180);

                                            const radius = 80;
                                            const x1 = 90 + radius * Math.cos(startRad);
                                            const y1 = 90 + radius * Math.sin(startRad);
                                            const x2 = 90 + radius * Math.cos(endRad);
                                            const y2 = 90 + radius * Math.sin(endRad);

                                            const largeArc = angle > 180 ? 1 : 0;

                                            const pathData = [
                                              `M 90 90`,
                                              `L ${x1} ${y1}`,
                                              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                                              'Z',
                                            ].join(' ');

                                            return (
                                              <g key={index}>
                                                <path
                                                  d={pathData}
                                                  fill={colors[index % colors.length]}
                                                  stroke="white"
                                                  strokeWidth="2"
                                                  style={{
                                                    transition: 'all 0.3s ease',
                                                    opacity:
                                                      hoveredTopic === null ||
                                                      hoveredTopic === topic
                                                        ? 1
                                                        : 0.4,
                                                    cursor: 'pointer',
                                                  }}
                                                  onMouseEnter={() => setHoveredTopic(topic)}
                                                  onMouseLeave={() => setHoveredTopic(null)}
                                                />
                                              </g>
                                            );
                                          });
                                        })()}
                                        <circle cx="90" cy="90" r="55" fill="white" />
                                      </svg>
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: '50%',
                                          left: '50%',
                                          transform: 'translate(-50%, -50%)',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {hoveredTopic ? (
                                          <>
                                            <Typography
                                              variant="body2"
                                              fontWeight="bold"
                                              color="primary"
                                            >
                                              {hoveredTopic}
                                            </Typography>
                                            <Typography
                                              variant="h4"
                                              fontWeight="bold"
                                              color="#f44336"
                                            >
                                              {contentStats.topicDistribution[hoveredTopic]}%
                                            </Typography>
                                          </>
                                        ) : (
                                          <>
                                            <Typography variant="caption" color="text.secondary">
                                              Topics
                                            </Typography>
                                            <Typography
                                              variant="h5"
                                              fontWeight="bold"
                                              color="primary"
                                            >
                                              {contentStats.keyTopics.length}
                                            </Typography>
                                          </>
                                        )}
                                      </Box>
                                    </Box>

                                    <Box
                                      onClick={() =>
                                        setShowDetailedDistribution(!showDetailedDistribution)
                                      }
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        cursor: 'pointer',
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid #f44336',
                                        bgcolor: 'transparent',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                          bgcolor: 'rgba(244, 67, 54, 0.05)',
                                        },
                                        width: '100%',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Typography variant="body2" fontWeight="bold" color="#f44336">
                                        Detailed Distribution
                                      </Typography>
                                      <ExpandMoreIcon
                                        sx={{
                                          color: '#f44336',
                                          transform: showDetailedDistribution
                                            ? 'rotate(180deg)'
                                            : 'rotate(0deg)',
                                          transition: 'transform 0.3s',
                                        }}
                                      />
                                    </Box>

                                    {showDetailedDistribution && (
                                      <Box sx={{ mt: 2, width: '100%' }}>
                                        {contentStats.keyTopics.map((topic, index) => {
                                          const colors = [
                                            '#2196f3',
                                            '#9c27b0',
                                            '#4caf50',
                                            '#ff9800',
                                            '#f44336',
                                            '#00bcd4',
                                            '#ff5722',
                                            '#673ab7',
                                          ];
                                          const color = colors[index % colors.length];
                                          const percentage =
                                            contentStats.topicDistribution[topic] || 0;

                                          return (
                                            <Box key={index} sx={{ mb: 2.5 }}>
                                              <Box
                                                display="flex"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                mb={1}
                                              >
                                                <Box display="flex" alignItems="center" gap={1}>
                                                  <Box
                                                    sx={{
                                                      width: 12,
                                                      height: 12,
                                                      borderRadius: '50%',
                                                      bgcolor: color,
                                                      border: '2px solid',
                                                      borderColor: color,
                                                    }}
                                                  />
                                                  <Typography variant="body2" fontWeight="bold">
                                                    {topic}
                                                  </Typography>
                                                </Box>
                                                <Chip
                                                  label={`${percentage}%`}
                                                  size="small"
                                                  sx={{
                                                    bgcolor: `${color}20`,
                                                    color: color,
                                                    fontWeight: 'bold',
                                                    border: `1px solid ${color}`,
                                                  }}
                                                />
                                              </Box>
                                              <LinearProgress
                                                variant="determinate"
                                                value={percentage}
                                                sx={{
                                                  height: 10,
                                                  borderRadius: 5,
                                                  border: '2px solid',
                                                  borderColor: color,
                                                  backgroundColor: `${color}15`,
                                                  '& .MuiLinearProgress-bar': {
                                                    backgroundColor: color,
                                                    borderRadius: 5,
                                                  },
                                                }}
                                              />
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Grid>
                            )}

                            {/* Content Summary */}
                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  border: '1px solid #f44336',
                                  borderRadius: 2,
                                  bgcolor: 'transparent',
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color="#f44336"
                                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                                >
                                  <ArticleIcon />
                                  Summary
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ lineHeight: 1.6, color: 'text.primary' }}
                                >
                                  {linkData.analysis?.summary ||
                                    `This ${contentStats.readabilityLevel.toLowerCase()}-level content contains ${contentStats.wordCount.toLocaleString()} words covering topics like ${contentStats.keyTopics
                                      .slice(0, 3)
                                      .join(', ')}. It has a ${
                                      contentStats.contentQuality
                                    }% quality score and ${
                                      contentStats.credibilityScore
                                    }% credibility rating.`}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Key Metrics */}
                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  border: '1px solid #f44336',
                                  borderRadius: 2,
                                  bgcolor: 'transparent',
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color="#f44336"
                                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                                >
                                  <AssessmentIcon />
                                  Quick Stats
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Typography variant="body2" color="text.primary">
                                      Reading Level:
                                    </Typography>
                                    <Chip
                                      label={contentStats.readabilityLevel}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        borderColor: '#9c27b0',
                                        color: '#9c27b0',
                                        fontWeight: 'bold',
                                      }}
                                    />
                                  </Box>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Typography variant="body2" color="text.primary">
                                      Credibility:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="#2196f3">
                                      {contentStats.credibilityScore}%
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Typography variant="body2" color="text.primary">
                                      Quality Score:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="#4caf50">
                                      {contentStats.contentQuality}%
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Typography variant="body2" color="text.primary">
                                      Complexity:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="#ff9800">
                                      {contentStats.complexityScore}%
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>

                            {/* Sentiment Analysis */}
                            {linkData.analysis?.sentiment && (
                              <Grid item xs={12} md={6}>
                                <Box
                                  sx={{
                                    p: 2,
                                    border: '1px solid #f44336',
                                    borderRadius: 2,
                                    bgcolor: 'transparent',
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color="#f44336"
                                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                                  >
                                    <PsychologyIcon />
                                    Sentiment
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Chip
                                      label={linkData.analysis.sentiment}
                                      size="medium"
                                      variant="outlined"
                                      sx={{
                                        borderColor:
                                          linkData.analysis.sentiment === 'positive'
                                            ? '#4caf50'
                                            : linkData.analysis.sentiment === 'negative'
                                            ? '#f44336'
                                            : '#ff9800',
                                        color:
                                          linkData.analysis.sentiment === 'positive'
                                            ? '#4caf50'
                                            : linkData.analysis.sentiment === 'negative'
                                            ? '#f44336'
                                            : '#ff9800',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                      }}
                                    />
                                    <Typography variant="body2" color="text.primary">
                                      {linkData.analysis.sentiment === 'positive'
                                        ? '👍 Generally positive tone'
                                        : linkData.analysis.sentiment === 'negative'
                                        ? '👎 Critical or negative perspective'
                                        : '😐 Neutral or balanced viewpoint'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Card>

                        {/* Key Metrics Cards */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} sm={3}>
                            <Card
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                height: '100%',
                                border: '2px solid',
                                borderColor: 'primary.main',
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: 'white',
                                  mx: 'auto',
                                  mb: 1,
                                }}
                              >
                                <ArticleIcon sx={{ color: 'primary.main' }} />
                              </Avatar>
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {contentStats.wordCount.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Words
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Card
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                height: '100%',
                                border: '2px solid',
                                borderColor: 'warning.main',
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: 'white',
                                  mx: 'auto',
                                  mb: 1,
                                }}
                              >
                                <BookIcon sx={{ color: 'warning.main' }} />
                              </Avatar>
                              <Typography variant="h6" color="warning.main" fontWeight="bold">
                                {contentStats.readabilityLevel}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Level
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Card
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                height: '100%',
                                border: '2px solid',
                                borderColor: 'success.main',
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: 'white',
                                  mx: 'auto',
                                  mb: 1,
                                }}
                              >
                                <ScheduleIcon sx={{ color: 'success.main' }} />
                              </Avatar>
                              <Typography variant="h6" color="success.main" fontWeight="bold">
                                {contentStats.readingTime}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Min Read
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Card
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                height: '100%',
                                border: '2px solid',
                                borderColor: 'info.main',
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: 'white',
                                  mx: 'auto',
                                  mb: 1,
                                }}
                              >
                                <StarIcon sx={{ color: 'info.main' }} />
                              </Avatar>
                              <Typography variant="h6" color="info.main" fontWeight="bold">
                                {contentStats.contentQuality}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Quality
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>

                        {/* Progress Indicators */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={6}>
                            <Card sx={{ p: 2 }}>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Credibility Score
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={contentStats.credibilityScore}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  mb: 1,
                                  border: '2px solid',
                                  borderColor:
                                    contentStats.credibilityScore > 80
                                      ? '#4caf50'
                                      : contentStats.credibilityScore < 50
                                      ? '#f44336'
                                      : '#ff9800',
                                  backgroundColor:
                                    contentStats.credibilityScore > 80
                                      ? 'rgba(76, 175, 80, 0.15)'
                                      : contentStats.credibilityScore < 50
                                      ? 'rgba(244, 67, 54, 0.15)'
                                      : 'rgba(255, 152, 0, 0.15)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor:
                                      contentStats.credibilityScore > 80
                                        ? '#4caf50'
                                        : contentStats.credibilityScore < 50
                                        ? '#f44336'
                                        : '#ff9800',
                                  },
                                }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {contentStats.credibilityScore}% -{' '}
                                {contentStats.credibilityScore > 80
                                  ? 'High'
                                  : contentStats.credibilityScore >= 50
                                  ? 'Moderate'
                                  : 'Low'}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Card sx={{ p: 2 }}>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Complexity Score
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={contentStats.complexityScore}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  mb: 1,
                                  border: '2px solid',
                                  borderColor:
                                    contentStats.complexityScore > 80
                                      ? '#4caf50'
                                      : contentStats.complexityScore < 50
                                      ? '#f44336'
                                      : '#ff9800',
                                  backgroundColor:
                                    contentStats.complexityScore > 80
                                      ? 'rgba(76, 175, 80, 0.15)'
                                      : contentStats.complexityScore < 50
                                      ? 'rgba(244, 67, 54, 0.15)'
                                      : 'rgba(255, 152, 0, 0.15)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor:
                                      contentStats.complexityScore > 80
                                        ? '#4caf50'
                                        : contentStats.complexityScore < 50
                                        ? '#f44336'
                                        : '#ff9800',
                                  },
                                }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {contentStats.complexityScore}% -{' '}
                                {contentStats.complexityScore > 80
                                  ? 'High'
                                  : contentStats.complexityScore >= 50
                                  ? 'Moderate'
                                  : 'Low'}
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Paper>

            {/* Chat Panel - RIGHT (40% width) */}
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
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Chat with AI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask questions about the link content
                </Typography>
              </Box>

              {/* Chat Messages */}
              <Box
                ref={chatContainerRef}
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {chatHistory.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '80%',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: message.role === 'user' ? 'transparent' : 'grey.100',
                        border: message.role === 'user' ? '2px solid' : 'none',
                        borderColor: message.role === 'user' ? 'primary.main' : 'transparent',
                        color: message.role === 'user' ? 'text.primary' : 'text.primary',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {message.role === 'user' ? (
                          <UserIcon fontSize="small" />
                        ) : (
                          <AIIcon fontSize="small" />
                        )}
                        <Typography variant="caption" fontWeight="bold">
                          {message.role === 'user' ? 'You' : 'AI'}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto' }}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => copyToClipboard(message.content)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                ))}

                {/* Thinking indicator */}
                {thinking && !streaming && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AIIcon fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                      <CircularProgress size={16} />
                    </Box>
                  </Box>
                )}

                {/* Streaming message */}
                {streaming && streamingMessage && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '80%',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        color: 'text.primary',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AIIcon fontSize="small" />
                        <Typography variant="caption" fontWeight="bold">
                          AI
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {streamingMessage}
                        <span
                          style={{
                            animation: 'blink 1s infinite',
                            marginLeft: '2px',
                          }}
                        >
                          |
                        </span>
                      </Typography>
                    </Box>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Chat Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: '1px solid #e0e0e0',
                  bgcolor: 'background.default',
                }}
              >
                <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim() && !sending && !thinking && !streaming) {
                          handleSendMessage(e as any);
                        }
                      }
                    }}
                    placeholder="Ask a question about the link content..."
                    size="small"
                    disabled={sending || thinking || streaming}
                    multiline
                    maxRows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <IconButton
                    type="submit"
                    disabled={!newMessage.trim() || sending || thinking || streaming}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '&:disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500',
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {typeof snackbar.message === 'string'
              ? snackbar.message
              : JSON.stringify(snackbar.message)}
          </Alert>
        </Snackbar>
      </Dialog>

      {/* CSS for blinking cursor animation */}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </>
  );
};

export default LinkChatModal;
