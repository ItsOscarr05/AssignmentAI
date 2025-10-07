import {
  Book,
  CheckCircle,
  ContentCopy,
  Download,
  ExpandMore,
  FactCheck,
  Info,
  PsychologyOutlined,
  School,
  Science,
  Source,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
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
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureAccessErrorComponent } from '../workshop/FeatureAccessError';

interface ResearchResult {
  topic: string;
  research_depth: string;
  executive_summary: string;
  research_results: Record<
    string,
    {
      content: string;
      timestamp: string;
    }
  >;
  fact_check_results: {
    overall_confidence: number;
    section_checks: Record<
      string,
      {
        confidence: number;
        analysis: string;
        timestamp: string;
      }
    >;
    flagged_statements: Array<{
      section: string;
      confidence: number;
      reason: string;
    }>;
  };
  sources: Array<{
    title: string;
    description: string;
  }>;
  research_plan: {
    plan_text: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
    research_depth: string;
  };
  timestamp: string;
  metadata: {
    total_sections: number;
    fact_check_score: number;
    source_count: number;
  };
}

interface SourceComparisonResult {
  topic: string;
  sources: Array<{
    source: string;
    analysis: string;
    index: number;
  }>;
  comparative_analysis: string;
  consensus_points: string[];
  conflicting_views: string[];
  recommendations: string;
}

