import {
  AssignmentOutlined as AssignmentIcon,
  BarChartOutlined as BarChartIcon,
  BookOutlined as BookIcon,
  BuildOutlined as BuildIcon,
  CheckCircleOutlined as CheckCircleIcon,
  Close as CloseIcon,
  HelpOutline as HelpIcon,
  LightbulbOutlined as LightbulbIcon,
  VisibilityOutlined as PreviewIcon,
  ScheduleOutlined as ScheduleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface ConversationAspect {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  extractedContent: string;
}

interface ConversationSummarizerProps {
  open: boolean;
  onClose: () => void;
  action: string;
  messages: ChatMessage[];
  onProcess: (selectedAspects: string[], action: string) => void;
  onRedirectToAI?: (message: string) => void;
}

const ConversationSummarizer: React.FC<ConversationSummarizerProps> = ({
  open,
  onClose,
  action,
  messages,
  onProcess,
  onRedirectToAI,
}) => {
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Extraction functions
  const extractKeyPoints = (messages: ChatMessage[]): string => {
    const keyPoints = messages
      .filter(msg => msg.content.length > 50)
      .map(msg => `• ${msg.content.substring(0, 100)}...`)
      .slice(0, 5);
    return keyPoints.join('\n');
  };

  const extractQuestions = (messages: ChatMessage[]): string => {
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

  const extractDataFacts = (messages: ChatMessage[]): string => {
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

  const extractDecisions = (messages: ChatMessage[]): string => {
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

  const extractActionItems = (messages: ChatMessage[]): string => {
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

  const extractProblemsSolutions = (messages: ChatMessage[]): string => {
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

  const extractDefinitions = (messages: ChatMessage[]): string => {
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

  const extractTimeline = (messages: ChatMessage[]): string => {
    const timeline = messages
      .map(
        (msg, index) =>
          `${index + 1}. ${msg.isUser ? 'User' : 'AI'}: ${msg.content.substring(0, 80)}...`
      )
      .slice(0, 8);
    return timeline.join('\n');
  };

  // Define conversation aspects in descending rainbow order (Red → Orange → Yellow → Green → Blue → Indigo → Violet)
  const conversationAspects: ConversationAspect[] = [
    {
      id: 'action-items',
      name: 'Action Items',
      description: 'Tasks, next steps, to-dos',
      icon: <AssignmentIcon sx={{ color: '#f44336', fontSize: '1.2rem' }} />,
      color: '#f44336', // Red
      extractedContent: extractActionItems(messages),
    },
    {
      id: 'problems-solutions',
      name: 'Problems & Solutions',
      description: 'Issues raised and how they were addressed',
      icon: <BuildIcon sx={{ color: '#ff5722', fontSize: '1.2rem' }} />,
      color: '#ff5722', // Red-Orange
      extractedContent: extractProblemsSolutions(messages),
    },
    {
      id: 'key-points',
      name: 'Key Points',
      description: 'Main ideas, concepts, and important information',
      icon: <LightbulbIcon sx={{ color: '#ff9800', fontSize: '1.2rem' }} />,
      color: '#ff9800', // Orange
      extractedContent: extractKeyPoints(messages),
    },
    {
      id: 'definitions',
      name: 'Definitions',
      description: 'Terms, concepts, and explanations provided',
      icon: <BookIcon sx={{ color: '#ffc107', fontSize: '1.2rem' }} />,
      color: '#ffc107', // Yellow/Amber
      extractedContent: extractDefinitions(messages),
    },
    {
      id: 'data-facts',
      name: 'Data & Facts',
      description: 'Specific data, numbers, statistics, dates',
      icon: <BarChartIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />,
      color: '#4caf50', // Green
      extractedContent: extractDataFacts(messages),
    },
    {
      id: 'questions',
      name: 'Questions',
      description: 'All questions asked and answered',
      icon: <HelpIcon sx={{ color: '#2196f3', fontSize: '1.2rem' }} />,
      color: '#2196f3', // Blue
      extractedContent: extractQuestions(messages),
    },
    {
      id: 'decisions',
      name: 'Decisions',
      description: 'Conclusions, choices made, agreements',
      icon: <CheckCircleIcon sx={{ color: '#9c27b0', fontSize: '1.2rem' }} />,
      color: '#9c27b0', // Purple/Violet
      extractedContent: extractDecisions(messages),
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Chronological sequence of events or steps',
      icon: <ScheduleIcon sx={{ color: '#795548', fontSize: '1.2rem' }} />,
      color: '#795548', // Brown (Earth tone)
      extractedContent: extractTimeline(messages),
    },
  ];

  const handleAspectSelection = (aspectId: string) => {
    setSelectedAspects(prev =>
      prev.includes(aspectId) ? prev.filter(id => id !== aspectId) : [...prev, aspectId]
    );
  };

  const handleProcess = () => {
    if (selectedAspects.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one aspect to process',
        severity: 'error',
      });
      return;
    }

    // Create a pre-filled message for the AI popup
    const selectedAspectNames = selectedAspects
      .map(aspectId => {
        const aspect = conversationAspects.find(a => a.id === aspectId);
        return aspect?.name;
      })
      .filter(Boolean);

    // Debug: Log the messages being processed
    console.log('Messages for processing:', messages);
    console.log('Selected aspects:', selectedAspectNames);

    // Create a more structured and concise message
    const conversationSummary = messages
      .map(msg => `${msg.isUser ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n')
      .substring(0, 1500); // Limit conversation history to prevent token overflow

    console.log('Conversation summary length:', conversationSummary.length);
    console.log('Conversation summary:', conversationSummary);

    // Create simple, direct messages for each aspect
    const aspectMessages: Record<string, string> = {
      'action-items':
        'Based on this conversation, can you give me my next steps, tasks, and to-dos?',
      'problems-solutions':
        'Can you summarize the problems and solutions we covered in this conversation?',
      'key-points': 'Can you highlight the key points we discussed in this conversation?',
      definitions: 'Can you define and explain the key terms and concepts from our conversation?',
      'data-facts':
        'Can you extract and summarize the important data, statistics, and facts from our conversation?',
      questions: 'Can you list the questions we discussed and provide answers or insights?',
      decisions:
        'Can you summarize the decisions we made and conclusions we reached in this conversation?',
      timeline: 'Can you create a timeline or chronological summary of what we discussed?',
    };

    // Use the first selected aspect's message (or combine if multiple selected)
    const primaryAspect = selectedAspects[0];
    let message =
      aspectMessages[primaryAspect] ||
      `Can you help me with ${selectedAspectNames.join(', ')} from our conversation?`;

    // If multiple aspects selected, add them as context
    if (selectedAspects.length > 1) {
      const additionalAspects = selectedAspects.slice(1);
      message += ` Also, please consider: ${additionalAspects
        .map(id => {
          const aspect = conversationAspects.find(a => a.id === id);
          return aspect?.name.toLowerCase();
        })
        .filter(Boolean)
        .join(', ')}.`;
    }

    console.log('Final message being sent:', message);

    // If redirect function is provided, use it; otherwise fall back to original behavior
    if (onRedirectToAI) {
      onRedirectToAI(message);
      setSelectedAspects([]);
      onClose();
    } else {
      onProcess(selectedAspects, action);
      setSelectedAspects([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedAspects([]);
    onClose();
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'SUMMARIZE':
        return 'summarize';
      case 'EXTRACT':
        return 'extract key points from';
      case 'REWRITE':
        return 'rewrite';
      default:
        return 'process';
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '2px solid #d32f2f',
            maxHeight: '90vh',
            width: { xs: '95vw', sm: '90vw', md: '80vw' },
            maxWidth: { xs: '95vw', sm: '90vw', md: '80vw' },
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                color: '#d32f2f',
                fontWeight: 700,
                fontSize: '1.5rem',
              }}
            >
              Select Conversation Aspects to {action}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            height: '70vh',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Left Column - Options */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              borderRight: { md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
              maxHeight: { xs: '40vh', md: 'none' },
              overflowY: { xs: 'auto', md: 'visible' },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the conversation aspects you want to {getActionDescription(action)}. Each
              aspect will be intelligently extracted from your chat history.
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 2,
                maxHeight: { xs: 'calc(40vh - 120px)', md: 'calc(70vh - 120px)' },
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              {conversationAspects.map(aspect => (
                <Box
                  key={aspect.id}
                  sx={{
                    p: 2,
                    border: selectedAspects.includes(aspect.id)
                      ? '2px solid #d32f2f'
                      : '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    backgroundColor: selectedAspects.includes(aspect.id)
                      ? 'rgba(211, 47, 47, 0.06)'
                      : theme =>
                          theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
                    '&:hover': {
                      backgroundColor: selectedAspects.includes(aspect.id)
                        ? 'rgba(211, 47, 47, 0.1)'
                        : theme =>
                            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                      borderColor: selectedAspects.includes(aspect.id)
                        ? '#d32f2f'
                        : 'rgba(211, 47, 47, 0.3)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onClick={() => handleAspectSelection(aspect.id)}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1.5 }}>{aspect.icon}</Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: aspect.color,
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            lineHeight: 1.2,
                          }}
                        >
                          {aspect.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme => theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {aspect.description}
                        </Typography>
                      </Box>
                    </Box>
                    {selectedAspects.includes(aspect.id) && (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: '#d32f2f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Column - Preview & Visualization */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              maxHeight: { xs: 'calc(70vh - 40vh)', md: 'none' },
              overflowY: { xs: 'auto', md: 'visible' },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#d32f2f',
                fontWeight: 700,
                fontSize: '1.2rem',
                mb: 2,
              }}
            >
              Preview & Analysis
            </Typography>

            {selectedAspects.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 'calc(30vh - 60px)', md: 'calc(70vh - 120px)' },
                  textAlign: 'center',
                  color: theme => theme.palette.text.secondary,
                }}
              >
                <PreviewIcon
                  sx={{
                    fontSize: '6rem',
                    mb: 2,
                    opacity: 0.3,
                    color: '#d32f2f',
                  }}
                />
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.7, color: '#d32f2f' }}>
                  Select aspects to see preview
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                  Choose conversation aspects from the left to see a detailed preview and analysis
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  height: { xs: 'calc(30vh - 60px)', md: 'calc(70vh - 120px)' },
                  overflowY: 'auto',
                }}
              >
                {/* Summary Statistics */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(211, 47, 47, 0.1)'
                        : 'rgba(211, 47, 47, 0.05)',
                    borderRadius: 3,
                    mb: 3,
                    border: '1px solid rgba(211, 47, 47, 0.2)',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Selection Summary
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {selectedAspects.map(aspectId => {
                      const aspect = conversationAspects.find(a => a.id === aspectId);
                      return (
                        <Box
                          key={aspectId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            backgroundColor: theme => theme.palette.background.paper,
                            borderRadius: 2,
                            border: `1px solid ${aspect?.color}40`,
                          }}
                        >
                          <Box sx={{ fontSize: '0.9rem' }}>{aspect?.icon}</Box>
                          <Typography
                            variant="caption"
                            sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                          >
                            {aspect?.name}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Preview Content */}
                {selectedAspects.map(aspectId => {
                  const aspect = conversationAspects.find(a => a.id === aspectId);
                  if (!aspect || !aspect.extractedContent) return null;

                  return (
                    <Box
                      key={aspectId}
                      sx={{
                        mb: 3,
                        p: 2.5,
                        backgroundColor: theme => theme.palette.background.paper,
                        borderRadius: 3,
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          backgroundColor: aspect.color,
                          borderRadius: '0 2px 2px 0',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ mr: 1.5 }}>{aspect.icon}</Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: aspect.color,
                            fontWeight: 600,
                            fontSize: '1.1rem',
                          }}
                        >
                          {aspect.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          color: theme => theme.palette.text.primary,
                          fontSize: '0.9rem',
                        }}
                      >
                        {aspect.extractedContent}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: '#d32f2f',
              color: '#d32f2f',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.8rem',
              padding: '6px 16px',
              '&:hover': {
                borderColor: '#9a0007',
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            variant="contained"
            disabled={selectedAspects.length === 0}
            sx={{
              backgroundColor: '#d32f2f',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.8rem',
              padding: '6px 16px',
              '&:hover': {
                backgroundColor: '#9a0007',
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af',
              },
            }}
          >
            {action} Selected Aspects ({selectedAspects.length})
          </Button>
        </DialogActions>
      </Dialog>

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

export default ConversationSummarizer;
