import { Close as CloseIcon } from '@mui/icons-material';
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
  useTheme,
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
  icon: string;
  color: string;
  extractedContent: string;
}

interface ConversationSummarizerProps {
  open: boolean;
  onClose: () => void;
  action: string;
  messages: ChatMessage[];
  onProcess: (selectedAspects: string[], action: string) => void;
}

const ConversationSummarizer: React.FC<ConversationSummarizerProps> = ({
  open,
  onClose,
  action,
  messages,
  onProcess,
}) => {
  const theme = useTheme();
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

  // Define conversation aspects
  const conversationAspects: ConversationAspect[] = [
    {
      id: 'key-points',
      name: 'Key Points',
      description: 'Main ideas, concepts, and important information',
      icon: '💡',
      color: '#ff9800',
      extractedContent: extractKeyPoints(messages),
    },
    {
      id: 'questions',
      name: 'Questions',
      description: 'All questions asked and answered',
      icon: '❓',
      color: '#2196f3',
      extractedContent: extractQuestions(messages),
    },
    {
      id: 'data-facts',
      name: 'Data & Facts',
      description: 'Specific data, numbers, statistics, dates',
      icon: '📊',
      color: '#4caf50',
      extractedContent: extractDataFacts(messages),
    },
    {
      id: 'decisions',
      name: 'Decisions',
      description: 'Conclusions, choices made, agreements',
      icon: '✅',
      color: '#9c27b0',
      extractedContent: extractDecisions(messages),
    },
    {
      id: 'action-items',
      name: 'Action Items',
      description: 'Tasks, next steps, to-dos',
      icon: '📋',
      color: '#f44336',
      extractedContent: extractActionItems(messages),
    },
    {
      id: 'problems-solutions',
      name: 'Problems & Solutions',
      description: 'Issues raised and how they were addressed',
      icon: '🔧',
      color: '#ff5722',
      extractedContent: extractProblemsSolutions(messages),
    },
    {
      id: 'definitions',
      name: 'Definitions',
      description: 'Terms, concepts, and explanations provided',
      icon: '📚',
      color: '#607d8b',
      extractedContent: extractDefinitions(messages),
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Chronological sequence of events or steps',
      icon: '⏰',
      color: '#795548',
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

    onProcess(selectedAspects, action);
    setSelectedAspects([]);
    onClose();
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
            border: '2px solid #f44336',
            maxHeight: '90vh',
            width: { xs: '95vw', sm: '90vw', md: '80vw' },
            maxWidth: { xs: '95vw', sm: '90vw', md: '80vw' },
            backgroundColor: theme => theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                fontWeight: 'bold',
              }}
            >
              Select Conversation Aspects to {action}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose the conversation aspects you want to {getActionDescription(action)}. Each aspect
            will be intelligently extracted from your chat history.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 2,
            }}
          >
            {conversationAspects.map(aspect => (
              <Box
                key={aspect.id}
                sx={{
                  p: 2.5,
                  border: selectedAspects.includes(aspect.id)
                    ? '2px solid #f44336'
                    : '1px solid #e0e0e0',
                  borderRadius: 3,
                  cursor: 'pointer',
                  backgroundColor: selectedAspects.includes(aspect.id)
                    ? '#fff5f5'
                    : theme.palette.background.default,
                  boxShadow: selectedAspects.includes(aspect.id)
                    ? '0 2px 8px rgba(244, 67, 54, 0.2)'
                    : '0 1px 2px rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: selectedAspects.includes(aspect.id) ? '#fff5f5' : '#f5f5f5',
                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.15)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleAspectSelection(aspect.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      mr: 1.5,
                    }}
                  >
                    {aspect.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: aspect.color,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                    }}
                  >
                    {aspect.name}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, fontSize: '0.875rem' }}
                >
                  {aspect.description}
                </Typography>
                {aspect.extractedContent && (
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 1,
                        display: 'block',
                      }}
                    >
                      Preview:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.4,
                        color: theme.palette.text.primary,
                        fontSize: '0.8rem',
                        maxHeight: '80px',
                        overflow: 'hidden',
                      }}
                    >
                      {aspect.extractedContent}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(244, 67, 54, 0.04)',
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
              backgroundColor: '#f44336',
              '&:hover': {
                backgroundColor: '#d32f2f',
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
