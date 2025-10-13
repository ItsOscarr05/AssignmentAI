import {
  Psychology as BrainIcon,
  Person as PersonIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { Avatar, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useWorkshopStore } from '../../services/WorkshopService';
import { formatUTCToTime } from '../../utils/timezone';

interface ChatMessage {
  id: string;
  prompt: string;
  content: string;
  timestamp: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  initialText?: string;
  onMessageSent?: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialText, onMessageSent }) => {
  const { generateContent, history: workshopHistory, isLoading } = useWorkshopStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        });

        // Add AI response
        chatMessages.push({
          id: `${item.id}-ai`,
          prompt: item.prompt,
          content: item.content,
          timestamp: item.timestamp,
          isUser: false,
        });
      });

      setMessages(chatMessages);
    }
  }, [workshopHistory]);

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
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Generate AI response
    try {
      await generateContent(message);
      if (onMessageSent) {
        onMessageSent(message);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
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
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 1,
                        textAlign: message.isUser ? 'right' : 'left',
                      }}
                    >
                      {formatUTCToTime(message.timestamp)}
                    </Typography>
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
          fullWidth
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
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
      </Box>
    </Box>
  );
};

export default ChatInterface;
