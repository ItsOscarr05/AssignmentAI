import {
  Add as AddIcon,
  ChatOutlined as ChatOutlinedIcon,
  DeleteOutlined,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FullscreenExit as FullscreenExitIcon,
  History as HistoryIcon,
  InfoOutlined as InfoIcon,
  Launch as LaunchIcon,
  LinkOutlined as LinkOutlinedIcon,
  RecordVoiceOverOutlined,
  Send as SendIcon,
  UploadOutlined as UploadOutlinedIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { animate } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Customized,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import AIResponsePopup from '../components/workshop/AIResponsePopup';
import FileUploadModal from '../components/workshop/FileUploadModal';
import LinkChatModal from '../components/workshop/LinkChatModal';
import RecentHistorySidebar from '../components/workshop/RecentHistorySidebar';
import { SubscriptionUpgradeModal } from '../components/workshop/SubscriptionUpgradeModal';
import WorkshopFileUpload from '../components/workshop/WorkshopFileUpload';
import WorkshopLiveModal from '../components/workshop/WorkshopLiveModal';

import TokenLimitExceededPopup from '../components/subscription/TokenLimitExceededPopup';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTokenLimit } from '../hooks/useTokenLimit';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { useWorkshopStore, WorkshopFile } from '../services/WorkshopService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

interface HistoryItem {
  id: string;
  title: string;
  date: Date;
  type: 'file' | 'link' | 'chat';
  isPinned: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const VerticalDividers = ({ xAxisMap, yAxisMap }: any) => {
  // Guard against missing maps
  if (!xAxisMap || !yAxisMap) {
    return null;
  }
  const xAxis = Object.values(xAxisMap)[0] as any;
  const yAxis = Object.values(yAxisMap)[0] as any;

  // Guard against missing axes
  if (!xAxis || !yAxis) {
    return null;
  }

  const { scale } = xAxis;
  const ticks = scale.domain();

  // We don't need a divider after the last group of bars
  const relevantTicks = ticks.slice(0, ticks.length - 1);

  return (
    <g>
      {relevantTicks.map((tick: any) => {
        // Position the line at the end of the band for each tick
        const x = scale(tick) + scale.bandwidth();

        return (
          <line
            key={`divider-for-${tick}`}
            x1={x}
            y1={yAxis.y}
            x2={x}
            y2={yAxis.y + yAxis.height}
            stroke="#e0e0e0" // A subtle color for the divider
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
};

const Workshop: React.FC = () => {
  const location = useLocation();

  const { breakpoint } = useAspectRatio();
  const {
    generateContent,
    history: workshopHistory,
    error,
    featureAccessError,
    files,
    addLink,
    processFile,
    deleteFile,
    clearFeatureAccessError,
  } = useWorkshopStore();

  // Debug logging for feature access error
  React.useEffect(() => {
    console.log('Feature access error changed:', featureAccessError);
  }, [featureAccessError]);

  // Monitor for token limit errors and show popup
  React.useEffect(() => {
    if (
      error &&
      (error.includes('Token limit exceeded') ||
        error.includes('token limit') ||
        error.includes('Unable to verify token limits'))
    ) {
      setShowTokenLimitPopup(true);
    }
  }, [error]);
  const [input, setInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isLinkProcessing, setIsLinkProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [responseTab, setResponseTab] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activityData, setActivityData] = useState<any[]>(() => {
    // Get the current week's start date (Sunday)
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    const currentWeekStart = lastSunday.toISOString().split('T')[0];

    // Load persisted activity data from localStorage
    const saved = localStorage.getItem('weeklyActivityData');
    const savedWeekStart = localStorage.getItem('weeklyActivityWeekStart');

    if (saved && savedWeekStart === currentWeekStart) {
      // Same week, load the saved data
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved activity data:', e);
      }
    } else if (savedWeekStart && savedWeekStart !== currentWeekStart) {
      // New week detected, clear old data
      console.log('New week detected, resetting activity data');
      localStorage.removeItem('weeklyActivityData');
      localStorage.setItem('weeklyActivityWeekStart', currentWeekStart);
    } else {
      // First time, set the week start
      localStorage.setItem('weeklyActivityWeekStart', currentWeekStart);
    }

    // Return empty data for the current week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(lastSunday);
      date.setDate(lastSunday.getDate() + i);
      return date;
    });

    return weekDays.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        date: dayName,
        chats: 0,
        files: 0,
        links: 0,
        summarize: 0,
        extract: 0,
        rewrite: 0,
      };
    });
  });
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [isTokenChartHovered, setIsTokenChartHovered] = useState(false);

