import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';

interface WorkshopLiveModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
  aiResponse: string;
  isLoading: boolean;
  title?: string;
}

const WorkshopLiveModal: React.FC<WorkshopLiveModalProps> = ({
  open,
  onClose,
  content,
  aiResponse,
  isLoading,
  title,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title || 'File Preview & AI Response'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* File/Link Content */}
          <Paper sx={{ flex: 1, p: 2, minHeight: 200, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom>
              Content
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {content}
            </Typography>
          </Paper>
          {/* AI Response */}
          <Paper
            sx={{
              flex: 1,
              p: 2,
              minHeight: 200,
              maxHeight: 400,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              AI Response
            </Typography>
            {isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress color="primary" />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  AI is processing...
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {aiResponse}
              </Typography>
            )}
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkshopLiveModal;
