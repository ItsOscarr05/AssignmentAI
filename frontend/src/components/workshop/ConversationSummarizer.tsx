import {
  ArrowForwardOutlined as ArrowForwardIcon,
  AssignmentOutlined as AssignmentIcon,
  BarChartOutlined as BarChartIcon,
  BookOutlined as BookIcon,
  BuildOutlined as BuildIcon,
  CheckCircleOutlined as CheckCircleIcon,
  Close as CloseIcon,
  FlagOutlined as FlagIcon,
  HelpOutline as HelpIcon,
  CodeOutlined as JsonIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  LightbulbOutlined as LightbulbIcon,
  TextFieldsOutlined as MarkdownIcon,
  PictureAsPdfOutlined as PdfIcon,
  VisibilityOutlined as PreviewIcon,
  PsychologyOutlined as PsychologyIcon,
  ScheduleOutlined as ScheduleIcon,
  ThumbUpOutlined as ThumbUpIcon,
  TopicOutlined as TopicIcon,
  DescriptionOutlined as TxtIcon,
  WarningAmberOutlined as WarningIcon,
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
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);
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

  // Additional extraction functions for new aspects
  const extractMainTopics = (messages: ChatMessage[]): string => {
    const topics = messages
      .filter(msg => msg.content.length > 50)
      .map(msg => `• ${msg.content.substring(0, 100)}...`)
      .slice(0, 6);
    return topics.join('\n');
  };

  const extractOutcomes = (messages: ChatMessage[]): string => {
    const outcomes = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('result') ||
          msg.content.toLowerCase().includes('outcome') ||
          msg.content.toLowerCase().includes('conclusion') ||
          msg.content.toLowerCase().includes('achieved')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return outcomes.join('\n');
  };

  const extractChallenges = (messages: ChatMessage[]): string => {
    const challenges = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('challenge') ||
          msg.content.toLowerCase().includes('difficult') ||
          msg.content.toLowerCase().includes('issue') ||
          msg.content.toLowerCase().includes('problem')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return challenges.join('\n');
  };

  const extractRecommendations = (messages: ChatMessage[]): string => {
    const recommendations = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('recommend') ||
          msg.content.toLowerCase().includes('suggest') ||
          msg.content.toLowerCase().includes('should') ||
          msg.content.toLowerCase().includes('advise')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return recommendations.join('\n');
  };

  const extractInsights = (messages: ChatMessage[]): string => {
    const insights = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('insight') ||
          msg.content.toLowerCase().includes('realize') ||
          msg.content.toLowerCase().includes('understand') ||
          msg.content.toLowerCase().includes('learn')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return insights.join('\n');
  };

  const extractNextSteps = (messages: ChatMessage[]): string => {
    const nextSteps = messages
      .filter(
        msg =>
          msg.content.toLowerCase().includes('next') ||
          msg.content.toLowerCase().includes('follow up') ||
          msg.content.toLowerCase().includes('continue') ||
          msg.content.toLowerCase().includes('proceed')
      )
      .map(msg => `• ${msg.content}`)
      .slice(0, 5);
    return nextSteps.join('\n');
  };

  // Define conversation aspects in descending rainbow order (Red → Orange → Yellow → Green → Blue → Indigo → Violet)
  // Define all conversation aspects
  const allConversationAspects: ConversationAspect[] = [
    {
      id: 'action-items',
      name: 'Action Items',
      description:
        'Extract specific tasks, assignments, and actionable next steps that require follow-up or completion',
      icon: <AssignmentIcon sx={{ color: '#ffc107', fontSize: '1.2rem' }} />,
      color: '#ffc107', // Yellow
      extractedContent: extractActionItems(messages),
    },
    {
      id: 'problems-solutions',
      name: 'Problems & Solutions',
      description:
        'Identify issues, challenges, or pain points discussed and the corresponding solutions or resolutions provided',
      icon: <BuildIcon sx={{ color: '#2196f3', fontSize: '1.2rem' }} />,
      color: '#2196f3', // Light Blue
      extractedContent: extractProblemsSolutions(messages),
    },
    {
      id: 'key-points',
      name: 'Key Points',
      description:
        'Capture the most important ideas, main concepts, and critical information that form the core of the discussion',
      icon: <LightbulbIcon sx={{ color: '#f44336', fontSize: '1.2rem' }} />,
      color: '#f44336', // Red
      extractedContent: extractKeyPoints(messages),
    },
    {
      id: 'main-topics',
      name: 'Main Topics',
      description:
        'Identify the primary subjects, central themes, and main areas of focus that were explored in the conversation',
      icon: <TopicIcon sx={{ color: '#ff5722', fontSize: '1.2rem' }} />,
      color: '#ff5722', // Red-Orange
      extractedContent: extractMainTopics(messages),
    },
    {
      id: 'definitions',
      name: 'Definitions',
      description:
        'Extract technical terms, jargon, concepts, and explanations that were defined or clarified during the discussion',
      icon: <BookIcon sx={{ color: '#1976d2', fontSize: '1.2rem' }} />,
      color: '#1976d2', // Dark Blue
      extractedContent: extractDefinitions(messages),
    },
    {
      id: 'data-facts',
      name: 'Data & Facts',
      description:
        'Collect specific numbers, statistics, dates, metrics, and factual information that were shared or referenced',
      icon: <BarChartIcon sx={{ color: '#8bc34a', fontSize: '1.2rem' }} />,
      color: '#8bc34a', // Light Green
      extractedContent: extractDataFacts(messages),
    },
    {
      id: 'questions',
      name: 'Questions',
      description:
        'Gather all questions that were asked, answered, or raised during the conversation for future reference',
      icon: <HelpIcon sx={{ color: '#66bb6a', fontSize: '1.2rem' }} />,
      color: '#66bb6a', // Medium Green
      extractedContent: extractQuestions(messages),
    },
    {
      id: 'decisions',
      name: 'Decisions',
      description:
        'Identify conclusions reached, choices made, agreements formed, and final determinations that were established',
      icon: <CheckCircleIcon sx={{ color: '#ff9800', fontSize: '1.2rem' }} />,
      color: '#ff9800', // Orange
      extractedContent: extractDecisions(messages),
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description:
        'Create a chronological sequence of events, steps, or milestones that occurred during the conversation',
      icon: <ScheduleIcon sx={{ color: '#ffc107', fontSize: '1.2rem' }} />,
      color: '#ffc107', // Yellow
      extractedContent: extractTimeline(messages),
    },
    {
      id: 'outcomes',
      name: 'Outcomes',
      description:
        'Capture the results achieved, goals accomplished, and successful conclusions that were reached',
      icon: <FlagIcon sx={{ color: '#ffeb3b', fontSize: '1.2rem' }} />,
      color: '#ffeb3b', // Light Yellow
      extractedContent: extractOutcomes(messages),
    },
    {
      id: 'challenges',
      name: 'Challenges',
      description:
        'Identify difficulties encountered, obstacles faced, and problems that arose during the discussion or project',
      icon: <WarningIcon sx={{ color: '#673ab7', fontSize: '1.2rem' }} />,
      color: '#673ab7', // Dark Purple
      extractedContent: extractChallenges(messages),
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      description:
        'Extract suggestions provided, advice given, and guidance offered for future actions or improvements',
      icon: <ThumbUpIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />,
      color: '#4caf50', // Green
      extractedContent: extractRecommendations(messages),
    },
    {
      id: 'insights',
      name: 'Insights',
      description:
        'Capture key learnings, realizations, discoveries, and deeper understanding that emerged from the conversation',
      icon: <PsychologyIcon sx={{ color: '#e91e63', fontSize: '1.2rem' }} />,
      color: '#e91e63', // Hot Pink
      extractedContent: extractInsights(messages),
    },
    {
      id: 'next-steps',
      name: 'Next Steps',
      description:
        'Identify future actions planned, follow-up items scheduled, and continuation plans for moving forward',
      icon: <ArrowForwardIcon sx={{ color: '#2196f3', fontSize: '1.2rem' }} />,
      color: '#2196f3', // Blue
      extractedContent: extractNextSteps(messages),
    },
  ];

  // Categorize aspects based on action type - each aspect appears in only one category
  // Aspects are organized in priority order within each category
  const getAspectsForAction = (actionType: string): ConversationAspect[] => {
    switch (actionType) {
      case 'SUMMARIZE':
        // High-level overview and synthesis - focus on main themes and flow
        // Priority order: Key Points (most important) → Main Topics → Decisions → Timeline → Outcomes
        return allConversationAspects.filter(aspect =>
          ['key-points', 'main-topics', 'decisions', 'timeline', 'outcomes'].includes(aspect.id)
        );
      case 'EXTRACT':
        // Specific data and structured information - focus on actionable and factual content
        // Priority order: Action Items (most actionable) → Data & Facts → Questions → Recommendations → Next Steps
        return allConversationAspects.filter(aspect =>
          ['action-items', 'data-facts', 'questions', 'recommendations', 'next-steps'].includes(
            aspect.id
          )
        );
      case 'REWRITE':
        // Content transformation and improvement - focus on content that benefits from restructuring
        // Priority order: Problems & Solutions (most complex) → Definitions → Challenges → Insights
        return allConversationAspects.filter(aspect =>
          ['problems-solutions', 'definitions', 'challenges', 'insights'].includes(aspect.id)
        );
      default:
        return allConversationAspects;
    }
  };

  // Get aspects for current action
  const conversationAspects = getAspectsForAction(action);

  const handleAspectSelection = (aspectId: string) => {
    setSelectedAspects(prev =>
      prev.includes(aspectId) ? prev.filter(id => id !== aspectId) : [...prev, aspectId]
    );
  };

  const handleProcess = () => {
    if (selectedAspects.length === 0) {
      setSnackbar({
        open: true,
        message:
          action === 'DOWNLOAD'
            ? 'Please select at least one format to download'
            : 'Please select at least one aspect to process',
        severity: 'error',
      });
      return;
    }

    if (action === 'DOWNLOAD') {
      // Handle download format selection
      const selectedFormat = selectedAspects[0]; // Only allow one format selection
      const format = downloadFormats.find(f => f.id === selectedFormat);

      if (!format) {
        setSnackbar({
          open: true,
          message: 'Invalid format selected',
          severity: 'error',
        });
        return;
      }

      // Call the appropriate download function based on format
      if (onProcess) {
        onProcess([selectedFormat], action);
      }

      setSelectedAspects([]);
      onClose();
      return;
    }

    // Original logic for other actions (SUMMARIZE, EXTRACT, REWRITE)
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
      case 'DOWNLOAD':
        return 'download conversation as';
      default:
        return 'process';
    }
  };

  const downloadFormats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      shortDescription: 'Professional formatted document for sharing and printing',
      fullDescription:
        'Professional formatted document with conversation overview, engagement metrics, and full transcript. Perfect for sharing, printing, or archiving conversations with proper formatting and visual appeal.',
      icon: <PdfIcon sx={{ color: '#673ab7', fontSize: '1.5rem' }} />,
      color: '#673ab7', // Dark Purple
    },
    {
      id: 'json',
      name: 'JSON Data',
      shortDescription: 'Structured data format for developers and analysis',
      fullDescription:
        'Structured data format containing all conversation details, engagement metrics, and metadata. Ideal for developers, data analysis, integration with other tools, or programmatic processing.',
      icon: <JsonIcon sx={{ color: '#f8bbd9', fontSize: '1.5rem' }} />,
      color: '#f8bbd9', // Light Pink
    },
    {
      id: 'txt',
      name: 'Plain Text',
      shortDescription: 'Simple text format, universally compatible',
      fullDescription:
        'Simple, clean text format with conversation overview and full transcript. Easy to read, edit, and share across any platform. Lightweight and universally compatible.',
      icon: <TxtIcon sx={{ color: '#f06292', fontSize: '1.5rem' }} />,
      color: '#f06292', // Normal Pink
    },
    {
      id: 'markdown',
      name: 'Markdown',
      shortDescription: 'Formatted text for documentation and GitHub',
      fullDescription:
        'Formatted text using Markdown syntax with headers, tables, and styling. Perfect for documentation, GitHub, Notion, or any platform that supports Markdown rendering.',
      icon: <MarkdownIcon sx={{ color: '#e91e63', fontSize: '1.5rem' }} />,
      color: '#e91e63', // Hot Pink
    },
  ];

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
              {action === 'DOWNLOAD'
                ? 'Choose the format you want to download your conversation in. The export will include conversation overview, engagement metrics, and full transcript.'
                : `Choose the conversation aspects you want to ${getActionDescription(
                    action
                  )}. Each aspect will be intelligently extracted from your chat history.`}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  action === 'DOWNLOAD' ? { xs: '1fr', sm: 'repeat(2, 1fr)' } : '1fr',
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
              {action === 'DOWNLOAD'
                ? downloadFormats.map(format => (
                    <Box
                      key={format.id}
                      sx={{
                        p: 3,
                        border: selectedAspects.includes(format.id)
                          ? '2px solid #d32f2f'
                          : '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 3,
                        cursor: 'pointer',
                        backgroundColor: selectedAspects.includes(format.id)
                          ? 'rgba(211, 47, 47, 0.06)'
                          : theme =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.default
                                : '#fff',
                        '&:hover': {
                          backgroundColor: selectedAspects.includes(format.id)
                            ? 'rgba(211, 47, 47, 0.1)'
                            : theme =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : '#fafafa',
                          borderColor: selectedAspects.includes(format.id)
                            ? '#d32f2f'
                            : 'rgba(211, 47, 47, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        minHeight: expandedFormat === format.id ? '240px' : '120px',
                        position: 'relative',
                      }}
                      onClick={() => handleAspectSelection(format.id)}
                    >
                      {/* Selection indicator */}
                      {selectedAspects.includes(format.id) && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: '#d32f2f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            zIndex: 1,
                          }}
                        >
                          ✓
                        </Box>
                      )}

                      {/* Icon */}
                      <Box sx={{ mb: expandedFormat === format.id ? 2 : 1.5, mt: 1 }}>
                        {format.icon}
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          color: format.color,
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          lineHeight: 1.2,
                          mb: expandedFormat === format.id ? 1.5 : 1,
                          textAlign: 'center',
                        }}
                      >
                        {format.name}
                      </Typography>

                      {/* Description - Only visible when expanded */}
                      {expandedFormat === format.id && (
                        <Box sx={{ flex: 1, width: '100%' }}>
                          {/* Short Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme => theme.palette.text.secondary,
                              fontSize: '0.85rem',
                              lineHeight: 1.4,
                              textAlign: 'left',
                              mb: 1,
                            }}
                          >
                            {format.shortDescription}
                          </Typography>

                          {/* Full Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme => theme.palette.text.secondary,
                              fontSize: '0.85rem',
                              lineHeight: 1.4,
                              textAlign: 'left',
                              mb: 1,
                            }}
                          >
                            {format.fullDescription}
                          </Typography>
                        </Box>
                      )}

                      {/* Expand/Collapse Button - Always at bottom */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mt: 'auto',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            borderRadius: 1,
                          },
                          p: 0.5,
                          borderRadius: 1,
                          transition: 'background-color 0.2s ease',
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          setExpandedFormat(expandedFormat === format.id ? null : format.id);
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme => theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            mr: 0.5,
                          }}
                        >
                          {expandedFormat === format.id ? 'Show less' : 'Show more'}
                        </Typography>
                        <KeyboardArrowDownIcon
                          sx={{
                            fontSize: '1rem',
                            color: theme => theme.palette.text.secondary,
                            transform:
                              expandedFormat === format.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  ))
                : conversationAspects.map(aspect => (
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
                              theme.palette.mode === 'dark'
                                ? theme.palette.background.default
                                : '#fff',
                        '&:hover': {
                          backgroundColor: selectedAspects.includes(aspect.id)
                            ? 'rgba(211, 47, 47, 0.1)'
                            : theme =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : '#fafafa',
                          borderColor: selectedAspects.includes(aspect.id)
                            ? '#d32f2f'
                            : 'rgba(211, 47, 47, 0.3)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      onClick={() => handleAspectSelection(aspect.id)}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
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
                    {action === 'DOWNLOAD'
                      ? selectedAspects.map(formatId => {
                          const format = downloadFormats.find(f => f.id === formatId);
                          return (
                            <Box
                              key={formatId}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 1,
                                backgroundColor: theme => theme.palette.background.paper,
                                borderRadius: 2,
                                border: `1px solid ${format?.color}40`,
                              }}
                            >
                              <Box sx={{ fontSize: '0.9rem' }}>{format?.icon}</Box>
                              <Typography
                                variant="caption"
                                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                              >
                                {format?.name}
                              </Typography>
                            </Box>
                          );
                        })
                      : selectedAspects.map(aspectId => {
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
                {action === 'DOWNLOAD'
                  ? selectedAspects.map(formatId => {
                      const format = downloadFormats.find(f => f.id === formatId);
                      return (
                        <Box key={formatId} sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ mb: 2, color: format?.color }}>
                            {format?.name}
                          </Typography>
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: theme => theme.palette.background.paper,
                              borderRadius: 2,
                              border: `1px solid ${format?.color}40`,
                            }}
                          >
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              {format?.shortDescription}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {format?.fullDescription}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  : selectedAspects.map(aspectId => {
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
