import {
  AutoAwesome,
  Calculate,
  CameraAlt,
  CheckCircle,
  Description,
  DocumentScanner,
  ExpandMore,
  Functions,
  Info,
  PhotoCamera,
  QuestionAnswer,
  Refresh,
  Upload,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';

interface AnalysisResult {
  answer: string;
  extracted_text: string;
  image_analysis: any;
  confidence: string;
}

interface MathSolution {
  problem: string;
  solution_steps: string[];
  answer: string;
  explanation: string;
  difficulty: string;
}

interface DocumentAnalysis {
  document_type: string;
  main_topic: string;
  key_points: string[];
  summary: string;
  suggestions: string[];
  word_count: number;
  extracted_text: string;
}

const ImageToAnswer: React.FC = () => {
  const { user } = useAuth();
  const snackbarContext = useContext(SnackbarContext);
  const showSnackbar = snackbarContext?.showSnackbar || (() => {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [mathSolution, setMathSolution] = useState<MathSolution | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please select an image file', 'error');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setMathSolution(null);
      setDocumentAnalysis(null);
      setImageType(null);
      setError(null);
    },
    [showSnackbar]
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleCameraCapture = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const detectImageType = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/v1/image-analysis/detect-type', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setImageType(result.image_type);
        return result.image_type;
      }
    } catch (err) {
      console.error('Error detecting image type:', err);
    }
    return 'other';
  }, [selectedFile, user?.id]);

  const analyzeImage = useCallback(async () => {
    if (!selectedFile) {
      showSnackbar('Please select an image first', 'error');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // First detect image type
      await detectImageType();

      const formData = new FormData();
      formData.append('image', selectedFile);
      if (question.trim()) {
        formData.append('question', question);
      }
      if (context.trim()) {
        formData.append('context', context);
      }

      const response = await fetch('/api/v1/image-analysis/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      showSnackbar('Image analyzed successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, question, context, user?.id, showSnackbar, detectImageType]);

  const solveMathProblem = useCallback(async () => {
    if (!selectedFile) {
      showSnackbar('Please select an image first', 'error');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/v1/image-analysis/solve-math', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to solve math problem');
      }

      const result = await response.json();
      setMathSolution(result.solution);
      showSnackbar('Math problem solved successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to solve math problem';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, user?.id, showSnackbar]);

  const extractTextDocument = useCallback(async () => {
    if (!selectedFile) {
      showSnackbar('Please select an image first', 'error');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/v1/image-analysis/extract-text', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text document');
      }

      const result = await response.json();
      setDocumentAnalysis(result.document);
      showSnackbar('Text document extracted successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract text document';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, user?.id, showSnackbar]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setQuestion('');
    setContext('');
    setAnalysisResult(null);
    setMathSolution(null);
    setDocumentAnalysis(null);
    setImageType(null);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, []);

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'math_problem':
        return <Calculate />;
      case 'text_document':
        return <Description />;
      case 'diagram':
        return <Info />;
      case 'handwritten_notes':
        return <Description />;
      case 'screenshot':
        return <PhotoCamera />;
      case 'photo':
        return <PhotoCamera />;
      default:
        return <Info />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700, color: '#D32F2F' }}
      >
        Image to Answer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload a photo of your problem and get instant answers. Perfect for math problems, document
        analysis, and general questions about images.
      </Typography>

      <Grid container spacing={4}>
        {/* Input Panel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content', border: '2px solid #D32F2F' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Upload Your Image
              </Typography>

              <Stack spacing={3}>
                {/* Image Upload Area */}
                <Box
                  sx={{
                    border: '2px dashed #D32F2F',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#B71C1C',
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                    },
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <Box>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '8px',
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Click to change image
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Upload sx={{ fontSize: 48, color: '#D32F2F', mb: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        Drag & drop an image here
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        or click to browse files
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  style={{ display: 'none' }}
                />

                {/* Camera Button */}
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{ borderColor: '#D32F2F', color: '#D32F2F' }}
                >
                  Take Photo
                </Button>

                {/* Question Input */}
                <TextField
                  fullWidth
                  label="Question (Optional)"
                  placeholder="Ask a specific question about the image..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  variant="outlined"
                  helperText="Leave empty for general analysis"
                />

                {/* Context Input */}
                <TextField
                  fullWidth
                  label="Context (Optional)"
                  placeholder="Provide additional context about the image..."
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  variant="outlined"
                  multiline
                  rows={2}
                  helperText="Help AI understand the context better"
                />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    onClick={analyzeImage}
                    disabled={isAnalyzing || !selectedFile}
                    startIcon={isAnalyzing ? <CircularProgress size={20} /> : <QuestionAnswer />}
                    sx={{
                      bgcolor: '#D32F2F',
                      '&:hover': { bgcolor: '#B71C1C' },
                      flex: 1,
                    }}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={solveMathProblem}
                    disabled={isAnalyzing || !selectedFile}
                    startIcon={<Functions />}
                    sx={{ borderColor: '#D32F2F', color: '#D32F2F' }}
                  >
                    Solve Math
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={extractTextDocument}
                    disabled={isAnalyzing || !selectedFile}
                    startIcon={<DocumentScanner />}
                    sx={{ borderColor: '#D32F2F', color: '#D32F2F' }}
                  >
                    Extract Text
                  </Button>

                  <Tooltip title="Reset form">
                    <IconButton onClick={handleReset} color="primary">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Error Display */}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Image Type Display */}
          {imageType && (
            <Card sx={{ mt: 2, border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Detected Image Type:
                </Typography>
                <Chip
                  icon={getImageTypeIcon(imageType)}
                  label={imageType.replace('_', ' ').toUpperCase()}
                  size="small"
                  color="primary"
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Output Panel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content', border: '2px solid #D32F2F' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Analysis Results
              </Typography>

              {isAnalyzing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={60} sx={{ color: '#D32F2F', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Analyzing your image...
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    This may take a few moments
                  </Typography>
                </Box>
              ) : analysisResult ? (
                <Box>
                  {/* General Analysis Results */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        General Analysis
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body1" paragraph>
                            {analysisResult.answer}
                          </Typography>
                        </Box>

                        {analysisResult.extracted_text && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Extracted Text:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography
                                variant="body2"
                                component="pre"
                                sx={{ whiteSpace: 'pre-wrap' }}
                              >
                                {analysisResult.extracted_text}
                              </Typography>
                            </Paper>
                          </Box>
                        )}

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Confidence:
                          </Typography>
                          <Chip
                            label={analysisResult.confidence.toUpperCase()}
                            color={getConfidenceColor(analysisResult.confidence) as any}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ) : mathSolution ? (
                <Box>
                  {/* Math Solution Results */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Math Solution
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Problem:
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {mathSolution.problem}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Solution Steps:
                          </Typography>
                          <List dense>
                            {mathSolution.solution_steps.map((step, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <CheckCircle color="primary" />
                                </ListItemIcon>
                                <ListItemText primary={step} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Answer:
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            {mathSolution.answer}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Explanation:
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {mathSolution.explanation}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Difficulty:
                          </Typography>
                          <Chip
                            label={mathSolution.difficulty.toUpperCase()}
                            color={
                              mathSolution.difficulty === 'easy'
                                ? 'success'
                                : mathSolution.difficulty === 'medium'
                                ? 'warning'
                                : 'error'
                            }
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ) : documentAnalysis ? (
                <Box>
                  {/* Document Analysis Results */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Document Analysis
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Document Type:
                          </Typography>
                          <Chip label={documentAnalysis.document_type.toUpperCase()} size="small" />
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Main Topic:
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {documentAnalysis.main_topic}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Key Points:
                          </Typography>
                          <List dense>
                            {documentAnalysis.key_points.map((point, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <Info color="primary" />
                                </ListItemIcon>
                                <ListItemText primary={point} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Summary:
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {documentAnalysis.summary}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Word Count:
                          </Typography>
                          <Typography variant="body1">
                            {documentAnalysis.word_count} words
                          </Typography>
                        </Box>

                        {documentAnalysis.suggestions.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Suggestions:
                            </Typography>
                            <List dense>
                              {documentAnalysis.suggestions.map((suggestion, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <AutoAwesome color="primary" />
                                  </ListItemIcon>
                                  <ListItemText primary={suggestion} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {documentAnalysis.extracted_text && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Extracted Text:
                            </Typography>
                            <Paper
                              sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}
                            >
                              <Typography
                                variant="body2"
                                component="pre"
                                sx={{ whiteSpace: 'pre-wrap' }}
                              >
                                {documentAnalysis.extracted_text}
                              </Typography>
                            </Paper>
                          </Box>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 8,
                    border: '2px dashed #e0e0e0',
                    borderRadius: 2,
                  }}
                >
                  <QuestionAnswer sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Your analysis results will appear here
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 1 }}
                  >
                    Upload an image and click analyze to get started
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tips Section */}
      <Card sx={{ mt: 4, border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            💡 Tips for Better Results
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                For Math Problems:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Ensure equations are clearly visible
                <br />
                • Include the full problem statement
                <br />• Use good lighting for handwritten problems
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                For Documents:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Align the document properly
                <br />
                • Ensure text is readable
                <br />• Avoid shadows and glare
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                For General Questions:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Be specific in your question
                <br />
                • Provide relevant context
                <br />• Focus on one aspect at a time
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ImageToAnswer;
