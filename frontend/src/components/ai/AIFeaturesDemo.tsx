import { CheckCircle, Code, Info, Lightbulb, PlayArrow, Speed, Warning } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAIFeatures } from '../../contexts/AIFeaturesContext';

const AIFeaturesDemo: React.FC = () => {
  const {
    isFeatureEnabled,
    getAutoCompleteSuggestions,
    getCodeSnippets,
    getAISuggestions,
    analyzeCode,
  } = useAIFeatures();

  const [code, setCode] = useState(`function calculateSum(a, b) {
  var result = a + b;
  console.log("Result:", result);
  return result;
}

// TODO: Add input validation
function processData(data) {
  if (data == null) {
    return false;
  }
  
  for (let i = 0; i < data.length; i++) {
    // Process each item
  }
}`);

  const [language] = useState('javascript');
  const [autoCompleteText, setAutoCompleteText] = useState('');
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([]);
  const [snippetType, setSnippetType] = useState('function');
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<{
    quality: number;
    suggestions: string[];
    warnings: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-complete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (autoCompleteText.length > 0 && isFeatureEnabled('autoComplete')) {
        const suggestions = await getAutoCompleteSuggestions(autoCompleteText, language);
        setAutoCompleteSuggestions(suggestions);
      } else {
        setAutoCompleteSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [autoCompleteText, language, isFeatureEnabled, getAutoCompleteSuggestions]);

  const handleGenerateSnippet = async () => {
    if (isFeatureEnabled('codeSnippets')) {
      const snippet = await getCodeSnippets(snippetType, language);
      setGeneratedSnippet(snippet);
    }
  };

  const handleGetSuggestions = async () => {
    if (isFeatureEnabled('aiSuggestions')) {
      const suggestions = await getAISuggestions(code);
      setAiSuggestions(suggestions);
    }
  };

  const handleAnalyzeCode = async () => {
    if (isFeatureEnabled('realTimeAnalysis')) {
      setIsAnalyzing(true);
      try {
        const result = await analyzeCode(code);
        setAnalysis(result);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'success';
    if (quality >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        AI Features Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test the AI features you've enabled in the settings. Each feature demonstrates real
        functionality.
      </Typography>

      <Grid container spacing={3}>
        {/* Auto-Complete Demo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Code color={isFeatureEnabled('autoComplete') ? 'primary' : 'disabled'} />
              <Typography variant="h6">Auto-Complete</Typography>
              <Chip
                label={isFeatureEnabled('autoComplete') ? 'Enabled' : 'Disabled'}
                color={isFeatureEnabled('autoComplete') ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {isFeatureEnabled('autoComplete') ? (
              <>
                <TextField
                  fullWidth
                  label="Type to see suggestions"
                  value={autoCompleteText}
                  onChange={e => setAutoCompleteText(e.target.value)}
                  placeholder="Try typing 'func' or 'for'"
                  sx={{ mb: 2 }}
                />
                {autoCompleteSuggestions.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Suggestions:
                    </Typography>
                    <List dense>
                      {autoCompleteSuggestions.map((suggestion, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">
                Enable Auto-Complete in settings to see intelligent code suggestions
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Code Snippets Demo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Code color={isFeatureEnabled('codeSnippets') ? 'primary' : 'disabled'} />
              <Typography variant="h6">Code Snippets</Typography>
              <Chip
                label={isFeatureEnabled('codeSnippets') ? 'Enabled' : 'Disabled'}
                color={isFeatureEnabled('codeSnippets') ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {isFeatureEnabled('codeSnippets') ? (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Snippet Type</InputLabel>
                  <Select
                    value={snippetType}
                    label="Snippet Type"
                    onChange={e => setSnippetType(e.target.value)}
                  >
                    <MenuItem value="function">Function</MenuItem>
                    <MenuItem value="class">Class</MenuItem>
                    <MenuItem value="loop">Loop</MenuItem>
                    <MenuItem value="try-catch">Try-Catch</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleGenerateSnippet}
                  startIcon={<PlayArrow />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Generate Snippet
                </Button>
                {generatedSnippet && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={generatedSnippet}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                )}
              </>
            ) : (
              <Alert severity="info">
                Enable Code Snippets in settings to generate boilerplate code
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* AI Suggestions Demo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Lightbulb color={isFeatureEnabled('aiSuggestions') ? 'primary' : 'disabled'} />
              <Typography variant="h6">AI Suggestions</Typography>
              <Chip
                label={isFeatureEnabled('aiSuggestions') ? 'Enabled' : 'Disabled'}
                color={isFeatureEnabled('aiSuggestions') ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {isFeatureEnabled('aiSuggestions') ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleGetSuggestions}
                  startIcon={<Lightbulb />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Get AI Suggestions
                </Button>
                {aiSuggestions.length > 0 && (
                  <List dense>
                    {aiSuggestions.map((suggestion, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Info fontSize="small" color="info" />
                        </ListItemIcon>
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            ) : (
              <Alert severity="info">
                Enable AI Suggestions in settings to get coding recommendations
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Real-Time Analysis Demo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Speed color={isFeatureEnabled('realTimeAnalysis') ? 'primary' : 'disabled'} />
              <Typography variant="h6">Real-Time Analysis</Typography>
              <Chip
                label={isFeatureEnabled('realTimeAnalysis') ? 'Enabled' : 'Disabled'}
                color={isFeatureEnabled('realTimeAnalysis') ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {isFeatureEnabled('realTimeAnalysis') ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleAnalyzeCode}
                  disabled={isAnalyzing}
                  startIcon={isAnalyzing ? <CircularProgress size={16} /> : <Speed />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
                </Button>
                {analysis && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">Code Quality:</Typography>
                      <Chip
                        label={`${analysis.quality}%`}
                        color={getQualityColor(analysis.quality) as any}
                        size="small"
                      />
                    </Box>
                    {analysis.suggestions.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Suggestions:
                        </Typography>
                        <List dense>
                          {analysis.suggestions.map((suggestion, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <Info fontSize="small" color="info" />
                              </ListItemIcon>
                              <ListItemText primary={suggestion} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    {analysis.warnings.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Warnings:
                        </Typography>
                        <List dense>
                          {analysis.warnings.map((warning, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <Warning fontSize="small" color="warning" />
                              </ListItemIcon>
                              <ListItemText primary={warning} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">
                Enable Real-Time Analysis in settings to analyze code quality
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Code Editor Demo */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Test Code Editor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Edit this code to test the AI features. The code contains various issues that the AI
              can identify.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={code}
              onChange={e => setCode(e.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIFeaturesDemo;
