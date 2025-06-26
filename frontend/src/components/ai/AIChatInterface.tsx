import {
  SmartToy as AIIcon,
  ContentCopy as CopyIcon,
  Send as SendIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useTokenLimitContext } from '../../contexts/TokenLimitContext';
import { assignmentInputService } from '../../services/assignmentInput';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
}

interface AIChatInterfaceProps {
  onAssignmentGenerated?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  onAssignmentGenerated,
  placeholder = 'Describe your assignment or ask me to help you create one...',
  className,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hasEnoughTokens, loading: tokenLoading } = useTokenLimitContext();

  // Estimate tokens needed for chat generation
  const tokensNeeded = 300;
  const canGenerate = hasEnoughTokens(tokensNeeded);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !canGenerate) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isGenerating: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await assignmentInputService.generateChatResponse({
        message: inputValue,
        context: messages.length > 0 ? messages[messages.length - 1].content : '',
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: response.response, isGenerating: false }
            : msg
        )
      );

      if (onAssignmentGenerated) {
        onAssignmentGenerated(response.response);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate response');
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: 'Sorry, I encountered an error. Please try again.',
                isGenerating: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await assignmentInputService.copyToClipboard(content);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getMessageIcon = (role: 'user' | 'assistant') => {
    return role === 'user' ? <UserIcon /> : <AIIcon />;
  };

  const getMessageColor = (role: 'user' | 'assistant') => {
    return role === 'user' ? 'primary.main' : 'secondary.main';
  };

  return (
    <Paper
      elevation={3}
      className={className}
      sx={{
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          AI Assignment Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Describe your assignment requirements and I'll help you create it
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List sx={{ p: 0 }}>
          {messages.map(message => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '80%',
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: getMessageColor(message.role), width: 32, height: 32 }}>
                    {getMessageIcon(message.role)}
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    position: 'relative',
                  }}
                >
                  {message.isGenerating ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Generating...</Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      {message.role === 'assistant' && (
                        <IconButton
                          size="small"
                          onClick={() => copyMessage(message.content)}
                          sx={{ position: 'absolute', top: 4, right: 4 }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      )}
                    </>
                  )}
                </Paper>
                {message.role === 'user' && (
                  <Avatar sx={{ bgcolor: getMessageColor(message.role), width: 32, height: 32 }}>
                    {getMessageIcon(message.role)}
                  </Avatar>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || !canGenerate}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !canGenerate}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>

        {!canGenerate && !tokenLoading && (
          <Chip
            label="Insufficient tokens - upgrade your plan"
            color="warning"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>
    </Paper>
  );
};
