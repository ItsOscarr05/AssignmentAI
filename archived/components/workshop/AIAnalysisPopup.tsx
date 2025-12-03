import {
  Close as CloseIcon,
  DownloadOutlined as DownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Minimize as MinimizeIcon,
  RecordVoiceOverOutlined,
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
} from '@mui/material';
import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import FileAnalysisInterface from './FileAnalysisInterface';
import LinkAnalysisInterface from './LinkAnalysisInterface';

interface AIAnalysisPopupProps {
  open: boolean;
  onClose: () => void;
  uploadType: 'text' | 'file' | 'link';
  content: any;
  onTabClick: (tabIndex: number) => void;
  onSuggestionClick: (suggestion: string, tabIndex: number) => void;
}

const AIAnalysisPopup: React.FC<AIAnalysisPopupProps> = ({
  open,
  onClose,
  uploadType,
  content,
  onTabClick,
  onSuggestionClick,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
    onTabClick(tabIndex);
  };

  const handleSuggestionClick = (suggestion: string, tabIndex: number) => {
    onSuggestionClick(suggestion, tabIndex);
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
          <ChatInterface
            initialText={content?.text}
            onMessageSent={message => {
              // Handle message sent if needed
              console.log('Message sent:', message);
            }}
          />
        );
      case 'file':
        return (
          <FileAnalysisInterface
            file={content}
            onAnalysisComplete={results => {
              console.log('File analysis complete:', results);
            }}
          />
        );
      case 'link':
        return (
          <LinkAnalysisInterface
            link={content}
            onAnalysisComplete={results => {
              console.log('Link analysis complete:', results);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '2px solid red',
          maxHeight: '90vh',
          width: { xs: '95vw', sm: '90vw', md: '80vw' },
          maxWidth: { xs: '95vw', sm: '90vw', md: '80vw' },
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
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
            <IconButton size="small">
              <MinimizeIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', height: '70vh' }}>
        {/* Main Content Area */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>{renderMainContent()}</Box>

        {/* Quick Actions & AI Suggestions Sidebar */}
        <Box
          sx={{
            width: '300px',
            borderLeft: '1px solid #e0e0e0',
            p: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
            overflow: 'auto',
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
            <Button
              onClick={() => handleTabClick(0)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#9c27b0',
                borderBottom: activeTab === 0 ? '2px solid #9c27b0' : 'none',
                backgroundColor: 'transparent',
                textTransform: 'none',
                fontWeight: activeTab === 0 ? 'bold' : 'normal',
                minWidth: '100%',
                justifyContent: 'flex-start',
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#9c27b0',
                },
              }}
            >
              <DownloadOutlinedIcon sx={{ color: '#9c27b0', fontSize: '1.25rem' }} />
              DOWNLOAD
            </Button>
            <Button
              onClick={() => handleTabClick(1)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#2196f3',
                borderBottom: activeTab === 1 ? '2px solid #2196f3' : 'none',
                backgroundColor: 'transparent',
                textTransform: 'none',
                fontWeight: activeTab === 1 ? 'bold' : 'normal',
                minWidth: '100%',
                justifyContent: 'flex-start',
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                },
              }}
            >
              <EditOutlinedIcon sx={{ color: '#2196f3', fontSize: '1.25rem' }} />
              REWRITE
            </Button>
            <Button
              onClick={() => handleTabClick(2)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#ffc107',
                borderBottom: activeTab === 2 ? '2px solid #ffc107' : 'none',
                backgroundColor: 'transparent',
                textTransform: 'none',
                fontWeight: activeTab === 2 ? 'bold' : 'normal',
                minWidth: '100%',
                justifyContent: 'flex-start',
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#ffc107',
                },
              }}
            >
              <FormatListBulletedIcon sx={{ color: '#ffc107', fontSize: '1.25rem' }} />
              EXTRACT
            </Button>
            <Button
              onClick={() => handleTabClick(3)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#ff9800',
                borderBottom: activeTab === 3 ? '2px solid #ff9800' : 'none',
                backgroundColor: 'transparent',
                textTransform: 'none',
                fontWeight: activeTab === 3 ? 'bold' : 'normal',
                minWidth: '100%',
                justifyContent: 'flex-start',
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#ff9800',
                },
              }}
            >
              <RecordVoiceOverOutlined sx={{ color: '#ff9800', fontSize: '1.25rem' }} />
              SUMMARIZE
            </Button>
          </Box>

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
            <ListItem
              button
              onClick={() => handleSuggestionClick('Summarize this content', 3)}
              sx={{ p: 0, mb: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <RecordVoiceOverOutlined sx={{ color: '#ff9800' }} />
              </ListItemIcon>
              <ListItemText
                primary="Summarize"
                secondary="Get a concise summary of the content"
                sx={{
                  '& .MuiTypography-root.MuiTypography-body1': {
                    color: '#ff9800',
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
            <ListItem
              button
              onClick={() => handleSuggestionClick('Extract key points', 2)}
              sx={{ p: 0, mb: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <FormatListBulletedIcon sx={{ color: '#ffc107' }} />
              </ListItemIcon>
              <ListItemText
                primary="Extract"
                secondary="Extract the main points and insights"
                sx={{
                  '& .MuiTypography-root.MuiTypography-body1': {
                    color: '#ffc107',
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
            <ListItem
              button
              onClick={() => handleSuggestionClick('Rewrite this content', 1)}
              sx={{ p: 0 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EditOutlinedIcon sx={{ color: '#2196f3' }} />
              </ListItemIcon>
              <ListItemText
                primary="Rewrite"
                secondary="Rewrite content in a different style"
                sx={{
                  '& .MuiTypography-root.MuiTypography-body1': {
                    color: '#2196f3',
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
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AIAnalysisPopup;
