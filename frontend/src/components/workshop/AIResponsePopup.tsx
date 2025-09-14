import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  DownloadOutlined as DownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FullscreenExit as FullscreenExitIcon,
  Fullscreen as FullscreenIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Remove as MinimizeIcon,
  RecordVoiceOverOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Slide,
  Snackbar,
  SwipeableDrawer,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useWorkshopStore } from '../../services/WorkshopService';
import ConversationSummarizer from './ConversationSummarizer';
import EnhancedChatInterface from './EnhancedChatInterface';
import EnhancedFileAnalysisInterface from './EnhancedFileAnalysisInterface';
import EnhancedLinkAnalysisInterface from './EnhancedLinkAnalysisInterface';

interface AIResponsePopupProps {
  open: boolean;
  onClose: () => void;
  uploadType: 'text' | 'file' | 'link';
  content: any;
}

const Transition = React.forwardRef(function Transition(props: any, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AIResponsePopup: React.FC<AIResponsePopupProps> = ({
  open,
  onClose,
  uploadType,
  content,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { clearHistory, history: workshopHistory, generatedContent } = useWorkshopStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isScoreExpanded, setIsScoreExpanded] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    message: string;
  }>({ open: false, action: '', title: '', message: '' });
  const [processedContent, setProcessedContent] = useState<string>('');
  const [showProcessedContent, setShowProcessedContent] = useState(false);
  const [clearChatRef, setClearChatRef] = useState<(() => void) | null>(null);
  const [showMessageSelection, setShowMessageSelection] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('SUMMARIZE');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Get conversation history from Workshop store
  useEffect(() => {
    const history = workshopHistory.filter((item: any) => item.type === 'chat');
    const messages = history.map((item: any) => ({
      id: item.id,
      content: item.prompt,
      isUser: true,
      timestamp: item.timestamp,
    }));

    // Add AI responses
    history.forEach((item: any) => {
      if (item.content) {
        messages.push({
          id: `${item.id}-response`,
          content: item.content,
          isUser: false,
          timestamp: item.timestamp,
        });
      }
    });

    // Sort by timestamp
    messages.sort(
      (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setChatMessages(messages);
    console.log('Updated chat messages from Workshop history:', messages);
    console.log('Workshop history items:', workshopHistory);
  }, [workshopHistory]);

  const handleClose = () => {
    // Clear chat history when popup is closed
    if (clearChatRef) {
      console.log('Clearing chat history on popup close');
      clearChatRef();
    }
    // Clear workshop history from store
    console.log('Clearing workshop history from store on popup close');
    clearHistory();
    onClose();
  };

  const handleClearChat = (clearFn: () => void) => {
    console.log('Setting up clear function');
    setClearChatRef(() => clearFn);
  };

  const handleChatMessagesUpdate = (messages: any[]) => {
    setChatMessages(messages);
  };

  // Extraction functions (same as in ConversationSummarizer)
  const extractKeyPoints = (messages: any[]): string => {
    const keyPoints = messages
      .filter(msg => msg.content.length > 50)
      .map(msg => `• ${msg.content.substring(0, 100)}...`)
      .slice(0, 5);
    return keyPoints.join('\n');
  };

  const extractQuestions = (messages: any[]): string => {
    const questions = messages
      .filter(
        msg =>
          msg.content.includes('?') ||
          msg.content.toLowerCase().includes('what') ||
          msg.content.toLowerCase().includes('how')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return questions.join('\n');
  };

  const extractDataFacts = (messages: any[]): string => {
    const dataFacts = messages
      .filter(
        msg =>
          /\d+/.test(msg.content) ||
          msg.content.toLowerCase().includes('percent') ||
          msg.content.toLowerCase().includes('data')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return dataFacts.join('\n');
  };

  const extractDecisions = (messages: any[]): string => {
    const decisions = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('decide') ||
          msg.content.toLowerCase().includes('choose') ||
          msg.content.toLowerCase().includes('agree')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return decisions.join('\n');
  };

  const extractActionItems = (messages: any[]): string => {
    const actionItems = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('todo') ||
          msg.content.toLowerCase().includes('next') ||
          msg.content.toLowerCase().includes('step')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return actionItems.join('\n');
  };

  const extractProblemsSolutions = (messages: any[]): string => {
    const problemsSolutions = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('problem') ||
          msg.content.toLowerCase().includes('issue') ||
          msg.content.toLowerCase().includes('solution')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return problemsSolutions.join('\n');
  };

  const extractDefinitions = (messages: any[]): string => {
    const definitions = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('definition') ||
          msg.content.toLowerCase().includes('means') ||
          msg.content.toLowerCase().includes('is a')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return definitions.join('\n');
  };

  const extractTimeline = (messages: any[]): string => {
    const timeline = messages
      .map(
        (msg, index) =>
          `${index + 1}. ${msg.isUser ? 'User' : 'AI'}: ${msg.content.substring(0, 80)}...`
      )
      .slice(0, 8);
    return timeline.join('\n');
  };

  const handleProcessSelectedMessages = (selectedAspectIds: string[], action: string) => {
    // Get the selected aspects and their extracted content
    const selectedAspects = selectedAspectIds
      .map(aspectId => {
        switch (aspectId) {
          case 'key-points':
            return 'Key Points:\n' + extractKeyPoints(chatMessages);
          case 'questions':
            return 'Questions:\n' + extractQuestions(chatMessages);
          case 'data-facts':
            return 'Data & Facts:\n' + extractDataFacts(chatMessages);
          case 'decisions':
            return 'Decisions:\n' + extractDecisions(chatMessages);
          case 'action-items':
            return 'Action Items:\n' + extractActionItems(chatMessages);
          case 'problems-solutions':
            return 'Problems & Solutions:\n' + extractProblemsSolutions(chatMessages);
          case 'definitions':
            return 'Definitions:\n' + extractDefinitions(chatMessages);
          case 'timeline':
            return 'Timeline:\n' + extractTimeline(chatMessages);
          default:
            return '';
        }
      })
      .join('\n\n');

    // Process the selected aspects based on action
    let processedText = '';
    switch (action) {
      case 'SUMMARIZE':
        processedText = `Please provide a comprehensive summary of the following conversation aspects:\n\n${selectedAspects}`;
        break;
      case 'EXTRACT':
        processedText = `Please extract and organize the key information from these conversation aspects:\n\n${selectedAspects}`;
        break;
      case 'REWRITE':
        processedText = `Please rewrite and improve the clarity of these conversation aspects:\n\n${selectedAspects}`;
        break;
    }

    // Send the processed text to the chat
    if (clearChatRef) {
      // Clear current chat first
      clearChatRef();
    }

    // Send the processed request to the chat after a short delay
    setTimeout(() => {
      // Find the chat interface and send the message
      const chatInput = document.querySelector(
        'textarea[placeholder*="Message AssignmentAI"]'
      ) as HTMLTextAreaElement;
      const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

      if (chatInput && sendButton) {
        // Set the input value
        chatInput.value = processedText;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Click the send button
        sendButton.click();
      } else {
        // Fallback: show processed content dialog
        setProcessedContent(processedText);
        setShowProcessedContent(true);
      }
    }, 200);

    // Close the selection dialog
    setShowMessageSelection(false);
    setSelectedAction('');
  };

  const handleQuickAction = (action: string) => {
    if (action === 'DOWNLOAD') {
      // Get current content based on upload type
      let contentToExport = '';
      switch (uploadType) {
        case 'text':
          contentToExport = content?.text || '';
          break;
        case 'file':
          contentToExport = `File: ${content?.name || 'Document'}\nContent: ${
            content?.content || ''
          }`;
          break;
        case 'link':
          contentToExport = `Link: ${content?.url || ''}\nTitle: ${
            content?.title || ''
          }\nContent: ${content?.content || ''}`;
          break;
      }
      handleExport(contentToExport);
    } else {
      // For SUMMARIZE, EXTRACT, REWRITE - show message selection
      setSelectedAction(action);
      setShowMessageSelection(true);
    }
  };

  const handleConfirmAction = () => {
    const { action } = confirmationDialog;
    setConfirmationDialog({ open: false, action: '', title: '', message: '' });

    // Simulate processing and show results
    let processedText = '';
    switch (action) {
      case 'SUMMARIZE':
        processedText = `📝 SUMMARY\n\nHere's the gist of what you shared:\n\n• Main idea: The core concept that matters most\n• Key insight: The "aha!" moment from your content\n• Bottom line: What you should remember\n\nPretty neat, right? 😊`;
        break;
      case 'EXTRACT':
        processedText = `🎯 KEY POINTS\n\nI found these gems in your content:\n\n1. The big idea\n2. Supporting evidence\n3. Important details\n4. Action items\n\nThat's the good stuff! ✨`;
        break;
      case 'REWRITE':
        processedText = `✨ REWRITTEN VERSION\n\nI've spruced this up for you:\n\n• Made it flow better\n• Fixed the awkward bits\n• Added some clarity\n• Kept your voice intact\n\nMuch cleaner now! 🚀`;
        break;
    }

    setProcessedContent(processedText);
    setShowProcessedContent(true);
    setSnackbar({
      open: true,
      message: `${action} completed successfully!`,
      severity: 'success',
    });
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(processedContent);
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

  const handleDownloadProcessedContent = () => {
    handleExport(processedContent);
    setSnackbar({
      open: true,
      message: 'Processed content downloaded!',
      severity: 'success',
    });
  };

  const handleExport = (content: string, format?: string) => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${new Date().toISOString().split('T')[0]}.${format || 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Content exported successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export content',
        severity: 'error',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50'; // Green - High/Good
    if (score >= 60) return '#ffc107'; // Yellow/Gold - Medium
    return '#f44336'; // Red - Low
  };

  const getTitle = () => {
    switch (uploadType) {
      case 'text':
        return 'AI Chat Assistant';
      case 'file':
        return `File Analysis - ${content?.name || 'Document'}`;
      case 'link':
        return `Link Analysis - ${content?.title || 'Web Content'}`;
      default:
        return 'AI Analysis';
    }
  };

  const renderMainContent = () => {
    switch (uploadType) {
      case 'text':
        return (
          <EnhancedChatInterface
            initialText={content?.text}
            onMessageSent={message => {
              console.log('Message sent:', message);
            }}
            onClear={handleClearChat}
            onMessagesUpdate={handleChatMessagesUpdate}
          />
        );
      case 'file':
        return (
          <EnhancedFileAnalysisInterface
            file={content}
            onAnalysisComplete={results => {
              console.log('File analysis complete:', results);
            }}
            onExport={handleExport}
          />
        );
      case 'link':
        return (
          <EnhancedLinkAnalysisInterface
            link={content}
            onAnalysisComplete={results => {
              console.log('Link analysis complete:', results);
            }}
            onExport={handleExport}
          />
        );
      default:
        return null;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsMinimized(!isMinimized);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isFullscreen, isMinimized, onClose]);

  // Touch gestures for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const startY = touch.clientY;

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const currentY = touch.clientY;
        const diff = startY - currentY;

        // Swipe down to close
        if (diff < -100) {
          handleClose();
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        }
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    },
    [onClose]
  );

  const QuickActionsSidebar = () => (
    <Box
      sx={{
        width: { xs: '100%', md: '300px' },
        borderLeft: { xs: 'none', md: '1px solid #e0e0e0' },
        borderTop: { xs: '1px solid #e0e0e0', md: 'none' },
        p: 2,
        backgroundColor: theme =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
        overflow: 'auto',
        maxHeight: { xs: '40vh', md: '100%' },
      }}
    >
      {/* Chat Quality Score */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
          color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
          mb: 2,
        }}
      >
        Chat Quality Score
      </Typography>

      {/* Overall Score - Always Visible */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        {(() => {
          const score = 85;
          const scoreColor = getScoreColor(score);
          const circumference = Math.PI * 80; // Half circle circumference
          const strokeDasharray = `${circumference * (score / 100)} ${circumference}`;
          return (
            <Box
              sx={{
                width: 200,
                height: 120,
                position: 'relative',
                margin: '0 auto 12px',
              }}
            >
              <svg
                width="200"
                height="120"
                viewBox="0 0 200 120"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                {/* Background semicircle */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Progress semicircle */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              {/* Score text - Clean layout */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '70%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    textShadow: '0 0 6px rgba(255,255,255,0.9)',
                    lineHeight: 1,
                  }}
                >
                  {score}
                </Typography>
              </Box>
            </Box>
          );
        })()}
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2 }}>
          Overall Quality
        </Typography>

        {/* View Score Details Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => setIsScoreExpanded(!isScoreExpanded)}
          sx={{
            fontSize: '0.75rem',
            textTransform: 'none',
            borderColor: 'red',
            color: 'red',
            fontWeight: 'bold',
            '&:hover': {
              borderColor: 'red',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
            },
          }}
        >
          {isScoreExpanded ? 'Hide Details' : 'View Score Details'}
        </Button>
      </Box>

      {/* Collapsible Detailed Breakdown */}
      <Box
        sx={{
          maxHeight: isScoreExpanded ? '500px' : '0',
          overflow: isScoreExpanded ? 'auto' : 'hidden',
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-in-out',
          opacity: isScoreExpanded ? 1 : 0,
          mb: isScoreExpanded ? 2 : 0,
        }}
      >
        <Box sx={{ mb: 2 }}>
          {/* Score Breakdown */}
          <Box sx={{ mb: 2 }}>
            {[
              { label: 'Clarity', score: 92, color: '#4caf50' },
              { label: 'Relevance', score: 88, color: '#8bc34a' },
              { label: 'Completeness', score: 85, color: '#ffc107' },
              { label: 'Tone', score: 90, color: '#4caf50' },
              { label: 'Structure', score: 78, color: '#ff9800' },
            ].map(({ label, score, color }, index) => (
              <Box
                key={index}
                sx={{
                  mb: 1.5,
                  transform: isScoreExpanded ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isScoreExpanded ? 1 : 0,
                  transition: `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${
                    index * 0.1
                  }s, opacity 0.4s ease ${index * 0.1}s`,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.875rem', fontWeight: 'bold', color }}
                  >
                    {score}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 4,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${score}%`,
                      height: '100%',
                      backgroundColor: color,
                      borderRadius: 2,
                      transition: 'width 0.6s ease 0.2s',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>

          {/* Improvement Suggestions */}
          <Box
            sx={{
              mt: 2,
              transform: isScoreExpanded ? 'translateY(0)' : 'translateY(20px)',
              opacity: isScoreExpanded ? 1 : 0,
              transition:
                'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.6s, opacity 0.4s ease 0.6s',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600, color: 'red' }}
            >
              💡 Suggestions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                • Add more specific examples
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                • Improve paragraph structure
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                • Consider adding a conclusion
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Quick Actions */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
          color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
          mb: 2,
        }}
      >
        Quick Actions
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
          mb: 3,
        }}
      >
        {[
          { index: 0, label: 'SUMMARIZE', icon: RecordVoiceOverOutlined, color: '#ff9800' },
          { index: 1, label: 'EXTRACT', icon: FormatListBulletedIcon, color: '#ffc107' },
          { index: 2, label: 'DOWNLOAD', icon: DownloadOutlinedIcon, color: '#9c27b0' },
          { index: 3, label: 'REWRITE', icon: EditOutlinedIcon, color: '#2196f3' },
        ].map(({ index, label, icon: Icon, color }) => (
          <Button
            key={index}
            onClick={() => handleQuickAction(label)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              color: color,
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontWeight: 'normal',
              minWidth: '100%',
              justifyContent: 'center',
              fontSize: '0.75rem',
              padding: 1,
              '&:hover': {
                backgroundColor: 'transparent',
                color: color,
              },
            }}
          >
            <Icon sx={{ color: color, fontSize: '1.5rem' }} />
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            height: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            border: '2px solid red',
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
          onTouchStart={handleTouchStart}
        >
          {/* Mobile Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
              {getTitle()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Minimize">
                <IconButton onClick={() => setIsMinimized(!isMinimized)}>
                  <KeyboardArrowDownIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {!isMinimized && (
            <>
              {/* Mobile Content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>{renderMainContent()}</Box>
                <QuickActionsSidebar />
              </Box>
            </>
          )}
        </Box>
      </SwipeableDrawer>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={isFullscreen ? false : 'lg'}
        fullWidth
        fullScreen={isFullscreen}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: isFullscreen ? 0 : 3,
            border: '2px solid red',
            maxHeight: isFullscreen ? '100vh' : '90vh',
            width: isFullscreen ? '100vw' : { xs: '95vw', sm: '90vw', md: '80vw' },
            maxWidth: isFullscreen ? '100vw' : { xs: '95vw', sm: '90vw', md: '80vw' },
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            ...(isMinimized && {
              height: '60px',
              maxHeight: '60px',
            }),
          },
        }}
        BackdropComponent={isFullscreen ? Backdrop : undefined}
        BackdropProps={isFullscreen ? { sx: { backgroundColor: 'rgba(0,0,0,0.8)' } } : undefined}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
            ...(isMinimized && { display: 'none' }),
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                fontWeight: 'normal',
              }}
            >
              {getTitle()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title={isMinimized ? 'Restore' : 'Minimize'}>
                <IconButton
                  size="small"
                  onClick={() => setIsMinimized(!isMinimized)}
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MinimizeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <IconButton
                  size="small"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton
                  onClick={handleClose}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>

        {!isMinimized ? (
          <DialogContent sx={{ p: 0, display: 'flex', height: '70vh' }}>
            {/* Main Content Area */}
            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>{renderMainContent()}</Box>

            {/* Quick Actions & AI Suggestions Sidebar */}
            <QuickActionsSidebar />
          </DialogContent>
        ) : (
          <DialogContent
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '48px',
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #e5e5e5',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10a37f',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#6b7280',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {getTitle()} - Minimized
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Restore">
                <IconButton
                  size="small"
                  onClick={() => setIsMinimized(false)}
                  sx={{
                    width: 24,
                    height: 24,
                    color: '#6b7280',
                    '&:hover': {
                      color: '#10a37f',
                      backgroundColor: 'rgba(16, 163, 127, 0.1)',
                    },
                  }}
                >
                  <MinimizeIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={handleClose}
                  sx={{
                    width: 24,
                    height: 24,
                    color: '#6b7280',
                    '&:hover': {
                      color: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog({ open: false, action: '', title: '', message: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmationDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmationDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmationDialog({ open: false, action: '', title: '', message: '' })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processed Content Display */}
      <Dialog
        open={showProcessedContent}
        onClose={() => setShowProcessedContent(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          }}
        >
          Processed Content
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopyContent} size="small">
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download content">
              <IconButton onClick={handleDownloadProcessedContent} size="small">
                <DownloadOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={() => setShowProcessedContent(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              maxHeight: '60vh',
              overflow: 'auto',
              p: 2,
              backgroundColor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300',
              m: 2,
            }}
          >
            {generatedContent || processedContent}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Conversation Summarizer */}
      <ConversationSummarizer
        open={showMessageSelection}
        onClose={() => setShowMessageSelection(false)}
        action={selectedAction}
        messages={chatMessages}
        onProcess={handleProcessSelectedMessages}
        onRedirectToAI={async message => {
          // Close the conversation summarizer
          setShowMessageSelection(false);

          // Debug: Log the message being sent
          console.log('Sending message to chat:', message);

          // Inject the message into the actual chat interface (like typing and sending)
          setTimeout(() => {
            console.log('Looking for chat input to inject message...');

            // Try multiple selectors to find the chat input
            const selectors = [
              'input[placeholder*="Message"]',
              'textarea[placeholder*="Message"]',
              'input[placeholder*="message"]',
              'textarea[placeholder*="message"]',
              'input[data-testid*="chat"]',
              'textarea[data-testid*="chat"]',
              'input[data-testid*="input"]',
              'textarea[data-testid*="input"]',
              'input[type="text"]',
              'textarea',
            ];

            let chatInput: HTMLInputElement | HTMLTextAreaElement | null = null;

            // Try each selector
            for (const selector of selectors) {
              const element = document.querySelector(selector) as
                | HTMLInputElement
                | HTMLTextAreaElement;
              if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
                chatInput = element;
                console.log(`Found chat input with selector: ${selector}`, element);
                break;
              }
            }

            if (chatInput) {
              console.log('Chat input found, injecting message:', message);

              // Clear any existing content
              chatInput.value = '';

              // Simulate typing the message character by character
              let i = 0;
              const typeMessage = () => {
                if (i < message.length) {
                  chatInput!.value += message[i];
                  chatInput!.dispatchEvent(new Event('input', { bubbles: true }));
                  chatInput!.dispatchEvent(new Event('change', { bubbles: true }));
                  i++;
                  setTimeout(typeMessage, 10); // Type 100 characters per second
                } else {
                  // Message fully typed, now send it
                  console.log('Message fully typed, sending...');

                  // Focus the input
                  chatInput!.focus();

                  // Try to find and click send button
                  const sendSelectors = [
                    '[data-testid="send-button"]',
                    'button[type="submit"]',
                    'button[aria-label*="send"]',
                    'button[aria-label*="Send"]',
                    'button:has(svg)',
                    '.send-button',
                    'button[title*="send"]',
                    'button[title*="Send"]',
                  ];

                  let sendButton: HTMLButtonElement | null = null;
                  for (const selector of sendSelectors) {
                    const button = document.querySelector(selector) as HTMLButtonElement;
                    if (button && button.tagName === 'BUTTON') {
                      sendButton = button;
                      console.log(`Found send button with selector: ${selector}`, button);
                      break;
                    }
                  }

                  if (sendButton) {
                    console.log('Clicking send button');
                    sendButton.click();
                  } else {
                    console.log('Send button not found, trying Enter key');
                    // Try Enter key
                    chatInput!.dispatchEvent(
                      new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true,
                      })
                    );
                  }
                }
              };

              // Start typing the message
              typeMessage();
            } else {
              console.error('Chat input not found with any selector');
              console.log(
                'Available inputs on page:',
                document.querySelectorAll('input, textarea')
              );
            }
          }, 500);
        }}
      />

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
    </>
  );
};

export default AIResponsePopup;
