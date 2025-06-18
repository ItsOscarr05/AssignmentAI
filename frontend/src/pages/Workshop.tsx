import {
  Add as AddIcon,
  Chat as ChatIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FormatListBulleted as FormatListBulletedIcon,
  History as HistoryIcon,
  InfoOutlined as InfoOutlinedIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  StarBorder as StarBorderIcon,
  Star as StarIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUp as ThumbUpIcon,
  Title as TitleIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { useWorkshopStore } from '../services/WorkshopService';
import { recentAssignments } from './DashboardHome';

interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  preview?: string;
}

interface LinkSubmission {
  id: string;
  url: string;
  title: string;
  description: string;
}

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

const Workshop: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  useWorkshopStore();
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [linkSubmissions, setLinkSubmissions] = useState<LinkSubmission[]>([]);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean; timestamp: Date }>
  >([]);
  const [activeTab, setActiveTab] = useState(0);
  const [responseTab, setResponseTab] = useState(3);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const { totalTokens, usedTokens, remainingTokens, percentUsed } = useTokenUsage();
  const tokenUsage = {
    label: 'Free Plan (30,000 tokens/month)',
    total: totalTokens,
    used: usedTokens,
    remaining: remainingTokens,
    percentUsed,
  };

  useEffect(() => {
    // Use the 5 most recent assignments from mock data for history
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
    setLoading(false);
  }, []);

  useEffect(() => {
    // Use local mock data for activity
    setActivityData([
      { date: 'Mon', chats: 4, files: 2, links: 1, summarize: 3, extract: 2, rewrite: 1 },
      { date: 'Tue', chats: 3, files: 1, links: 2, summarize: 2, extract: 1, rewrite: 2 },
      { date: 'Wed', chats: 5, files: 3, links: 0, summarize: 4, extract: 2, rewrite: 1 },
      { date: 'Thu', chats: 2, files: 2, links: 1, summarize: 1, extract: 2, rewrite: 1 },
      { date: 'Fri', chats: 6, files: 1, links: 3, summarize: 5, extract: 1, rewrite: 2 },
      { date: 'Sat', chats: 4, files: 0, links: 2, summarize: 3, extract: 0, rewrite: 1 },
      { date: 'Sun', chats: 3, files: 2, links: 1, summarize: 2, extract: 1, rewrite: 1 },
    ]);
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true, timestamp: new Date() }]);
      setInput('');
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
        return <AddIcon />;
      case 'link':
        return <LinkIcon />;
      case 'chat':
        return <ChatIcon />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileUpload[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
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
                startIcon={<DeleteIcon />}
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
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                p: 3,
                border: '2px dashed #8884d8',
                borderRadius: 2,
                textAlign: 'center',
                backgroundColor: 'rgba(136, 132, 216, 0.02)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(136, 132, 216, 0.04)',
                },
              }}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
                >
                  <UploadIcon sx={{ fontSize: 48, color: '#8884d8', opacity: 0.7 }} />
                  <Typography variant="h6" color="text.secondary">
                    Drag and drop your file here
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to browse files
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Supported formats: PDF, DOCX, TXT, RTF
                  </Typography>
                </Box>
              </label>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
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
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Paste your link here..."
              variant="outlined"
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
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
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
      default:
        return null;
    }
  };

  // Custom tooltip for the activity graph
  const CustomActivityTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    const allKeys = [
      { key: 'chats', label: 'Chats', color: 'red' },
      { key: 'summarize', label: 'Summarize', color: '#ff9800' },
      { key: 'extract', label: 'Extract', color: '#ffc107' },
      { key: 'links', label: 'Links', color: '#82ca9d' },
      { key: 'rewrite', label: 'Rewrite', color: '#2196f3' },
      { key: 'files', label: 'Files', color: '#8884d8' },
    ];
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Box>
          {allKeys.map(({ key, label, color }) => {
            if (selectedLine && selectedLine !== key) return null;
            return (
              <Typography key={key} variant="body2" sx={{ color }}>
                {label}: {point[key]}
              </Typography>
            );
          })}
        </Box>
      </Paper>
    );
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Weekly Activity
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
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip content={CustomActivityTooltip} />
                  <Legend
                    onClick={e => {
                      if (!e || !e.dataKey) return;
                      const key = String(e.dataKey);
                      setSelectedLine(prev => (prev === key ? null : key));
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="chats"
                    stroke="red"
                    activeDot={{ r: 8 }}
                    name="Chats"
                    strokeOpacity={selectedLine && selectedLine !== 'chats' ? 0.2 : 1}
                    strokeWidth={selectedLine === 'chats' ? 3 : 1}
                  />
                  <Line
                    type="monotone"
                    dataKey="summarize"
                    stroke="#ff9800"
                    activeDot={{ r: 8 }}
                    name="Summarize"
                    strokeOpacity={selectedLine && selectedLine !== 'summarize' ? 0.2 : 1}
                    strokeWidth={selectedLine === 'summarize' ? 3 : 1}
                  />
                  <Line
                    type="monotone"
                    dataKey="extract"
                    stroke="#ffc107"
                    name="Extract"
                    strokeOpacity={selectedLine && selectedLine !== 'extract' ? 0.2 : 1}
                    strokeWidth={selectedLine === 'extract' ? 3 : 1}
                  />
                  <Line
                    type="monotone"
                    dataKey="links"
                    stroke="#82ca9d"
                    name="Links"
                    strokeOpacity={selectedLine && selectedLine !== 'links' ? 0.2 : 1}
                    strokeWidth={selectedLine === 'links' ? 3 : 1}
                  />
                  <Line
                    type="monotone"
                    dataKey="rewrite"
                    stroke="#2196f3"
                    name="Rewrite"
                    strokeOpacity={selectedLine && selectedLine !== 'rewrite' ? 0.2 : 1}
                    strokeWidth={selectedLine === 'rewrite' ? 3 : 1}
                  />
                  <Line
                    type="monotone"
                    dataKey="files"
                    stroke="#8884d8"
                    name="Files"
                    strokeOpacity={selectedLine && selectedLine !== 'files' ? 0.2 : 1}
                    strokeWidth={selectedLine === 'files' ? 3 : 1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Upload Content and Input Section */}
          <Paper sx={{ ...cardStyle, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="h6" sx={{ color: 'black', pl: 2 }}>
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
                  icon={<ChatIcon sx={{ color: 'red' }} />}
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
                  icon={<UploadIcon sx={{ color: '#8884d8' }} />}
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
                  icon={<LinkIcon sx={{ color: '#82ca9d' }} />}
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
            <Divider />
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
          <Paper sx={{ ...cardStyle, p: 3 }}>
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
                    icon={<DownloadIcon sx={{ color: '#9c27b0' }} />}
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
                    icon={<TitleIcon sx={{ color: '#2196f3' }} />}
                    iconPosition="start"
                    sx={{
                      color: '#2196f3',
                      '&.Mui-selected': {
                        color: '#2196f3',
                      },
                      minWidth: 120,
                    }}
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
                    icon={<ContentCopyIcon sx={{ color: '#ff9800' }} />}
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
                <Tooltip title="Copy">
                  <IconButton size="small" sx={{ color: 'red' }}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate">
                  <IconButton size="small" sx={{ color: 'red' }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ minHeight: '200px', width: '100%', px: { xs: 0, sm: 2 } }}>
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: message.isUser ? 'rgba(25, 118, 210, 0.04)' : '#fff',
                      borderRadius: '8px',
                      border: '1px solid red',
                    }}
                  >
                    <Typography variant="body1">{message.text}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                      {!message.isUser && (
                        <Box>
                          <IconButton size="small">
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <ThumbDownIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Paper>
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
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              <ListItem button onClick={() => setActiveTab(0)}>
                <ListItemIcon>
                  <ChatIcon sx={{ color: 'red' }} />
                </ListItemIcon>
                <ListItemText primary="Start New Chat" />
              </ListItem>
              <ListItem button onClick={() => setActiveTab(1)}>
                <ListItemIcon>
                  <UploadIcon sx={{ color: '#8884d8' }} />
                </ListItemIcon>
                <ListItemText primary="Upload New Document" />
              </ListItem>
              <ListItem button onClick={() => setActiveTab(2)}>
                <ListItemIcon>
                  <LinkIcon sx={{ color: '#82ca9d' }} />
                </ListItemIcon>
                <ListItemText primary="Add External Link" />
              </ListItem>
            </List>
          </Paper>

          {/* AI Suggestions */}
          <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Try These
            </Typography>
            <List>
              <ListItem button onClick={() => setInput('Summarize this document.')}>
                <ListItemIcon>
                  <ContentCopyIcon sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText primary="Summarize this document." />
              </ListItem>
              <ListItem button onClick={() => setInput('Extract key points from this essay.')}>
                <ListItemIcon>
                  <FormatListBulletedIcon sx={{ color: '#ffc107' }} />
                </ListItemIcon>
                <ListItemText primary="Extract key points from this essay." />
              </ListItem>
              <ListItem button onClick={() => setInput('Rewrite in more academic tone.')}>
                <ListItemIcon>
                  <TitleIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText primary="Rewrite in more academic tone." />
              </ListItem>
            </List>
          </Paper>

          {/* Assignment Tokens */}
          <Paper sx={{ ...cardStyle, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assignment Tokens
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={tokenUsage.percentUsed}
                  size={120}
                  thickness={4}
                  sx={{
                    color: 'red',
                    '& .MuiCircularProgress-track': {
                      stroke: 'red',
                      opacity: 0.2,
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
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" color="text.secondary">
                    {tokenUsage.percentUsed}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Tokens Used: {tokenUsage.used.toLocaleString()} /{' '}
                  {tokenUsage.total.toLocaleString()}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{
                  mt: 2,
                  borderColor: 'red',
                  color: 'red',
                  '&:hover': {
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.04)',
                  },
                }}
                onClick={() => navigate('/dashboard/ai-tokens')}
              >
                See More Info
              </Button>
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
          <Typography variant="h6" gutterBottom>
            Recent History
          </Typography>
          <Card sx={{ ...cardStyle, mb: 3, backgroundColor: 'white' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Recent History</Typography>
                <IconButton size="small">
                  <RefreshIcon sx={{ color: 'red' }} />
                </IconButton>
              </Box>
              <List>
                {history.map(item => (
                  <ListItem key={item.id} button onClick={() => handlePinHistory(item.id)}>
                    <ListItemIcon>
                      {React.cloneElement(getHistoryIcon(item.type), { sx: { color: 'red' } })}
                    </ListItemIcon>
                    <ListItemText primary={item.title} secondary={item.date.toLocaleString()} />
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        handlePinHistory(item.id);
                      }}
                    >
                      {item.isPinned ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Workshop;
