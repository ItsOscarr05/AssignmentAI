import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  DownloadOutlined as DownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomOutMap as FullscreenIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Remove as MinimizeIcon,
  RecordVoiceOverOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkshopStore } from '../../services/WorkshopService';
import ConversationSummarizer from './ConversationSummarizer';
import EnhancedChatInterface, { EnhancedChatInterfaceRef } from './EnhancedChatInterface';
import EnhancedFileAnalysisInterface from './EnhancedFileAnalysisInterface';
import EnhancedLinkAnalysisInterface from './EnhancedLinkAnalysisInterface';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface AIResponsePopupProps {
  open: boolean;
  onClose: () => void;
  uploadType: 'text' | 'file' | 'link';
  content: any;
}

const Transition = React.forwardRef(function Transition(props: any, ref: React.Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper function for score colors
const getScoreColor = (score: number) => {
  if (score >= 80) return '#4caf50'; // Green - High/Good
  if (score >= 50) return '#ffc107'; // Yellow/Gold - Medium
  return '#f44336'; // Red - Low
};

// Interface for individual engagement metrics
interface EngagementMetrics {
  messageCount: number;
  conversationBalance: number;
  responseDepth: number;
  questionAnswerFlow: number;
  interactionQuality: number;
  totalScore: number;
}

// Function to estimate tokens from text content
const estimateTokens = (text: string): number => {
  if (!text) return 0;
  // Rough estimation: ~4 characters per token for English text
  // This is a simplified approximation - actual tokenization varies by model
  return Math.ceil(text.length / 4);
};

// Calculate total tokens used in conversation
const calculateConversationTokens = (messages: ChatMessage[]): number => {
  return messages.reduce((total, message) => {
    return total + estimateTokens(message.content || '');
  }, 0);
};

// Memoized engagement calculation for better performance
const calculateEngagement = (messages: ChatMessage[]): EngagementMetrics => {
  if (!messages || messages.length === 0) {
    return {
      messageCount: 0,
      conversationBalance: 0,
      responseDepth: 0,
      questionAnswerFlow: 0,
      interactionQuality: 0,
      totalScore: 0,
    };
  }

  try {
    const totalMessages = messages.length;
    const userMessages = messages.filter(msg => msg.isUser).length;
    const aiMessages = messages.filter(msg => !msg.isUser).length;

    // 1. Message Count Score (0-100) - with diminishing returns and penalties
    let messageCountScore = Math.min(totalMessages * 8, 60); // Reduced base score

    // Penalty for too many messages (might indicate spam or rambling)
    if (totalMessages > 15) {
      messageCountScore -= (totalMessages - 15) * 2; // Penalty for excessive messages
    }

    messageCountScore = Math.max(0, messageCountScore);

    // 2. Conversation Balance Score (0-100) - with penalties for imbalance
    let conversationBalanceScore = 0;
    if (userMessages > 0 && aiMessages > 0) {
      const balance = Math.min(userMessages, aiMessages) / Math.max(userMessages, aiMessages);
      conversationBalanceScore = Math.round(balance * 100);

      // Penalty for very imbalanced conversations
      if (balance < 0.3) {
        conversationBalanceScore -= 20; // Heavy penalty for very imbalanced
      }
    } else if (userMessages > 0 || aiMessages > 0) {
      conversationBalanceScore = 15; // Reduced partial credit

      // Additional penalty for extremely one-sided conversations
      const maxSide = Math.max(userMessages, aiMessages);
      if (maxSide > 5) {
        conversationBalanceScore -= (maxSide - 5) * 3; // Increasing penalty
      }
    }

    conversationBalanceScore = Math.max(0, conversationBalanceScore);

    // 3. Response Depth Score (0-100) - with penalties for poor quality
    const avgMessageLength =
      messages.reduce((sum, msg) => {
        return sum + (msg.content?.length || 0);
      }, 0) / totalMessages;

    let responseDepthScore = 0;
    if (avgMessageLength > 100) {
      responseDepthScore = 100;
    } else if (avgMessageLength > 50) {
      responseDepthScore = Math.round((avgMessageLength - 50) * 2);
    } else if (avgMessageLength > 20) {
      responseDepthScore = Math.round(avgMessageLength * 0.8);
    } else if (avgMessageLength > 10) {
      responseDepthScore = Math.round(avgMessageLength * 0.5);
    } else {
      responseDepthScore = Math.round(avgMessageLength * 0.3); // Heavy penalty for very short messages
    }

    // Penalty for very short messages (might indicate low engagement)
    if (avgMessageLength < 15) {
      responseDepthScore -= 10;
    }

    // Penalty for extremely long messages (might indicate rambling)
    if (avgMessageLength > 200) {
      responseDepthScore -= 15;
    }

    responseDepthScore = Math.max(0, responseDepthScore);

    // 4. Question-Answer Flow Score (0-100) - with penalties for lack of interaction
    const questions = messages.filter(msg => msg.content?.includes('?')).length;
    let questionAnswerFlowScore = Math.min(questions * 15, 80); // Reduced multiplier and cap

    // Penalty for long conversations without questions
    if (totalMessages > 8 && questions === 0) {
      questionAnswerFlowScore -= 20;
    }

    // Bonus for good question distribution
    if (questions > 0 && totalMessages > 0) {
      const questionRatio = questions / totalMessages;
      if (questionRatio > 0.3) {
        questionAnswerFlowScore += 10; // Bonus for high question ratio
      }
    }

    questionAnswerFlowScore = Math.max(0, Math.min(questionAnswerFlowScore, 100));

    // 5. Interaction Quality Score (0-100) - based on recent activity and patterns
    let interactionQualityScore = 40; // Reduced base score

    // Penalty for too many consecutive messages from same sender
    let consecutiveSameSender = 0;
    let maxConsecutive = 0;
    let lastSender = null;

    for (const msg of messages) {
      if (msg.isUser === lastSender) {
        consecutiveSameSender++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, consecutiveSameSender);
        consecutiveSameSender = 1;
        lastSender = msg.isUser;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, consecutiveSameSender);

    // Heavy penalty for monologues
    if (maxConsecutive > 2) {
      interactionQualityScore -= (maxConsecutive - 2) * 15; // Increased penalty
    }

    // Bonus for recent activity
    const recentMessages = messages.slice(-3);
    const recentUserMessages = recentMessages.filter(msg => msg.isUser).length;
    const recentAIMessages = recentMessages.filter(msg => !msg.isUser).length;

    if (recentUserMessages > 0 && recentAIMessages > 0) {
      interactionQualityScore += 25; // Increased bonus
    } else if (recentUserMessages === 0 || recentAIMessages === 0) {
      interactionQualityScore -= 10; // Penalty for no recent interaction
    }

    // Penalty for very long conversations without questions
    if (totalMessages > 8 && questions === 0) {
      interactionQualityScore -= 20; // Increased penalty
    }

    // Penalty for very short conversations (might indicate low engagement)
    if (totalMessages < 3) {
      interactionQualityScore -= 15;
    }

    // Penalty for repetitive content (simple heuristic)
    const uniqueWords = new Set();
    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => uniqueWords.add(word));
    });
    const uniqueWordRatio = uniqueWords.size / (totalMessages * 5); // Rough estimate
    if (uniqueWordRatio < 0.3) {
      interactionQualityScore -= 10; // Penalty for repetitive content
    }

    interactionQualityScore = Math.max(0, Math.min(interactionQualityScore, 100));

    // Calculate weighted average (all metrics equally weighted)
    const scores = [
      messageCountScore,
      conversationBalanceScore,
      responseDepthScore,
      questionAnswerFlowScore,
      interactionQualityScore,
    ];

    // Filter out any NaN or invalid values and calculate average
    const validScores = scores.filter(score => !isNaN(score) && isFinite(score));

    // Debug logging to help identify NaN issues
    if (validScores.length !== scores.length) {
      console.warn('Some engagement scores were invalid:', {
        messageCountScore,
        conversationBalanceScore,
        responseDepthScore,
        questionAnswerFlowScore,
        interactionQualityScore,
        validScores,
      });
    }

    const totalScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
        : 0;

    return {
      messageCount: Math.max(0, Math.min(messageCountScore, 100)),
      conversationBalance: Math.max(0, Math.min(conversationBalanceScore, 100)),
      responseDepth: Math.max(0, Math.min(responseDepthScore, 100)),
      questionAnswerFlow: Math.max(0, Math.min(questionAnswerFlowScore, 100)),
      interactionQuality: Math.max(0, Math.min(interactionQualityScore, 100)),
      totalScore: Math.max(0, Math.min(totalScore, 100)),
    };
  } catch (error) {
    console.error('Error calculating engagement:', error);
    return {
      messageCount: 0,
      conversationBalance: 0,
      responseDepth: 0,
      questionAnswerFlow: 0,
      interactionQuality: 0,
      totalScore: 0,
    };
  }
};

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Ref to the chat interface for direct message sending
  const chatInterfaceRef = useRef<EnhancedChatInterfaceRef>(null);

  // State for smooth engagement animation
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Memoized engagement calculation for performance
  const engagementData = useMemo(() => {
    const metrics = calculateEngagement(chatMessages);
    const scoreColor = getScoreColor(animatedScore);
    const circumference = Math.PI * 80; // Half circle circumference
    const strokeDasharray = `${circumference * (animatedScore / 100)} ${circumference}`;

    return { metrics, scoreColor, circumference, strokeDasharray };
  }, [chatMessages, animatedScore]);

  // Memoized token calculation for performance
  const conversationTokens = useMemo(() => {
    return calculateConversationTokens(chatMessages);
  }, [chatMessages]);

  // Smooth animation effect for engagement score
  useEffect(() => {
    const metrics = calculateEngagement(chatMessages);
    const currentScore = metrics.totalScore;

    // Only animate if there are AI messages (AI has responded)
    const hasAIMessages = chatMessages.some(msg => !msg.isUser);
    if (!hasAIMessages) {
      setAnimatedScore(0);
      return;
    }

    // Only update if score actually changed
    if (currentScore !== animatedScore) {
      setIsAnimating(true);

      // Smooth animation over 1.5 seconds
      const duration = 1500;
      const startScore = animatedScore;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newScore = Math.round(startScore + (currentScore - startScore) * easeOutCubic);

        setAnimatedScore(newScore);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [chatMessages, animatedScore]);

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

  const handleChatMessagesUpdate = (messages: ChatMessage[]) => {
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
      case 'DOWNLOAD':
        // Handle download format selection
        const selectedFormat = selectedAspectIds[0];
        switch (selectedFormat) {
          case 'pdf':
            downloadAsPdf();
            return; // Exit early for download
          case 'json':
            downloadAsJson();
            return;
          case 'txt':
            downloadAsTxt();
            return;
          case 'markdown':
            downloadAsMarkdown();
            return;
          default:
            console.error('Unknown download format:', selectedFormat);
            return;
        }
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
      // Show download format selection
      setSelectedAction('DOWNLOAD');
      setShowMessageSelection(true);
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

  // Download functionality
  const generateConversationData = () => {
    const metrics = calculateEngagement(chatMessages);
    const totalMessages = chatMessages.length;
    const userMessages = chatMessages.filter(msg => msg.isUser).length;
    const aiMessages = chatMessages.filter(msg => !msg.isUser).length;

    // Calculate conversation duration (rough estimate)
    const firstMessage = chatMessages[0];
    const lastMessage = chatMessages[chatMessages.length - 1];
    const duration =
      firstMessage && lastMessage
        ? new Date(lastMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime()
        : 0;

    const durationMinutes = Math.round(duration / (1000 * 60));

    return {
      overview: {
        engagementScore: metrics.totalScore,
        messageCount: totalMessages,
        userMessages,
        aiMessages,
        duration: durationMinutes,
        timestamp: new Date().toISOString(),
      },
      metrics: {
        messageCount: metrics.messageCount,
        conversationBalance: metrics.conversationBalance,
        responseDepth: metrics.responseDepth,
        questionAnswerFlow: metrics.questionAnswerFlow,
        interactionQuality: metrics.interactionQuality,
      },
      transcript: chatMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: msg.timestamp,
        formattedTime: new Date(msg.timestamp).toLocaleString(),
      })),
    };
  };

  const downloadAsJson = () => {
    const data = generateConversationData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsTxt = () => {
    const data = generateConversationData();
    const content = `CONVERSATION EXPORT
Generated: ${new Date().toLocaleString()}

=== OVERVIEW ===
Engagement Score: ${data.overview.engagementScore}%
Total Messages: ${data.overview.messageCount}
User Messages: ${data.overview.userMessages}
AI Messages: ${data.overview.aiMessages}
Duration: ${data.overview.duration} minutes

=== ENGAGEMENT METRICS ===
Message Count: ${data.metrics.messageCount}%
Conversation Balance: ${data.metrics.conversationBalance}%
Response Depth: ${data.metrics.responseDepth}%
Question-Answer Flow: ${data.metrics.questionAnswerFlow}%
Interaction Quality: ${data.metrics.interactionQuality}%

=== CONVERSATION TRANSCRIPT ===
${data.transcript
  .map(msg => `[${msg.formattedTime}] ${msg.isUser ? 'USER' : 'AI'}: ${msg.content}`)
  .join('\n\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsMarkdown = () => {
    const data = generateConversationData();
    const content = `# Conversation Export
*Generated: ${new Date().toLocaleString()}*

## Overview
- **Engagement Score:** ${data.overview.engagementScore}%
- **Total Messages:** ${data.overview.messageCount}
- **User Messages:** ${data.overview.userMessages}
- **AI Messages:** ${data.overview.aiMessages}
- **Duration:** ${data.overview.duration} minutes

## Engagement Metrics
| Metric | Score |
|--------|-------|
| Message Count | ${data.metrics.messageCount}% |
| Conversation Balance | ${data.metrics.conversationBalance}% |
| Response Depth | ${data.metrics.responseDepth}% |
| Question-Answer Flow | ${data.metrics.questionAnswerFlow}% |
| Interaction Quality | ${data.metrics.interactionQuality}% |

## Conversation Transcript

${data.transcript
  .map(msg => `### ${msg.isUser ? '👤 User' : '🤖 AI'} - ${msg.formattedTime}\n\n${msg.content}`)
  .join('\n\n---\n\n')}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-export-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = () => {
    // For PDF generation, we'll use a simple approach with window.print()
    // In a production app, you might want to use a library like jsPDF or Puppeteer
    const data = generateConversationData();

    // Create a temporary div with the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #f44336; padding-bottom: 10px;">
          Conversation Export
        </h1>
        <p style="color: #666; font-style: italic;">
          Generated: ${new Date().toLocaleString()}
        </p>
        
        <h2 style="color: #333; margin-top: 30px;">Overview</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Engagement Score:</strong> ${data.overview.engagementScore}%</p>
          <p><strong>Total Messages:</strong> ${data.overview.messageCount}</p>
          <p><strong>User Messages:</strong> ${data.overview.userMessages}</p>
          <p><strong>AI Messages:</strong> ${data.overview.aiMessages}</p>
          <p><strong>Duration:</strong> ${data.overview.duration} minutes</p>
        </div>
        
        <h2 style="color: #333; margin-top: 30px;">Engagement Metrics</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Metric</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Score</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Message Count</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${data.metrics.messageCount}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Conversation Balance</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${
              data.metrics.conversationBalance
            }%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Response Depth</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${data.metrics.responseDepth}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Question-Answer Flow</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${
              data.metrics.questionAnswerFlow
            }%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Interaction Quality</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${
              data.metrics.interactionQuality
            }%</td>
          </tr>
        </table>
        
        <h2 style="color: #333; margin-top: 30px;">Conversation Transcript</h2>
        ${data.transcript
          .map(
            msg => `
          <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${
            msg.isUser ? '#2196f3' : '#4caf50'
          }; background: ${msg.isUser ? '#f0f8ff' : '#f0fff0'};">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;">
              ${msg.isUser ? '👤 User' : '🤖 AI'} - ${msg.formattedTime}
            </p>
            <p style="margin: 0; white-space: pre-wrap;">${msg.content}</p>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Conversation Export</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0.5in; }
              }
            </style>
          </head>
          <body>
            ${tempDiv.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load, then trigger print
      setTimeout(() => {
        if (printWindow) {
          printWindow.print();
          printWindow.close();
        }
      }, 500);
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
            ref={chatInterfaceRef}
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
        borderLeft: {
          xs: 'none',
          md: theme => `1px solid ${theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'}`,
        },
        borderTop: {
          xs: theme => `1px solid ${theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'}`,
          md: 'none',
        },
        p: 2,
        backgroundColor: theme =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
        overflow: 'auto',
        maxHeight: { xs: '40vh', md: '100%' },
      }}
    >
      {/* Conversation Engagement */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
          color: '#d32f2f', // Red color for Conversation Engagement title
          mb: 2,
          textAlign: 'center',
        }}
      >
        Conversation Engagement
      </Typography>

      {/* Overall Score - Always Visible */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        {(() => {
          const { scoreColor, strokeDasharray } = engagementData;
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
                {/* Background semicircle - outlined in dark mode */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                  }
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Progress semicircle with smooth animation */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    transition: isAnimating
                      ? 'none'
                      : 'stroke-dasharray 0.3s ease-in-out, stroke 0.3s ease-in-out',
                  }}
                />
              </svg>
              {/* Score text - Clean layout with smooth animation */}
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
                    transition: isAnimating ? 'none' : 'all 0.3s ease-in-out',
                    transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {animatedScore}
                </Typography>
              </Box>
            </Box>
          );
        })()}
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2 }}>
          Engagement Level
        </Typography>

        {/* View Score Details Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => setIsScoreExpanded(!isScoreExpanded)}
          sx={{
            fontSize: '0.75rem',
            textTransform: 'none',
            borderColor: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'),
            color: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'),
            fontWeight: 'bold',
            '&:hover': {
              borderColor: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'),
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.1)',
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
            {(() => {
              try {
                const { metrics } = engagementData;

                // Only show breakdown if AI has responded
                const hasAIMessages = chatMessages.some(msg => !msg.isUser);
                if (!hasAIMessages) {
                  return [
                    { label: 'Message Count', score: 0, color: '#f44336' },
                    { label: 'Conversation Balance', score: 0, color: '#f44336' },
                    { label: 'Response Depth', score: 0, color: '#f44336' },
                    { label: 'Question-Answer Flow', score: 0, color: '#f44336' },
                    { label: 'Interaction Quality', score: 0, color: '#f44336' },
                  ];
                }

                return [
                  {
                    label: 'Message Count',
                    score: metrics.messageCount,
                    color: getScoreColor(metrics.messageCount),
                  },
                  {
                    label: 'Conversation Balance',
                    score: metrics.conversationBalance,
                    color: getScoreColor(metrics.conversationBalance),
                  },
                  {
                    label: 'Response Depth',
                    score: metrics.responseDepth,
                    color: getScoreColor(metrics.responseDepth),
                  },
                  {
                    label: 'Question-Answer Flow',
                    score: metrics.questionAnswerFlow,
                    color: getScoreColor(metrics.questionAnswerFlow),
                  },
                  {
                    label: 'Interaction Quality',
                    score: metrics.interactionQuality,
                    color: getScoreColor(metrics.interactionQuality),
                  },
                ];
              } catch (error) {
                console.error('Error calculating breakdown:', error);
                return [
                  { label: 'Message Count', score: 0, color: '#f44336' },
                  { label: 'Conversation Balance', score: 0, color: '#f44336' },
                  { label: 'Response Depth', score: 0, color: '#f44336' },
                  { label: 'Question-Answer Flow', score: 0, color: '#f44336' },
                  { label: 'Interaction Quality', score: 0, color: '#f44336' },
                ];
              }
            })().map(({ label, score, color }, index) => (
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
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
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
        </Box>
      </Box>

      <Divider sx={{ my: 2, borderColor: 'white' }} />

      {/* Quick Actions */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
          color: '#d32f2f', // Red color for Quick Actions title
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
          { index: 1, label: 'EXTRACT', icon: FormatListBulletedIcon, color: '#4caf50' },
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
            border: theme => `2px solid ${theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'}`,
            width: { xs: '85vw', sm: '90vw', md: '100%' }, // Thinner on mobile
            maxWidth: { xs: '85vw', sm: '90vw', md: '100%' }, // Thinner on mobile
            mx: 'auto', // Center the popup horizontally
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
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
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
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#d32f2f', // Red color for AI Chat Assistant title
                fontWeight: 'bold',
              }}
            >
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
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    overflow: 'auto',
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  }}
                >
                  {renderMainContent()}
                </Box>
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
            border: theme => `2px solid ${theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'}`,
            maxHeight: isFullscreen ? '100vh' : '90vh',
            width: isFullscreen ? '100vw' : { xs: '90vw', sm: '90vw', md: '80vw' },
            maxWidth: isFullscreen ? '100vw' : { xs: '85vw', sm: '90vw', md: '80vw' },
            mx: 'auto', // Center the popup horizontally
            backgroundColor: theme => {
              console.log(
                'Dialog background - mode:',
                theme.palette.mode,
                'default:',
                theme.palette.background.default
              );
              return theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff';
            },
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
            borderColor: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f'),
            pb: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
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
              {conversationTokens > 0 && (
                <Chip
                  label={`${conversationTokens.toLocaleString()} tokens`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'error.main',
                    color: 'error.main',
                  }}
                />
              )}
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
          <DialogContent
            sx={{
              p: 0,
              display: 'flex',
              height: '70vh',
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
            }}
          >
            {/* Main Content Area */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                // Ensure mobile view has correct background
                '@media (max-width: 900px)': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                },
              }}
            >
              {renderMainContent()}
            </Box>

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
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
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

          // Use the ref to send the message directly
          if (chatInterfaceRef.current) {
            console.log('Sending message via ref:', message);
            chatInterfaceRef.current.sendMessage(message);
          } else {
            console.error('Chat interface ref not available');
          }
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