  // Helper function to calculate bar opacity based on filters
  const getBarOpacity = (dataKey: string, date: string) => {
    if (selectedArea && selectedDay) {
      // Both filters active - only show if both match
      return selectedArea === dataKey && selectedDay === date ? 0.8 : 0.1;
    } else if (selectedArea) {
      // Only area filter active
      return selectedArea === dataKey ? 0.8 : 0.15;
    } else if (selectedDay) {
      // Only day filter active
      return selectedDay === date ? 0.8 : 0.15;
    } else {
      // No filters active
      return 0.4;
    }
  };

  const getStrokeOpacity = (dataKey: string, date: string) => {
    if (selectedArea && selectedDay) {
      return selectedArea === dataKey && selectedDay === date ? 1 : 0.2;
    } else if (selectedArea) {
      return selectedArea === dataKey ? 1 : 0.3;
    } else if (selectedDay) {
      return selectedDay === date ? 1 : 0.3;
    } else {
      return 1;
    }
  };

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // NEW AI Response Popup state - Enhanced analysis interface
  const [isAnalysisPopupOpen, setIsAnalysisPopupOpen] = useState(false);
  const [popupUploadType, setPopupUploadType] = useState<'text' | 'file' | 'link'>('text');
  const [popupContent, setPopupContent] = useState<any>(null);

