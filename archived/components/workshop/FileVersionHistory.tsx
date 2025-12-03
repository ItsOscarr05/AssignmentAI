import {
  Close as CloseIcon,
  Restore as RestoreIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  fileCompletionChatService,
  type VersionInfo,
} from '../../services/fileCompletionChatService';
import { formatUTCToTimezone } from '../../utils/timezone';

interface FileVersionHistoryProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  onRevert: (versionIndex: number) => void;
}

const FileVersionHistory: React.FC<FileVersionHistoryProps> = ({
  open,
  onClose,
  sessionId,
  onRevert,
}) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, sessionId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const versionList = await fileCompletionChatService.getVersionHistory(sessionId);
      setVersions(versionList);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load version history');
      console.error('Error loading versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (index: number) => {
    setSelectedVersion(index);
    setPreviewContent(versions[index].content);
  };

  const handleRevertToVersion = async (index: number) => {
    try {
      await fileCompletionChatService.revertToVersion(sessionId, index);
      onRevert(index);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to revert to version');
      console.error('Error reverting:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatUTCToTimezone(timestamp);
  };

  const getVersionColor = (index: number) => {
    if (index === 0) return 'default';
    if (index === versions.length - 1) return 'success';
    return 'primary';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Version History</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {/* Version List */}
            <Paper elevation={2} sx={{ flex: 1, overflow: 'auto', maxWidth: '400px' }}>
              <List>
                {versions.map((version, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Preview">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleViewVersion(index)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {index < versions.length - 1 && (
                            <Tooltip title="Revert to this version">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRevertToVersion(index)}
                                color="primary"
                              >
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemButton
                        selected={selectedVersion === index}
                        onClick={() => handleViewVersion(index)}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">Version {index + 1}</Typography>
                              <Chip
                                label={
                                  index === 0
                                    ? 'Original'
                                    : index === versions.length - 1
                                    ? 'Current'
                                    : 'History'
                                }
                                size="small"
                                color={getVersionColor(index)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {version.description}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                <TimeIcon fontSize="small" sx={{ fontSize: 14 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatTimestamp(version.timestamp)}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                After {version.message_count} message
                                {version.message_count !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < versions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Content Preview */}
            <Paper elevation={2} sx={{ flex: 2, overflow: 'auto', p: 2 }}>
              {previewContent !== null ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Content Preview - Version {(selectedVersion ?? 0) + 1}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.9rem',
                    }}
                  >
                    {previewContent}
                  </Paper>
                  {selectedVersion !== null && selectedVersion < versions.length - 1 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleRevertToVersion(selectedVersion)}
                      >
                        Revert to This Version
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                  color="text.secondary"
                >
                  <ViewIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body1">Select a version to preview its content</Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, ml: 2 }}>
          {versions.length} version{versions.length !== 1 ? 's' : ''} saved
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileVersionHistory;
