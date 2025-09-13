import {
  Psychology as BrainIcon,
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  initialText,
  onMessageSent,
  onClear,
  onMessagesUpdate,
}) => {
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

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll during streaming with throttling
  const scrollToBottomThrottled = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Throttle to every 100ms during streaming
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with initial text if provided
  useEffect(() => {
    if (initialText && messages.length === 0) {
      handleSendMessage(initialText);
    }
  }, [initialText]);

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

  // Listen for new AI responses from workshop history and simulate streaming
  useEffect(() => {
    if (workshopHistory.length > 0 && streamingMessageId && !hasStreamed) {
      // Find the current streaming message to get its prompt
      const currentStreamingMessage = messages.find(msg => msg.id === streamingMessageId);
      if (!currentStreamingMessage) return;

      // Find the AI response that matches the current user's prompt
      const matchingResponse = workshopHistory.find(
        item =>
          item.prompt === currentStreamingMessage.prompt &&
          item.content &&
          item.content !== streamingContent
      );

      if (matchingResponse) {
        console.log('Starting streaming for message:', currentStreamingMessage.prompt);
        // Start streaming the response
        simulateStreamingResponse(matchingResponse.content);
        setHasStreamed(true);
      }
    }
  }, [workshopHistory, streamingMessageId, hasStreamed, messages, streamingContent]);

  // Function to simulate streaming response
  const simulateStreamingResponse = (fullContent: string) => {
    let currentIndex = 0;
    const words = fullContent.split(' ');

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const word = words[currentIndex];
        setStreamingContent(prev => {
          const newContent = prev + (prev ? ' ' : '') + word;
          return newContent;
        });
        currentIndex++;

        // Auto-scroll during streaming
        scrollToBottomThrottled();
      } else {
        // Streaming complete
        clearInterval(streamInterval);
        setStreamingInterval(null);
        setIsTyping(false);
        setStreamingMessageId(null);
        setHasStreamed(false);

        // Update the final message with complete content
        const currentMessage = messages.find(msg => msg.id === streamingMessageId);
        if (currentMessage) {
          const finalMessage: ChatMessage = { ...currentMessage, content: fullContent };
          addToMemory(finalMessage); // Add AI message to memory
        }

        setMessages(prev =>
          prev.map(msg => (msg.id === streamingMessageId ? { ...msg, content: fullContent } : msg))
        );
        setStreamingContent('');

        // Final scroll to bottom when streaming completes
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }, 50); // Adjust speed as needed (50ms per word)

    setStreamingInterval(streamInterval);
  };

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

      await generateContent(contextualMessage);

      if (onMessageSent) {
        onMessageSent(message);
      }
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
          border: '1px solid #e0e0e0',
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
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: message.isUser ? '#f7f7f8' : '#ffffff',
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
                            color: message.isUser ? '#374151' : '#374151',
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
                      transition: 'opacity 0.2s ease-in-out',
                    }}
                  >
                    {message.isUser ? (
                      // User message order: Copy, Edit, Delete
                      <>
                        <Tooltip title="Copy">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyMessage(message.content)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditMessage(message.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteMessage(message.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      // AI message: Copy only
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => handleCopyMessage(message.content)}>
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
                color: theme => (theme.palette.mode === 'dark' ? '#ff6b6b' : 'red'),
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Start a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask me anything about your content
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
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e5e5',
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
                backgroundColor: '#f7f7f8',
                border: '1px solid #e5e5e5',
                height: '40px',
                '&:hover': {
                  borderColor: '#d1d5db',
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
              backgroundColor: '#d1d5db',
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
};

export default EnhancedChatInterface;
