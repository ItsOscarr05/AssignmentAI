import {
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Link as LinkIcon,
  Send as SendIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { useWorkshopStore } from '../services/WorkshopService';

interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
}

interface LinkSubmission {
  id: string;
  url: string;
  title: string;
  description: string;
}

const Workshop: React.FC = () => {
  const theme = useTheme();
  const { generateContent, addFile, addLink, error, isLoading } = useWorkshopStore();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [links, setLinks] = useState<LinkSubmission[]>([]);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean; timestamp: Date }>
  >([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'links'>('chat');

  // Custom styles
  const cardStyle = {
    backgroundColor: '#fff',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
  };

  const tabButtonStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? theme.palette.error.main : 'transparent',
    color: isActive ? '#fff' : theme.palette.error.main,
    '&:hover': {
      backgroundColor: isActive ? theme.palette.error.dark : 'rgba(211, 47, 47, 0.04)',
    },
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    for (const file of uploadedFiles) {
      await addFile(file);
      const newFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
      };
      setFiles(prev => [...prev, newFile]);
    }
  };

  const handleLinkSubmit = async (url: string) => {
    const newLink = {
      url,
      title: url,
      description: `Link to ${url}`,
    };
    await addLink(newLink);
    setLinks(prev => [...prev, { ...newLink, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0 && links.length === 0) return;

    // Add user message
    const userMessage = { text: input, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    await generateContent(input);
    setInput('');
  };

  const recentHistory = [
    { title: 'Math Problem Solving', date: '2024-03-15', type: 'file' },
    { title: 'History Essay Outline', date: '2024-03-14', type: 'link' },
    { title: 'Science Project Research', date: '2024-03-13', type: 'chat' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom className="page-title">
        AI Workshop
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress role="progressbar" />
        </Box>
      )}

      {error && (
        <Typography color="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...cardStyle, p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant={activeTab === 'chat' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setActiveTab('chat')}
                sx={tabButtonStyle(activeTab === 'chat')}
              >
                Chat
              </Button>
              <Button
                variant={activeTab === 'files' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setActiveTab('files')}
                startIcon={<UploadIcon />}
                sx={tabButtonStyle(activeTab === 'files')}
              >
                Files
              </Button>
              <Button
                variant={activeTab === 'links' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setActiveTab('links')}
                startIcon={<LinkIcon />}
                sx={tabButtonStyle(activeTab === 'links')}
              >
                Links
              </Button>
            </Box>

            {activeTab === 'chat' && (
              <>
                <Box sx={{ mb: 3 }}>
                  {messages.map((message, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: message.isUser ? 'rgba(211, 47, 47, 0.04)' : '#fff',
                        borderRadius: '8px',
                      }}
                    >
                      <Typography variant="body1">{message.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type your assignment or question here..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        multiline
                        rows={3}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: theme.palette.error.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.error.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        size="large"
                        sx={{
                          height: '100%',
                          px: 4,
                          borderRadius: '8px',
                        }}
                        startIcon={<SendIcon />}
                        disabled={isLoading}
                      >
                        Send
                      </Button>
                    </Grid>
                  </Grid>
                </form>

                {/* Quick Actions Card */}
                <Paper sx={{ ...cardStyle, p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <List>
                    <ListItem button onClick={() => setActiveTab('files')}>
                      <ListItemIcon>
                        <UploadIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Upload Document" />
                    </ListItem>
                    <ListItem button onClick={() => setActiveTab('links')}>
                      <ListItemIcon>
                        <LinkIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Add Link" />
                    </ListItem>
                    <ListItem button>
                      <ListItemIcon>
                        <HistoryIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="View History" />
                    </ListItem>
                  </List>
                </Paper>

                {/* AI Suggestions Card */}
                <Paper sx={{ ...cardStyle, p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    AI Suggestions
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Analyze your document"
                        secondary="Get AI-powered insights and suggestions"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Improve your writing"
                        secondary="Get grammar and style suggestions"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Generate summaries"
                        secondary="Get concise summaries of your content"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </>
            )}

            {activeTab === 'files' && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload"
                        aria-label="Upload Files"
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          sx={{ mb: 3 }}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {files.map(file => (
                          <ListItem
                            key={file.id}
                            sx={{
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              mb: 1,
                            }}
                          >
                            <ListItemIcon>
                              <UploadIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={file.name}
                              secondary={`${(file.size / 1024).toFixed(1)} KB`}
                            />
                            <Chip
                              label={`${file.progress}%`}
                              color={file.progress === 100 ? 'success' : 'primary'}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === 'links' && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const url = form.url.value;
                        if (url) {
                          handleLinkSubmit(url);
                          form.reset();
                        }
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs>
                          <TextField
                            fullWidth
                            name="url"
                            variant="outlined"
                            placeholder="Enter URL..."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item>
                          <Button type="submit" variant="contained" color="primary">
                            Add Link
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ ...cardStyle, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent History
            </Typography>
            <List>
              {recentHistory.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {item.type === 'file' ? (
                      <UploadIcon color="primary" />
                    ) : item.type === 'link' ? (
                      <LinkIcon color="primary" />
                    ) : (
                      <HistoryIcon color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={item.title} secondary={item.date} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Supported Documents Card */}
          <Paper sx={{ ...cardStyle, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Supported Documents
            </Typography>
            <Grid container spacing={1}>
              {['PDF', 'DOCX', 'TXT', 'RTF'].map((type, index) => (
                <Grid item xs={6} key={index}>
                  <Chip
                    label={type}
                    sx={{
                      m: 0.5,
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                      color: theme.palette.error.main,
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Workshop;
