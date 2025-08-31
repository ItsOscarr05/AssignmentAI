import {
  Analytics,
  AutoAwesomeOutlined,
  Business,
  CheckCircle,
  Code,
  ContentCopy,
  Create,
  Download,
  ExpandMore,
  Info,
  Lightbulb,
  School,
  Search,
  TrendingUp,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

interface OptimizationResult {
  original_content: string;
  optimized_content: string;
  optimization_type: string;
  target_audience: string;
  content_purpose: string;
  content_analysis: {
    analysis_text: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
    basic_metrics: {
      word_count: number;
      sentence_count: number;
      paragraph_count: number;
      avg_sentence_length: number;
      avg_paragraph_length: number;
      reading_time_minutes: number;
    };
    optimization_type: string;
  };
  optimization_suggestions: Array<{
    title: string;
    content: string;
    category: string;
  }>;
  metrics: {
    original_metrics: {
      word_count: number;
      sentence_count: number;
      paragraph_count: number;
      avg_sentence_length: number;
      avg_paragraph_length: number;
      reading_time_minutes: number;
    };
    optimized_metrics: {
      word_count: number;
      sentence_count: number;
      paragraph_count: number;
      avg_sentence_length: number;
      avg_paragraph_length: number;
      reading_time_minutes: number;
    };
    improvements: {
      word_count_change_percent: number;
      sentence_count_change_percent: number;
      readability_improvement: number;
      engagement_improvement: number;
      overall_improvement_score: number;
    };
    comparison: {
      original_readability: number;
      optimized_readability: number;
      original_engagement: number;
      optimized_engagement: number;
    };
  };
  improvement_report: string;
  timestamp: string;
}

interface SEOOptimizationResult {
  original_content: string;
  seo_optimized_content: string;
  target_keywords: string[];
  content_type: string;
  seo_analysis: {
    analysis: string;
    target_keywords: string[];
    content_length: number;
  };
  seo_suggestions: string[];
  seo_metrics: {
    keyword_density: {
      original: number;
      optimized: number;
      improvement: number;
    };
    content_length: {
      original: number;
      optimized: number;
      change_percent: number;
    };
    readability: {
      original: number;
      optimized: number;
      improvement: number;
    };
    seo_score: number;
  };
  timestamp: string;
}

const AdvancedContentOptimization: React.FC = () => {
  const [content, setContent] = useState('');
  const [optimizationType, setOptimizationType] = useState('general');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentPurpose, setContentPurpose] = useState('');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [seoResult, setSeoResult] = useState<SEOOptimizationResult | null>(null);
  const [targetKeywords, setTargetKeywords] = useState<string[]>(['']);
  const [contentType, setContentType] = useState('article');
  const [mode, setMode] = useState<'general' | 'seo'>('general');
  const [activeTab, setActiveTab] = useState(0);

  const { enqueueSnackbar } = useSnackbar();
  const { hasAccess, currentPlan } = useFeatureAccess('advanced_content_optimization');

  const optimizationTypes = [
    { value: 'general', label: 'General Optimization', icon: <AutoAwesomeOutlined /> },
    { value: 'academic', label: 'Academic Writing', icon: <School /> },
    { value: 'business', label: 'Business Content', icon: <Business /> },
    { value: 'creative', label: 'Creative Writing', icon: <Create /> },
    { value: 'technical', label: 'Technical Content', icon: <Code /> },
  ];

  const contentPurposes = [
    { value: 'inform', label: 'Inform' },
    { value: 'persuade', label: 'Persuade' },
    { value: 'entertain', label: 'Entertain' },
    { value: 'educate', label: 'Educate' },
    { value: 'sell', label: 'Sell' },
  ];

  const contentTypes = [
    { value: 'article', label: 'Article' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'landing_page', label: 'Landing Page' },
    { value: 'product_description', label: 'Product Description' },
    { value: 'newsletter', label: 'Newsletter' },
  ];

  const handleOptimize = async () => {
    if (!content.trim()) {
      enqueueSnackbar('Please enter content to optimize', { variant: 'warning' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSeoResult(null);

    try {
      const response = await fetch('/api/v1/smart-features/optimize-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          optimization_type: optimizationType,
          target_audience: targetAudience || undefined,
          content_purpose: contentPurpose || undefined,
          include_metrics: includeMetrics,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to optimize content');
      }

      const data = await response.json();
      setResult(data);
      enqueueSnackbar('Content optimized successfully!', { variant: 'success' });
    } catch (error: any) {
      console.error('Optimization error:', error);
      enqueueSnackbar(error.message || 'Failed to optimize content', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSEOOptimize = async () => {
    if (!content.trim()) {
      enqueueSnackbar('Please enter content to optimize for SEO', { variant: 'warning' });
      return;
    }

    const validKeywords = targetKeywords.filter(k => k.trim());
    if (validKeywords.length === 0) {
      enqueueSnackbar('Please provide at least one target keyword', { variant: 'warning' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSeoResult(null);

    try {
      const response = await fetch('/api/v1/smart-features/optimize-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          target_keywords: validKeywords,
          content_type: contentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to optimize for SEO');
      }

      const data = await response.json();
      setSeoResult(data);
      enqueueSnackbar('SEO optimization completed successfully!', { variant: 'success' });
    } catch (error: any) {
      console.error('SEO optimization error:', error);
      enqueueSnackbar(error.message || 'Failed to optimize for SEO', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = () => {
    setTargetKeywords([...targetKeywords, '']);
  };

  const updateKeyword = (index: number, value: string) => {
    const updatedKeywords = [...targetKeywords];
    updatedKeywords[index] = value;
    setTargetKeywords(updatedKeywords);
  };

  const removeKeyword = (index: number) => {
    setTargetKeywords(targetKeywords.filter((_, i) => i !== index));
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

  const getImprovementColor = (score: number) => {
    if (score >= 20) return 'success';
    if (score >= 10) return 'warning';
    return 'error';
  };

  const getImprovementIcon = (score: number) => {
    if (score >= 20) return <CheckCircle />;
    if (score >= 10) return <TrendingUp />;
    return <Info />;
  };

  if (!hasAccess) {
    return (
      <FeatureAccessErrorComponent
        error={{
          error: 'Feature not available',
          feature: 'advanced_content_optimization',
          current_plan: currentPlan,
          upgrade_message: `Upgrade to Max plan to access Advanced Content Optimization.`,
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
        Advanced Content Optimization
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Optimize your content for maximum impact using AI-powered analysis and improvements.
      </Typography>

      {/* Mode Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimization Mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={mode === 'general' ? 'contained' : 'outlined'}
              onClick={() => setMode('general')}
              startIcon={<AutoAwesomeOutlined />}
            >
              General Optimization
            </Button>
            <Button
              variant={mode === 'seo' ? 'contained' : 'outlined'}
              onClick={() => setMode('seo')}
              startIcon={<Search />}
            >
              SEO Optimization
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
                <InputLabel>Optimization Type</InputLabel>
                <Select
                  value={optimizationType}
                  onChange={e => setOptimizationType(e.target.value)}
                  label="Optimization Type"
                >
                  {optimizationTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Target Audience"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="e.g., Students, Professionals"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Content Purpose</InputLabel>
                <Select
                  value={contentPurpose}
                  onChange={e => setContentPurpose(e.target.value)}
                  label="Content Purpose"
                >
                  {contentPurposes.map(purpose => (
                    <MenuItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {mode === 'general' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Include Metrics</InputLabel>
              <Select
                value={includeMetrics.toString()}
                onChange={e => setIncludeMetrics(e.target.value === 'true')}
                label="Include Metrics"
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          )}

          {mode === 'seo' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Target Keywords
              </Typography>
              {targetKeywords.map((keyword, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Keyword ${index + 1}`}
                    value={keyword}
                    onChange={e => updateKeyword(index, e.target.value)}
                    placeholder="Enter target keyword"
                  />
                  {targetKeywords.length > 1 && (
                    <Button variant="outlined" color="error" onClick={() => removeKeyword(index)}>
                      Remove
                    </Button>
                  )}
                </Box>
              ))}
              <Button variant="outlined" onClick={addKeyword} sx={{ mt: 1 }}>
                Add Keyword
              </Button>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  label="Content Type"
                >
                  {contentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Content Input */}
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
            placeholder="Enter the content you want to optimize..."
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
              onClick={mode === 'general' ? handleOptimize : handleSEOOptimize}
              disabled={isLoading || !content.trim()}
              startIcon={isLoading ? <CircularProgress size={20} /> : <AutoAwesomeOutlined />}
            >
              {isLoading ? 'Optimizing...' : `Optimize ${mode === 'seo' ? 'for SEO' : 'Content'}`}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results */}
      {(result || seoResult) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Optimization Results</Typography>
              <Box>
                <Button
                  startIcon={<ContentCopy />}
                  onClick={() =>
                    copyToClipboard(
                      result?.optimized_content || seoResult?.seo_optimized_content || ''
                    )
                  }
                  sx={{ mr: 1 }}
                >
                  Copy Optimized
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={() =>
                    downloadResult(result || seoResult, `${mode}-optimization-result.json`)
                  }
                >
                  Download
                </Button>
              </Box>
            </Box>

            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Optimized Content" />
              <Tab label="Analysis" />
              <Tab label="Metrics" />
              <Tab label="Suggestions" />
            </Tabs>

            {/* Optimized Content Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Optimized Content:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {result?.optimized_content || seoResult?.seo_optimized_content}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Analysis Tab */}
            {activeTab === 1 && result && (
              <Box>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography
                      variant="subtitle1"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Analytics />
                      Content Analysis
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                      {result.content_analysis.analysis_text}
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom>
                      Analysis Sections:
                    </Typography>
                    <List dense>
                      {result.content_analysis.sections.map((section, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Info />
                          </ListItemIcon>
                          <ListItemText primary={section.title} secondary={section.content} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {seoResult && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography
                        variant="subtitle1"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Search />
                        SEO Analysis
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {seoResult.seo_analysis.analysis}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}

            {/* Metrics Tab */}
            {activeTab === 2 && result && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Content Statistics
                      </Typography>
                      <Typography variant="body2">
                        Original Words: {result.metrics.original_metrics.word_count}
                      </Typography>
                      <Typography variant="body2">
                        Optimized Words: {result.metrics.optimized_metrics.word_count}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Change:{' '}
                        {result.metrics.improvements.word_count_change_percent > 0 ? '+' : ''}
                        {result.metrics.improvements.word_count_change_percent.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Quality Improvements
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getImprovementIcon(result.metrics.improvements.readability_improvement)}
                        <Typography variant="body2">
                          Readability: +
                          {result.metrics.improvements.readability_improvement.toFixed(1)} points
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getImprovementIcon(result.metrics.improvements.engagement_improvement)}
                        <Typography variant="body2">
                          Engagement: +
                          {result.metrics.improvements.engagement_improvement.toFixed(1)} points
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getImprovementIcon(result.metrics.improvements.overall_improvement_score)}
                        <Typography
                          variant="body2"
                          color={`${getImprovementColor(
                            result.metrics.improvements.overall_improvement_score
                          )}.main`}
                        >
                          Overall Score: +
                          {result.metrics.improvements.overall_improvement_score.toFixed(1)} points
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {seoResult && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          SEO Score
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {seoResult.seo_metrics.seo_score.toFixed(0)}/100
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Keyword Density
                        </Typography>
                        <Typography variant="body2">
                          Original: {seoResult.seo_metrics.keyword_density.original.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2">
                          Optimized: {seoResult.seo_metrics.keyword_density.optimized.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Improvement: +
                          {seoResult.seo_metrics.keyword_density.improvement.toFixed(2)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Readability
                        </Typography>
                        <Typography variant="body2">
                          Original: {seoResult.seo_metrics.readability.original.toFixed(1)}
                        </Typography>
                        <Typography variant="body2">
                          Optimized: {seoResult.seo_metrics.readability.optimized.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          Improvement: +{seoResult.seo_metrics.readability.improvement.toFixed(1)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {/* Suggestions Tab */}
            {activeTab === 3 && result && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Optimization Suggestions
                </Typography>
                <List>
                  {result.optimization_suggestions.map((suggestion, index) => (
                    <ListItem
                      key={index}
                      sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Lightbulb color="primary" />
                        <Typography variant="subtitle2">{suggestion.title}</Typography>
                        <Chip
                          label={suggestion.category}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {suggestion.content}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                {seoResult && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      SEO Suggestions
                    </Typography>
                    <List>
                      {seoResult.seo_suggestions.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Search />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdvancedContentOptimization;
