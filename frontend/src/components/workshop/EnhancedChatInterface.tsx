import {
  Psychology as BrainIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Send as SendIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUp as ThumbUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
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
  onExport?: (content: string) => void;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  initialText,
  onMessageSent,
  onExport,
}) => {
  const { generateContent, history: workshopHistory, isLoading } = useWorkshopStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Convert workshop history to chat messages
  useEffect(() => {
    if (workshopHistory.length > 0) {
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
    }
  }, [workshopHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingMessageId(null);
        setAnchorEl(null);
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
    setInput('');

    // Show typing indicator
    setIsTyping(true);

    // Generate AI response
    try {
      await generateContent(message);
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
    } finally {
      setIsTyping(false);
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
      setAnchorEl(null);
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
    setAnchorEl(null);
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

  const handleReaction = (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions!,
                [reaction]: msg.reactions![reaction] + 1,
              },
            }
          : msg
      )
    );
  };

  const handleExportConversation = () => {
    const conversationText = messages
      .map(msg => `${msg.isUser ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n');

    if (onExport) {
      onExport(conversationText);
    } else {
      // Fallback: download as text file
      const blob = new Blob([conversationText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, messageId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
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
                }}
              >
                {!message.isUser && (
                  <Avatar
                    sx={{
                      bgcolor: 'white',
                      width: 32,
                      height: 32,
                      mr: 1,
                      mt: 0.5,
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <BrainIcon sx={{ color: 'red', fontSize: 20 }} />
                  </Avatar>
                )}

                <Box sx={{ maxWidth: '70%', position: 'relative' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: message.isUser
                        ? 'rgba(25, 118, 210, 0.1)'
                        : 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid red',
                      borderRadius: 2,
                    }}
                  >
                    {!message.isUser && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                      >
                        AI Assistant
                      </Typography>
                    )}

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
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        {message.isEdited && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic' }}
                          >
                            (edited)
                          </Typography>
                        )}
                      </>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 1,
                        textAlign: message.isUser ? 'right' : 'left',
                      }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>

                    {/* Message Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        mt: 1,
                        justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!message.isUser && (
                        <>
                          <Tooltip title="Thumbs up">
                            <IconButton
                              size="small"
                              onClick={() => handleReaction(message.id, 'thumbsUp')}
                            >
                              <ThumbUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Thumbs down">
                            <IconButton
                              size="small"
                              onClick={() => handleReaction(message.id, 'thumbsDown')}
                            >
                              <ThumbDownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => handleCopyMessage(message.content)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {message.isUser && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditMessage(message.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More options">
                            <IconButton size="small" onClick={e => handleMenuClick(e, message.id)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>

                    {/* Reactions */}
                    {(message.reactions?.thumbsUp || message.reactions?.thumbsDown) && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {message.reactions.thumbsUp > 0 && (
                          <Chip
                            icon={<ThumbUpIcon />}
                            label={message.reactions.thumbsUp}
                            size="small"
                            color="primary"
                          />
                        )}
                        {message.reactions.thumbsDown > 0 && (
                          <Chip
                            icon={<ThumbDownIcon />}
                            label={message.reactions.thumbsDown}
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                    )}
                  </Paper>
                </Box>

                {message.isUser && (
                  <Avatar
                    sx={{
                      bgcolor: 'red',
                      width: 32,
                      height: 32,
                      ml: 1,
                      mt: 0.5,
                    }}
                  >
                    <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Avatar>
                )}
              </Box>
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'white',
                    width: 32,
                    height: 32,
                    mr: 1,
                    mt: 0.5,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <BrainIcon sx={{ color: 'red', fontSize: 20 }} />
                </Avatar>
                <Box sx={{ maxWidth: '70%' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid #f44336',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: 'red' }} />
                    <Typography variant="body2" color="text.secondary">
                      AI is thinking...
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
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          ref={inputRef}
          fullWidth
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          multiline
          maxRows={4}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: 'red',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'red',
              },
            },
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!input.trim() || isLoading}
            sx={{
              backgroundColor: 'red',
              '&:hover': {
                backgroundColor: 'darkred',
              },
              minWidth: 'auto',
              px: 2,
            }}
          >
            <SendIcon />
          </Button>
          {messages.length > 0 && (
            <Tooltip title="Export conversation">
              <IconButton size="small" onClick={handleExportConversation} sx={{ color: 'red' }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedMessageId) {
              handleEditMessage(selectedMessageId);
            }
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedMessageId) {
              handleDeleteMessage(selectedMessageId);
            }
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

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
