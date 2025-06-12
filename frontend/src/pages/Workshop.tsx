import {
  Add as AddIcon,
  Chat as ChatIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  FormatListBulleted as FormatListBulletedIcon,
  History as HistoryIcon,
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
import React, { useState } from 'react';
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
import { useWorkshopStore } from '../services/WorkshopService';

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
  useWorkshopStore();
  const [input, setInput] = useState('');
  const [] = useState<FileUpload[]>([]);
  const [] = useState<LinkSubmission[]>([]);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean; timestamp: Date }>
  >([]);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: '1',
      title: 'Math Problem Solving',
      date: new Date('2024-03-15'),
      type: 'file',
      isPinned: true,
    },
    {
      id: '2',
      title: 'History Essay Outline',
      date: new Date('2024-03-14'),
      type: 'link',
      isPinned: false,
    },
    {
      id: '3',
      title: 'Science Project Research',
      date: new Date('2024-03-13'),
      type: 'chat',
      isPinned: false,
    },
  ]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sample activity data - in a real app, this would come from your backend
  const activityData: ActivityData[] = [
    { date: 'Mon', chats: 4, files: 2, links: 1 },
    { date: 'Tue', chats: 3, files: 1, links: 2 },
    { date: 'Wed', chats: 5, files: 3, links: 0 },
    { date: 'Thu', chats: 2, files: 2, links: 1 },
    { date: 'Fri', chats: 6, files: 1, links: 3 },
    { date: 'Sat', chats: 4, files: 0, links: 2 },
    { date: 'Sun', chats: 3, files: 2, links: 1 },
  ];

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

  const handleFileUpload = () => {
    // Handle file upload logic here
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
            <Typography variant="h6" gutterBottom>
              Weekly Activity
            </Typography>
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
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="chats"
                    stroke="red"
                    activeDot={{ r: 8 }}
                    name="Chats"
                  />
                  <Line type="monotone" dataKey="files" stroke="#8884d8" name="Files" />
                  <Line type="monotone" dataKey="links" stroke="#82ca9d" name="Links" />
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">AI Response</Typography>
              <Box>
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
            <Box sx={{ minHeight: '200px' }}>
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
              <ListItem button onClick={() => setActiveTab(1)}>
                <ListItemIcon>
                  <UploadIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Upload New Document" />
              </ListItem>
              <ListItem button onClick={() => setActiveTab(2)}>
                <ListItemIcon>
                  <LinkIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Add External Link" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <HistoryIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="View Saved Assignments" />
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
                  <ContentCopyIcon sx={{ color: 'red' }} />
                </ListItemIcon>
                <ListItemText primary="Summarize this document." />
              </ListItem>
              <ListItem button onClick={() => setInput('Extract key points from this essay.')}>
                <ListItemIcon>
                  <FormatListBulletedIcon sx={{ color: 'red' }} />
                </ListItemIcon>
                <ListItemText primary="Extract key points from this essay." />
              </ListItem>
              <ListItem button onClick={() => setInput('Rewrite in more academic tone.')}>
                <ListItemIcon>
                  <TitleIcon sx={{ color: 'red' }} />
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
                  value={75}
                  size={120}
                  thickness={4}
                  sx={{ color: 'red' }}
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
                    75%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Tokens Used: 1,500 / 2,000
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