  // Fullscreen message state
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);

  // Link chat modal state
  const [showLinkChatModal, setShowLinkChatModal] = useState(false);
  const [lastProcessedLink, setLastProcessedLink] = useState<any>(null);

  // Token limit exceeded popup state
  const [showTokenLimitPopup, setShowTokenLimitPopup] = useState(false);

  // Use token limit hook for subscription and token data
  const {
    subscription,
    tokenUsage: tokenLimitData,
    loading: subscriptionLoading,
  } = useTokenLimit();

  const { totalTokens, usedTokens, remainingTokens, percentUsed } = useTokenUsage(subscription);

  const uploadContentRef = useRef<HTMLDivElement>(null);
  const rewriteTabRef = useRef<HTMLDivElement>(null);

  // Generate activity data from workshop history
  const generateActivityData = useMemo(() => {
    const now = new Date();

    // Find the most recent Sunday (start of week)
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysSinceSunday = currentDay;
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - daysSinceSunday);

    // Generate 7 days starting from Sunday
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(lastSunday);
      date.setDate(lastSunday.getDate() + i);
      return date;
    });

    return weekDays.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      // Count activities for this day
      const dayActivities = workshopHistory.filter(item => {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        return itemDate === dateStr;
      });

      // Categorize activities
      const chats = dayActivities.filter(item => item.type === 'chat').length;

      const files = dayActivities.filter(item => item.type === 'file').length;

      const links = dayActivities.filter(item => item.type === 'link').length;

      // Count AI actions (summarize, extract, rewrite)
      const summarize = dayActivities.filter(
        item =>
          item.serviceUsed === 'summarize' ||
          (item.prompt && item.prompt.toLowerCase().includes('summarize'))
      ).length;

      const extract = dayActivities.filter(
        item =>
          item.serviceUsed === 'extract' ||
          (item.prompt && item.prompt.toLowerCase().includes('extract'))
      ).length;

      const rewrite = dayActivities.filter(
        item =>
          item.serviceUsed === 'rewrite' ||
          (item.prompt && item.prompt.toLowerCase().includes('rewrite'))
      ).length;

      return {
        date: dayName,
        chats,
        files,
        links,
        summarize,
        extract,
        rewrite,
      };
    });
  }, [workshopHistory]);

  // Update activity data when workshop history changes - merge with existing data
  useEffect(() => {
    const newData = generateActivityData;

    // Check if we're still in the same week
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    const currentWeekStart = lastSunday.toISOString().split('T')[0];
    const savedWeekStart = localStorage.getItem('weeklyActivityWeekStart');

    // If it's a new week, reset the data
    if (savedWeekStart && savedWeekStart !== currentWeekStart) {
      console.log('New week detected in useEffect, resetting activity data');
      localStorage.setItem('weeklyActivityWeekStart', currentWeekStart);
      localStorage.setItem('weeklyActivityData', JSON.stringify(newData));
      setActivityData(newData);
      return;
    }

    setActivityData(prevData => {
      // Merge new data with existing data by adding counts
      const merged = prevData.map((prevDay, index) => {
        const newDay = newData[index];
        if (!newDay) return prevDay;

        return {
          date: prevDay.date,
          chats: Math.max(prevDay.chats, newDay.chats),
          files: Math.max(prevDay.files, newDay.files),
          links: Math.max(prevDay.links, newDay.links),
          summarize: Math.max(prevDay.summarize, newDay.summarize),
          extract: Math.max(prevDay.extract, newDay.extract),
          rewrite: Math.max(prevDay.rewrite, newDay.rewrite),
        };
      });

      // Save to localStorage
      localStorage.setItem('weeklyActivityData', JSON.stringify(merged));

      return merged;
    });
  }, [generateActivityData]);

  // Modal state for live AI response
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  // File upload modal state
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  // Debug: Log when modal state changes
  React.useEffect(() => {
    console.log('File upload modal state changed:', showFileUploadModal);
  }, [showFileUploadModal]);

  // Use real token usage for the circular progress bar
  const tokenUsage = useMemo(
    () => ({
      label: subscriptionLoading
        ? 'Loading...'
        : tokenLimitData?.label || 'Free Plan (100,000 tokens/month)',
      total: totalTokens,
      used: usedTokens,
      remaining: remainingTokens,
      percentUsed: percentUsed,
    }),
    [
      subscriptionLoading,
      tokenLimitData?.label,
      totalTokens,
      usedTokens,
      remainingTokens,
      percentUsed,
    ]
  );

  useEffect(() => {
    if (location.hash === '#upload-content-card' && uploadContentRef.current) {
      uploadContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
    if (location.state?.responseTab) {
      setResponseTab(location.state.responseTab);
    }

    // Handle reopening assignment from assignments page
    if (location.state?.assignment && location.state?.reopen) {
      const assignment = location.state.assignment;
      const assignmentPrompt = `Reopen assignment: ${assignment.title}\n\nSubject: ${assignment.subject}\nDescription: ${assignment.description}\n\nPlease help me continue working on this assignment.`;
      setInput(assignmentPrompt);
      setActiveTab(0); // Switch to chat tab

      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const animation = animate(0, percentUsed, {
      duration: 1.2,
      ease: 'circOut',
      onUpdate: latest => {
        setAnimatedPercent(latest);
      },
    });
    return () => animation.stop();
  }, [percentUsed]);

  // Populate history from workshopHistory
  useEffect(() => {
    // Load pinned state from localStorage
    const pinnedIdsJson = localStorage.getItem('workshop-pinned-history');
    const pinnedIds: string[] = pinnedIdsJson ? JSON.parse(pinnedIdsJson) : [];

    const historyItems: HistoryItem[] = workshopHistory.map(item => {
      let title = 'Unknown';

      if (item.type === 'chat') {
        title = (item.prompt || 'Chat message').substring(0, 50);
        if (title.length === 50) title += '...';
      } else if (item.type === 'file') {
        // Try to find the file name from the prompt or content
        const fileNameMatch = item.prompt?.match(/File(?:: | - | )([^\\n]+)/i);
        title = fileNameMatch ? `File: ${fileNameMatch[1]}` : 'File Upload';
      } else if (item.type === 'link') {
        // Try to extract URL or title from the prompt
        const urlMatch = item.prompt?.match(/(https?:\/\/[^\\s]+)/);
        title = urlMatch ? `Link: ${urlMatch[1].substring(0, 40)}...` : 'Link';
      }

      return {
        id: item.id,
        title,
        date: new Date(item.timestamp),
        type: item.type as 'file' | 'link' | 'chat',
        isPinned: pinnedIds.includes(item.id), // Restore pinned state from localStorage
      };
    });
    setHistory(historyItems);
  }, [workshopHistory]);

  useEffect(() => {
    if (responseTab === 1 && rewriteTabRef.current) {
      rewriteTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [responseTab]);

  // Show error snackbar when there's an error
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error',
      });
    }
  }, [error]);

  // Custom styles
  const cardStyle = {
    backgroundColor: (theme: any) => {
      return theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff';
    },
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    transition: 'all 0.2s ease-in-out',
    border: '2px solid red',
    '&:hover': {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Open popup immediately before generating content
      handleOpenAnalysisPopup('text', { text: input });
      await generateContent(input);
      setInput('');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      setIsLinkProcessing(true);
      try {
        const linkData = await addLink({ url: linkInput, title: linkInput });
        // Open the Link Chat Modal with the processed link data
        setLastProcessedLink(linkData);
        setShowLinkChatModal(true);
        setLinkInput('');
      } catch (error) {
        console.error('Error processing link:', error);
      } finally {
        setIsLinkProcessing(false);
      }
    }
  };

  // NEW AI Response Popup handlers - Enhanced analysis interface
  const handleOpenAnalysisPopup = (uploadType: 'text' | 'file' | 'link', content: any) => {
    setPopupUploadType(uploadType);
    setPopupContent(content);
    setIsAnalysisPopupOpen(true);
  };

  // File upload modal handlers
  const handleFileUploaded = (file: any) => {
    console.log('File uploaded:', file);

    // Only open the modal if the file upload was successful (status is 'completed')
    if (file && file.status === 'completed') {
      setShowFileUploadModal(true);
    } else {
      console.log('File upload failed or subscription error - not opening modal');
      // Don't open the modal for failed uploads or subscription errors
    }
  };

  const handleFileProcessed = (file: WorkshopFile) => {
    // Handle file processing result
    console.log('File processed:', file);
  };

  const handleFileDeleted = (fileId: string) => {
    deleteFile(fileId);
    // Close the modal after deleting the file
    setShowFileUploadModal(false);
    // Clear the files array since the file was deleted
    useWorkshopStore.setState({ files: [] });
  };

  const handleCloseAnalysisPopup = () => {
    setIsAnalysisPopupOpen(false);
    setPopupContent(null);
  };

  const handleFileAction = async (action: 'summarize' | 'extract' | 'rewrite' | 'analyze') => {
    if (files.length > 0) {
      const lastFile = files[files.length - 1];
      await processFile(lastFile.id, action);
      setSnackbar({
        open: true,
        message: `File ${action} completed!`,
        severity: 'success',
      });
    }
  };

  const handlePinHistory = (id: string) => {
    setHistory(prev => {
      const updatedHistory = prev.map(item =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );

      // Persist pinned state to localStorage
      const pinnedIds = updatedHistory.filter(item => item.isPinned).map(item => item.id);
      localStorage.setItem('workshop-pinned-history', JSON.stringify(pinnedIds));

      return updatedHistory;
    });
  };

  const renderInputSection = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Type your message here..."
                variant="outlined"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                    '& fieldset': {
                      borderColor: 'red',
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
              <Tooltip title="Open AI Chat Popup">
                <IconButton
                  onClick={() => {
                    setPopupUploadType('text');
                    setPopupContent({ text: '' });
                    setIsAnalysisPopupOpen(true);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    },
                    zIndex: 1,
                  }}
                  size="small"
                >
                  <LaunchIcon sx={{ color: 'red', fontSize: '1.2rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                sx={{
                  backgroundColor: 'red',
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                  },
                }}
              >
                Send Message
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteOutlined />}
                onClick={() => setInput('')}
                sx={{
                  borderColor: 'red',
                  color: 'red',
                  '&:hover': {
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.04)',
                  },
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        );
      case 1:
        return <WorkshopFileUpload onFileUploaded={handleFileUploaded} />;
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <form onSubmit={handleLinkSubmit}>
              <TextField
                fullWidth
                placeholder="Paste a link here..."
                variant="outlined"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkSubmit(e);
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#82ca9d',
                    },
                    '&:hover fieldset': {
                      borderColor: '#82ca9d',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#82ca9d',
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={
                    isLinkProcessing ? <CircularProgress size={20} color="inherit" /> : <AddIcon />
                  }
                  type="submit"
                  disabled={isLinkProcessing}
                  sx={{
                    backgroundColor: isLinkProcessing ? '#9e9e9e' : '#82ca9d',
                    '&:hover': {
                      backgroundColor: isLinkProcessing ? '#9e9e9e' : '#6a9c7a',
                    },
                  }}
                >
                  {isLinkProcessing ? 'Link Processing' : 'Process Link'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteOutlined />}
                  onClick={() => setLinkInput('')}
                  sx={{
                    borderColor: 'red',
                    color: 'red',
                    '&:hover': {
                      borderColor: 'red',
                      backgroundColor: 'rgba(255, 0, 0, 0.04)',
                    },
                  }}
                >
                  Clear
                </Button>
              </Box>
            </form>
          </Box>
        );
      default:
        return null;
    }
  };

  // Custom tooltip for the activity graph
  const CustomActivityTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    const allKeys = [
      { key: 'chats', label: 'Chats', color: '#E53935' },
      { key: 'summarize', label: 'Summarize', color: '#FB8C00' },
      { key: 'extract', label: 'Extract', color: '#FDD835' },
      { key: 'links', label: 'Links', color: '#43A047' },
      { key: 'rewrite', label: 'Rewrite', color: '#1E88E5' },
      { key: 'files', label: 'Files', color: '#8E24AA' },
    ];
    return (
      <Box
        sx={{
          p: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
          border: '2px solid red',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'inherit'),
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {allKeys.map(({ key, label, color }) => {
            if (selectedArea && selectedArea !== key) return null;
            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: color,
                    borderRadius: '2px',
                  }}
                />
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                  {label}:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                  {point[key]}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderLegendText = (value: string, entry: any) => {
    const { color, dataKey } = entry;
    const keyAsString = String(dataKey);
    const isSelected = selectedArea === keyAsString;
    return (
      <span
        style={{
          color,
          fontWeight: 500,
          textDecoration: isSelected ? 'underline' : 'none',
          cursor: 'pointer',
        }}
      >
        {value}
      </span>
    );
  };

  const getProgressColor = (_percent: number) => '#D32F2F';
  const progressColor = getProgressColor(percentUsed);

  return (
    <Box
      sx={{
        p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
        minHeight: '100vh',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        '@media (max-width: 480px)': {
          '& .MuiTab-label': {
            display: 'none !important',
            visibility: 'hidden !important',
            opacity: 0,
            width: 0,
            height: 0,
            overflow: 'hidden',
            position: 'absolute',
            left: '-9999px',
            fontSize: 0,
            lineHeight: 0,
          },
          '& .ai-response-tabs .MuiTab-label': {
            display: 'none !important',
            visibility: 'hidden !important',
            opacity: 0,
            width: 0,
            height: 0,
            overflow: 'hidden',
            position: 'absolute',
            left: '-9999px',
            fontSize: 0,
            lineHeight: 0,
          },
        },
        '@media (max-width: 360px)': {
          p: 0.25,
          '& .MuiCard-root': {
            width: '99% !important',
            mx: 'auto !important',
          },
        },
      }}
    >
      {/* Subscription Upgrade Modal */}
      {featureAccessError && (
        <SubscriptionUpgradeModal
          open={true}
          onClose={clearFeatureAccessError}
          error={featureAccessError}
        />
      )}

      {/* Token Limit Exceeded Popup */}
      <TokenLimitExceededPopup
        open={showTokenLimitPopup}
        onClose={() => setShowTokenLimitPopup(false)}
        currentUsage={usedTokens}
        limit={totalTokens}
      />

      <Grid
        container
        spacing={{ xs: 0.5, sm: 1, md: 3 }}
        sx={{
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          '@media (max-width: 360px)': {
            spacing: 0.25,
            width: '99%',
            mx: 'auto',
          },
        }}
      >
        {/* Main Content */}
        <Grid
          item
          xs={12}
          md={breakpoint === 'standard' ? 12 : 8}
          lg={breakpoint === 'standard' ? 12 : 8}
          xl={breakpoint === 'standard' ? 12 : 7}
          sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          {/* Header */}
          <Box
            sx={{
              ...cardStyle,
              mb: { xs: 2, sm: 3, md: 4 },
            }}
          >
            <Box sx={{ p: { xs: 1, sm: 1, md: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: { xs: 1, md: 0 },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: theme =>
                      theme.palette.mode === 'dark' ? 'red' : theme.palette.primary.main,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' },
                    fontWeight: { xs: 600, md: 400 },
                  }}
                >
                  Workshop
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => setIsDrawerOpen(true)}
                  size="small"
                  sx={{
                    borderColor: 'red',
                    color: 'red',
                    '&:hover': { borderColor: 'red' },
                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 },
                  }}
                >
                  History
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Activity Chart */}
          <Box
            sx={{
              ...cardStyle,
              p: { xs: 0.75, sm: 1, md: 3 },
              mb: { xs: 2, sm: 3, md: 4 },
              overflow: 'hidden',
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1 },
                mb: { xs: 1.5, sm: 2 },
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' },
                    mb: { xs: 0.5, sm: 1 },
                    color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
                  }}
                >
                  Weekly Activity Overview
                </Typography>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Weekly Activity Overview
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Track your AI usage and interaction patterns over the past week. This chart shows daily activity to help you understand your workflow trends.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Bar chart displays daily AI interactions and assignments
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Hover over bars to see exact values for each day
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Use this data to identify your most productive days
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                        Updated in real-time as you use AI features
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <InfoIcon
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: 16, sm: 18, md: 20 },
                      cursor: 'help',
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
            <Box
              sx={{
                height: { xs: 280, sm: 320, md: 400 },
                overflow: 'hidden',
                width: '100%',
                '@media (max-width: 360px)': {
                  width: '98%',
                  mx: 'auto',
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityData}
                  margin={{
                    top: 20,
                    right: 10,
                    left: -30,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 500 }}
                  />
                  <RechartsTooltip
                    content={CustomActivityTooltip}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Legend
                    onClick={e => {
                      if (e.dataKey) {
                        const keyAsString = String(e.dataKey);
                        setSelectedArea(prev => (prev === keyAsString ? null : keyAsString));
                      }
                    }}
                    wrapperStyle={{
                      paddingTop: 5,
                      fontSize: '0.75rem',
                    }}
                    formatter={renderLegendText}
                    iconSize={8}
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                  <Customized component={VerticalDividers} />
                  <Bar
                    dataKey="chats"
                    stroke="#E53935"
                    strokeWidth={2}
                    fill="#E53935"
                    name="Chats"
                    radius={[4, 4, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#E53935"
                        fillOpacity={getBarOpacity('chats', entry.date)}
                        stroke="#E53935"
                        strokeOpacity={getStrokeOpacity('chats', entry.date)}
                        onClick={() => {
                          setSelectedDay(prev => (prev === entry.date ? null : entry.date));
                        }}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="summarize"
                    stroke="#FB8C00"
                    strokeWidth={2}
                    fill="#FB8C00"
                    name="Summarize"
                    radius={[4, 4, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#FB8C00"
                        fillOpacity={getBarOpacity('summarize', entry.date)}
                        stroke="#FB8C00"
                        strokeOpacity={getStrokeOpacity('summarize', entry.date)}
                        onClick={() => {
                          setSelectedDay(prev => (prev === entry.date ? null : entry.date));
                        }}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="extract"
                    stroke="#FDD835"
                    strokeWidth={2}
                    fill="#FDD835"
                    name="Extract"
                    radius={[4, 4, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#FDD835"
                        fillOpacity={getBarOpacity('extract', entry.date)}
                        stroke="#FDD835"
                        strokeOpacity={getStrokeOpacity('extract', entry.date)}
                        onClick={() => {
                          setSelectedDay(prev => (prev === entry.date ? null : entry.date));
                        }}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="links"
                    stroke="#43A047"
                    strokeWidth={2}
                    fill="#43A047"
                    name="Links"
                    radius={[4, 4, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#43A047"
                        fillOpacity={getBarOpacity('links', entry.date)}
                        stroke="#43A047"
                        strokeOpacity={getStrokeOpacity('links', entry.date)}
                        onClick={() => {
                          setSelectedDay(prev => (prev === entry.date ? null : entry.date));
                        }}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="rewrite"
                    stroke="#1E88E5"
                    strokeWidth={2}
                    fill="#1E88E5"
                    name="Rewrite"
                    radius={[4, 4, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#1E88E5"
                        fillOpacity={getBarOpacity('rewrite', entry.date)}
                        stroke="#1E88E5"
                        strokeOpacity={getStrokeOpacity('rewrite', entry.date)}
                        onClick={() => {
                          setSelectedDay(prev => (prev === entry.date ? null : entry.date));
                        }}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="files"
                    stroke="#8E24AA"
                    strokeWidth={2}
                    fill="#8E24AA"
                    name="Files"
                    radius={[4, 4, 0, 0]}
                  >
                    {activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#8E24AA"
                        fillOpacity={getBarOpacity('files', entry.date)}
                        stroke="#8E24AA"
                        strokeOpacity={getStrokeOpacity('files', entry.date)}
                        onClick={() => {
                          setSelectedDay(prev => (prev === entry.date ? null : entry.date));
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Upload Content and Input Section */}
          <Box
            ref={uploadContentRef}
            id="upload-content-card"
            sx={{
              ...cardStyle,
              p: { xs: 0.75, sm: 1, md: 3 },
              mb: { xs: 2, sm: 3, md: 4 },
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: breakpoint === 'standard' ? 'column' : 'row' },
                alignItems: { xs: 'flex-start', sm: 'flex-start' },
                justifyContent: { xs: 'flex-start', sm: 'flex-start' },
                gap: { xs: 0.75, sm: 1, md: 2 },
                borderBottom: '1px solid #e0e0e0',
                pb: { xs: 0.75, sm: 1 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' },
                    mb: { xs: 0.5, sm: 0 },
                    textAlign: { xs: 'left', sm: 'left' },
                    color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
                  }}
                >
                  Upload Content
                </Typography>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Upload Content
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Add files, links, or text to your assignment workspace. Upload documents, images, or provide URLs to analyze with AI assistance.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • File Upload: Add PDFs, images, documents, or code files
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Link Upload: Provide URLs for AI to analyze web content
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Text Input: Type or paste content directly
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                        All uploaded content becomes available for AI analysis
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <InfoIcon
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: 16, sm: 18, md: 20 },
                      cursor: 'help',
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                    }}
                  />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  onClick={() => setActiveTab(0)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#ff6b6b',
                    borderBottom: activeTab === 0 ? '2px solid #ff6b6b' : 'none',
                    backgroundColor: 'transparent',
                    textTransform: 'none',
                    fontWeight: activeTab === 0 ? 'bold' : 'normal',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#ff6b6b',
                    },
                  }}
                >
                  <ChatOutlinedIcon sx={{ color: '#ff6b6b' }} />
                  <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>CHAT</Typography>
                </Button>
                <Button
                  onClick={() => setActiveTab(1)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#8884d8',
                    borderBottom: activeTab === 1 ? '2px solid #8884d8' : 'none',
                    backgroundColor: 'transparent',
                    textTransform: 'none',
                    fontWeight: activeTab === 1 ? 'bold' : 'normal',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#8884d8',
                    },
                  }}
                >
                  <UploadOutlinedIcon sx={{ color: '#8884d8' }} />
                  <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>FILES</Typography>
                </Button>
                <Button
                  onClick={() => setActiveTab(2)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#82ca9d',
                    borderBottom: activeTab === 2 ? '2px solid #82ca9d' : 'none',
                    backgroundColor: 'transparent',
                    textTransform: 'none',
                    fontWeight: activeTab === 2 ? 'bold' : 'normal',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#82ca9d',
                    },
                  }}
                >
                  <LinkOutlinedIcon sx={{ color: '#82ca9d' }} />
                  <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>LINKS</Typography>
                </Button>
              </Box>
            </Box>
            <Box sx={{ p: 1 }}>
              <TabPanel value={activeTab} index={0}>
                {renderInputSection()}
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                {renderInputSection()}
              </TabPanel>
              <TabPanel value={activeTab} index={2}>
                {renderInputSection()}
              </TabPanel>
            </Box>
          </Box>
        </Grid>

        {/* Sidebar */}
        <Grid
          item
          xs={12}
          md={breakpoint === 'standard' ? 12 : 4}
          lg={breakpoint === 'standard' ? 12 : 4}
          xl={breakpoint === 'standard' ? 12 : 5}
          sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          {/* File Actions */}
          {files.length > 0 && !showFileUploadModal && !isAnalysisPopupOpen && (
            <Box
              sx={{
                ...cardStyle,
                p: { xs: 0.75, sm: 1, md: 3 },
                mb: { xs: 2, sm: 3, md: 4 },
                overflow: 'hidden',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
                }}
              >
                File Actions
              </Typography>
              <List>
                <ListItem button onClick={() => handleFileAction('summarize')}>
                  <ListItemIcon>
                    <RecordVoiceOverOutlined sx={{ color: '#ff9800' }} />
                  </ListItemIcon>
                  <ListItemText primary="Summarize File" />
                </ListItem>
                <ListItem button onClick={() => handleFileAction('extract')}>
                  <ListItemIcon>
                    <FormatListBulletedIcon sx={{ color: '#ffc107' }} />
                  </ListItemIcon>
                  <ListItemText primary="Extract Key Points" />
                </ListItem>
                <ListItem button onClick={() => handleFileAction('rewrite')}>
                  <ListItemIcon>
                    <EditOutlinedIcon sx={{ color: '#2196f3' }} />
                  </ListItemIcon>
                  <ListItemText primary="Rewrite Content" />
                </ListItem>
              </List>
            </Box>
          )}

          {/* Assignment Tokens */}
          <Box
            sx={{
              ...cardStyle,
              p: { xs: 0.75, sm: 1, md: 3 },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: { xs: '380px', sm: '320px', md: '280px' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  color: theme => (theme.palette.mode === 'dark' ? 'red' : 'black'),
                }}
              >
                Assignment Tokens
                {subscriptionLoading && <CircularProgress size={16} sx={{ ml: 1, color: 'red' }} />}
              </Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Assignment Tokens
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Your available AI tokens for assignment-related features. Tokens are consumed when using AI analysis, feedback, or completion features.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Tokens are deducted per AI request or analysis
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Different features consume different amounts of tokens
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Purchase additional tokens or upgrade your plan to get more
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                      Check the AI Tokens page for detailed usage information
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <InfoIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: 16, sm: 18, md: 20 },
                    cursor: 'help',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                  }}
                />
              </Tooltip>
            </Box>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                gap: 2,
                flex: 1,
                width: '100%',
                textAlign: 'center',
                '@media (max-width: 480px)': {
                  gap: 3,
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: {
                    xs: 'min(80vw, 200px)',
                    sm: 'min(70vw, 250px)',
                    md: 'min(60vw, 300px)',
                    lg: 'min(45vw, 320px)',
                    xl: 'min(30vw, 350px)',
                    '@media (minWidth: 1920px)': {
                      width: 'min(25vw, 400px)',
                    },
                    '@media (minWidth: 2560px)': {
                      width: 'min(20vw, 450px)',
                    },
                  },
                  height: {
                    xs: 'min(80vw, 200px)',
                    sm: 'min(70vw, 250px)',
                    md: 'min(60vw, 300px)',
                    lg: 'min(45vw, 320px)',
                    xl: 'min(30vw, 350px)',
                    '@media (minWidth: 1920px)': {
                      height: 'min(25vw, 400px)',
                    },
                    '@media (minWidth: 2560px)': {
                      height: 'min(20vw, 450px)',
                    },
                  },
                  cursor: 'pointer',
                  margin: '0 auto',
                  minWidth: { xs: 150, sm: 180, md: 220, lg: 260, xl: 300 },
                  minHeight: { xs: 150, sm: 180, md: 220, lg: 260, xl: 300 },
                  maxWidth: {
                    xs: 200,
                    sm: 250,
                    md: 300,
                    lg: 320,
                    xl: 350,
                    '@media (minWidth: 1920px)': 400,
                    '@media (minWidth: 2560px)': 450,
                  },
                  maxHeight: {
                    xs: 200,
                    sm: 250,
                    md: 300,
                    lg: 320,
                    xl: 350,
                    '@media (minWidth: 1920px)': 400,
                    '@media (minWidth: 2560px)': 450,
                  },
                }}
                onMouseEnter={() => setIsTokenChartHovered(true)}
                onMouseLeave={() => setIsTokenChartHovered(false)}
              >
                {/* Background Track */}
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size="100%"
                  thickness={6}
                  sx={{
                    color: alpha(progressColor, 0.2),
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    transform: 'translate(-10%, -10%)',
                    width: '100%',
                    height: '100%',
                  }}
                />
                {/* Actual progress */}
                <CircularProgress
                  variant="determinate"
                  value={animatedPercent}
                  size="100%"
                  thickness={6}
                  sx={{
                    color: progressColor,
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    [`& .MuiCircularProgress-circle`]: {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                >
                  {isTokenChartHovered ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant={
                          breakpoint === 'tall'
                            ? 'h5'
                            : breakpoint === 'square'
                            ? 'h4'
                            : breakpoint === 'standard'
                            ? 'h3'
                            : 'h2'
                        }
                        component="div"
                        color={progressColor}
                        sx={{ fontWeight: 700 }}
                      >
                        {tokenUsage.used.toLocaleString()}
                      </Typography>
                      <Divider sx={{ my: 0.5, width: '50%', mx: 'auto' }} />
                      <Typography
                        variant={
                          breakpoint === 'tall'
                            ? 'body1'
                            : breakpoint === 'square'
                            ? 'h6'
                            : breakpoint === 'standard'
                            ? 'h5'
                            : 'h4'
                        }
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        {tokenUsage.total.toLocaleString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant={
                        breakpoint === 'tall'
                          ? 'h3'
                          : breakpoint === 'square'
                          ? 'h2'
                          : breakpoint === 'standard'
                          ? 'h1'
                          : 'h1'
                      }
                      component="div"
                      color="text.secondary"
                      sx={{ fontWeight: 700 }}
                    >
                      {Math.round(animatedPercent)}%
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  textAlign: 'center',
                  mt: 2,
                  '@media (max-width: 480px)': {
                    mt: 3,
                    mb: 2,
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {tokenUsage.label}
                </Typography>

                {/* Show upgrade button if user is close to token limit */}
                {subscription && percentUsed > 80 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open('/dashboard/price-plan', '_blank')}
                    sx={{
                      mt: 1,
                      borderColor: 'red',
                      color: 'red',
                      '&:hover': {
                        borderColor: 'red',
                        backgroundColor: 'rgba(255, 0, 0, 0.04)',
                      },
                    }}
                  >
                    Upgrade Plan
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Recent History Sidebar */}
      <RecentHistorySidebar
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        history={history}
        onPinHistory={handlePinHistory}
      />

      {/* Snackbar for alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Render the modal */}
      <WorkshopLiveModal
        open={liveModalOpen}
        onClose={() => setLiveModalOpen(false)}
        content=""
        aiResponse=""
        isLoading={false}
        title="AI Response"
      />

      {/* Fullscreen Message Dialog */}
      <Dialog
        open={!!fullscreenMessage}
        onClose={() => setFullscreenMessage(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '2px solid #f44336',
            maxHeight: '90vh',
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
              AI Response - Full View
            </Typography>
            <IconButton onClick={() => setFullscreenMessage(null)} size="small">
              <FullscreenExitIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {fullscreenMessage && (
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                lineHeight: 1.6,
                fontSize: '1.1rem',
              }}
            >
              {workshopHistory.find(m => m.id === fullscreenMessage)?.content}
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW AI Response Popup - Enhanced analysis interface */}
      <AIResponsePopup
        open={isAnalysisPopupOpen}
        onClose={handleCloseAnalysisPopup}
        uploadType={popupUploadType}
        content={popupContent}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        open={showFileUploadModal}
        onClose={() => {
          setShowFileUploadModal(false);

          // Clear only the files array to prevent confusion with future uploads
          // Keep other workshop data (prompt, history, etc.) intact
          useWorkshopStore.setState({ files: [] });
        }}
        files={files as WorkshopFile[]}
        onFileProcessed={handleFileProcessed}
        onFileDeleted={handleFileDeleted}
      />

      {/* Link Chat Modal */}
      <LinkChatModal
        open={showLinkChatModal}
        onClose={() => {
          setShowLinkChatModal(false);
          setLastProcessedLink(null);
        }}
        linkData={lastProcessedLink}
        onLinkDeleted={linkId => {
          // Handle link deletion if needed
          console.log('Link deleted:', linkId);
        }}
      />
    </Box>
  );
};

export default Workshop;
