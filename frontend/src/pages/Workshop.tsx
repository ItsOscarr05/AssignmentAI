import {
  Add as AddIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  Chat as ChatIcon,
  ChatOutlined as ChatOutlinedIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutlined,
  DownloadOutlined as DownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  History as HistoryIcon,
  HistoryOutlined as HistoryOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  LinkOutlined as LinkOutlinedIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  RecordVoiceOverOutlined,
  Refresh as RefreshIcon,
  Send as SendIcon,
  UploadOutlined as UploadOutlinedIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { animate, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
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
import { FeatureAccessErrorComponent } from '../components/workshop/FeatureAccessError';
import WorkshopFileUpload from '../components/workshop/WorkshopFileUpload';
import WorkshopLiveModal from '../components/workshop/WorkshopLiveModal';
import { useAuth } from '../contexts/AuthContext';
import { recentAssignmentsWithSubject } from '../data/mockData';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { api } from '../services/api';
import { useWorkshopStore } from '../services/WorkshopService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

interface HistoryItem {
  id: string;
  title: string;
  date: Date;
  type: 'file' | 'link' | 'chat';
  isPinned: boolean;
}

interface ActivityData {
  date: string;
  chats: number;
  files: number;
  links: number;
  summarize: number;
  extract: number;
  rewrite: number;
}

const generateWeeklyActivityData = (): ActivityData[] => {
  const today = new Date();
  const weekData = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];

    const files = recentAssignmentsWithSubject.filter(
      a => a.createdAt.split('T')[0] === dayStr
    ).length;

    // Simulate other activities for a more dynamic chart
    weekData.push({
      date: dayName,
      chats: Math.floor(Math.random() * 5) + files,
      files: files,
      links: Math.floor(Math.random() * 3),
      summarize: Math.floor(Math.random() * 4),
      extract: Math.floor(Math.random() * 3),
      rewrite: Math.floor(Math.random() * 2),
    });
  }
  return weekData;
};

