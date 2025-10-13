import {
  SmartToy as AIIcon,
  CheckCircleOutlined as ApplyIcon,
  Close as CloseIcon,
  CompareArrows as CompareIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  History as HistoryIcon,
  Send as SendIcon,
  CloudUploadOutlined as UploadIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import {
  fileCompletionChatService,
  type ChatMessageResponse,
  type FileCompletionSession,
} from '../../services/fileCompletionChatService';
import { WorkshopFile } from '../../services/WorkshopService';
import { formatUTCToTime } from '../../utils/timezone';
import FileVersionHistory from './FileVersionHistory';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  files: WorkshopFile[];
  onFileProcessed?: (file: WorkshopFile) => void;
  onFileDeleted?: (fileId: string) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  files,
  onFileDeleted,
}) => {
  const [selectedFile, setSelectedFile] = useState<WorkshopFile | null>(null);
  const [session, setSession] = useState<FileCompletionSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-select the first file when modal opens
  useEffect(() => {
    if (open && files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [open, files]);

  // Initialize chat session when file is selected
  useEffect(() => {
    if (selectedFile) {
      initializeSession();
    }
  }, [selectedFile]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [session?.conversation_history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const newSession = await fileCompletionChatService.startSession(
        parseInt(selectedFile.id, 10)
      );
      setSession(newSession);
      setCurrentContent(newSession.current_content || '');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start session');
      console.error('Error starting session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !session || sending) return;

    const userMessage = message;

    // Immediately add user message to conversation history for instant feedback
    if (session) {
      const tempSession = {
        ...session,
        conversation_history: [
          ...(session.conversation_history || []),
          {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
            metadata: {},
          },
        ],
      };
      setSession(tempSession);
    }

    setMessage('');
    setSending(true);
    setError(null);

    try {
      const response: ChatMessageResponse = await fileCompletionChatService.sendMessage(
        session.id,
        userMessage,
        false
      );

      // Update session with new message
      const updatedSession = await fileCompletionChatService.getSession(session.id);
      setSession(updatedSession);

      // If AI proposed changes, show them
      if (response.proposed_changes.preview_available && response.proposed_changes.new_content) {
        setProposedContent(response.proposed_changes.new_content);
        setSnackbar({
          open: true,
          message: 'AI has proposed changes. Review and apply them!',
          severity: 'info',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!proposedContent || !session) return;

    try {
      await fileCompletionChatService.applyChanges(session.id, proposedContent);

      // Refresh session to get updated content
      const updatedSession = await fileCompletionChatService.getSession(session.id);
      setSession(updatedSession);
      setCurrentContent(updatedSession.current_content || '');
      setProposedContent(null);
      setShowDiff(false);

      setSnackbar({
        open: true,
        message: 'Changes applied successfully!',
        severity: 'success',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to apply changes');
      console.error('Error applying changes:', err);
    }
  };

  const handleDownload = () => {
    if (!currentContent || !selectedFile) return;

    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: 'File downloaded successfully!',
      severity: 'success',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        message: 'Copied to clipboard!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error',
      });
    }
  };

  const handleClose = () => {
    setSession(null);
    setSelectedFile(null);
    setCurrentContent('');
    setProposedContent(null);
    setMessage('');
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            border: '3px solid #f44336',
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '3px solid #f44336',
            p: 2,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <UploadIcon sx={{ color: '#f44336', fontSize: '1.5rem' }} />
              <Typography variant="h6">Interactive File Completion</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              {session && (
                <>
                  <Chip
                    label={`${session.version_history?.length || 0} versions`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`${session.total_tokens_used || 0} tokens`}
                    size="small"
                    variant="outlined"
                  />
                  <Tooltip title="Version History">
                    <IconButton onClick={() => setShowVersionHistory(true)} size="small">
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Complete and Download">
                    <IconButton onClick={handleDownload} color="success" size="small">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {onFileDeleted && selectedFile && (
                <Tooltip title="Delete File">
                  <IconButton
                    onClick={() => onFileDeleted(selectedFile.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: '100%' }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 4,
              }}
            >
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                gap: 2,
                p: 2,
              }}
            >
              {/* Preview Panel - NOW ON LEFT (60% width) */}
              <Paper
                elevation={3}
                sx={{
                  flex: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '2px solid #f44336',
                  borderRadius: 3,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderBottom: '3px solid #f44336',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {proposedContent ? 'Proposed Changes' : selectedFile?.name || 'Content'}
                    </Typography>
                    <Box display="flex" gap={1}>
                      {proposedContent && (
                        <>
                          <Tooltip title="Compare Changes">
                            <IconButton size="small" onClick={() => setShowDiff(!showDiff)}>
                              <CompareIcon />
                            </IconButton>
                          </Tooltip>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<ApplyIcon />}
                            onClick={handleApplyChanges}
                          >
                            Apply Changes
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setProposedContent(null)}
                          >
                            Discard
                          </Button>
                        </>
                      )}
                      <Tooltip title="Copy Content">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(proposedContent || currentContent)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {proposedContent || currentContent || 'No content yet...'}
                  </Paper>
                </Box>
              </Paper>

              {/* Chat Panel - NOW ON RIGHT (40% width) */}
              <Paper
                elevation={3}
                sx={{
                  flex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '2px solid #f44336',
                  borderRadius: 3,
                }}
              >
                {/* Chat Messages */}
                <Box
                  ref={chatContainerRef}
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {session?.conversation_history?.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                          color: 'white',
                        }}
                      >
                        {msg.role === 'user' ? (
                          <UserIcon fontSize="small" />
                        ) : (
                          <AIIcon fontSize="small" />
                        )}
                      </Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          maxWidth: '75%',
                          bgcolor: msg.role === 'user' ? 'primary.light' : 'background.paper',
                          color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ mt: 1, display: 'block', opacity: 0.7 }}
                        >
                          {formatUTCToTime(msg.timestamp)}
                        </Typography>
                      </Paper>
                      {msg.role === 'assistant' && (
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => copyToClipboard(msg.content)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  {sending && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask AI to complete, modify, or improve your file..."
                      disabled={sending}
                      variant="outlined"
                      size="small"
                    />
                    <Button
                      variant="contained"
                      endIcon={<SendIcon sx={{ fontSize: '2rem' }} />}
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      sx={{
                        minWidth: '100px',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      Send
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="Make it more formal"
                      size="small"
                      onClick={() => {
                        if (selectedChip === 'formal') {
                          setSelectedChip(null);
                          setMessage('');
                        } else {
                          setMessage('Make this more formal and professional');
                          setSelectedChip('formal');
                        }
                      }}
                      clickable
                      sx={{
                        backgroundColor: selectedChip === 'formal' ? '#f44336' : 'default',
                        color: selectedChip === 'formal' ? 'white' : 'default',
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label="Fill in blanks"
                      size="small"
                      onClick={() => {
                        if (selectedChip === 'blanks') {
                          setSelectedChip(null);
                          setMessage('');
                        } else {
                          setMessage('Complete all blank sections and answer all questions');
                          setSelectedChip('blanks');
                        }
                      }}
                      clickable
                      sx={{
                        backgroundColor: selectedChip === 'blanks' ? '#f44336' : 'default',
                        color: selectedChip === 'blanks' ? 'white' : 'default',
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label="Improve clarity"
                      size="small"
                      onClick={() => {
                        if (selectedChip === 'clarity') {
                          setSelectedChip(null);
                          setMessage('');
                        } else {
                          setMessage('Improve the clarity and readability');
                          setSelectedChip('clarity');
                        }
                      }}
                      clickable
                      sx={{
                        backgroundColor: selectedChip === 'clarity' ? '#f44336' : 'default',
                        color: selectedChip === 'clarity' ? 'white' : 'default',
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label="Add more detail"
                      size="small"
                      onClick={() => {
                        if (selectedChip === 'detail') {
                          setSelectedChip(null);
                          setMessage('');
                        } else {
                          setMessage('Add more detail and examples');
                          setSelectedChip('detail');
                        }
                      }}
                      clickable
                      sx={{
                        backgroundColor: selectedChip === 'detail' ? '#f44336' : 'default',
                        color: selectedChip === 'detail' ? 'white' : 'default',
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                    <Chip
                      label="Answer the Question(s)"
                      size="small"
                      onClick={() => {
                        if (selectedChip === 'questions') {
                          setSelectedChip(null);
                          setMessage('');
                        } else {
                          setMessage('Answer all questions in the document');
                          setSelectedChip('questions');
                        }
                      }}
                      clickable
                      sx={{
                        backgroundColor: selectedChip === 'questions' ? '#f44336' : 'default',
                        color: selectedChip === 'questions' ? 'white' : 'default',
                        '&:hover': {
                          backgroundColor: '#f44336',
                          color: 'white',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      {session && (
        <FileVersionHistory
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          sessionId={session.id}
          onRevert={() => {
            // Refresh session after revert
            fileCompletionChatService.getSession(session.id).then(updatedSession => {
              setSession(updatedSession);
              setCurrentContent(updatedSession.current_content || '');
              setShowVersionHistory(false);
              setSnackbar({
                open: true,
                message: 'Reverted to previous version successfully!',
                severity: 'success',
              });
            });
          }}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FileUploadModal;
