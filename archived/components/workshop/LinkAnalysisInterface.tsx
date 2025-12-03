import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  Error as ErrorIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  HourglassEmpty as ProcessingIcon,
} from '@mui/icons-material';
import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface LinkAnalysisInterfaceProps {
  link: {
    url: string;
    title: string;
  };
  onAnalysisComplete?: (results: any) => void;
}

const LinkAnalysisInterface: React.FC<LinkAnalysisInterfaceProps> = ({
  link,
  onAnalysisComplete,
}) => {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [linkStatus, setLinkStatus] = useState<'ready' | 'processing' | 'completed' | 'error'>(
    'ready'
  );

  // Get link status chip
  const getLinkStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleOutlineIcon />}
            label="Analysis Complete"
            color="success"
            size="small"
          />
        );
      case 'processing':
        return (
          <Chip icon={<ProcessingIcon />} label="Processing..." color="warning" size="small" />
        );
      case 'error':
        return <Chip icon={<ErrorIcon />} label="Error" color="error" size="small" />;
      default:
        return <Chip icon={<LinkIcon />} label="Ready to Analyze" color="default" size="small" />;
    }
  };

  // Simulate analysis progress
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsAnalyzing(false);
            setLinkStatus('completed');
            // Simulate analysis completion
            setAnalysisResults({
              summary:
                'This web page contains valuable information about the topic. The content is well-structured and provides comprehensive coverage of the subject matter with relevant examples and insights.',
              keyPoints: [
                'Main topic thoroughly discussed',
                'Supporting evidence and examples provided',
                'Clear structure and organization',
                'Actionable insights and recommendations',
              ],
              insights: [
                'The page provides authoritative information on the subject',
                'Content is current and up-to-date',
                'Multiple perspectives are considered',
                'Well-written and easy to understand',
              ],
              metadata: {
                title: link.title,
                url: link.url,
                wordCount: '~1,200 words',
                readingTime: '5-7 minutes',
              },
            });
            if (onAnalysisComplete) {
              onAnalysisComplete(analysisResults);
            }
            return 100;
          }
          return prev + 15;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, onAnalysisComplete, link.title, link.url]);

  const handleAnalyze = async () => {
    if (!link) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setLinkStatus('processing');

    try {
      // Simulate API call to analyze the link
      // In a real implementation, this would call your backend API
      console.log('Analyzing link:', link.url);
    } catch (error) {
      console.error('Error analyzing link:', error);
      setIsAnalyzing(false);
      setLinkStatus('error');
    }
  };

  const handleOpenLink = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Link Preview Area */}
      <Box
        sx={{
          flex: 1,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 2,
          mb: 2,
          minHeight: '300px',
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {link ? (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <LinkIcon sx={{ fontSize: 40, color: '#82ca9d', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, wordBreak: 'break-word' }}>
              {link.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, wordBreak: 'break-all' }}
            >
              {link.url}
            </Typography>
            {getLinkStatusChip(linkStatus)}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenLink}
                sx={{
                  borderColor: '#82ca9d',
                  color: '#82ca9d',
                  '&:hover': {
                    borderColor: '#82ca9d',
                    backgroundColor: 'rgba(130, 202, 157, 0.1)',
                  },
                }}
              >
                Open Link
              </Button>

              {!analysisResults && !isAnalyzing && (
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  sx={{
                    backgroundColor: 'red',
                    '&:hover': {
                      backgroundColor: 'darkred',
                    },
                  }}
                >
                  Analyze Link
                </Button>
              )}
            </Box>

            {isAnalyzing && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Analyzing content... {analysisProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analysisProgress}
                  sx={{
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'red',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No link provided
          </Typography>
        )}
      </Box>

      {/* AI Analysis Results */}
      {analysisResults && (
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'red' }}>
            AI Analysis Results
          </Typography>

          {/* Metadata */}
          {analysisResults.metadata && (
            <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Content Information:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Title:</strong> {analysisResults.metadata.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Word Count:</strong> {analysisResults.metadata.wordCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Reading Time:</strong> {analysisResults.metadata.readingTime}
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Summary:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {analysisResults.summary}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Key Points:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {analysisResults.keyPoints.map((point: string, index: number) => (
                <li key={index}>
                  <Typography variant="body2">{point}</Typography>
                </li>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Insights:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {analysisResults.insights.map((insight: string, index: number) => (
                <li key={index}>
                  <Typography variant="body2">{insight}</Typography>
                </li>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LinkAnalysisInterface;