const AdvancedResearchAssistant: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [researchDepth, setResearchDepth] = useState('comprehensive');
  const [includeSources, setIncludeSources] = useState(true);
  const [factCheck, setFactCheck] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<SourceComparisonResult | null>(null);
  const [sources, setSources] = useState<string[]>(['', '']);
  const [mode, setMode] = useState<'research' | 'comparison'>('research');

  const { enqueueSnackbar } = useSnackbar();
  const { hasAccess, currentPlan } = useFeatureAccess('advanced_research_assistant');

  const researchDepths = [
    { value: 'basic', label: 'Basic Research' },
    { value: 'comprehensive', label: 'Comprehensive Research' },
    { value: 'in-depth', label: 'In-Depth Research' },
  ];

  const handleResearch = async () => {
    if (!topic.trim()) {
      enqueueSnackbar('Please enter a topic to research', { variant: 'warning' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setComparisonResult(null);

    try {
      const response = await fetch('/api/v1/smart-features/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          research_depth: researchDepth,
          include_sources: includeSources,
          fact_check: factCheck,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to conduct research');
      }

      const data = await response.json();
      setResult(data);
      enqueueSnackbar('Research completed successfully!', { variant: 'success' });
    } catch (error: any) {
      console.error('Research error:', error);
      enqueueSnackbar(error.message || 'Failed to conduct research', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceComparison = async () => {
    if (!topic.trim()) {
      enqueueSnackbar('Please enter a topic for comparison', { variant: 'warning' });
      return;
    }

    const validSources = sources.filter(s => s.trim());
    if (validSources.length < 2) {
      enqueueSnackbar('Please provide at least 2 sources to compare', { variant: 'warning' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setComparisonResult(null);

    try {
      const response = await fetch('/api/v1/smart-features/compare-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          sources: validSources,
          topic: topic.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to compare sources');
      }

      const data = await response.json();
      setComparisonResult(data);
      enqueueSnackbar('Source comparison completed successfully!', { variant: 'success' });
    } catch (error: any) {
      console.error('Source comparison error:', error);
      enqueueSnackbar(error.message || 'Failed to compare sources', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const addSource = () => {
    setSources([...sources, '']);
  };

  const updateSource = (index: number, value: string) => {
    const updatedSources = [...sources];
    updatedSources[index] = value;
    setSources(updatedSources);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle />;
    if (confidence >= 60) return <Warning />;
    return <Info />;
  };

  if (!hasAccess) {
    return (
      <FeatureAccessErrorComponent
        error={{
          error: 'Feature not available',
          feature: 'advanced_research_assistant',
          current_plan: currentPlan,
          upgrade_message: `Upgrade to ${
            currentPlan === 'free' ? 'Pro' : currentPlan === 'plus' ? 'Pro' : 'Max'
          } plan to access Advanced Research Assistant.`,
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
        <PsychologyOutlined color="primary" />
        Advanced Research Assistant
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Conduct comprehensive research with AI-powered fact-checking and source analysis.
      </Typography>

      {/* Mode Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Research Mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={mode === 'research' ? 'contained' : 'outlined'}
              onClick={() => setMode('research')}
              startIcon={<School />}
            >
              Topic Research
            </Button>
            <Button
              variant={mode === 'comparison' ? 'contained' : 'outlined'}
              onClick={() => setMode('comparison')}
              startIcon={<Source />}
            >
              Source Comparison
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
              <TextField
                fullWidth
                label="Research Topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Enter the topic you want to research..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Research Depth</InputLabel>
                <Select
                  value={researchDepth}
                  onChange={e => setResearchDepth(e.target.value)}
                  label="Research Depth"
                >
                  {researchDepths.map(depth => (
                    <MenuItem key={depth.value} value={depth.value}>
                      {depth.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Include Sources</InputLabel>
                <Select
                  value={includeSources.toString()}
                  onChange={e => setIncludeSources(e.target.value === 'true')}
                  label="Include Sources"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {mode === 'research' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Fact-Checking</InputLabel>
              <Select
                value={factCheck.toString()}
                onChange={e => setFactCheck(e.target.value === 'true')}
                label="Fact-Checking"
              >
                <MenuItem value="true">Enable</MenuItem>
                <MenuItem value="false">Disable</MenuItem>
              </Select>
            </FormControl>
          )}
        </CardContent>
      </Card>

      {/* Input Section */}
      {mode === 'research' ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Research Topic
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Enter a detailed research topic or question..."
              variant="outlined"
            />
            <Box
              sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                {topic.length} characters
              </Typography>
              <Button
                variant="contained"
                onClick={handleResearch}
                disabled={isLoading || !topic.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : <PsychologyOutlined />}
              >
                {isLoading ? 'Researching...' : 'Start Research'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sources to Compare
              <Button variant="outlined" size="small" onClick={addSource} sx={{ ml: 2 }}>
                Add Source
              </Button>
            </Typography>

            {sources.map((source, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">Source {index + 1}</Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => removeSource(index)}
                  >
                    Remove
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Source URL or Reference"
                  value={source}
                  onChange={e => updateSource(index, e.target.value)}
                  placeholder="Enter source URL, reference, or description..."
                />
              </Paper>
            ))}

            {sources.length === 0 && (
              <Alert severity="info">
                Click "Add Source" to start adding sources for comparison.
              </Alert>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSourceComparison}
                disabled={isLoading || sources.filter(s => s.trim()).length < 2}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Source />}
              >
                {isLoading ? 'Comparing...' : 'Compare Sources'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Research Results */}
      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Research Results</Typography>
              <Box>
                <Button
                  startIcon={<ContentCopy />}
                  onClick={() => copyToClipboard(result.executive_summary)}
                  sx={{ mr: 1 }}
                >
                  Copy Summary
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={() => downloadResult(result, 'research-result.json')}
                >
                  Download
                </Button>
              </Box>
            </Box>

            {/* Executive Summary */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TrendingUp />
                  Executive Summary
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.executive_summary}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Research Plan */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <School />
                  Research Plan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                  {result.research_plan.plan_text}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Research Sections:
                </Typography>
                <List dense>
                  {result.research_plan.sections.map((section, index) => (
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

            {/* Research Results */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Science />
                  Detailed Research Results
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(result.research_results).map(([section, data]) => (
                  <Accordion key={section} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">{section}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {data.content}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </AccordionDetails>
            </Accordion>

            {/* Fact-Checking Results */}
            {factCheck && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography
                    variant="subtitle1"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <FactCheck />
                    Fact-Checking Results
                    <Badge
                      badgeContent={`${result.fact_check_results.overall_confidence.toFixed(0)}%`}
                      color={getConfidenceColor(result.fact_check_results.overall_confidence)}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Overall Confidence
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getConfidenceIcon(result.fact_check_results.overall_confidence)}
                          <Typography
                            variant="h6"
                            color={`${getConfidenceColor(
                              result.fact_check_results.overall_confidence
                            )}.main`}
                          >
                            {result.fact_check_results.overall_confidence.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Flagged Statements
                        </Typography>
                        <Typography variant="body2" color="error">
                          {result.fact_check_results.flagged_statements.length} statements need
                          verification
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {result.fact_check_results.flagged_statements.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Statements Requiring Verification:
                      </Typography>
                      <List dense>
                        {result.fact_check_results.flagged_statements.map((statement, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Warning color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${statement.section} (${statement.confidence}% confidence)`}
                              secondary={statement.reason}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Sources */}
            {includeSources && result.sources.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography
                    variant="subtitle1"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Book />
                    Recommended Sources ({result.sources.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {result.sources.map((source, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Source />
                        </ListItemIcon>
                        <ListItemText primary={source.title} secondary={source.description} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source Comparison Results */}
      {comparisonResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Source Comparison Results</Typography>
              <Button
                startIcon={<Download />}
                onClick={() => downloadResult(comparisonResult, 'source-comparison.json')}
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
                  {comparisonResult.comparative_analysis}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {comparisonResult.sources.map((source, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Source {index + 1}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {source.analysis}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdvancedResearchAssistant;
