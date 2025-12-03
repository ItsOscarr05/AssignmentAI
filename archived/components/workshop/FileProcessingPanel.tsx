import {
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  FileUpload as FileUploadIcon,
  AutoFixHigh as FillIcon,
  Info as InfoIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileAnalysisResult,
  FileFillResult,
  FilePreviewResult,
  fileProcessingService,
  SupportedFormat,
} from '../../services/fileProcessingService';

interface FileProcessingPanelProps {
  onFileProcessed?: (result: FileFillResult) => void;
  onClose?: () => void;
}

const FileProcessingPanel: React.FC<FileProcessingPanelProps> = ({ onFileProcessed, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(null);
  const [fillResult, setFillResult] = useState<FileFillResult | null>(null);
  const [previewResult, setPreviewResult] = useState<FilePreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_supportedFormats, setSupportedFormats] = useState<SupportedFormat[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load supported formats on component mount
  React.useEffect(() => {
    const loadSupportedFormats = async () => {
      try {
        const formats = await fileProcessingService.getSupportedFormats();
        setSupportedFormats(formats.supported_formats);
      } catch (err) {
        console.error('Failed to load supported formats:', err);
      }
    };
    loadSupportedFormats();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const validation = fileProcessingService.validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
        setCurrentStep(1);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Document formats - Word documents only (.doc, .docx)
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],

      // Spreadsheet formats - Excel files only (.xls, .xlsx), NOT CSV
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],

      // Data formats
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],

      // Code formats
      'text/x-python': ['.py'],
      'text/javascript': ['.js'],
      'text/x-java-source': ['.java'],
      'text/x-c++src': ['.cpp'],
      'text/x-csrc': ['.c'],
      'text/html': ['.html'],
      'text/css': ['.css'],

      // Image formats
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff'],
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fileProcessingService.analyzeFile(selectedFile);
      setAnalysisResult(result);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze file');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewFile = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fileProcessingService.previewFile(selectedFile);
      setPreviewResult(result);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleFillFile = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fileProcessingService.fillFile(selectedFile);
      setFillResult(result);
      setCurrentStep(3);
      onFileProcessed?.(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fill file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fillResult) return;

    try {
      const filename = fillResult.filled_file_name;
      const fileExtension = filename?.split('.').pop()?.toLowerCase();

      // Check if it's an Excel file
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Use the special Excel download method
        await fileProcessingService.downloadAndOpenExcel(fillResult.file_id);
      } else {
        // Use the regular download method for other file types
        const { blob, filename: backendFilename } = await fileProcessingService.downloadFilledFile(
          fillResult.file_id
        );
        fileProcessingService.downloadFile(blob, backendFilename);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download file');
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedFile(null);
    setAnalysisResult(null);
    setFillResult(null);
    setPreviewResult(null);
    setError(null);
  };

  // Render Excel-style preview (similar to FileUploadModal)
  const renderExcelPreview = (previewContent: any) => {
    // Generate column letters (A, B, C, D, etc.)
    const getColumnLetter = (index: number) => {
      let result = '';
      while (index >= 0) {
        result = String.fromCharCode(65 + (index % 26)) + result;
        index = Math.floor(index / 26) - 1;
      }
      return result;
    };

    // Create a full Excel-like grid: 26 columns (A-Z) and 100 rows (1-100)
    const COLUMNS = 26;
    const ROWS = 100;

    // Extract actual data if available
    let actualHeaders: string[] = [];
    let actualRows: any[] = [];

    if (previewContent.sheets) {
      // Excel format with sheets
      const firstSheetName = Object.keys(previewContent.sheets)[0];
      const sheetData = previewContent.sheets[firstSheetName];
      actualHeaders = sheetData.headers || [];
      actualRows = sheetData.rows || [];
    } else if (previewContent.headers) {
      // CSV format
      actualHeaders = previewContent.headers;
      actualRows = previewContent.rows || [];
    }

    // Create a data map for quick lookup of actual values
    const dataMap = new Map();
    actualRows.forEach((row: any, rowIndex: number) => {
      actualHeaders.forEach((header: string, colIndex: number) => {
        const cellValue = row[header];
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          dataMap.set(`${rowIndex}_${colIndex}`, cellValue);
        }
      });
    });

    return (
      <Box>
        <Box
          sx={{
            border: '2px solid #d0d7de',
            borderRadius: '4px',
            overflow: 'auto',
            backgroundColor: '#ffffff',
            maxHeight: 380,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            '&::-webkit-scrollbar': {
              width: '12px',
              height: '12px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '6px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}
        >
          {/* Column Headers Row */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #d0d7de' }}>
            {/* Empty cell for row numbers column */}
            <Box
              sx={{
                width: 45,
                height: 28,
                backgroundColor: '#f1f3f4',
                borderRight: '2px solid #d0d7de',
                borderBottom: '2px solid #d0d7de',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#5f6368',
                position: 'sticky',
                left: 0,
                zIndex: 2,
                minWidth: 45,
                flexShrink: 0,
              }}
            >
              {/* Empty top-left corner */}
            </Box>

            {/* Column letters A-Z */}
            {Array.from({ length: COLUMNS }, (_, index) => (
              <Box
                key={index}
                sx={{
                  minWidth: 120,
                  width: 120,
                  height: 28,
                  backgroundColor: '#f1f3f4',
                  borderRight: '1px solid #d0d7de',
                  borderBottom: '2px solid #d0d7de',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#5f6368',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  flexShrink: 0,
                }}
              >
                {getColumnLetter(index)}
              </Box>
            ))}
          </Box>

          {/* Data Rows 1-100 */}
          {Array.from({ length: ROWS }, (_, rowIndex) => (
            <Box key={rowIndex} sx={{ display: 'flex' }}>
              {/* Row number */}
              <Box
                sx={{
                  width: 45,
                  height: 24,
                  backgroundColor: '#f8f9fa',
                  borderRight: '2px solid #d0d7de',
                  borderBottom: '1px solid #d0d7de',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#5f6368',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  minWidth: 45,
                  flexShrink: 0,
                }}
              >
                {String(rowIndex + 1).padStart(2, ' ')}
              </Box>

              {/* Data cells A-Z */}
              {Array.from({ length: COLUMNS }, (_, colIndex) => {
                // Check if this cell has actual data
                const hasData = dataMap.has(`${rowIndex}_${colIndex}`);
                const cellValue = hasData ? dataMap.get(`${rowIndex}_${colIndex}`) : '';

                return (
                  <Box
                    key={colIndex}
                    sx={{
                      minWidth: 120,
                      width: 120,
                      height: 24,
                      backgroundColor: hasData ? '#ffffff' : '#fafbfc',
                      borderRight: '1px solid #e1e4e8',
                      borderBottom: '1px solid #e1e4e8',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      fontSize: '11px',
                      color: hasData ? '#24292f' : '#8b949e',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'text',
                      flexShrink: 0,
                      // Right-align numbers, left-align text
                      justifyContent: typeof cellValue === 'number' ? 'flex-end' : 'flex-start',
                      '&:hover': {
                        backgroundColor: hasData ? '#f6f8fa' : '#f1f3f4',
                      },
                      // Highlight cells with data
                      ...(hasData
                        ? {
                            border: '1px solid #d0d7de',
                            backgroundColor: '#ffffff',
                          }
                        : {}),
                    }}
                  >
                    {cellValue || ''}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const steps = [
    {
      label: 'Upload File',
      description: 'Select a file to process',
    },
    {
      label: 'Analyze File',
      description: 'AI will identify fillable sections',
    },
    {
      label: 'Fill Content',
      description: 'AI will fill in the identified sections',
    },
    {
      label: 'Download',
      description: 'Download your completed file',
    },
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h5" component="h2">
              AI File Filling
            </Typography>
            {onClose && (
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a document and let AI automatically fill in blank sections, complete incomplete
            content, and generate appropriate text based on context.
          </Typography>

          <Stepper activeStep={currentStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>

                  {index === 0 && (
                    <Box
                      {...getRootProps()}
                      sx={{
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'grey.300',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <input {...getInputProps()} ref={fileInputRef} />
                      <FileUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        {isDragActive
                          ? 'Drop the file here'
                          : 'Drag & drop a file here, or click to select'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supported formats: PDF, DOCX, TXT, CSV, XLSX, JSON, XML
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Max file size: 100MB
                      </Typography>
                    </Box>
                  )}

                  {index === 1 && selectedFile && (
                    <Box>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Selected File: {selectedFile.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Size: {fileProcessingService.formatFileSize(selectedFile.size)}
                          </Typography>
                        </CardContent>
                      </Card>
                      <Button
                        variant="contained"
                        onClick={handleAnalyzeFile}
                        disabled={loading}
                        startIcon={<InfoIcon />}
                        sx={{ mr: 1 }}
                      >
                        {loading ? 'Analyzing...' : 'Analyze File'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handlePreviewFile}
                        disabled={loading}
                        startIcon={<PreviewIcon />}
                      >
                        Preview
                      </Button>
                    </Box>
                  )}

                  {index === 2 && analysisResult && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Found {analysisResult.fillable_sections.length} sections that can be filled
                      </Alert>

                      {analysisResult.fillable_sections.length > 0 && (
                        <List dense>
                          {analysisResult.fillable_sections.map((section, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <CheckIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  section.text.substring(0, 100) +
                                  (section.text.length > 100 ? '...' : '')
                                }
                                secondary={`Type: ${section.type} • Confidence: ${Math.round(
                                  section.confidence * 100
                                )}%`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}

                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleFillFile}
                          disabled={loading || analysisResult.fillable_sections.length === 0}
                          startIcon={<FillIcon />}
                          sx={{ mr: 1 }}
                        >
                          {loading ? 'Filling...' : 'Fill File'}
                        </Button>
                        <Button variant="outlined" onClick={handleReset}>
                          Start Over
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {index === 3 && fillResult && (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Successfully filled {fillResult.sections_filled} sections!
                      </Alert>

                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Original: {fillResult.file_name}
                          </Typography>
                          <Typography variant="subtitle1" gutterBottom>
                            Filled: {fillResult.filled_file_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Sections filled: {fillResult.sections_filled}
                          </Typography>
                        </CardContent>
                      </Card>

                      {/* Show filled content preview */}
                      {fillResult.text && (
                        <Card variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Filled Content Preview
                            </Typography>
                            <Typography
                              variant="body2"
                              component="pre"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace',
                                lineHeight: 1.6,
                                color: '#333',
                                maxHeight: '300px',
                                overflow: 'auto',
                                backgroundColor: '#f5f5f5',
                                p: 2,
                                borderRadius: 1,
                              }}
                            >
                              {fillResult.text}
                            </Typography>
                          </CardContent>
                        </Card>
                      )}

                      <Box>
                        <Button
                          variant="contained"
                          onClick={handleDownload}
                          startIcon={<DownloadIcon />}
                          sx={{ mr: 1 }}
                        >
                          Download Filled File
                        </Button>
                        <Button variant="outlined" onClick={handleReset}>
                          Process Another File
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {loading && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Processing your file...
                      </Typography>
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {previewResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {previewResult.file_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {previewResult.sections_to_fill} sections will be filled
              </Typography>
              <Divider sx={{ my: 2 }} />

              {/* Check if this is an Excel/CSV file and render accordingly */}
              {previewResult.preview_content &&
              (previewResult.file_name?.toLowerCase().includes('.xlsx') ||
                previewResult.file_name?.toLowerCase().includes('.csv') ||
                previewResult.file_name?.toLowerCase().includes('.xls')) ? (
                <Box>
                  {/* Render Excel-style grid if available */}
                  {previewResult.preview_content.sheets || previewResult.preview_content.headers ? (
                    renderExcelPreview(previewResult.preview_content)
                  ) : (
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}
                    >
                      {JSON.stringify(previewResult.preview_content, null, 2)}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}
                >
                  {JSON.stringify(previewResult.preview_content, null, 2)}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowPreview(false);
              handleFillFile();
            }}
          >
            Fill File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileProcessingPanel;
