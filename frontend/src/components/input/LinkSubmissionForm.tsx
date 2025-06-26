import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Description as DocIcon,
  Google as GoogleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTokenLimitContext } from '../../contexts/TokenLimitContext';
import { assignmentInputService } from '../../services/assignmentInput';

interface LinkSubmission {
  id: string;
  url: string;
  title: string;
  content: string;
  type: 'google-docs' | 'webpage' | 'document';
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface LinkSubmissionFormProps {
  onContentExtracted?: (content: string, title: string) => void;
  onLinksChanged?: (links: LinkSubmission[]) => void;
  className?: string;
}

export const LinkSubmissionForm: React.FC<LinkSubmissionFormProps> = ({
  onContentExtracted,
  onLinksChanged,
  className,
}) => {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState<LinkSubmission[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasEnoughTokens, loading: tokenLoading } = useTokenLimitContext();

  // Estimate tokens needed for content extraction
  const tokensNeeded = 200;
  const canProcess = hasEnoughTokens(tokensNeeded);

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const getUrlType = (url: string): 'google-docs' | 'webpage' | 'document' => {
    if (url.includes('docs.google.com')) return 'google-docs';
    if (url.match(/\.(pdf|doc|docx|txt)$/i)) return 'document';
    return 'webpage';
  };

  const handleAddLink = async () => {
    if (!url.trim() || !validateUrl(url) || !canProcess) return;

    setError(null);
    setIsProcessing(true);

    const newLink: LinkSubmission = {
      id: Date.now().toString(),
      url: url.trim(),
      title: '',
      content: '',
      type: getUrlType(url),
      status: 'processing',
    };

    setLinks(prev => [...prev, newLink]);
    setUrl('');

    try {
      const response = await assignmentInputService.extractFromLink({ url: url.trim() });

      setLinks(prev =>
        prev.map(link =>
          link.id === newLink.id
            ? {
                ...link,
                title: response.title,
                content: response.content,
                status: 'completed',
              }
            : link
        )
      );

      if (onContentExtracted) {
        onContentExtracted(response.content, response.title);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to extract content');
      setLinks(prev =>
        prev.map(link =>
          link.id === newLink.id
            ? { ...link, status: 'error', error: 'Failed to extract content' }
            : link
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
    if (onLinksChanged) {
      onLinksChanged(links.filter(link => link.id !== id));
    }
  };

  const handleCopyContent = async (content: string) => {
    try {
      await assignmentInputService.copyToClipboard(content);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'google-docs':
        return <GoogleIcon />;
      case 'document':
        return <DocIcon />;
      default:
        return <LinkIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={3} className={className} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Link Submission
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submit Google Docs links, public URLs, or document links for assignment processing
      </Typography>

      {/* URL Input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          label="Enter URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://docs.google.com/document/d/... or any public URL"
          disabled={isProcessing || !canProcess}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleAddLink}
          disabled={!url.trim() || !validateUrl(url) || isProcessing || !canProcess}
          startIcon={isProcessing ? <CircularProgress size={16} /> : <LinkIcon />}
        >
          {isProcessing ? 'Processing...' : 'Add'}
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Token Limit Warning */}
      {!canProcess && !tokenLoading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Insufficient tokens to process links. Please upgrade your plan.
        </Alert>
      )}

      {/* Links List */}
      {links.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Submitted Links ({links.length})
          </Typography>
          <List>
            {links.map(link => (
              <ListItem
                key={link.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <ListItemIcon>{getLinkIcon(link.type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {link.title || 'Processing...'}
                        </Typography>
                        <Chip
                          label={link.status}
                          color={getStatusColor(link.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {link.url}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {link.status === 'completed' && (
                      <IconButton
                        size="small"
                        onClick={() => handleCopyContent(link.content)}
                        title="Copy content"
                      >
                        <CopyIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveLink(link.id)}
                      title="Remove link"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {link.status === 'completed' && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        bgcolor: 'grey.50',
                        p: 1,
                        borderRadius: 1,
                        maxHeight: '100px',
                        overflow: 'auto',
                      }}
                    >
                      {link.content}
                    </Typography>
                  </Box>
                )}

                {link.status === 'error' && link.error && (
                  <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
                    {link.error}
                  </Alert>
                )}

                {link.status === 'processing' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Extracting content...
                    </Typography>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Instructions */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Supported Link Types:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <GoogleIcon />
            </ListItemIcon>
            <ListItemText primary="Google Docs (public or shared links)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DocIcon />
            </ListItemIcon>
            <ListItemText primary="Public PDF, DOC, DOCX, TXT files" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText primary="Public webpages with readable content" />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};
