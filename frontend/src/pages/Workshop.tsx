import {
  Add as AddIcon,
  Chat as ChatIcon,
  ChatOutlined as ChatOutlinedIcon,
  ContentCopy as ContentCopyIcon,
  DeleteOutlined,
  DownloadOutlined as DownloadOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  History as HistoryIcon,
  InfoOutlined as InfoOutlinedIcon,
  LinkOutlined as LinkOutlinedIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  RecordVoiceOverOutlined,
  Refresh as RefreshIcon,
  Send as SendIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUp as ThumbUpIcon,
  UploadOutlined as UploadOutlinedIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
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
import WorkshopFileUpload from '../components/workshop/WorkshopFileUpload';
import WorkshopLiveModal from '../components/workshop/WorkshopLiveModal';
import { useAuth } from '../contexts/AuthContext';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { api } from '../services/api';
import { useWorkshopStore } from '../services/WorkshopService';
import { recentAssignments } from './DashboardHome';

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

    const files = recentAssignments.filter(a => a.createdAt.split('T')[0] === dayStr).length;

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
  const {
    generateContent,
    history: workshopHistory,
    isLoading,
    error,
    files,
    addLink,
    processFile,
    clearWorkshop,
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
  const [liveModalContent, setLiveModalContent] = useState('');
  const [liveModalTitle, setLiveModalTitle] = useState('');
  const [liveModalAI, setLiveModalAI] = useState('');
  const [liveModalLoading, setLiveModalLoading] = useState(false);

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
      const sorted = [...recentAssignments].sort(
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

  // File complete notification when liveModalLoading finishes
  useEffect(() => {
    if (!liveModalLoading && liveModalOpen && liveModalAI.length > 0) {
      setSnackbar({
        open: true,
        message: 'File processing complete!',
        severity: 'success',
      });
    }
  }, [liveModalLoading, liveModalOpen, liveModalAI]);

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
      const processedLink = await addLink({ url: linkInput, title: linkInput });
      setLinkInput('');
      setSnackbar({
        open: true,
        message: 'Link processed successfully!',
        severity: 'success',
      });
      if (processedLink) {
        handleLinkUploadComplete(processedLink);
      }
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

  // Helper to simulate live AI response (for demo, chunk by chunk)
  const simulateLiveAI = (fullText: string) => {
    setLiveModalAI('');
    setLiveModalLoading(true);
    let i = 0;
    const chunkSize = 30;
    function nextChunk() {
      if (i < fullText.length) {
        setLiveModalAI(prev => prev + fullText.slice(i, i + chunkSize));
        i += chunkSize;
        setTimeout(nextChunk, 40);
      } else {
        setLiveModalLoading(false);
      }
    }
    nextChunk();
  };

  // Handler for link upload completion (simulate similar to file)
  const handleLinkUploadComplete = (link: any) => {
    setLiveModalTitle(link.title || 'Processed Link');
    setLiveModalContent(link.content || '');
    setLiveModalOpen(true);
    simulateLiveAI(link.analysis || '');
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
                placeholder="Paste your link here..."
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
    <Box sx={{ p: 3, backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <Card sx={{ ...cardStyle, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
              AI Workshop
            </Typography>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setIsDrawerOpen(true)}
              sx={{ borderColor: 'red', color: 'red', '&:hover': { borderColor: 'red' } }}
            >
              History
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Activity Chart */}
          <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Weekly Activity Overview
              </Typography>
              <Tooltip title="Activity based on your assignments and interactions" arrow>
                <InfoOutlinedIcon
                  sx={{
                    color: 'gray',
                    fontSize: 20,
                    cursor: 'pointer',
                    position: 'relative',
                    top: '-5px',
                  }}
                />
              </Tooltip>
            </Box>
            <Box sx={{ height: 350 }}>
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
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={renderLegendText}
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
          </Paper>

          {/* Upload Content and Input Section */}
          <Paper
            ref={uploadContentRef}
            id="upload-content-card"
            sx={{
              p: 3,
              mb: 3,
              border: '2px solid #D32F2F',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid #e0e0e0',
                pb: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
                  }}
                />
              </Tabs>
            </Box>
            <Box sx={{ p: 2 }}>
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
          <Paper ref={aiResponseRef} sx={{ ...cardStyle, p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                mb: 2,
                width: '100%',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: { xs: '100%', sm: 'auto' },
                  overflowX: { xs: 'auto', sm: 'visible' },
                  flexWrap: { xs: 'nowrap', sm: 'wrap' },
                  pb: { xs: 1, sm: 0 },
                }}
              >
                <Typography variant="h6" sx={{ whiteSpace: 'nowrap', mr: 2 }}>
                  AI Response
                </Typography>
                <Tabs
                  value={responseTab}
                  onChange={(_e, newValue) => setResponseTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 40,
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
                    icon={<DownloadOutlinedIcon sx={{ color: '#9c27b0' }} />}
                    iconPosition="start"
                    sx={{
                      color: '#9c27b0',
                      '&.Mui-selected': {
                        color: '#9c27b0',
                      },
                      minWidth: 120,
                    }}
                  />
                  <Tab
                    label="Rewrite"
                    icon={<EditOutlinedIcon sx={{ color: '#2196f3' }} />}
                    iconPosition="start"
                    sx={{
                      color: '#2196f3',
                      '&.Mui-selected': {
                        color: '#2196f3',
                      },
                      minWidth: 120,
                    }}
                    ref={rewriteTabRef}
                  />
                  <Tab
                    label="Extract"
                    icon={<FormatListBulletedIcon sx={{ color: '#ffc107' }} />}
                    iconPosition="start"
                    sx={{
                      color: '#ffc107',
                      '&.Mui-selected': {
                        color: '#ffc107',
                      },
                      minWidth: 120,
                    }}
                  />
                  <Tab
                    label="Summarize"
                    icon={<RecordVoiceOverOutlined sx={{ color: '#ff9800' }} />}
                    iconPosition="start"
                    sx={{
                      color: '#ff9800',
                      '&.Mui-selected': {
                        color: '#ff9800',
                      },
                      minWidth: 120,
                    }}
                  />
                </Tabs>
              </Box>
              <Box sx={{ flexShrink: 0, mt: { xs: 1, sm: 0 } }}>
                <Tooltip title="Clear Chat">
                  <IconButton size="small" sx={{ color: 'red' }} onClick={handleClearChat}>
                    <DeleteOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
                  <IconButton size="small" sx={{ color: 'red' }} onClick={handleCopy}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate">
                  <IconButton size="small" sx={{ color: 'red' }} onClick={handleRegenerate}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
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
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid red',
                      }}
                    >
                      <Typography variant="body1">{item.content}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </Typography>
                        <Box>
                          <IconButton size="small">
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <ThumbDownIcon fontSize="small" />
                          </IconButton>
                        </Box>
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
                    No Responses Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a conversation by typing a message or uploading a document
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
        <Grid item xs={12} md={3}>
          <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
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
          <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" gutterBottom>
                Try These
              </Typography>
              <Tooltip
                title="To use it, click a button and press send message in the upload content card"
                arrow
              >
                <InfoOutlinedIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: 18,
                    cursor: 'pointer',
                    position: 'relative',
                    top: '-4px',
                  }}
                />
              </Tooltip>
            </Box>
            <List>
              <ListItem button onClick={() => handleSuggestionClick('Summarize this document.', 3)}>
                <ListItemIcon>
                  <RecordVoiceOverOutlined sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText primary="Summarize this document." />
              </ListItem>
              <ListItem
                button
                onClick={() => handleSuggestionClick('Extract key points from this essay.', 2)}
              >
                <ListItemIcon>
                  <FormatListBulletedIcon sx={{ color: '#ffc107' }} />
                </ListItemIcon>
                <ListItemText primary="Extract key points from this essay." />
              </ListItem>
              <ListItem
                button
                onClick={() => handleSuggestionClick('Rewrite in more academic tone.', 1)}
              >
                <ListItemIcon>
                  <EditOutlinedIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText primary="Rewrite in more academic tone." />
              </ListItem>
            </List>
          </Paper>

          {/* File Actions */}
          {files.length > 0 && (
            <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
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
          <Paper sx={{ ...cardStyle, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assignment Tokens
            </Typography>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2 }}
            >
              <Box
                sx={{ position: 'relative', width: 160, height: 160, cursor: 'pointer' }}
                onMouseEnter={() => setIsTokenChartHovered(true)}
                onMouseLeave={() => setIsTokenChartHovered(false)}
              >
                {/* Background Track */}
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={160}
                  thickness={5}
                  sx={{
                    color: alpha(progressColor, 0.2),
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
                {/* Actual progress */}
                <CircularProgress
                  variant="determinate"
                  value={animatedPercent}
                  size={160}
                  thickness={5}
                  sx={{
                    color: progressColor,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    [`& .MuiCircularProgress-circle`]: {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                >
                  {isTokenChartHovered ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" component="div" color={progressColor}>
                        {tokenUsage.used.toLocaleString()}
                      </Typography>
                      <Divider sx={{ my: 0.5, width: '50%', mx: 'auto' }} />
                      <Typography variant="body2" color="text.secondary">
                        {tokenUsage.total.toLocaleString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="h4" component="div" color="text.secondary">
                      {Math.round(animatedPercent)}%
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
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
            <Tooltip title="Pin items to keep them at the top of the list" arrow>
              <InfoOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            </Tooltip>
          </Box>
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
                        {item.isPinned ? <PushPinIcon color="primary" /> : <PushPinOutlinedIcon />}
                      </IconButton>
                    </ListItem>
                  </motion.div>
                ))}
            </List>
          </motion.div>
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
        content={liveModalContent}
        aiResponse={liveModalAI}
        isLoading={liveModalLoading}
        title={liveModalTitle}
      />
    </Box>
  );
};

export default Workshop;
