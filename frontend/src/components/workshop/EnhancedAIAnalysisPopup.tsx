import {
  Close as CloseIcon,
  DownloadOutlined as DownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Minimize as MinimizeIcon,
  RecordVoiceOverOutlined,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  Slide,
  Fade,
  Backdrop,
  SwipeableDrawer,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import EnhancedChatInterface from './EnhancedChatInterface';
import EnhancedFileAnalysisInterface from './EnhancedFileAnalysisInterface';
import EnhancedLinkAnalysisInterface from './EnhancedLinkAnalysisInterface';

interface EnhancedAIAnalysisPopupProps {
  open: boolean;
  onClose: () => void;
  uploadType: 'text' | 'file' | 'link';
  content: any;
  onTabClick: (tabIndex: number) => void;
  onSuggestionClick: (suggestion: string, tabIndex: number) => void;
}

const Transition = React.forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EnhancedAIAnalysisPopup: React.FC<EnhancedAIAnalysisPopupProps> = ({
  open,
  onClose,
  uploadType,
  content,
  onTabClick,
  onSuggestionClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
    onTabClick(tabIndex);
  };

  const handleSuggestionClick = (suggestion: string, tabIndex: number) => {
    onSuggestionClick(suggestion, tabIndex);
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
            initialText={content?.text}
            onMessageSent={(message) => {
              console.log('Message sent:', message);
            }}
            onExport={handleExport}
          />
        );
      case 'file':
        return (
          <EnhancedFileAnalysisInterface
            file={content}
            onAnalysisComplete={(results) => {
              console.log('File analysis complete:', results);
            }}
            onExport={handleExport}
          />
        );
      case 'link':
        return (
          <EnhancedLinkAnalysisInterface
            link={content}
            onAnalysisComplete={(results) => {
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
        onClose();
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
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const diff = startY - currentY;
      
      // Swipe down to close
      if (diff < -100) {
        onClose();
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
  }, [onClose]);

  const QuickActionsSidebar = () => (
    <Box
      sx={{
        width: { xs: '100%', md: '300px' },
        borderLeft: { xs: 'none', md: '1px solid #e0e0e0' },
        borderTop: { xs: '1px solid #e0e0e0', md: 'none' },
        p: 2,
        backgroundColor: theme =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
        overflow: 'auto',
        maxHeight: { xs: '40vh', md: '100%' },
      }}
    >
      {/* Quick Actions */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
          color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
          mb: 2,
        }}
      >
        Quick Actions
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        {[
          { index: 0, label: 'DOWNLOAD', icon: DownloadOutlinedIcon, color: '#9c27b0' },
          { index: 1, label: 'REWRITE', icon: EditOutlinedIcon, color: '#2196f3' },
          { index: 2, label: 'EXTRACT', icon: FormatListBulletedIcon, color: '#ffc107' },
          { index: 3, label: 'SUMMARIZE', icon: RecordVoiceOverOutlined, color: '#ff9800' },
        ].map(({ index, label, icon: Icon, color }) => (
          <Button
            key={index}
            onClick={() => handleTabClick(index)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: color,
              borderBottom: activeTab === index ? `2px solid ${color}` : 'none',
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontWeight: activeTab === index ? 'bold' : 'normal',
              minWidth: '100%',
              justifyContent: 'flex-start',
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: 'transparent',
                color: color,
              },
            }}
          >
            <Icon sx={{ color: color, fontSize: '1.25rem' }} />
            {label}
          </Button>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* AI Suggestions */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
          color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
          mb: 2,
        }}
      >
        AI Suggestions
      </Typography>
      <List sx={{ p: 0 }}>
        {[
          { text: 'Summarize this content', tabIndex: 3, icon: RecordVoiceOverOutlined, color: '#ff9800' },
          { text: 'Extract key points', tabIndex: 2, icon: FormatListBulletedIcon, color: '#ffc107' },
          { text: 'Rewrite this content', tabIndex: 1, icon: EditOutlinedIcon, color: '#2196f3' },
        ].map(({ text, tabIndex, icon: Icon, color }, index) => (
          <ListItem
            key={index}
            button
            onClick={() => handleSuggestionClick(text, tabIndex)}
            sx={{ p: 0, mb: 1, borderRadius: 1, '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon sx={{ color: color }} />
            </ListItemIcon>
            <ListItemText
              primary={text.split(' ')[0]}
              secondary={text.substring(text.indexOf(' ') + 1)}
              sx={{
                '& .MuiTypography-root.MuiTypography-body1': {
                  color: color,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiTypography-root.MuiTypography-body2': {
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'inherit'),
                  fontSize: '0.75rem',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            height: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            border: '2px solid red',
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
            }}
          >
            <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
              {getTitle()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Minimize">
                <IconButton onClick={() => setIsMinimized(!isMinimized)}>
                  <KeyboardArrowDownIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {!isMinimized && (
            <>
              {/* Mobile Content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
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
        onClose={onClose}
        maxWidth={isFullscreen ? false : 'lg'}
        fullWidth
        fullScreen={isFullscreen}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: isFullscreen ? 0 : 3,
            border: '2px solid red',
            maxHeight: isFullscreen ? '100vh' : '90vh',
            width: isFullscreen ? '100vw' : { xs: '95vw', sm: '90vw', md: '80vw' },
            maxWidth: isFullscreen ? '100vw' : { xs: '95vw', sm: '90vw', md: '80vw' },
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
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
            borderColor: 'divider', 
            pb: 2,
            ...(isMinimized && { display: 'none' })
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isMinimized ? 'Restore' : 'Minimize'}>
                <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)}>
                  <MinimizeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={onClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        
        {!isMinimized && (
          <DialogContent sx={{ p: 0, display: 'flex', height: '70vh' }}>
            {/* Main Content Area */}
            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
              {renderMainContent()}
            </Box>

            {/* Quick Actions & AI Suggestions Sidebar */}
            <QuickActionsSidebar />
          </DialogContent>
        )}
      </Dialog>

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

export default EnhancedAIAnalysisPopup;
