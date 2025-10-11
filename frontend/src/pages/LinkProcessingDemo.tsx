import { AutoAwesome as AIIcon, Link as LinkIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import EnhancedLinkProcessingInterface from '../components/workshop/EnhancedLinkProcessingInterface';

const LinkProcessingDemo: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInterface, setShowInterface] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);

  const handleProcessLink = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll create mock data
      // In a real implementation, this would call your backend to extract content
      const mockLinkData = {
        id: `demo-${Date.now()}`,
        url: url,
        title: 'Sample Article Title',
        content: `This is a comprehensive article about ${
          url.includes('tech') ? 'technology' : 'general topics'
        }. 

The article covers several key areas including:
- Introduction to the main concepts
- Detailed analysis of current trends
- Future implications and predictions
- Practical applications and examples
- Conclusion and key takeaways

This content demonstrates the capabilities of our enhanced link processing system. It shows how AI can analyze web content, extract key insights, assess credibility, and provide interactive chat functionality.

The system can handle various types of content including news articles, academic papers, blog posts, tutorials, and research reports. Each piece of content is analyzed for sentiment, credibility, reading time, and related topics.

Users can interact with the content through an intelligent chat interface that allows them to ask questions, request summaries, find similar content, and get actionable insights.`,
        type: 'article',
        extracted_at: new Date().toISOString(),
      };

      setLinkData(mockLinkData);
      setShowInterface(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process link');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseInterface = () => {
    setShowInterface(false);
    setLinkData(null);
  };

  const handleDeleteLink = (linkId: string) => {
    console.log('Delete link:', linkId);
    handleCloseInterface();
  };

  if (showInterface && linkData) {
    return (
      <EnhancedLinkProcessingInterface
        link={linkData}
        onClose={handleCloseInterface}
        onDelete={handleDeleteLink}
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}
        >
          <AIIcon sx={{ fontSize: '3rem', color: '#f44336' }} />
          <Typography variant="h3" component="h1" sx={{ color: '#f44336', fontWeight: 'bold' }}>
            Enhanced Link Processing
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Intelligent analysis, interactive chat, and AI-powered insights for any web content
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 600, mx: 'auto', border: '3px solid #f44336', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            Process a Link
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Enter URL to analyze"
              placeholder="https://example.com/article"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleProcessLink}
              disabled={loading || !url.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
              sx={{
                backgroundColor: '#f44336',
                fontSize: '1.1rem',
                py: 1.5,
                '&:hover': {
                  backgroundColor: '#d32f2f',
                },
              }}
            >
              {loading ? 'Processing...' : 'Analyze Link'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Features:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Content Summarization" color="primary" variant="outlined" />
              <Chip label="Key Points Extraction" color="primary" variant="outlined" />
              <Chip label="Credibility Assessment" color="primary" variant="outlined" />
              <Chip label="Sentiment Analysis" color="primary" variant="outlined" />
              <Chip label="Interactive Chat" color="primary" variant="outlined" />
              <Chip label="Related Topics" color="primary" variant="outlined" />
              <Chip label="Suggested Actions" color="primary" variant="outlined" />
              <Chip label="Citation Generation" color="primary" variant="outlined" />
            </Box>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Demo Note:</strong> This is a standalone demo. Enter any URL to see the
              enhanced link processing interface. The system will show comprehensive analysis,
              interactive chat, and AI-powered insights for the content.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Built with AI-powered analysis and interactive enhancement capabilities
        </Typography>
      </Box>
    </Container>
  );
};

export default LinkProcessingDemo;
