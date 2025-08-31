import {
  Analytics,
  AutoAwesomeOutlined,
  ContentCopy,
  Download,
  ExpandMore,
  Lightbulb,
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureAccessErrorComponent } from '../workshop/FeatureAccessError';

interface SummarizationResult {
  summary: string;
  insights: string[];
  metrics: {
    original_words: number;
    summary_words: number;
    compression_ratio: number;
    information_density: number;
    readability_score: number;
    readability_level: string;
  };
  summary_type: string;
  original_length: number;
  summary_length: number;
  compression_ratio: number;
}

interface MultiDocumentResult {
  individual_summaries: Array<{
    title: string;
    summary: SummarizationResult;
  }>;
  comparative_analysis: string;
  total_documents: number;
  summary_type: string;
}

const SmartSummarization: React.FC = () => {
  const [content, setContent] = useState('');
  const [summaryType, setSummaryType] = useState('comprehensive');
  const [maxLength, setMaxLength] = useState<number | ''>('');
  const [includeInsights, setIncludeInsights] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummarizationResult | null>(null);
  const [multiDocResult, setMultiDocResult] = useState<MultiDocumentResult | null>(null);
  const [documents, setDocuments] = useState<Array<{ title: string; content: string }>>([]);
  const [mode, setMode] = useState<'single' | 'multi'>('single');

  const { enqueueSnackbar } = useSnackbar();
  const { hasAccess, currentPlan } = useFeatureAccess('smart_content_summarization');

  const summaryTypes = [
    { value: 'comprehensive', label: 'Comprehensive Summary' },
    { value: 'executive', label: 'Executive Summary' },
    { value: 'bullet_points', label: 'Bullet Points' },
    { value: 'key_insights', label: 'Key Insights Only' },
  ];

  const handleSummarize = async () => {
    if (!content.trim()) {
      enqueueSnackbar('Please enter content to summarize', { variant: 'warning' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setMultiDocResult(null);

    try {
      const response = await fetch('/api/v1/smart-features/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          summary_type: summaryType,
          max_length: maxLength || undefined,
          include_insights: includeInsights,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate summary');
      }

      const data = await response.json();
      setResult(data);
      enqueueSnackbar('Summary generated successfully!', { variant: 'success' });
    } catch (error: any) {
      console.error('Summarization error:', error);
      enqueueSnackbar(error.message || 'Failed to generate summary', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiDocumentSummarize = async () => {
    if (documents.length < 2) {
      enqueueSnackbar('Please add at least 2 documents to compare', { variant: 'warning' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setMultiDocResult(null);

    try {
      const response = await fetch('/api/v1/smart-features/summarize-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          documents: documents.map(doc => ({
            title: doc.title,
            content: doc.content,
          })),
          summary_type: summaryType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate multi-document summary');
      }

      const data = await response.json();
      setMultiDocResult(data);
      enqueueSnackbar('Multi-document summary generated successfully!', { variant: 'success' });
    } catch (error: any) {
      console.error('Multi-document summarization error:', error);
      enqueueSnackbar(error.message || 'Failed to generate multi-document summary', {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = () => {
    setDocuments([...documents, { title: '', content: '' }]);
  };

  const updateDocument = (index: number, field: 'title' | 'content', value: string) => {
    const updatedDocs = [...documents];
    updatedDocs[index][field] = value;
    setDocuments(updatedDocs);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copied to clipboard!', { variant: 'success' });
  };

  const downloadResult = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasAccess) {
    return (
      <FeatureAccessErrorComponent
        error={{
          error: 'Feature not available',
          feature: 'smart_content_summarization',
          current_plan: currentPlan,
          upgrade_message: `Upgrade to ${
            currentPlan === 'free' ? 'Plus' : currentPlan === 'plus' ? 'Pro' : 'Max'
          } plan to access Smart Content Summarization.`,
          upgrade_url: '/dashboard/price-plan',
        }}
        onUpgrade={() => window.open('/dashboard/price-plan', '_blank')}
        onDismiss={() => {}}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeOutlined color="primary" />
        Smart Content Summarization
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate intelligent content summarization with key insights and detailed metrics.
      </Typography>

      {/* Mode Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analysis Mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={mode === 'single' ? 'contained' : 'outlined'}
              onClick={() => setMode('single')}
            >
              Single Document
            </Button>
            <Button
              variant={mode === 'multi' ? 'contained' : 'outlined'}
              onClick={() => setMode('multi')}
            >
              Multiple Documents
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Summary Type</InputLabel>
                <Select
                  value={summaryType}
                  onChange={e => setSummaryType(e.target.value)}
                  label="Summary Type"
                >
                  {summaryTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Length (words)"
                type="number"
                value={maxLength}
                onChange={e => setMaxLength(e.target.value ? Number(e.target.value) : '')}
                placeholder="Auto"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Include Insights</InputLabel>
                <Select
                  value={includeInsights.toString()}
                  onChange={e => setIncludeInsights(e.target.value === 'true')}
                  label="Include Insights"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Content Input */}
      {mode === 'single' ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Content
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Enter the content you want to summarize..."
              variant="outlined"
            />
            <Box
              sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                {content.length} characters
              </Typography>
              <Button
                variant="contained"
                onClick={handleSummarize}
                disabled={isLoading || !content.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : <AutoAwesomeOutlined />}
              >
                {isLoading ? 'Generating...' : 'Generate Summary'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Multiple Documents
              <Button variant="outlined" size="small" onClick={addDocument} sx={{ ml: 2 }}>
                Add Document
              </Button>
            </Typography>

            {documents.map((doc, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">Document {index + 1}</Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => removeDocument(index)}
                  >
                    Remove
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label="Document Title"
                  value={doc.title}
                  onChange={e => updateDocument(index, 'title', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Document Content"
                  value={doc.content}
                  onChange={e => updateDocument(index, 'content', e.target.value)}
                />
              </Paper>
            ))}

            {documents.length === 0 && (
              <Alert severity="info">
                Click "Add Document" to start adding documents for comparison.
              </Alert>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleMultiDocumentSummarize}
                disabled={isLoading || documents.length < 2}
                startIcon={isLoading ? <CircularProgress size={20} /> : <AutoAwesomeOutlined />}
              >
                {isLoading ? 'Generating...' : 'Generate Multi-Document Summary'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Summary Results</Typography>
              <Box>
                <Button
                  startIcon={<ContentCopy />}
                  onClick={() => copyToClipboard(result.summary)}
                  sx={{ mr: 1 }}
                >
                  Copy
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={() => downloadResult(result, 'summary-result.json')}
                >
                  Download
                </Button>
              </Box>
            </Box>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AutoAwesomeOutlined />
                  Generated Summary
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.summary}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {result.insights && result.insights.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography
                    variant="subtitle1"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Lightbulb />
                    Key Insights
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {result.insights.map((insight, index) => (
                      <Chip
                        key={index}
                        label={insight}
                        variant="outlined"
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Analytics />
                  Analysis Metrics
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Content Statistics
                      </Typography>
                      <Typography variant="body2">
                        Original Words: {result.metrics.original_words}
                      </Typography>
                      <Typography variant="body2">
                        Summary Words: {result.metrics.summary_words}
                      </Typography>
                      <Typography variant="body2">
                        Compression Ratio: {(result.metrics.compression_ratio * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Quality Metrics
                      </Typography>
                      <Typography variant="body2">
                        Information Density: {result.metrics.information_density.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        Readability Score: {result.metrics.readability_score.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">
                        Readability Level: {result.metrics.readability_level}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {multiDocResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Multi-Document Analysis</Typography>
              <Button
                startIcon={<Download />}
                onClick={() => downloadResult(multiDocResult, 'multi-document-summary.json')}
              >
                Download
              </Button>
            </Box>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Comparative Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {multiDocResult.comparative_analysis}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {multiDocResult.individual_summaries.map((docSummary, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    {docSummary.title || `Document ${index + 1}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {docSummary.summary.summary}
                  </Typography>
                  {docSummary.summary.insights && docSummary.summary.insights.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Insights:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {docSummary.summary.insights.map((insight, insightIndex) => (
                          <Chip
                            key={insightIndex}
                            label={insight}
                            variant="outlined"
                            size="small"
                            color="secondary"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SmartSummarization;
