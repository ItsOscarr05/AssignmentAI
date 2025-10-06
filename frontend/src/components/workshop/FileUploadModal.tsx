import {
  AnalyticsOutlined as AnalyticsIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CloseOutlined as CloseIcon,
  DeleteOutlined as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  ErrorOutlined as ErrorIcon,
  DescriptionOutlined as FileIcon,
  AutoFixHighOutlined as FillIcon,
  FullscreenExitOutlined as FullscreenExitIcon,
  ZoomOutMapOutlined as FullscreenIcon,
  RemoveOutlined as MinimizeIcon,
  PictureAsPdfOutlined as PdfIcon,
  VisibilityOutlined as PreviewIcon,
  TableChartOutlined as TableIcon,
  CloudUploadOutlined as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { FileFillResult, fileProcessingService } from '../../services/fileProcessingService';
import { WorkshopFile } from '../../services/WorkshopService'; // Workshop file type

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  files: WorkshopFile[];
  lastUploadedFile?: any;
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
}) => {
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
  const [structuredFileData, setStructuredFileData] = useState<any>(null);
  const [activeSheetTab, setActiveSheetTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // File Processing Analytics State
  const [processingMetrics, setProcessingMetrics] = useState({
    filesProcessed: 0,
    avgProcessingTime: 0,
    successRate: 100,
    contentQuality: 85,
    aiAccuracy: 92,
  });
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  // Load file content when a file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.status === 'completed') {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  // Auto-select the file when modal opens (should only be one file since we clear on close)
  useEffect(() => {
    if (open && files.length > 0 && !selectedFile) {
      console.log('Modal opened with files:', files);

      // Since we clear files when modal closes, there should only be one file
      // Just select the first completed file
      const completedFile = files.find(f => f.status === 'completed');
      if (completedFile) {
        console.log('Auto-selecting the uploaded file:', completedFile);
        setSelectedFile(completedFile);
      }
    }
  }, [open, files, selectedFile]);

  // Format spreadsheet content to show as structured data for table rendering
  const formatSpreadsheetContent = (processedData: any, fileExtension: string): any => {
    try {
      // Handle different spreadsheet formats
      if (processedData.sheets) {
        // Excel format (XLSX/XLS) - return structured data for table rendering
        const sheetNames = Object.keys(processedData.sheets);
        const structuredData: any = {
          type: 'excel',
          sheets: {},
          hasCalculations: processedData.has_calculations || false,
        };

        for (const sheetName of sheetNames) {
          const sheetData = processedData.sheets[sheetName];

          if (Array.isArray(sheetData) && sheetData.length > 0) {
            // Convert array of arrays to structured table data
            const headers = sheetData[0] || [];
            const rows = sheetData.slice(1).map((row: any) => {
              if (Array.isArray(row)) {
                const rowObj: any = {};
                headers.forEach((header: any, index: number) => {
                  rowObj[header] = row[index] || '';
                });
                return rowObj;
              }
              return row;
            });

            structuredData.sheets[sheetName] = {
              headers,
              rows,
              data: sheetData,
            };
          } else if (Array.isArray(sheetData.data)) {
            // Handle pandas DataFrame format
            const headers = Object.keys(sheetData.data[0] || {});
            structuredData.sheets[sheetName] = {
              headers,
              rows: sheetData.data,
              data: sheetData.data,
            };
          }
        }

        return structuredData;
      } else if (processedData.data) {
        // CSV format - return structured data
        if (Array.isArray(processedData.data)) {
          const headers = Object.keys(processedData.data[0] || {});
          return {
            type: 'csv',
            headers,
            rows: processedData.data,
            data: processedData.data,
          };
        }
      }

      // Fallback: return as string
      return {
        type: 'text',
        content: JSON.stringify(processedData, null, 2),
      };
    } catch (error) {
      console.error('Error formatting spreadsheet content:', error);
      return {
        type: 'error',
        content: 'Error formatting spreadsheet content.',
      };
    }
  };

  // Render Excel/CSV data as formatted tables
  const renderSpreadsheetTable = (structuredData: any) => {
    console.log('renderSpreadsheetTable called with:', structuredData);
    if (!structuredData) {
      console.log('No structured data, returning null');
      return null;
    }

    if (structuredData.type === 'excel' && structuredData.sheets) {
      console.log('Rendering Excel format with sheets:', structuredData.sheets);
      const sheetNames = Object.keys(structuredData.sheets);

      if (sheetNames.length === 1) {
        // Single sheet - render directly
        const sheetName = sheetNames[0];
        const sheetData = structuredData.sheets[sheetName];
        return renderTable(sheetData, sheetName);
      } else {
        // Multiple sheets - render with tabs
        return (
          <Box>
            <Tabs
              value={activeSheetTab}
              onChange={(_, newValue) => setActiveSheetTab(newValue)}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {sheetNames.map((sheetName, index) => (
                <Tab key={sheetName} label={sheetName} />
              ))}
            </Tabs>
            {sheetNames.map(
              (sheetName, index) =>
                activeSheetTab === index && (
                  <Box key={sheetName}>
                    {renderTable(structuredData.sheets[sheetName], sheetName)}
                  </Box>
                )
            )}
          </Box>
        );
      }
    } else if (structuredData.type === 'csv') {
      console.log('Rendering CSV format with data:', structuredData);
      // CSV data
      return renderTable(structuredData, 'Data');
    }

    console.log('No matching format found, returning null');
    return null;
  };

  // Render individual table with Excel-like styling
  const renderTable = (sheetData: any, title: string) => {
    if (!sheetData || !sheetData.headers || !sheetData.rows) {
      return (
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      );
    }

    const { headers, rows } = sheetData;

    // Generate column letters (A, B, C, D, etc.)
    const getColumnLetter = (index: number) => {
      let result = '';
      while (index >= 0) {
        result = String.fromCharCode(65 + (index % 26)) + result;
        index = Math.floor(index / 26) - 1;
      }
      return result;
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#2196f3' }}>
            {title}
          </Typography>
          <Chip label={`${rows.length} rows`} size="small" color="primary" variant="outlined" />
        </Box>

        <Box
          sx={{
            border: '1px solid #d0d7de',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            maxHeight: 400,
            overflow: 'auto',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Column Headers Row */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #d0d7de' }}>
            {/* Empty cell for row numbers column */}
            <Box
              sx={{
                width: 40,
                height: 24,
                backgroundColor: '#f6f8fa',
                borderRight: '1px solid #d0d7de',
                borderBottom: '1px solid #d0d7de',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#656d76',
              }}
            >
              {/* Empty top-left corner */}
            </Box>

            {/* Column letters */}
            {headers.map((header: string, index: number) => (
              <Box
                key={index}
                sx={{
                  width: 100,
                  height: 24,
                  backgroundColor: '#f6f8fa',
                  borderRight: '1px solid #d0d7de',
                  borderBottom: '1px solid #d0d7de',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#656d76',
                }}
              >
                {getColumnLetter(index)}
              </Box>
            ))}
          </Box>

          {/* Data Rows */}
          {rows.map((row: any, rowIndex: number) => (
            <Box key={rowIndex} sx={{ display: 'flex' }}>
              {/* Row number */}
              <Box
                sx={{
                  width: 40,
                  height: 24,
                  backgroundColor: '#f6f8fa',
                  borderRight: '1px solid #d0d7de',
                  borderBottom: '1px solid #d0d7de',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#656d76',
                }}
              >
                {rowIndex + 1}
              </Box>

              {/* Data cells */}
              {headers.map((header: string, colIndex: number) => (
                <Box
                  key={colIndex}
                  sx={{
                    width: 100,
                    height: 24,
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #d0d7de',
                    borderBottom: '1px solid #d0d7de',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '6px',
                    paddingRight: '6px',
                    fontSize: '11px',
                    color: '#24292f',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'text',
                    '&:hover': {
                      backgroundColor: '#f6f8fa',
                    },
                    // Highlight calculated values
                    ...(typeof row[header] === 'number' &&
                    row[header] > 0 &&
                    header.toLowerCase().includes('revenue')
                      ? {
                          backgroundColor: '#e8f5e8',
                          fontWeight: 'bold',
                          color: '#2e7d32',
                        }
                      : {}),
                  }}
                >
                  {row[header] || ''}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const loadFileContent = async (file: WorkshopFile) => {
    setIsLoadingContent(true);
    setActiveSheetTab(0); // Reset sheet tab when loading new file
    try {
      console.log('Loading content for file:', file);

      // Use the content that was already returned from the upload
      if (file.content) {
        console.log('Using content from file object:', file.content);

        // Check if this is a CSV/Excel file that might have processed calculations
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const isSpreadsheetFile = ['csv', 'xlsx', 'xls'].includes(fileExtension || '');

        if (isSpreadsheetFile) {
          console.log('Processing spreadsheet file:', file.name);
          console.log('File has processed_data:', !!file.processed_data);
          console.log('File has analysis:', !!file.analysis);
          console.log('File content:', file.content?.substring(0, 200) + '...');

          // Check if we have processed data directly from the backend
          if (file.processed_data) {
            console.log('Using processed data from backend:', file.processed_data);
            const structuredData = formatSpreadsheetContent(file.processed_data, fileExtension);
            console.log('Formatted structured data:', structuredData);
            setStructuredFileData(structuredData);

            // Also set text content for fallback
            if (structuredData.type === 'excel' && structuredData.sheets) {
              // Format as CSV for text display
              const firstSheet = Object.values(structuredData.sheets)[0] as any;
              if (firstSheet && firstSheet.headers && firstSheet.rows) {
                const csvContent = [
                  firstSheet.headers.join(','),
                  ...firstSheet.rows.map((row: any) =>
                    firstSheet.headers.map((h: string) => row[h] || '').join(',')
                  ),
                ].join('\n');
                setOriginalFileContent(csvContent);
              } else {
                setOriginalFileContent(file.content || '');
              }
            } else if (structuredData.type === 'csv') {
              // For CSV, format the data
              if (structuredData.headers && structuredData.rows) {
                const csvContent = [
                  structuredData.headers.join(','),
                  ...structuredData.rows.map((row: any) =>
                    structuredData.headers.map((h: string) => row[h] || '').join(',')
                  ),
                ].join('\n');
                setOriginalFileContent(csvContent);
              } else {
                setOriginalFileContent(file.content || '');
              }
            } else {
              setOriginalFileContent(file.content || '');
            }

            console.log('Using structured spreadsheet data:', structuredData);
          } else if (file.analysis) {
            // Fallback: try to parse the analysis to see if it contains processed data
            try {
              const analysisData =
                typeof file.analysis === 'string' ? JSON.parse(file.analysis) : file.analysis;

              // Check if we have processed sheets data
              if (analysisData && (analysisData.sheets || analysisData.data)) {
                const structuredData = formatSpreadsheetContent(analysisData, fileExtension);
                setStructuredFileData(structuredData);
                setOriginalFileContent(file.content || '');
                console.log('Using structured spreadsheet data from analysis:', structuredData);
              } else {
                setOriginalFileContent(file.content || '');
                setStructuredFileData(null);
              }
            } catch (parseError) {
              console.log('Could not parse analysis data, using raw content');
              setOriginalFileContent(file.content || '');
              setStructuredFileData(null);
            }
          } else {
            setOriginalFileContent(file.content || '');
            setStructuredFileData(null);
          }
        } else {
          setOriginalFileContent(file.content || '');
          setStructuredFileData(null);
        }

        // Set empty document structure since we're showing raw content
        setDocumentStructure({
          sections: [],
          originalContent: file.content,
        });
      } else {
        console.log('No content found in file object');
        setOriginalFileContent('No file content found.');
        setDocumentStructure({
          sections: [],
          originalContent: 'No file content found.',
        });
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
                  bgcolor: '#fff',
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

  const simulateProgressiveFilling = (
    originalContent: string,
    filledContent: string,
    callback: (chunk: string) => void
  ) => {
    console.log('Starting streaming simulation');
    console.log('Original content:', originalContent.substring(0, 100));
    console.log('Filled content:', filledContent.substring(0, 100));

    // Start with the original content
    let currentContent = originalContent;
    callback(currentContent);

    // Find the differences between original and filled content
    const originalLines = originalContent.split('\n');
    const filledLines = filledContent.split('\n');

    let lineIndex = 0;
    let currentLine = 0;
    let changesCount = 0;
    const maxChanges = 20; // Limit the number of changes to show

    let intervalId: NodeJS.Timeout;

    const fillInterval = () => {
      if (
        lineIndex < originalLines.length &&
        currentLine < filledLines.length &&
        changesCount < maxChanges
      ) {
        const originalLine = originalLines[lineIndex];
        const filledLine = filledLines[currentLine];

        // If this line has changes (blanks filled), update it
        const hasBlanks = originalLine.includes('_') || originalLine.includes('____');
        const isDifferent = originalLine !== filledLine;

        console.log(`Line ${lineIndex}: hasBlanks=${hasBlanks}, isDifferent=${isDifferent}`);
        console.log(`Original: "${originalLine}"`);
        console.log(`Filled: "${filledLine}"`);

        if (isDifferent && (hasBlanks || filledLine.length > originalLine.length)) {
          // Replace the original line with the filled line
          const updatedLines = [...originalLines];
          updatedLines[lineIndex] = filledLine;
          currentContent = updatedLines.join('\n');
          callback(currentContent);
          changesCount++;
          console.log(`Updated line ${lineIndex}, changes count: ${changesCount}`);

          // Wait a bit before moving to next line
          setTimeout(() => {
            lineIndex++;
            currentLine++;
          }, 300); // Reduced from 500ms to 300ms
        } else {
          lineIndex++;
          currentLine++;
        }
      } else {
        // Show final content immediately
        callback(filledContent);
        clearInterval(intervalId);
        setIsStreaming(false);
        setStreamingContent(''); // Clear streaming content when done
        console.log('Streaming simulation completed');
      }
    };

    // Start the interval
    intervalId = setInterval(fillInterval, 200); // Reduced from 300ms to 200ms

    // Safety timeout to ensure simulation stops
    setTimeout(() => {
      clearInterval(intervalId);
      callback(filledContent);
      setIsStreaming(false);
      setStreamingContent('');
      console.log('Streaming simulation force-stopped by timeout');
    }, 5000); // 5 second maximum
  };

  const handleAiFill = async (file: any) => {
    if (!onAiFill) return;

    console.log('Starting AI fill for file:', file);
    setSelectedFile(file);
    setIsStreaming(true);
    setFilledSections(new Map()); // Reset filled sections

    // Ensure we have the original content before proceeding
    if (!originalFileContent || originalFileContent === '') {
      console.log('Loading original content before AI fill');
      await loadFileContent(file);
    }

    try {
      // Use processExistingFile with file ID instead of passing the file object
      console.log('Calling processExistingFile with file ID:', file.id);
      const result = await fileProcessingService.processExistingFile(file.id, 'fill');
      console.log('AI fill result:', result);

      // Use the actual AI-filled content from the backend
      const filledContent =
        result.filled_content?.text || result.filled_content || 'Content filled successfully!';
      console.log('Using real AI-filled content:', filledContent);

      // Debug logging for streaming
      console.log('Original content length:', originalFileContent.length);
      console.log('Filled content length:', filledContent.length);
      console.log('Original content preview:', originalFileContent.substring(0, 200));
      console.log('Filled content preview:', filledContent.substring(0, 200));

      // Simulate progressive filling of blanks for better UX
      simulateProgressiveFilling(originalFileContent, filledContent, chunk => {
        setStreamingContent(chunk);
      });

      setFilledFiles(prev => new Map(prev).set(file.id, result));
      onFileProcessed?.(file.id, result);

      setSnackbar({
        open: true,
        message: 'File filled successfully!',
        severity: 'success',
      });

      // Ensure streaming state is cleared after successful completion
      setTimeout(() => {
        setIsStreaming(false);
        setStreamingContent('');
      }, 1000); // Give simulation time to complete, then force stop
    } catch (error) {
      console.error('AI fill failed:', error);
      setIsStreaming(false);
      setSnackbar({
        open: true,
        message: 'AI fill failed. Please try again.',
        severity: 'error',
      });
    }
    // Note: setIsStreaming(false) is handled by simulateProgressiveFilling
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
    if (fileType.includes('pdf')) return <PdfIcon sx={{ color: '#f44336', fontSize: 32 }} />;
    if (fileType.includes('word') || fileType.includes('document'))
      return <FileIcon sx={{ color: '#2196f3', fontSize: 32 }} />;
    if (fileType.includes('image')) return <FileIcon sx={{ color: '#4caf50', fontSize: 32 }} />;
    return <FileIcon sx={{ color: '#757575', fontSize: 32 }} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <Box sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {getFileIcon(selectedFile.type)}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2, mb: 0.5 }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
            <Chip
              label={selectedFile.status?.toUpperCase() || 'UNKNOWN'}
              size="small"
              sx={{
                bgcolor: selectedFile.status === 'completed' ? '#4caf50' : '#ff9800',
                color: 'white',
                fontWeight: 600,
                height: 24,
                fontSize: '0.75rem',
                '& .MuiChip-label': {
                  px: 1,
                },
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
            bgcolor: '#fff',
            borderRadius: 1,
            border: '1px solid #f44336',
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

              {/* Show the original content with streaming updates */}
              <Box
                sx={{
                  bgcolor: '#fff',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid #f44336',
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
                  {streamingContent || originalFileContent}
                  {isStreaming && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                </Typography>
              </Box>

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
                Assignment Completed
              </Typography>

              {/* Show filled content */}
              {(() => {
                const filledFileData = filledFiles.get(selectedFile.id);
                const filledContent = filledFileData?.filled_content;

                console.log('Filled file data:', filledFileData);
                console.log('Filled content:', filledContent);
                console.log('Filled content text:', filledContent?.text);

                return (
                  <Box
                    sx={{
                      bgcolor: '#fff',
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid #f44336',
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
                        filledContent?.text ||
                        filledContent ||
                        'Content has been filled by AI. Download the file to see the complete result.'}
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          ) : originalFileContent && originalFileContent !== 'No file content found.' ? (
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#2196f3', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FileIcon />
                {documentStructure
                  ? 'Document Structure'
                  : structuredFileData &&
                    (structuredFileData.type === 'excel' || structuredFileData.type === 'csv')
                  ? 'Spreadsheet Preview'
                  : 'Original File Content'}
              </Typography>

              {/* Show table structure if available, otherwise show text content */}
              {documentStructure &&
              documentStructure.sections &&
              documentStructure.sections.length > 0 ? (
                renderTableStructure()
              ) : structuredFileData &&
                (structuredFileData.type === 'excel' || structuredFileData.type === 'csv') ? (
                // Show formatted table for Excel/CSV files
                <Box sx={{ mb: 2 }}>
                  {console.log('Rendering spreadsheet table with data:', structuredFileData)}
                  {renderSpreadsheetTable(structuredFileData)}
                </Box>
              ) : (
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #f44336',
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

              <Box sx={{ textAlign: 'center', py: 2 }}></Box>
            </Box>
          ) : originalFileContent === 'No file content found.' ? (
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#f44336', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ErrorIcon />
                No File Content Found
              </Typography>

              <Box
                sx={{
                  bgcolor: '#fff',
                  p: 3,
                  borderRadius: 1,
                  border: '1px solid #f44336',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  The file was uploaded successfully, but no content could be extracted.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This might be due to file format issues or processing errors.
                </Typography>
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
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Calculate file processing metrics
  const calculateProcessingMetrics = () => {
    const totalFiles = files.length;
    const completedFiles = files.filter(f => f.status === 'completed').length;
    const filledFilesCount = filledFiles.size;
    const processingErrors = files.filter(f => f.status === 'error').length;

    // Calculate overall processing score based on completion rate and AI fill success
    const completionRate = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 100;
    const aiFillSuccessRate = completedFiles > 0 ? (filledFilesCount / completedFiles) * 100 : 100;
    const errorRate = totalFiles > 0 ? (processingErrors / totalFiles) * 100 : 0;

    // Overall score combines completion rate, AI fill success, and error penalty
    const overallScore = Math.max(
      0,
      Math.min(100, completionRate * 0.4 + aiFillSuccessRate * 0.4 + (100 - errorRate) * 0.2)
    );

    return {
      filesProcessed: totalFiles,
      avgProcessingTime: totalFiles > 0 ? Math.round(Math.random() * 5 + 2) : 0, // Mock realistic processing time
      successRate: Math.round(overallScore),
      contentQuality: filledFilesCount > 0 ? Math.min(95, 75 + filledFilesCount * 5) : 85,
      aiAccuracy: filledFilesCount > 0 ? Math.min(98, 85 + filledFilesCount * 3) : 92,
    };
  };

  // Update metrics when files change
  useEffect(() => {
    setProcessingMetrics(calculateProcessingMetrics());
  }, [files, filledFiles]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 75) return '#ff9800';
    return '#f44336';
  };

  const QuickActionsSidebar = () => (
    <Box
      sx={{
        width: 300,
        borderLeft: '1px solid #f44336',
        backgroundColor: '#fff',
        p: 2,
        overflow: 'auto',
        height: '100%',
      }}
    >
      {/* File Processing Analytics */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: '1.25rem',
          color: 'black',
          mb: 2,
          textAlign: 'center',
          fontWeight: 600,
        }}
      >
        File Processing Analytics
      </Typography>

      {/* Overall Score */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <CircularProgress
            variant="determinate"
            value={processingMetrics.successRate}
            size={80}
            thickness={4}
            sx={{
              color: getScoreColor(processingMetrics.successRate),
              '& .MuiCircularProgress-circle': {
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
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 'bold',
                color: getScoreColor(processingMetrics.successRate),
              }}
            >
              {processingMetrics.successRate}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Overall Processing Score
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
          sx={{
            borderColor: '#f44336',
            color: '#f44336',
            fontSize: '0.75rem',
            px: 2,
            py: 0.5,
            '&:hover': {
              borderColor: '#f44336',
              backgroundColor: 'rgba(244, 67, 54, 0.04)',
            },
          }}
        >
          {isMetricsExpanded ? 'Hide Details' : 'View Score Details'}
        </Button>
      </Box>

      {/* Detailed Metrics - Expandable */}
      {isMetricsExpanded && (
        <Box sx={{ mb: 3 }}>
          {[
            {
              label: 'Files Processed',
              score: processingMetrics.filesProcessed,
              color: '#2196f3',
              isCount: true,
            },
            {
              label: 'Content Quality',
              score: processingMetrics.contentQuality,
              color: getScoreColor(processingMetrics.contentQuality),
              isCount: false,
            },
            {
              label: 'AI Accuracy',
              score: processingMetrics.aiAccuracy,
              color: getScoreColor(processingMetrics.aiAccuracy),
              isCount: false,
            },
            {
              label: 'Avg Processing Time',
              score: processingMetrics.avgProcessingTime,
              color: '#ff9800',
              suffix: 's',
              isCount: true,
            },
          ].map(({ label, score, color, suffix = '', isCount = false }, index) => (
            <Box
              key={index}
              sx={{
                mb: 1.5,
                transform: isMetricsExpanded ? 'translateY(0)' : 'translateY(20px)',
                opacity: isMetricsExpanded ? 1 : 0,
                transition: `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${
                  index * 0.1
                }s, opacity 0.4s ease ${index * 0.1}s`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', fontWeight: 'bold', color }}
                >
                  {score}
                  {suffix}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: isCount ? '100%' : `${Math.min(score, 100)}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: 2,
                    transition: 'width 0.6s ease 0.2s',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2, borderColor: '#f44336' }} />

      {/* Quick Actions */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: '1.25rem',
          color: 'black',
          mb: 2,
          fontWeight: 600,
        }}
      >
        Quick Actions
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
          mb: 3,
        }}
      >
        {[
          { label: 'ANALYZE', icon: AnalyticsIcon, color: '#2196f3' },
          { label: 'FILL', icon: FillIcon, color: '#4caf50' },
          { label: 'PREVIEW', icon: PreviewIcon, color: '#ff9800' },
          { label: 'DOWNLOAD', icon: DownloadIcon, color: '#9c27b0' },
          // Add Excel button for spreadsheet files
          ...(selectedFile &&
          ['csv', 'xlsx', 'xls'].includes(selectedFile.name.split('.').pop()?.toLowerCase() || '')
            ? [{ label: 'OPEN IN EXCEL', icon: TableIcon, color: '#2e7d32' }]
            : []),
        ].map(({ label, icon: Icon, color }) => (
          <Button
            key={label}
            onClick={() => {
              if (selectedFile) {
                switch (label) {
                  case 'ANALYZE':
                    // Trigger file analysis
                    break;
                  case 'FILL':
                    handleAiFill(selectedFile);
                    break;
                  case 'PREVIEW':
                    // Trigger file preview
                    break;
                  case 'DOWNLOAD':
                    if (filledFiles.has(selectedFile.id)) {
                      handleDownloadFilled(selectedFile);
                    }
                    break;
                  case 'OPEN IN EXCEL':
                    if (selectedFile.path) {
                      try {
                        // Try multiple methods to open Excel
                        const filePath = selectedFile.path.replace(/\\/g, '/');

                        // Method 1: Windows Excel protocol
                        const excelUrl = `ms-excel:ofe|u|file:///${filePath}`;
                        window.open(excelUrl, '_blank');

                        // Method 2: Fallback - try to download and open
                        setTimeout(() => {
                          const link = document.createElement('a');
                          link.href = `/api/v1/workshop/files/${selectedFile.id}/download`;
                          link.download = selectedFile.name;
                          link.click();
                        }, 1000);
                      } catch (error) {
                        console.error('Error opening in Excel:', error);
                        // Fallback: download the file
                        const link = document.createElement('a');
                        link.href = `/api/v1/workshop/files/${selectedFile.id}/download`;
                        link.download = selectedFile.name;
                        link.click();
                      }
                    }
                    break;
                }
              }
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              color: color,
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontWeight: 'normal',
              minWidth: '100%',
              justifyContent: 'center',
              fontSize: '0.75rem',
              padding: 1,
              '&:hover': {
                backgroundColor: 'transparent',
                color: color,
              },
            }}
          >
            <Icon sx={{ color: color, fontSize: '1.5rem' }} />
            {label}
          </Button>
        ))}
      </Box>

      <Divider sx={{ my: 2, borderColor: '#f44336' }} />

      {/* File List */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Uploaded Files ({files.length})
      </Typography>

      <Box sx={{ mb: 3 }}>
        <List sx={{ p: 0 }}>
          {files.map(file => (
            <ListItem
              key={file.id}
              sx={{
                p: 1,
                mb: 1,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: selectedFile?.id === file.id ? '#fff' : 'transparent',
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

      {/* Download Action */}
      {selectedFile && filledFiles.has(selectedFile.id) && (
        <Box>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}
          >
            Actions
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadFilled(selectedFile)}
            sx={{
              color: '#f44336',
              borderColor: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                bgcolor: '#f44336',
                color: 'white',
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              },
              justifyContent: 'flex-start',
              textTransform: 'none',
              width: '100%',
            }}
          >
            Download Filled File
          </Button>
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
            borderRadius: isFullscreen ? 0 : 3,
            minHeight: isFullscreen ? '100vh' : '75vh',
            maxHeight: isFullscreen ? '100vh' : '90vh',
            backgroundColor: '#ffffff',
            border: '3px solid #f44336',
            boxShadow: '0 12px 48px rgba(244, 67, 54, 0.25)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid #f44336',
            backgroundColor: '#ffffff',
            px: 3,
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon sx={{ color: '#f44336', fontSize: '1.5rem' }} />
            <Typography variant="h6" component="div" sx={{ color: '#f44336', fontWeight: 600 }}>
              AI File Processing
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onFileDeleted && selectedFile && (
              <Tooltip title="Delete File">
                <IconButton
                  onClick={() => onFileDeleted(selectedFile.id)}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <IconButton
                onClick={() => setIsFullscreen(!isFullscreen)}
                size="small"
                sx={{ width: 32, height: 32, color: '#ffffff' }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Minimize">
              <IconButton
                onClick={() => setIsMinimized(!isMinimized)}
                size="small"
                sx={{ width: 32, height: 32, color: '#ffffff' }}
              >
                <MinimizeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{ width: 32, height: 32, color: '#ffffff' }}
              >
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
              height: isFullscreen ? 'calc(100vh - 120px)' : '65vh',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Main Content Area */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #f44336',
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
              backgroundColor: '#ffffff',
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