const initialActivityData = generateWeeklyActivityData();

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
  const theme = useTheme();
  const location = useLocation();
  const { isMockUser } = useAuth();
  const { breakpoint } = useAspectRatio();
  const {
    generateContent,
    history: workshopHistory,
    isLoading,
    error,
    featureAccessError,
    files,
    addLink,
    processFile,
    clearWorkshop,
    clearFeatureAccessError,
  } = useWorkshopStore();
  const [input, setInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [responseTab, setResponseTab] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activityData] = useState<ActivityData[]>(isMockUser ? initialActivityData : []);
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
  const [realTokenUsage, setRealTokenUsage] = useState({
    total: 30000,
    used: 0,
    remaining: 30000,
    percentUsed: 0,
  });

  const { totalTokens, usedTokens, remainingTokens, percentUsed } = useTokenUsage();

  // Fetch real token usage for test/real users
  useEffect(() => {
    if (!isMockUser) {
      api.get('/assignments').then(res => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.assignments)
          ? res.data.assignments
          : [];
        const used = data.reduce((sum: number, a: any) => sum + (a.tokensUsed || 0), 0);
        const total = totalTokens || 30000;
        setRealTokenUsage({
          total,
          used,
          remaining: total - used,
          percentUsed: total > 0 ? Math.round((used / total) * 100) : 0,
        });
      });
    }
  }, [isMockUser, totalTokens]);

  const uploadContentRef = useRef<HTMLDivElement>(null);
  const aiResponseRef = useRef<HTMLDivElement>(null);
  const rewriteTabRef = useRef<HTMLDivElement>(null);
  // Modal state for live AI response
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  // Use real or mock token usage for the circular progress bar
  const tokenUsage = isMockUser
    ? {
        label: 'Free Plan (30,000 tokens/month)',
        total: totalTokens,
        used: usedTokens,
        remaining: remainingTokens,
        percentUsed,
      }
    : {
        label: 'Free Plan (30,000 tokens/month)',
        total: realTokenUsage.total,
        used: realTokenUsage.used,
        remaining: realTokenUsage.remaining,
        percentUsed: realTokenUsage.percentUsed,
      };

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
    const animation = animate(0, tokenUsage.percentUsed, {
      duration: 1.2,
      ease: 'circOut',
      onUpdate: latest => {
        setAnimatedPercent(latest);
      },
    });
    return () => animation.stop();
  }, [tokenUsage.percentUsed]);

  useEffect(() => {
    // Use the 5 most recent assignments from mock data for history
    if (isMockUser) {
      const sorted = [...recentAssignmentsWithSubject].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const historyItems: HistoryItem[] = sorted.slice(0, 5).map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        date: new Date(assignment.createdAt),
        type: 'file',
        isPinned: false,
      }));
      setHistory(historyItems);
    } else {
      setHistory([]);
    }
  }, [isMockUser]);

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
    backgroundColor: '#fff',
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
      await generateContent(input);
      setInput('');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
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

  const handleSuggestionClick = (text: string, tabIndex: number) => {
    setInput(text);
    setActiveTab(0);
    setResponseTab(tabIndex);
    if (aiResponseRef.current) {
      aiResponseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

  const handleCopy = () => {
    if (workshopHistory.length > 0) {
      const lastResponse = workshopHistory[workshopHistory.length - 1].content;
      navigator.clipboard.writeText(lastResponse);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (workshopHistory.length > 0) {
      const lastPrompt = workshopHistory[workshopHistory.length - 1].prompt;
      generateContent(lastPrompt);
    }
  };

  const handleClearChat = () => {
    clearWorkshop();
  };

  // Add a download handler
  const handleDownloadAIContent = () => {
    if (workshopHistory.length > 0) {
      const last = workshopHistory[workshopHistory.length - 1];
      const blob = new Blob([last.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai_response.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const renderInputSection = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your message here..."
              variant="outlined"
              value={input}
              onChange={e => setInput(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
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
        return <WorkshopFileUpload />;
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
      <Paper sx={{ p: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
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
      </Paper>
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
  const progressColor = getProgressColor(tokenUsage.percentUsed);

  return (
    <Box
      sx={{
        p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
        backgroundColor: 'white',
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
          '& .MuiPaper-root': {
            width: '99% !important',
            mx: 'auto !important',
          },
        },
      }}
    >
      {/* Header */}
      <Card
        sx={{
          ...cardStyle,
          mb: { xs: 3, sm: 4, md: 6 },
          width: { xs: '95%', sm: '100%' },
          mx: { xs: 'auto', sm: 0 },
          '@media (max-width: 480px)': {
            width: '98%',
            mx: 'auto',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1, sm: 1, md: 2 } }}>
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
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' },
                fontWeight: { xs: 600, md: 400 },
              }}
            >
              AI Workshop
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
        </CardContent>
      </Card>

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
          md={breakpoint === 'standard' ? 12 : 9}
          sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          {/* Activity Chart */}
          <Paper
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
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  mb: { xs: 0.5, sm: 1 },
                }}
              >
                Weekly Activity Overview
              </Typography>
              <Tooltip title="View your AI activity over time" arrow>
                <InfoOutlinedIcon
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
                <BarChartOutlinedIcon sx={{ fontSize: 64, color: 'red', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No activity yet
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
          </Paper>

          {/* Upload Content and Input Section */}
          <Paper
            ref={uploadContentRef}
            id="upload-content-card"
            sx={{
              p: { xs: 0.75, sm: 1, md: 3 },
              mb: { xs: 2, sm: 3, md: 4 },
              border: '2px solid #D32F2F',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  mb: { xs: 0.5, sm: 0 },
                  textAlign: { xs: 'left', sm: 'left' },
                }}
              >
                Upload Content
              </Typography>
              <Tabs
                value={activeTab}
                onChange={(_e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor:
                      activeTab === 0 ? 'red' : activeTab === 1 ? '#8884d8' : '#82ca9d',
                  },
                }}
              >
                <Tab
                  label="Chat"
                  icon={<ChatOutlinedIcon sx={{ color: 'red' }} />}
                  iconPosition="start"
                  sx={{
                    color: 'red',
                    '&.Mui-selected': {
                      color: 'red',
                    },
                    '& .MuiTab-label': {
                      display: { xs: 'none', sm: 'block' },
                    },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none',
                      },
                    },
                  }}
                />
                <Tab
                  label="Files"
                  icon={<UploadOutlinedIcon sx={{ color: '#8884d8' }} />}
                  iconPosition="start"
                  sx={{
                    color: '#8884d8',
                    '&.Mui-selected': {
                      color: '#8884d8',
                    },
                    '& .MuiTab-label': {
                      display: { xs: 'none', sm: 'block' },
                    },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none',
                      },
                    },
                  }}
                />
                <Tab
                  label="Links"
                  icon={<LinkOutlinedIcon sx={{ color: '#82ca9d' }} />}
                  iconPosition="start"
                  sx={{
                    color: '#82ca9d',
                    '&.Mui-selected': {
                      color: '#82ca9d',
                    },
                    '& .MuiTab-label': {
                      display: { xs: 'none', sm: 'block' },
                    },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none',
                      },
                    },
                  }}
                />
              </Tabs>
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
          </Paper>

          {/* AI Response Area */}
          <Paper
            ref={aiResponseRef}
            sx={{
              ...cardStyle,
              p: { xs: 0.75, sm: 1, md: 3 },
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
                flexDirection: 'column',
                gap: { xs: 0.75, sm: 1 },
                borderBottom: '1px solid #e0e0e0',
                pb: { xs: 0.75, sm: 1 },
              }}
            >
              {/* Top row: Title and Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                  }}
                >
                  AI Response
                </Typography>
                <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
                  <Tooltip title="Clear Chat">
                    <IconButton
                      size="small"
                      sx={{
                        color: 'red',
                        width: { xs: 28, sm: 32, md: 36 },
                        height: { xs: 28, sm: 32, md: 36 },
                        '& .MuiSvgIcon-root': {
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                        },
                      }}
                      onClick={handleClearChat}
                    >
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small"
                      sx={{
                        color: 'red',
                        width: { xs: 28, sm: 32, md: 36 },
                        height: { xs: 28, sm: 32, md: 36 },
                        '& .MuiSvgIcon-root': {
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                        },
                      }}
                      onClick={handleCopy}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Regenerate">
                    <IconButton
                      size="small"
                      sx={{
                        color: 'red',
                        width: { xs: 28, sm: 32, md: 36 },
                        height: { xs: 28, sm: 32, md: 36 },
                        '& .MuiSvgIcon-root': {
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                        },
                      }}
                      onClick={handleRegenerate}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Bottom row: Tabs */}
              <Tabs
                value={responseTab}
                onChange={(_e, newValue) => setResponseTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor:
                      responseTab === 0
                        ? '#9c27b0'
                        : responseTab === 1
                        ? '#2196f3'
                        : responseTab === 2
                        ? '#ffc107'
                        : '#ff9800',
                  },
                }}
              >
                <Tab
                  label="Download"
                  icon={
                    <DownloadOutlinedIcon
                      sx={{ color: '#9c27b0', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    />
                  }
                  iconPosition="start"
                  sx={{
                    color: '#9c27b0',
                    '&.Mui-selected': {
                      color: '#9c27b0',
                    },
                    minWidth: { xs: 50, sm: 100 },
                    flex: { xs: 1, sm: 'none' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none !important',
                      },
                    },
                  }}
                />
                <Tab
                  label="Rewrite"
                  icon={
                    <EditOutlinedIcon
                      sx={{ color: '#2196f3', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    />
                  }
                  iconPosition="start"
                  sx={{
                    color: '#2196f3',
                    '&.Mui-selected': {
                      color: '#2196f3',
                    },
                    minWidth: { xs: 50, sm: 100 },
                    flex: { xs: 1, sm: 'none' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none !important',
                      },
                    },
                  }}
                  ref={rewriteTabRef}
                />
                <Tab
                  label="Extract"
                  icon={
                    <FormatListBulletedIcon
                      sx={{ color: '#ffc107', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    />
                  }
                  iconPosition="start"
                  sx={{
                    color: '#ffc107',
                    '&.Mui-selected': {
                      color: '#ffc107',
                    },
                    minWidth: { xs: 50, sm: 100 },
                    flex: { xs: 1, sm: 'none' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none !important',
                      },
                    },
                  }}
                />
                <Tab
                  label="Summarize"
                  icon={
                    <RecordVoiceOverOutlined
                      sx={{ color: '#ff9800', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    />
                  }
                  iconPosition="start"
                  sx={{
                    color: '#ff9800',
                    '&.Mui-selected': {
                      color: '#ff9800',
                    },
                    minWidth: { xs: 50, sm: 100 },
                    flex: { xs: 1, sm: 'none' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '& .MuiTab-label': {
                      display: { xs: 'none', sm: 'block' },
                    },
                    '@media (max-width: 480px)': {
                      '& .MuiTab-label': {
                        display: 'none',
                      },
                    },
                  }}
                />
              </Tabs>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ minHeight: '200px', width: '100%', px: { xs: 0, sm: 2 } }}>
              {workshopHistory.length > 0 ? (
                workshopHistory.map(item => (
                  <React.Fragment key={item.id}>
                    {/* User Prompt */}
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        borderRadius: '8px',
                        border: '1px solid red',
                      }}
                    >
                      <Typography variant="body1">{item.prompt}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Paper>

                    {/* AI Content */}
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: 'rgba(76, 175, 80, 0.04)',
                        borderRadius: '8px',
                        border: '1px solid #4caf50',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                          {item.content}
                        </Typography>
                        {item.serviceUsed && (
                          <Chip
                            label={item.serviceUsed.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              ml: 1,
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              color: '#4caf50',
                              fontWeight: 500,
                            }}
                          />
                        )}
                      </Box>
                      {item.fileCategory && (
                        <Chip
                          label={`File: ${item.fileCategory}`}
                          size="small"
                          sx={{
                            mr: 1,
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            color: '#2196f3',
                            fontWeight: 500,
                          }}
                        />
                      )}
                      {item.hasDiagram && (
                        <Chip
                          label="Diagram Generated"
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            color: '#ff9800',
                            fontWeight: 500,
                          }}
                        />
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Paper>
                  </React.Fragment>
                ))
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    color: 'text.secondary',
                    textAlign: 'center',
                    p: 3,
                  }}
                >
                  <ChatIcon sx={{ fontSize: 48, color: 'red', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No responses yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a conversation to see AI responses here
                  </Typography>
                </Box>
              )}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress sx={{ color: 'red' }} />
                </Box>
              )}
            </Box>
            {responseTab === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadOutlinedIcon />}
                  color="primary"
                  onClick={handleDownloadAIContent}
                  disabled={workshopHistory.length === 0}
                >
                  Download AI Response
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid
          item
          xs={12}
          md={breakpoint === 'standard' ? 12 : 3}
          sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          <Paper
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
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
            >
              Quick Actions
            </Typography>
            <List>
              <ListItem button onClick={() => handleQuickActionClick(0)}>
                <ListItemIcon>
                  <ChatOutlinedIcon sx={{ color: 'red' }} />
                </ListItemIcon>
                <ListItemText primary="Start New Chat" />
              </ListItem>
              <ListItem button onClick={() => handleQuickActionClick(1)}>
                <ListItemIcon>
                  <UploadOutlinedIcon sx={{ color: '#8884d8' }} />
                </ListItemIcon>
                <ListItemText primary="Upload New Document" />
              </ListItem>
              <ListItem button onClick={() => handleQuickActionClick(2)}>
                <ListItemIcon>
                  <LinkOutlinedIcon sx={{ color: '#82ca9d' }} />
                </ListItemIcon>
                <ListItemText primary="Add External Link" />
              </ListItem>
            </List>
          </Paper>

          {/* AI Suggestions */}
          <Paper
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
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
            >
              AI Suggestions
            </Typography>
            <List>
              <ListItem button onClick={() => handleSuggestionClick('Summarize this content', 3)}>
                <ListItemIcon>
                  <RecordVoiceOverOutlined sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Summarize"
                  secondary="Get a concise summary of the content"
                />
              </ListItem>
              <ListItem button onClick={() => handleSuggestionClick('Extract key points', 2)}>
                <ListItemIcon>
                  <FormatListBulletedIcon sx={{ color: '#ffc107' }} />
                </ListItemIcon>
                <ListItemText primary="Extract" secondary="Extract the main points and insights" />
              </ListItem>
              <ListItem button onClick={() => handleSuggestionClick('Rewrite this content', 1)}>
                <ListItemIcon>
                  <EditOutlinedIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText primary="Rewrite" secondary="Rewrite content in a different style" />
              </ListItem>
            </List>
          </Paper>

          {/* File Actions */}
          {files.length > 0 && (
            <Paper
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
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
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
            </Paper>
          )}

          {/* Assignment Tokens */}
          <Paper
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
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
            >
              Assignment Tokens
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
                  width:
                    breakpoint === 'tall'
                      ? 200
                      : breakpoint === 'square'
                      ? 300
                      : breakpoint === 'standard'
                      ? 350
                      : 450,
                  height:
                    breakpoint === 'tall'
                      ? 200
                      : breakpoint === 'square'
                      ? 300
                      : breakpoint === 'standard'
                      ? 350
                      : 450,
                  cursor: 'pointer',
                  margin: '0 auto',
                }}
                onMouseEnter={() => setIsTokenChartHovered(true)}
                onMouseLeave={() => setIsTokenChartHovered(false)}
              >
                {/* Background Track */}
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={
                    breakpoint === 'tall'
                      ? 200
                      : breakpoint === 'square'
                      ? 300
                      : breakpoint === 'standard'
                      ? 350
                      : 450
                  }
                  thickness={6}
                  sx={{
                    color: alpha(progressColor, 0.2),
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    transform: 'translate(-10%, -10%)',
                  }}
                />
                {/* Actual progress */}
                <CircularProgress
                  variant="determinate"
                  value={animatedPercent}
                  size={
                    breakpoint === 'tall'
                      ? 200
                      : breakpoint === 'square'
                      ? 300
                      : breakpoint === 'standard'
                      ? 350
                      : 450
                  }
                  thickness={6}
                  sx={{
                    color: progressColor,
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    transform: 'translate(-50%, -50%)',
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
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* History Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: 'white',
          },
        }}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Recent History</Typography>
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
              <HistoryOutlinedIcon sx={{ fontSize: 54, color: 'red', mb: 2, opacity: 0.5 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No history yet
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
                        onClick={() => handlePinHistory(item.id)}
                        sx={{ border: '1px solid red', borderRadius: '8px', mb: 1 }}
                      >
                        <ListItemIcon>
                          {React.cloneElement(getHistoryIcon(item.type), { sx: { color: 'red' } })}
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
                            handlePinHistory(item.id);
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
      </Drawer>

      {/* Snackbar for notifications */}
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
    </Box>
  );
};

export default Workshop;
