import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  HourglassEmpty as ProcessingIcon,
} from '@mui/icons-material';
import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useWorkshopStore } from '../../services/WorkshopService';

interface FileAnalysisInterfaceProps {
  file: any;
  onAnalysisComplete?: (results: any) => void;
}

const FileAnalysisInterface: React.FC<FileAnalysisInterfaceProps> = ({
  file,
  onAnalysisComplete,
}) => {
  const { processFile } = useWorkshopStore();
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon sx={{ fontSize: 40, color: '#2196f3' }} />;
      case 'txt':
        return <DescriptionIcon sx={{ fontSize: 40, color: '#4caf50' }} />;
      default:
        return <FileIcon sx={{ fontSize: 40, color: '#757575' }} />;
    }
  };

  // Get file status chip
  const getFileStatusChip = (status: string) => {
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
        return (
          <Chip icon={<CloudUploadIcon />} label="Ready to Analyze" color="default" size="small" />
        );
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
            // Simulate analysis completion
            setAnalysisResults({
              summary:
                'This document contains important information about the topic. Key points include detailed analysis and comprehensive coverage of the subject matter.',
              keyPoints: [
                'Main topic discussed in detail',
                'Supporting evidence provided',
                'Conclusions drawn from analysis',
                'Recommendations for further action',
              ],
              insights: [
                'The document provides a thorough examination of the subject',
                'Multiple perspectives are considered',
                'Data is well-organized and presented clearly',
              ],
            });
            if (onAnalysisComplete) {
              onAnalysisComplete(analysisResults);
            }
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, onAnalysisComplete]);

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Use the existing processFile function
      await processFile(file.id, 'analyze');
    } catch (error) {
      console.error('Error analyzing file:', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* File Preview Area */}
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
        {file ? (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            {getFileIcon(file.name)}
            <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
              {file.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
            {getFileStatusChip(file.status || 'ready')}

            {!analysisResults && !isAnalyzing && (
              <Button
                variant="contained"
                onClick={handleAnalyze}
                sx={{
                  mt: 2,
                  backgroundColor: 'red',
                  '&:hover': {
                    backgroundColor: 'darkred',
                  },
                }}
              >
                Analyze File
              </Button>
            )}

            {isAnalyzing && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Analyzing file... {analysisProgress}%
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
            No file selected
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

export default FileAnalysisInterface;
