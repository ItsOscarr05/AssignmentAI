import {
  ChatOutlined as ChatOutlinedIcon,
  HistoryOutlined as HistoryOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  LinkOutlined as LinkOutlinedIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  UploadOutlined as UploadOutlinedIcon,
} from '@mui/icons-material';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';

interface HistoryItem {
  id: string;
  title: string;
  date: Date;
  type: 'file' | 'link' | 'chat';
  isPinned: boolean;
}

interface RecentHistorySidebarProps {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onPinHistory: (id: string) => void;
}

const RecentHistorySidebar: React.FC<RecentHistorySidebarProps> = ({
  open,
  onClose,
  history,
  onPinHistory,
}) => {
  const getHistoryIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'file':
        return <UploadOutlinedIcon />;
      case 'link':
        return <LinkOutlinedIcon />;
      case 'chat':
        return <ChatOutlinedIcon />;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'transparent',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: 'none',
          borderLeft: theme => (theme.palette.mode === 'dark' ? '2px solid #d32f2f' : '1px solid'),
          borderColor: theme => (theme.palette.mode === 'dark' ? '#d32f2f' : 'divider'),
          borderRadius: '12px 0 0 12px',
        },
      }}
    >
      <Box sx={{ width: 350, height: '100%' }}>
        <Box
          sx={{
            background: theme =>
              theme.palette.mode === 'dark'
                ? theme.palette.background.paper
                : `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
            height: '100%',
            width: '100%',
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: theme => (theme.palette.mode === 'dark' ? 'red' : 'inherit'),
              }}
            >
              Recent History
            </Typography>
            <Tooltip title="Pin important items for quick access" arrow>
              <InfoOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            </Tooltip>
          </Box>
          {history.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ mt: 8 }}
            >
              <HistoryOutlinedIcon sx={{ fontSize: 54, color: '#ff6b6b', mb: 2, opacity: 0.5 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No History Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your workshop activity will appear here
              </Typography>
            </Box>
          ) : (
            <motion.div layout>
              <List>
                {history
                  .slice()
                  .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
                  .map(item => (
                    <motion.div layout key={item.id}>
                      <ListItem
                        button
                        onClick={() => onPinHistory(item.id)}
                        sx={{
                          border: '1px solid #ff6b6b',
                          borderRadius: '8px',
                          mb: 1,
                          backgroundColor: theme =>
                            theme.palette.mode === 'dark' ? '#001122' : 'transparent',
                        }}
                      >
                        <ListItemIcon>
                          {React.cloneElement(getHistoryIcon(item.type), {
                            sx: { color: '#ff6b6b' },
                          })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          secondary={item.date.toLocaleString()}
                          primaryTypographyProps={{
                            style: {
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            onPinHistory(item.id);
                          }}
                        >
                          {item.isPinned ? (
                            <PushPinIcon color="primary" />
                          ) : (
                            <PushPinOutlinedIcon />
                          )}
                        </IconButton>
                      </ListItem>
                    </motion.div>
                  ))}
              </List>
            </motion.div>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default RecentHistorySidebar;
