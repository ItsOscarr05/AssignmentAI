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
  const [supportedFormats, setSupportedFormats] = useState<SupportedFormat[]>([]);
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
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
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
      const blob = await fileProcessingService.downloadFilledFile(fillResult.file_id);
      fileProcessingService.downloadFile(blob, fillResult.filled_file_name);
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
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
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
              <Typography
                variant="body2"
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}
              >
                {JSON.stringify(previewResult.preview_content, null, 2)}
              </Typography>
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
