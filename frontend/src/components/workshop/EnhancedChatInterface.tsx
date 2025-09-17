import {
  PsychologyOutlined as BrainIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SmartToy as RobotIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useWorkshopStore } from '../../services/WorkshopService';

interface ChatMessage {
  id: string;
  prompt: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  isEdited?: boolean;
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
  };
}

interface EnhancedChatInterfaceProps {
  initialText?: string;
  onMessageSent?: (message: string) => void;
  onClear?: (clearFn: () => void) => void;
  onMessagesUpdate?: (messages: ChatMessage[]) => void;
}

export interface EnhancedChatInterfaceRef {
  sendMessage: (message: string) => void;
}

const EnhancedChatInterface = React.forwardRef<
  EnhancedChatInterfaceRef,
  EnhancedChatInterfaceProps
>(({ initialText, onMessageSent, onClear, onMessagesUpdate }, ref) => {
  const { generateContent, history: workshopHistory, isLoading } = useWorkshopStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingInterval, setStreamingInterval] = useState<NodeJS.Timeout | null>(null);
  const [hasStreamed, setHasStreamed] = useState(false);
  const [conversationMemory, setConversationMemory] = useState<ChatMessage[]>([]);
  const [isCleared, setIsCleared] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitializedMessages = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose sendMessage method to parent components
  useImperativeHandle(
    ref,
    () => ({
      sendMessage: (message: string) => {
        handleSendMessage(message);
      },
    }),
    []
  );

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Note: scrollToBottomThrottled removed as we're using real streaming now

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with initial text if provided
  useEffect(() => {
    if (initialText && messages.length === 0) {
      handleSendMessage(initialText);
    }
  }, [initialText]);

  // Handle loading state changes from WorkshopService
  useEffect(() => {
    // If WorkshopService is no longer loading and we're still showing typing indicator,
    // stop the typing indicator (fallback for cases where streaming doesn't work)
    if (!isLoading && isTyping && streamingMessageId) {
      console.log('WorkshopService loading finished, stopping typing indicator');
      setIsTyping(false);
      setStreamingMessageId(null);
      setStreamingContent('');
    }
  }, [isLoading, isTyping, streamingMessageId]);

  // Convert workshop history to chat messages only on initial load
  useEffect(() => {
    if (workshopHistory.length > 0 && !hasInitializedMessages.current && !isCleared) {
      const chatMessages: ChatMessage[] = [];

      workshopHistory.forEach(item => {
        // Add user message
        chatMessages.push({
          id: `${item.id}-user`,
          prompt: item.prompt,
          content: item.prompt,
          timestamp: item.timestamp,
          isUser: true,
          reactions: { thumbsUp: 0, thumbsDown: 0 },
        });

        // Add AI response
        chatMessages.push({
          id: `${item.id}-ai`,
          prompt: item.prompt,
          content: item.content,
          timestamp: item.timestamp,
          isUser: false,
          reactions: { thumbsUp: 0, thumbsDown: 0 },
        });
      });

      setMessages(chatMessages);
      hasInitializedMessages.current = true;
    }
  }, [workshopHistory, isCleared]);

  // Listen for new AI responses from workshop history and handle real streaming
  useEffect(() => {
    if (workshopHistory.length > 0 && streamingMessageId && !hasStreamed) {
      // Find the current streaming message to get its prompt
      const currentStreamingMessage = messages.find(msg => msg.id === streamingMessageId);
      if (!currentStreamingMessage) return;

      // Find the AI response that matches the current user's prompt
      // Use a more flexible matching since the prompt might be contextualized
      const matchingResponse = workshopHistory.find(
        item =>
          item.content &&
          // Match if the prompt contains the user's message or vice versa
          (item.prompt.includes(currentStreamingMessage.prompt) ||
            currentStreamingMessage.prompt.includes(item.prompt.split('\n\n').pop() || ''))
      );

      if (matchingResponse) {
        console.log('Received complete response for message:', currentStreamingMessage.prompt);
        // Update the message with the complete content immediately
        setMessages(prev =>
          prev.map(msg =>
            msg.id === streamingMessageId ? { ...msg, content: matchingResponse.content } : msg
          )
        );
        setIsTyping(false);
        setStreamingMessageId(null);
        setHasStreamed(true); // Mark as streamed to prevent re-processing
        setStreamingContent('');

        // Add AI message to memory
        const finalMessage: ChatMessage = {
          ...currentStreamingMessage,
          content: matchingResponse.content,
        };
        addToMemory(finalMessage);
      }
    }
  }, [workshopHistory, streamingMessageId, hasStreamed, messages, streamingContent]);

  // Fallback: If streaming completes but no matching response found, use the streaming content
  useEffect(() => {
    if (streamingMessageId && streamingContent && !isTyping && !hasStreamed) {
      // Wait a bit to see if the workshop history gets updated
      const timeout = setTimeout(() => {
        if (streamingMessageId && streamingContent) {
          console.log('Using streaming content as fallback for message:', streamingMessageId);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMessageId ? { ...msg, content: streamingContent } : msg
            )
          );
          setIsTyping(false);
          setStreamingMessageId(null);
          setHasStreamed(true);
          setStreamingContent('');
        }
      }, 1000); // Wait 1 second for workshop history to update

      return () => clearTimeout(timeout);
    }
  }, [streamingMessageId, streamingContent, isTyping, hasStreamed]);

  // Note: Real streaming is now handled by the WorkshopService

  // Function to stop streaming
  const stopStreaming = () => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
      setStreamingInterval(null);
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    setIsTyping(false);
    setStreamingMessageId(null);
    setHasStreamed(false);
    setStreamingContent('');
  };

  // Function to add message to conversation memory
  const addToMemory = (message: ChatMessage) => {
    setConversationMemory(prev => [...prev, message]);
  };

  // Function to get conversation context for AI
  const getConversationContext = (): string => {
    if (conversationMemory.length === 0) {
      return '';
    }

    // Get last 10 messages for context (adjust as needed)
    const recentMessages = conversationMemory.slice(-10);

    return recentMessages
      .map(msg => {
        const role = msg.isUser ? 'User' : 'AI';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  };

  // Create stable clear function
  const clearMessages = useCallback(() => {
    console.log('Clearing chat messages and memory');
    setMessages([]);
    setInput('');
    setEditingMessageId(null);
    setEditingContent('');
    setIsTyping(false);
    setStreamingMessageId(null);
    setStreamingContent('');
    setHasStreamed(false);
    setIsCleared(true); // Set cleared flag to prevent restoration
    if (streamingInterval) {
      clearInterval(streamingInterval);
      setStreamingInterval(null);
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    hasInitializedMessages.current = false;
    setHasStreamed(false);
    setConversationMemory([]); // Clear conversation memory
  }, [streamingInterval]);

  // Set up clear function when onClear is provided
  useEffect(() => {
    if (onClear) {
      onClear(clearMessages);
    }
  }, [onClear, clearMessages]);

  // Notify parent when messages change
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

  // Cleanup streaming interval and scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingInterval) {
        clearInterval(streamingInterval);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [streamingInterval]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingMessageId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || input.trim();
    if (!message) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      prompt: message,
      content: message,
      timestamp: new Date().toISOString(),
      isUser: true,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
    };

    setMessages(prev => [...prev, userMessage]);
    addToMemory(userMessage); // Add user message to memory
    setIsCleared(false); // Reset cleared flag when new message is sent
    setInput('');
    setIsTyping(true);

    // Create a placeholder AI message for streaming
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      prompt: message,
      content: '',
      timestamp: new Date().toISOString(),
      isUser: false,
      reactions: { thumbsUp: 0, thumbsDown: 0 },
    };

    setMessages(prev => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId);
    setStreamingContent('');
    setHasStreamed(false); // Reset hasStreamed for new message

    console.log('Created AI message with ID:', aiMessageId, 'for prompt:', message);

    // Scroll to bottom when AI message placeholder is added
    setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Generate AI response using the workshop service with conversation context
    try {
      const context = getConversationContext();
      const contextualMessage = context ? `${context}\n\nUser: ${message}` : message;

      // Use streaming for better performance with real-time updates
      await generateContent(contextualMessage, true, (chunk: string) => {
        // Update streaming content in real-time
        setStreamingContent(prev => prev + chunk);
        // Auto-scroll during streaming
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      });

      // After streaming completes, ensure the message content is set
      if (streamingMessageId && streamingContent) {
        console.log('Streaming completed, setting final content for message:', streamingMessageId);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === streamingMessageId ? { ...msg, content: streamingContent } : msg
          )
        );
        setIsTyping(false);
        setStreamingMessageId(null);
        setHasStreamed(true);
        setStreamingContent('');
      }

      if (onMessageSent) {
        onMessageSent(message);
      }

      // Add a safety timeout to stop loading state if streaming doesn't work
      setTimeout(() => {
        if (isTyping && streamingMessageId) {
          console.log('Safety timeout: stopping loading state');
          setIsTyping(false);
          setStreamingMessageId(null);
          setStreamingContent('');
        }
      }, 15000); // Increased to 15 seconds for streaming
    } catch (error) {
      console.error('Error generating content:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate response. Please try again.',
        severity: 'error',
      });
      setIsTyping(false);
      setStreamingMessageId(null);
      setStreamingContent('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingContent(message.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editingContent.trim()) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === editingMessageId
            ? { ...msg, content: editingContent.trim(), isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditingContent('');
      setSnackbar({
        open: true,
        message: 'Message updated successfully',
        severity: 'success',
      });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setSnackbar({
      open: true,
      message: 'Message deleted',
      severity: 'info',
    });
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setSnackbar({
        open: true,
        message: 'Message copied to clipboard',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to copy message',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'white' : '#e0e0e0'}`,
          borderRadius: 1,
          mb: 2,
          minHeight: '400px',
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
        }}
      >
        {messages.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map(message => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 2,
                  '&:hover .message-actions': {
                    opacity: 1,
                  },
                }}
              >
                {!message.isUser && (
                  <Avatar
                    sx={{
                      bgcolor: 'transparent',
                      width: 28,
                      height: 28,
                      mr: 1.5,
                      mt: 0.5,
                      border: '2px solid #f44336',
                    }}
                  >
                    <RobotIcon sx={{ color: '#f44336', fontSize: '18px' }} />
                  </Avatar>
                )}

                <Box sx={{ maxWidth: '80%', position: 'relative' }}>
                  <Paper
                    elevation={15}
                    sx={{
                      p: 2.5,
                      backgroundColor: theme =>
                        message.isUser
                          ? theme.palette.mode === 'dark'
                            ? theme.palette.background.paper
                            : '#f7f7f8'
                          : theme.palette.mode === 'dark'
                          ? theme.palette.background.paper
                          : '#ffffff',
                      border: '1px solid #f44336',
                      borderRadius: 3,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(244, 67, 54, 0.2)',
                      },
                    }}
                  >
                    {editingMessageId === message.id ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          multiline
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          variant="outlined"
                          size="small"
                          autoFocus
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button size="small" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button size="small" onClick={() => setEditingMessageId(null)}>
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Typography
                          variant="body1"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            fontSize: '15px',
                            color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#374151'),
                          }}
                        >
                          {message.id === streamingMessageId ? streamingContent : message.content}
                          {message.id === streamingMessageId && (
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                marginLeft: '8px',
                                gap: '2px',
                              }}
                            >
                              <Box
                                sx={{
                                  width: '4px',
                                  height: '4px',
                                  backgroundColor: '#f44336',
                                  borderRadius: '50%',
                                  animation: 'bounce 1.4s infinite ease-in-out both',
                                  '&:nth-of-type(1)': {
                                    animationDelay: '-0.32s',
                                  },
                                  '&:nth-of-type(2)': {
                                    animationDelay: '-0.16s',
                                  },
                                  '@keyframes bounce': {
                                    '0%, 80%, 100%': {
                                      transform: 'scale(0)',
                                    },
                                    '40%': {
                                      transform: 'scale(1)',
                                    },
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  width: '4px',
                                  height: '4px',
                                  backgroundColor: '#f44336',
                                  borderRadius: '50%',
                                  animation: 'bounce 1.4s infinite ease-in-out both',
                                  '&:nth-of-type(1)': {
                                    animationDelay: '-0.32s',
                                  },
                                  '&:nth-of-type(2)': {
                                    animationDelay: '-0.16s',
                                  },
                                  '@keyframes bounce': {
                                    '0%, 80%, 100%': {
                                      transform: 'scale(0)',
                                    },
                                    '40%': {
                                      transform: 'scale(1)',
                                    },
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  width: '4px',
                                  height: '4px',
                                  backgroundColor: '#f44336',
                                  borderRadius: '50%',
                                  animation: 'bounce 1.4s infinite ease-in-out both',
                                  '&:nth-of-type(1)': {
                                    animationDelay: '-0.32s',
                                  },
                                  '&:nth-of-type(2)': {
                                    animationDelay: '-0.16s',
                                  },
                                  '@keyframes bounce': {
                                    '0%, 80%, 100%': {
                                      transform: 'scale(0)',
                                    },
                                    '40%': {
                                      transform: 'scale(1)',
                                    },
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </Typography>
                        {message.isEdited && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic', fontSize: '12px' }}
                          >
                            (edited)
                          </Typography>
                        )}
                      </>
                    )}
                  </Paper>

                  {/* Message Actions - Only show on hover, outside the message box */}
                  <Box
                    className="message-actions"
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      mt: 0.5,
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                      opacity: 0,
                      transform: 'scale(0.65)',
                      transition: 'opacity 0.2s ease-in-out',
                      ml: message.isUser ? 0 : -3.5,
                      mr: message.isUser ? -1.5 : 0,
                    }}
                  >
                    {message.isUser ? (
                      // User message order: Copy, Edit, Delete
                      <>
                        <Tooltip title="Copy">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyMessage(message.content)}
                            sx={{}}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMessage(message.id)}
                            sx={{}}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMessage(message.id)}
                            sx={{}}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      // AI message: Copy only
                      <Tooltip title="Copy">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyMessage(message.content)}
                          sx={{
                            '&:hover': {
                              transform: 'scale(0.95)',
                              transition: 'transform 0.2s ease-in-out',
                            },
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}

            {/* Loading indicator when AI is thinking (but not streaming) */}
            {(isTyping || isLoading) && !streamingMessageId && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'transparent',
                    width: 28,
                    height: 28,
                    mr: 1.5,
                    mt: 0.5,
                    border: '2px solid #f44336',
                  }}
                >
                  <RobotIcon sx={{ color: '#f44336', fontSize: '18px' }} />
                </Avatar>
                <Box sx={{ maxWidth: '80%' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: '#ffffff',
                      border: '1px solid #f44336',
                      borderRadius: 3,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        '& > div': {
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#f44336',
                          animation: 'pulse 1.4s ease-in-out infinite both',
                          '&:nth-of-type(1)': { animationDelay: '-0.32s' },
                          '&:nth-of-type(2)': { animationDelay: '-0.16s' },
                        },
                        '@keyframes pulse': {
                          '0%, 80%, 100%': {
                            transform: 'scale(0)',
                            opacity: 0.5,
                          },
                          '40%': {
                            transform: 'scale(1)',
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <div />
                      <div />
                      <div />
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#6b7280',
                        fontSize: '15px',
                      }}
                    >
                      Generating response...
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 3,
            }}
          >
            <BrainIcon
              sx={{
                fontSize: 48,
                color: theme => (theme.palette.mode === 'dark' ? '#ff6b6b' : '#d32f2f'),
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                opacity: 0.7,
                color: theme => (theme.palette.mode === 'dark' ? '#ff6b6b' : '#d32f2f'),
                fontWeight: 600,
              }}
            >
              Start a conversation
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.6,
                color: theme => theme.palette.text.secondary,
                maxWidth: '400px',
                lineHeight: 1.5,
              }}
            >
              Ask me anything about your assignments
            </Typography>
          </Box>
        )}
      </Box>

      {/* Chat Input */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          p: 2,
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
          borderTop: theme => `1px solid ${theme.palette.mode === 'dark' ? 'white' : '#e5e5e5'}`,
        }}
      >
        <Box sx={{ flex: 1, position: 'relative' }}>
          <TextField
            ref={inputRef}
            fullWidth
            placeholder="Message AssignmentAI..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping || isLoading}
            multiline
            maxRows={6}
            minRows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.default : '#f7f7f8',
                border: theme =>
                  `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#e5e5e5'}`,
                height: '40px',
                '&:hover': {
                  borderColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.grey[600] : '#d1d5db',
                },
                '&.Mui-focused': {
                  borderColor: '#f44336',
                  boxShadow: '0 0 0 2px rgba(244, 67, 54, 0.1)',
                },
                '& fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input': {
                padding: '10px 16px',
                fontSize: '15px',
                lineHeight: 1.5,
                height: '20px',
                color: theme => theme.palette.text.primary,
                '&::placeholder': {
                  color: theme => theme.palette.text.secondary,
                  opacity: 1,
                },
              },
            }}
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          disabled={!input.trim() && !streamingMessageId}
          onClick={streamingMessageId ? stopStreaming : undefined}
          sx={{
            backgroundColor: streamingMessageId ? '#ef4444' : '#f44336',
            borderRadius: 2,
            minWidth: '40px',
            height: '40px',
            '&:hover': {
              backgroundColor: streamingMessageId ? '#dc2626' : '#d32f2f',
            },
            '&:disabled': {
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#d1d5db',
              color: theme =>
                theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[400],
            },
          }}
        >
          {streamingMessageId ? (
            <Box
              sx={{
                width: '12px',
                height: '12px',
                backgroundColor: 'white',
                borderRadius: '2px',
              }}
            />
          ) : (
            <SendIcon sx={{ fontSize: '18px' }} />
          )}
        </Button>
      </Box>

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
});

EnhancedChatInterface.displayName = 'EnhancedChatInterface';

export default EnhancedChatInterface;
