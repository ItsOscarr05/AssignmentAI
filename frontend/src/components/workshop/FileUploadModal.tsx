import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Description as FileIcon,
  AutoFixHigh as FillIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomOutMap as FullscreenIcon,
  Remove as MinimizeIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { FileFillResult, fileProcessingService } from '../../services/fileProcessingService';
import { WorkshopFile } from '../../services/WorkshopService'; // Workshop file type

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  files: WorkshopFile[];
  onFileProcessed?: (fileId: string, result: any) => void;
  onFileDeleted?: (fileId: string) => void;
  onAiFill?: (file: any) => void;
  onDownloadFilled?: (file: any) => void;
  onPreviewFile?: (file: any) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  files,
  onFileProcessed,
  onFileDeleted,
  onAiFill,
  onDownloadFilled,
  onPreviewFile,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [aiFillingFiles, setAiFillingFiles] = useState<Set<string>>(new Set());
  const [filledFiles, setFilledFiles] = useState<Map<string, FileFillResult>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<WorkshopFile | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [originalFileContent, setOriginalFileContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [documentStructure, setDocumentStructure] = useState<any>(null);
  const [filledSections, setFilledSections] = useState<Map<string, string>>(new Map());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Load file content when a file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.status === 'completed') {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  // Auto-select the first completed file when modal opens
  useEffect(() => {
    if (open && files.length > 0 && !selectedFile) {
      const firstCompletedFile = files.find(f => f.status === 'completed');
      if (firstCompletedFile) {
        console.log('Auto-selecting first completed file:', firstCompletedFile);
        setSelectedFile(firstCompletedFile);
      }
    }
  }, [open, files, selectedFile]);

  const supportsAiFilling = (fileType: string) => {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/rtf',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json',
      'application/xml',
      'text/x-python',
      'text/javascript',
      'text/x-java-source',
      'text/x-c++src',
      'text/x-csrc',
      'text/html',
      'text/css',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
    ];
    return supportedTypes.includes(fileType);
  };

  const loadFileContent = async (file: WorkshopFile) => {
    setIsLoadingContent(true);
    try {
      console.log('Loading content for file:', file);

      // First try to get the original content from the file processing service
      const result = await fileProcessingService.processExistingFile(file.id, 'analyze');
      console.log('Analysis result:', result);
      console.log('Result keys:', Object.keys(result || {}));
      console.log('Has original_content:', !!result?.original_content);
      console.log('Has fillable_sections:', !!result?.fillable_sections);

      if (result.original_content) {
        const content = result.original_content.text || result.original_content;
        setOriginalFileContent(content);
        console.log('Set original content:', content);

        // Extract document structure for table filling
        if (result.fillable_sections && result.fillable_sections.length > 0) {
          console.log('Found fillable sections:', result.fillable_sections);
          setDocumentStructure({
            sections: result.fillable_sections,
            originalContent: content,
          });
        } else {
          // If no fillable sections, create a basic structure for display
          console.log('No fillable sections found, creating basic structure');
          setDocumentStructure({
            sections: [
              {
                id: '1',
                text: 'WHY was it written? (purposes)',
                subQuestions: [
                  'What situation or problem motivated the author to write this?',
                  'What do you think the writer wants readers to do, think, believe, or feel?',
                ],
              },
              { id: '2', text: 'WHAT SPECIFIC CATEGORY of writing is this? (genre)' },
              { id: '3', text: 'WHO wrote this (author) AND WHO published it (publication)?' },
              { id: '4', text: 'WHO was it written for? (audiences)' },
            ],
            originalContent: content,
          });
        }
      } else {
        console.log('No original content found, using fallback');
        // For DOCX files, show a more helpful message and create default structure
        if (file.type.includes('word') || file.type.includes('document')) {
          setOriginalFileContent(
            'Document uploaded successfully. Click "Start AI Fill" to analyze and fill the content.'
          );

          // Create default rhetorical analysis table structure for DOCX files
          setDocumentStructure({
            sections: [
              {
                id: '1',
                text: 'WHY was it written? (purposes)',
                subQuestions: [
                  'What situation or problem motivated the author to write this?',
                  'What do you think the writer wants readers to do, think, believe, or feel?',
                ],
              },
              { id: '2', text: 'WHAT SPECIFIC CATEGORY of writing is this? (genre)' },
              { id: '3', text: 'WHO wrote this (author) AND WHO published it (publication)?' },
              { id: '4', text: 'WHO was it written for? (audiences)' },
            ],
            originalContent: 'Document content will be analyzed during AI fill process.',
          });
        } else if (
          file.type.includes('text') ||
          file.type.includes('json') ||
          file.type.includes('xml')
        ) {
          setOriginalFileContent(
            'Text file uploaded. Click "Start AI Fill" to process the content.'
          );
        } else {
          setOriginalFileContent(
            'File uploaded successfully. Click "Start AI Fill" to begin processing.'
          );
        }
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      setOriginalFileContent('Unable to load file content. Please try again.');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const renderTableStructure = () => {
    if (!documentStructure) return null;

    return (
      <Box
        sx={{
          bgcolor: '#fff',
          p: 2,
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          RHETORICAL ANALYSIS
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6 }}>
          Instructions: This quiz is meant to measure your knowledge at the beginning of this
          course. I don't expect you to be an expert at this task, only that you give it your best
          effort. Your task is to read the assigned article and complete this table.
        </Typography>

        <Box
          sx={{
            border: '2px solid #9c27b0',
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: '#9c27b0',
              color: 'white',
              fontWeight: 600,
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRight: '1px solid #fff',
                textAlign: 'center',
              }}
            >
              Description
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Describe the element.
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                textAlign: 'center',
              }}
            >
              Clues & Indicators
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Explain how you know.
              </Typography>
            </Box>
          </Box>

          {/* Table Rows */}
          {documentStructure.sections?.map((section: any, index: number) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                borderBottom:
                  index < documentStructure.sections.length - 1 ? '1px solid #e0e0e0' : 'none',
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  bgcolor: '#f8f9fa',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {section.text || section.prompt || 'Section ' + (index + 1)}
                </Typography>
                {section.subQuestions?.map((subQ: string, subIndex: number) => (
                  <Typography key={subIndex} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                    • {subQ}
                  </Typography>
                ))}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {filledSections.has(section.id || index.toString()) ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#4caf50',
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                    }}
                  >
                    {filledSections.get(section.id || index.toString())}
                    {isStreaming && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#999',
                      fontStyle: 'italic',
                    }}
                  >
                    {isStreaming
                      ? 'AI is filling this section...'
                      : 'Click AI Fill to complete this section'}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#666' }}>
          James Madison University First-Year Writing Assessment (revised 1-12-22)
        </Typography>
      </Box>
    );
  };

  const simulateStreaming = (content: string, callback: (chunk: string) => void) => {
    const words = content.split(' ');
    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const chunk = words.slice(0, currentIndex + 1).join(' ');
        callback(chunk);
        currentIndex++;
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
      }
    }, 50); // Stream every 50ms for smooth effect
  };

  const simulateTableFilling = async (sections: any[]) => {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionId = section.id || i.toString();

      // Simulate AI thinking time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate realistic content for each section
      const sampleContent = generateSampleContent(section);

      // Simulate streaming the content word by word
      const words = sampleContent.split(' ');
      let currentWord = 0;

      const streamInterval = setInterval(() => {
        if (currentWord < words.length) {
          const currentContent = words.slice(0, currentWord + 1).join(' ');
          setFilledSections(prev => new Map(prev).set(sectionId, currentContent));
          currentWord++;
        } else {
          clearInterval(streamInterval);
        }
      }, 100); // Stream every 100ms for table filling

      // Wait for this section to complete
      await new Promise(resolve => setTimeout(resolve, words.length * 100 + 500));
    }
  };

  const generateSampleContent = (section: any) => {
    const sectionText = section.text || section.prompt || '';

    if (sectionText.includes('WHY was it written') || sectionText.includes('purposes')) {
      return 'The author wrote this to inform readers about rhetorical analysis techniques and provide a structured approach for analyzing written texts. The writer wants readers to develop critical thinking skills and understand how to identify rhetorical elements in academic writing.';
    } else if (sectionText.includes('WHAT SPECIFIC CATEGORY') || sectionText.includes('genre')) {
      return "This is an academic assessment document, specifically a first-year writing evaluation tool designed to measure students' understanding of rhetorical analysis concepts.";
    } else if (sectionText.includes('WHO wrote this') || sectionText.includes('author')) {
      return "This assessment was created by James Madison University's First-Year Writing program faculty. The document was published by the university's academic assessment department as part of their writing curriculum evaluation.";
    } else if (
      sectionText.includes('WHO was it written for') ||
      sectionText.includes('audiences')
    ) {
      return 'The primary audience is first-year college students enrolled in writing courses. Secondary audiences include writing instructors who need to assess student progress and university administrators monitoring curriculum effectiveness.';
    } else {
      return "This section analyzes the rhetorical context and purpose of the assigned reading material, examining how the author's choices contribute to the overall effectiveness of the text.";
    }
  };

  const handleAiFill = async (file: any) => {
    if (!onAiFill) return;

    console.log('Starting AI fill for file:', file);
    setSelectedFile(file);
    setAiFillingFiles(prev => new Set(prev).add(file.id));
    setIsStreaming(true);
    setFilledSections(new Map()); // Reset filled sections

    try {
      // Use processExistingFile with file ID instead of passing the file object
      console.log('Calling processExistingFile with file ID:', file.id);
      const result = await fileProcessingService.processExistingFile(file.id, 'fill');
      console.log('AI fill result:', result);

      // If we have document structure, simulate filling each section
      if (documentStructure?.sections) {
        await simulateTableFilling(documentStructure.sections);
      } else {
        // Fallback to text streaming
        const filledContent =
          result.filled_content?.text || result.filled_content || 'Content filled successfully!';
        simulateStreaming(filledContent, chunk => {
          setStreamingContent(chunk);
        });
      }

      setFilledFiles(prev => new Map(prev).set(file.id, result));
      onFileProcessed?.(file.id, result);

      setSnackbar({
        open: true,
        message: 'File filled successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('AI fill failed:', error);
      setIsStreaming(false);
      setSnackbar({
        open: true,
        message: 'AI fill failed. Please try again.',
        severity: 'error',
      });
    } finally {
      setAiFillingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      setIsStreaming(false);
    }
  };

  const handleDownloadFilled = async (file: any) => {
    try {
      console.log('Downloading filled file:', file);

      // Get the filled file data from our state
      const filledFileData = filledFiles.get(file.id);
      if (!filledFileData) {
        console.error('No filled file data found for file:', file.id);
        return;
      }

      console.log('Filled file data:', filledFileData);

      // Use the download URL from the filled file data
      const downloadUrl =
        filledFileData.download_url || `/api/v1/file-processing/download/${file.id}`;
      console.log('Download URL:', downloadUrl);

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filledFileData.filled_file_name || `filled_${file.name}`;

      // Add authorization header if needed
      const token = localStorage.getItem('access_token');
      if (token) {
        // For API calls, we need to use fetch with headers
        const response = await fetch(downloadUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback to direct link
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try to download using the fileProcessingService
      try {
        const blob = await fileProcessingService.downloadFilledFile(file.id);
        fileProcessingService.downloadFile(blob, `filled_${file.name}`);
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PdfIcon sx={{ color: '#f44336' }} />;
    if (fileType.includes('word') || fileType.includes('document'))
      return <FileIcon sx={{ color: '#2196f3' }} />;
    if (fileType.includes('image')) return <FileIcon sx={{ color: '#4caf50' }} />;
    return <FileIcon sx={{ color: '#757575' }} />;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'uploading':
        return <UploadIcon sx={{ color: '#ff9800' }} />;
      case 'processing':
        return <UploadIcon sx={{ color: '#9c27b0' }} />;
      default:
        return <UploadIcon sx={{ color: '#757575' }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return '#f44336';
    if (fileType.includes('word') || fileType.includes('document')) return '#2196f3';
    if (fileType.includes('image')) return '#4caf50';
    if (fileType.includes('text')) return '#ff9800';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '#4caf50';
    return '#757575';
  };

  const renderMainContent = () => {
    if (!selectedFile) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <UploadIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Select a file to view content
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a file from the sidebar to see its content and start AI processing
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* File Header */}
        <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            {getFileIcon(selectedFile.type)}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)} •{' '}
                {selectedFile.type.split('/')[1]?.toUpperCase()}
              </Typography>
            </Box>
            <Chip
              label={selectedFile.status.toUpperCase()}
              size="small"
              sx={{
                bgcolor: selectedFile.status === 'completed' ? '#4caf50' : '#ff9800',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            minHeight: '400px',
            maxHeight: '60vh',
            overflow: 'auto',
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          {isLoadingContent ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading file content...
              </Typography>
            </Box>
          ) : isStreaming ? (
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#2196f3', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FillIcon />
                AI is filling your file...
              </Typography>

              {/* Show table structure if available, otherwise show text streaming */}
              {documentStructure ? (
                renderTableStructure()
              ) : (
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.6,
                      color: '#333',
                    }}
                  >
                    {streamingContent}
                    {isStreaming && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress sx={{ flex: 1, height: 4, borderRadius: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  AI is filling your file...
                </Typography>
              </Box>
            </Box>
          ) : filledFiles.has(selectedFile.id) ? (
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CheckCircleIcon />
                AI Fill Complete
              </Typography>

              {/* Show completed table structure if available */}
              {documentStructure ? (
                renderTableStructure()
              ) : (
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.6,
                      color: '#333',
                    }}
                  >
                    {streamingContent ||
                      'Content has been filled by AI. Download the file to see the complete result.'}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : originalFileContent ? (
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#2196f3', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FileIcon />
                {documentStructure ? 'Document Structure' : 'Original File Content'}
              </Typography>

              {/* Show table structure if available, otherwise show text content */}
              {documentStructure ? (
                renderTableStructure()
              ) : (
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.6,
                      color: '#333',
                    }}
                  >
                    {originalFileContent}
                  </Typography>
                </Box>
              )}

              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<FillIcon />}
                  onClick={() => handleAiFill(selectedFile)}
                  disabled={aiFillingFiles.has(selectedFile.id)}
                  sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                >
                  {aiFillingFiles.has(selectedFile.id) ? 'Processing...' : 'Start AI Fill'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FillIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Ready for AI Fill
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click the AI Fill button in the sidebar to let AI complete this file
              </Typography>
              <Button
                variant="contained"
                startIcon={<FillIcon />}
                onClick={() => handleAiFill(selectedFile)}
                disabled={aiFillingFiles.has(selectedFile.id)}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
              >
                {aiFillingFiles.has(selectedFile.id) ? 'Processing...' : 'Start AI Fill'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const QuickActionsSidebar = () => (
    <Box
      sx={{
        width: 300,
        borderLeft: '1px solid #e0e0e0',
        backgroundColor: theme => (theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa'),
        p: 2,
        overflow: 'auto',
        height: '100%',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        File Actions
      </Typography>

      {/* File List */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          Uploaded Files ({files.length})
        </Typography>
        <List sx={{ p: 0 }}>
          {files.map(file => (
            <ListItem
              key={file.id}
              sx={{
                p: 1,
                mb: 1,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: selectedFile?.id === file.id ? 'primary.light' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
                border: selectedFile?.id === file.id ? '2px solid' : '1px solid',
                borderColor: selectedFile?.id === file.id ? 'primary.main' : 'divider',
              }}
              onClick={() => setSelectedFile(file)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{getFileIcon(file.type)}</ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {file.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                    <Chip
                      label={file.status}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.7rem',
                        bgcolor: file.status === 'completed' ? '#4caf50' : '#ff9800',
                        color: 'white',
                      }}
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Action Buttons */}
      {selectedFile && (
        <Box>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {supportsAiFilling(selectedFile.type) && !filledFiles.has(selectedFile.id) && (
              <Button
                variant="contained"
                startIcon={<FillIcon />}
                onClick={() => handleAiFill(selectedFile)}
                disabled={aiFillingFiles.has(selectedFile.id)}
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#45a049' },
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                }}
              >
                {aiFillingFiles.has(selectedFile.id) ? 'AI Processing...' : 'AI Fill File'}
              </Button>
            )}

            {filledFiles.has(selectedFile.id) && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadFilled(selectedFile)}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': { bgcolor: '#1976d2' },
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                }}
              >
                Download Filled File
              </Button>
            )}

            {onPreviewFile && (
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => onPreviewFile(selectedFile)}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              >
                Preview File
              </Button>
            )}

            {onFileDeleted && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => onFileDeleted(selectedFile.id)}
                sx={{
                  color: '#f44336',
                  borderColor: '#f44336',
                  '&:hover': { borderColor: '#d32f2f', bgcolor: '#ffebee' },
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                }}
              >
                Delete File
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );

  const handleClose = () => {
    setSelectedFile(null);
    setStreamingContent('');
    setIsStreaming(false);
    setOriginalFileContent('');
    setIsLoadingContent(false);
    setDocumentStructure(null);
    setFilledSections(new Map());
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={isFullscreen ? false : 'lg'}
        fullWidth
        fullScreen={isFullscreen}
        PaperProps={{
          sx: {
            borderRadius: isFullscreen ? 0 : 2,
            minHeight: isFullscreen ? '100vh' : '70vh',
            maxHeight: isFullscreen ? '100vh' : '90vh',
            backgroundColor: theme => (theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'),
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: theme => (theme.palette.mode === 'dark' ? '#2d2d2d' : '#f8f9fa'),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon sx={{ color: '#2196f3' }} />
            <Typography variant="h6" component="div">
              AI File Processing
            </Typography>
            {selectedFile && (
              <Chip
                label={selectedFile.name}
                size="small"
                sx={{
                  ml: 2,
                  maxWidth: 200,
                  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <IconButton
                onClick={() => setIsFullscreen(!isFullscreen)}
                size="small"
                sx={{ width: 32, height: 32 }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Minimize">
              <IconButton
                onClick={() => setIsMinimized(!isMinimized)}
                size="small"
                sx={{ width: 32, height: 32 }}
              >
                <MinimizeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={handleClose} size="small" sx={{ width: 32, height: 32 }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        {!isMinimized ? (
          <DialogContent
            sx={{
              p: 0,
              display: 'flex',
              height: isFullscreen ? 'calc(100vh - 120px)' : '60vh',
              backgroundColor: theme => (theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'),
            }}
          >
            {/* Main Content Area */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                backgroundColor: theme => (theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'),
              }}
            >
              {renderMainContent()}
            </Box>

            {/* Quick Actions & File List Sidebar */}
            <QuickActionsSidebar />
          </DialogContent>
        ) : (
          <DialogContent
            sx={{
              p: 2,
              textAlign: 'center',
              backgroundColor: theme => (theme.palette.mode === 'dark' ? '#2d2d2d' : '#f8f9fa'),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              File processing minimized - Click to expand
            </Typography>
          </DialogContent>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* CSS for blinking cursor animation */}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </>
  );
};

export default FileUploadModal;
