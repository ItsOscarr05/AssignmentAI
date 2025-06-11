import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as TextIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onClose?: () => void;
  onDownload?: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  fileUrl,
  fileName,
  fileType,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        if (fileType.startsWith('image/')) {
          // For images, we'll use the URL directly
          setPreviewContent(fileUrl);
        } else if (fileType === 'application/pdf') {
          // For PDFs, we'll use an iframe
          setPreviewContent(fileUrl);
        } else if (fileType.startsWith('text/')) {
          // For text files, we'll fetch and display the content
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error('Failed to load text file');
          const text = await response.text();
          setPreviewContent(text);
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [fileUrl, fileType]);

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) return <ImageIcon />;
    if (fileType === 'application/pdf') return <PdfIcon />;
    return <TextIcon />;
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (fileType.startsWith('image/')) {
      return (
        <Box
          component="img"
          src={previewContent || ''}
          alt={fileName}
          sx={{
            maxWidth: '100%',
            maxHeight: '500px',
            objectFit: 'contain',
          }}
        />
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <Box
          component="iframe"
          src={previewContent || ''}
          sx={{
            width: '100%',
            height: '500px',
            border: 'none',
          }}
        />
      );
    }

    if (fileType.startsWith('text/')) {
      return (
        <Paper
          sx={{
            p: 2,
            maxHeight: '500px',
            overflow: 'auto',
            backgroundColor: 'grey.100',
          }}
        >
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {previewContent}
          </Typography>
        </Paper>
      );
    }

    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Preview not available for this file type
      </Alert>
    );
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {getFileIcon()}
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
            {fileName}
          </Typography>
          {onDownload && (
            <IconButton onClick={onDownload} title="Download">
              <DownloadIcon />
            </IconButton>
          )}
          {onClose && (
            <IconButton onClick={onClose} title="Close">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        {renderPreview()}
      </CardContent>
    </Card>
  );
};

export default FilePreview;
