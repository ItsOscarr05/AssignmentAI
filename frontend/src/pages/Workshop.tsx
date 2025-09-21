import {
  Add as AddIcon,
  BarChart as BarChartIcon,
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
  Customized,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import AIResponsePopup from '../components/workshop/AIResponsePopup';
import { FeatureAccessErrorComponent } from '../components/workshop/FeatureAccessError';
import FileUploadModal from '../components/workshop/FileUploadModal';
import RecentHistorySidebar from '../components/workshop/RecentHistorySidebar';
import WorkshopFileUpload from '../components/workshop/WorkshopFileUpload';
import WorkshopLiveModal from '../components/workshop/WorkshopLiveModal';

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
  const [input, setInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [responseTab, setResponseTab] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activityData] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [isTokenChartHovered, setIsTokenChartHovered] = useState(false);
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

  // Use token limit hook for subscription and token data
  const {
    subscription,
    tokenUsage: tokenLimitData,
    loading: subscriptionLoading,
  } = useTokenLimit();

  const { totalTokens, usedTokens, remainingTokens, percentUsed } = useTokenUsage(subscription);

  const uploadContentRef = useRef<HTMLDivElement>(null);
  const rewriteTabRef = useRef<HTMLDivElement>(null);
  // Modal state for live AI response
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  // File upload modal state
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  // Debug: Log when modal state changes
  React.useEffect(() => {
    console.log('File upload modal state changed:', showFileUploadModal);
  }, [showFileUploadModal]);

  // Use real token usage for the circular progress bar
  const getPlanLabel = () => {
    if (subscriptionLoading) return 'Loading...';
    if (!subscription) return 'Free Plan (100,000 tokens/month)';

    return tokenLimitData?.label || 'Free Plan (100,000 tokens/month)';
  };

  const tokenUsage = useMemo(
    () => ({
      label: getPlanLabel(),
      total: totalTokens,
      used: usedTokens,
      remaining: remainingTokens,
      percentUsed: percentUsed,
    }),
    [subscription, subscriptionLoading, totalTokens, usedTokens, remainingTokens, percentUsed]
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

  useEffect(() => {
    // Start with empty history for real users
    setHistory([]);
  }, []);

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
      // Open popup immediately before adding link
      handleOpenAnalysisPopup('link', { url: linkInput, title: linkInput });
      await addLink({ url: linkInput, title: linkInput });
      setLinkInput('');
      setSnackbar({
        open: true,
        message: 'Link processed successfully!',
        severity: 'success',
      });
    }
  };

  const handleQuickActionClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
    if (uploadContentRef.current) {
      uploadContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    setShowFileUploadModal(true);
  };

  const handleFileProcessed = (fileId: string, result: any) => {
    // Handle file processing result
    console.log('File processed:', fileId, result);
  };

  const handleFileDeleted = (fileId: string) => {
    deleteFile(fileId);
  };

  const handleAiFill = async (file: any) => {
    // This will be handled by the modal
    console.log('AI Fill requested for:', file);
  };

  const handleDownloadFilled = (file: any) => {
    // This will be handled by the modal
    console.log('Download filled file:', file);
  };

  const handlePreviewFile = (file: any) => {
    // This will be handled by the modal
    console.log('Preview file:', file);
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
    setHistory(prev =>
      prev.map(item => (item.id === id ? { ...item, isPinned: !item.isPinned } : item))
    );
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
                  startIcon={<AddIcon />}
                  type="submit"
                  sx={{
                    backgroundColor: '#82ca9d',
                    '&:hover': {
                      backgroundColor: '#6a9c7a',
                    },
                  }}
                >
                  Process Link
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
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
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
        backgroundColor: theme =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
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
      {/* Feature Access Error Display */}
      {featureAccessError && (
        <FeatureAccessErrorComponent
          error={featureAccessError}
          onUpgrade={() => window.open('/dashboard/price-plan', '_blank')}
          onDismiss={clearFeatureAccessError}
        />
      )}

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
              width: { xs: '95%', sm: '100%' },
              mx: { xs: 'auto', sm: 0 },
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
              '@media (max-width: 480px)': {
                width: '98%',
                mx: 'auto',
              },
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
              <Tooltip title="View your AI activity over time" arrow>
                <InfoIcon
                  sx={{
                    color: 'gray',
                    fontSize: { xs: 14, sm: 16, md: 20 },
                    cursor: 'pointer',
                    position: 'relative',
                    top: { xs: '-2px', sm: '-5px' },
                  }}
                />
              </Tooltip>
            </Box>
            {activityData.length === 0 ||
            activityData.every(d =>
              Object.values(d)
                .slice(1)
                .every(v => v === 0)
            ) ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 300 }}
              >
                <BarChartIcon sx={{ fontSize: 64, color: '#ff6b6b', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Activity Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start using the workshop to see your activity here
                </Typography>
              </Box>
            ) : (
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
                      right: 30,
                      left: 20,
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
                      fillOpacity={selectedArea ? (selectedArea === 'chats' ? 0.8 : 0.15) : 0.4}
                      strokeOpacity={selectedArea ? (selectedArea === 'chats' ? 1 : 0.3) : 1}
                      name="Chats"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="summarize"
                      stroke="#FB8C00"
                      strokeWidth={2}
                      fill="#FB8C00"
                      fillOpacity={selectedArea ? (selectedArea === 'summarize' ? 0.8 : 0.15) : 0.4}
                      strokeOpacity={selectedArea ? (selectedArea === 'summarize' ? 1 : 0.3) : 1}
                      name="Summarize"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="extract"
                      stroke="#FDD835"
                      strokeWidth={2}
                      fill="#FDD835"
                      fillOpacity={selectedArea ? (selectedArea === 'extract' ? 0.8 : 0.15) : 0.4}
                      strokeOpacity={selectedArea ? (selectedArea === 'extract' ? 1 : 0.3) : 1}
                      name="Extract"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="links"
                      stroke="#43A047"
                      strokeWidth={2}
                      fill="#43A047"
                      fillOpacity={selectedArea ? (selectedArea === 'links' ? 0.8 : 0.15) : 0.4}
                      strokeOpacity={selectedArea ? (selectedArea === 'links' ? 1 : 0.3) : 1}
                      name="Links"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="rewrite"
                      stroke="#1E88E5"
                      strokeWidth={2}
                      fill="#1E88E5"
                      fillOpacity={selectedArea ? (selectedArea === 'rewrite' ? 0.8 : 0.15) : 0.4}
                      strokeOpacity={selectedArea ? (selectedArea === 'rewrite' ? 1 : 0.3) : 1}
                      name="Rewrite"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="files"
                      stroke="#8E24AA"
                      strokeWidth={2}
                      fill="#8E24AA"
                      fillOpacity={selectedArea ? (selectedArea === 'files' ? 0.8 : 0.15) : 0.4}
                      strokeOpacity={selectedArea ? (selectedArea === 'files' ? 1 : 0.3) : 1}
                      name="Files"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
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
              width: { xs: '95%', sm: '100%' },
              mx: { xs: 'auto', sm: 0 },
              '@media (max-width: 480px)': {
                width: '98%',
                mx: 'auto',
              },
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
          <Box
            sx={{
              ...cardStyle,
              p: { xs: 0.75, sm: 1, md: 3 },
              mb: { xs: 2, sm: 3, md: 4 },
              overflow: 'hidden',
              width: { xs: '95%', sm: '100%' },
              mx: { xs: 'auto', sm: 0 },
              '@media (min-width: 960px)': {
                width: '100%',
                maxWidth: '100%',
              },
              '@media (max-width: 480px)': {
                width: '98%',
                mx: 'auto',
              },
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
              Quick Actions
            </Typography>
            <List>
              <ListItem button onClick={() => handleQuickActionClick(0)}>
                <ListItemIcon>
                  <ChatOutlinedIcon
                    sx={{ color: theme => (theme.palette.mode === 'dark' ? '#ff6b6b' : 'red') }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Start New Chat"
                  sx={{
                    '& .MuiTypography-root': {
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'inherit'),
                    },
                  }}
                />
              </ListItem>
              <ListItem button onClick={() => handleQuickActionClick(1)}>
                <ListItemIcon>
                  <UploadOutlinedIcon
                    sx={{ color: theme => (theme.palette.mode === 'dark' ? '#8884d8' : '#8884d8') }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Upload New Document"
                  sx={{
                    '& .MuiTypography-root': {
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'inherit'),
                    },
                  }}
                />
              </ListItem>
              <ListItem button onClick={() => handleQuickActionClick(2)}>
                <ListItemIcon>
                  <LinkOutlinedIcon
                    sx={{ color: theme => (theme.palette.mode === 'dark' ? '#82ca9d' : '#82ca9d') }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Add External Link"
                  sx={{
                    '& .MuiTypography-root': {
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'inherit'),
                    },
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {/* File Actions */}
          {files.length > 0 && (
            <Box
              sx={{
                ...cardStyle,
                p: { xs: 0.75, sm: 1, md: 3 },
                mb: { xs: 2, sm: 3, md: 4 },
                overflow: 'hidden',
                width: { xs: '95%', sm: '100%' },
                mx: { xs: 'auto', sm: 0 },
                '@media (min-width: 960px)': {
                  width: '100%',
                  maxWidth: '100%',
                },
                '@media (max-width: 480px)': {
                  width: '98%',
                  mx: 'auto',
                },
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
              width: { xs: '95%', sm: '100%' },
              mx: { xs: 'auto', sm: 0 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: { xs: '380px', sm: '320px', md: '280px' },
              '@media (min-width: 960px)': {
                width: '100%',
                maxWidth: '100%',
              },
              '@media (max-width: 480px)': {
                width: '98%',
                mx: 'auto',
                minHeight: '380px',
              },
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
              Assignment Tokens
              {subscriptionLoading && <CircularProgress size={16} sx={{ ml: 1, color: 'red' }} />}
            </Typography>
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
                    '@media (min-width: 1920px)': {
                      width: 'min(25vw, 400px)',
                    },
                    '@media (min-width: 2560px)': {
                      width: 'min(20vw, 450px)',
                    },
                  },
                  height: {
                    xs: 'min(80vw, 200px)',
                    sm: 'min(70vw, 250px)',
                    md: 'min(60vw, 300px)',
                    lg: 'min(45vw, 320px)',
                    xl: 'min(30vw, 350px)',
                    '@media (min-width: 1920px)': {
                      height: 'min(25vw, 400px)',
                    },
                    '@media (min-width: 2560px)': {
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
                    '@media (min-width: 1920px)': 400,
                    '@media (min-width: 2560px)': 450,
                  },
                  maxHeight: {
                    xs: 200,
                    sm: 250,
                    md: 300,
                    lg: 320,
                    xl: 350,
                    '@media (min-width: 1920px)': 400,
                    '@media (min-width: 2560px)': 450,
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
        onClose={() => setShowFileUploadModal(false)}
        files={files as WorkshopFile[]}
        onFileProcessed={handleFileProcessed}
        onFileDeleted={handleFileDeleted}
        onAiFill={handleAiFill}
        onDownloadFilled={handleDownloadFilled}
        onPreviewFile={handlePreviewFile}
      />
    </Box>
  );
};

export default Workshop;
