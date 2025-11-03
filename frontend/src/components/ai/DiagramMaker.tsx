import {
  AccountTree,
  AutoAwesome,
  BarChart,
  Download,
  Info,
  PieChart,
  Refresh,
  ScatterPlot,
  ShowChart,
  TableChart,
  Timeline,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useContext, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SnackbarContext } from '../../contexts/SnackbarContext';

interface DiagramType {
  value: string;
  label: string;
  icon: React.ReactElement;
  description: string;
}

interface DiagramStyle {
  value: string;
  label: string;
  description: string;
}

const diagramTypes: DiagramType[] = [
  {
    value: 'auto',
    label: 'Auto Detect',
    icon: <AutoAwesome />,
    description: 'Let AI choose the best diagram type',
  },
  {
    value: 'bar_chart',
    label: 'Bar Chart',
    icon: <BarChart />,
    description: 'Compare categories with bars',
  },
  {
    value: 'line_chart',
    label: 'Line Chart',
    icon: <ShowChart />,
    description: 'Show trends over time',
  },
  {
    value: 'pie_chart',
    label: 'Pie Chart',
    icon: <PieChart />,
    description: 'Show proportions and percentages',
  },
  {
    value: 'scatter_plot',
    label: 'Scatter Plot',
    icon: <ScatterPlot />,
    description: 'Show correlations between variables',
  },
  {
    value: 'flowchart',
    label: 'Flowchart',
    icon: <AccountTree />,
    description: 'Show processes and workflows',
  },
  {
    value: 'mind_map',
    label: 'Mind Map',
    icon: <AccountTree />,
    description: 'Organize ideas and concepts',
  },
  {
    value: 'venn_diagram',
    label: 'Venn Diagram',
    icon: <Info />,
    description: 'Show relationships between sets',
  },
  {
    value: 'org_chart',
    label: 'Org Chart',
    icon: <AccountTree />,
    description: 'Show organizational hierarchies',
  },
  {
    value: 'timeline',
    label: 'Timeline',
    icon: <Timeline />,
    description: 'Show events in chronological order',
  },
  {
    value: 'comparison_table',
    label: 'Comparison Table',
    icon: <TableChart />,
    description: 'Compare multiple options',
  },
  {
    value: 'infographic',
    label: 'Infographic',
    icon: <Info />,
    description: 'Comprehensive information display',
  },
];

const diagramStyles: DiagramStyle[] = [
  {
    value: 'modern',
    label: 'Modern',
    description: 'Clean, contemporary design',
  },
  {
    value: 'classic',
    label: 'Classic',
    description: 'Traditional professional look',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple, clean design',
  },
  {
    value: 'colorful',
    label: 'Colorful',
    description: 'Vibrant with bright colors',
  },
];

const DiagramMaker: React.FC = () => {
  const { user } = useAuth();
  const snackbarContext = useContext(SnackbarContext);
  const showSnackbar = snackbarContext?.showSnackbar || (() => {});

  const [description, setDescription] = useState('');
  const [diagramType, setDiagramType] = useState('auto');
  const [style, setStyle] = useState('modern');
  const [customData, setCustomData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDiagram = useCallback(async () => {
    if (!description.trim()) {
      showSnackbar('Please enter a description for your diagram', 'error');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('diagram_type', diagramType);
      formData.append('style', style);

      if (customData.trim()) {
        formData.append('data', customData);
      }

      const response = await fetch('/api/v1/diagrams/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate diagram');
      }

      const result = await response.json();
      setGeneratedDiagram(result.diagram);
      showSnackbar('Diagram generated successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate diagram';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [description, diagramType, style, customData, user?.id, showSnackbar]);

  const handleDownloadDiagram = useCallback(() => {
    if (generatedDiagram?.image) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${generatedDiagram.image}`;
      link.download = `diagram-${Date.now()}.png`;
      link.click();
    }
  }, [generatedDiagram]);

  const handleReset = useCallback(() => {
    setDescription('');
    setDiagramType('auto');
    setStyle('modern');
    setCustomData('');
    setGeneratedDiagram(null);
    setError(null);
  }, []);

  const selectedDiagramType = diagramTypes.find(dt => dt.value === diagramType);
  const selectedStyle = diagramStyles.find(ds => ds.value === style);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700, color: '#D32F2F' }}
      >
        Diagram Maker
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create professional diagrams and charts with AI assistance. Describe what you want to
        visualize and let our AI generate the perfect diagram for you.
      </Typography>

      <Grid container spacing={4}>
        {/* Input Panel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content', border: '2px solid #D32F2F' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Create Your Diagram
              </Typography>

              <Stack spacing={3}>
                {/* Description Input */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Describe your diagram"
                  placeholder="e.g., Show the sales performance of different departments over the last quarter, or create a flowchart for the user registration process..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  variant="outlined"
                  helperText="Be as detailed as possible for better results"
                />

                {/* Diagram Type Selection */}
                <FormControl fullWidth>
                  <InputLabel>Diagram Type</InputLabel>
                  <Select
                    value={diagramType}
                    label="Diagram Type"
                    onChange={e => setDiagramType(e.target.value)}
                  >
                    {diagramTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          <Box>
                            <Typography variant="body2">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Style Selection */}
                <FormControl fullWidth>
                  <InputLabel>Visual Style</InputLabel>
                  <Select
                    value={style}
                    label="Visual Style"
                    onChange={e => setStyle(e.target.value)}
                  >
                    {diagramStyles.map(styleOption => (
                      <MenuItem key={styleOption.value} value={styleOption.value}>
                        <Box>
                          <Typography variant="body2">{styleOption.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {styleOption.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Custom Data Input */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Custom Data (Optional)"
                  placeholder='{"labels": ["A", "B", "C"], "values": [10, 20, 30]}'
                  value={customData}
                  onChange={e => setCustomData(e.target.value)}
                  variant="outlined"
                  helperText="Provide JSON data for more control over the diagram"
                />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleGenerateDiagram}
                    disabled={isGenerating || !description.trim()}
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
                    sx={{
                      bgcolor: '#D32F2F',
                      '&:hover': { bgcolor: '#B71C1C' },
                      flex: 1,
                    }}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Diagram'}
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

          {/* Selected Options Display */}
          <Card sx={{ mt: 2, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Selected Options:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedDiagramType && (
                  <Chip
                    icon={selectedDiagramType.icon}
                    label={selectedDiagramType.label}
                    size="small"
                    color="primary"
                  />
                )}
                {selectedStyle && (
                  <Chip label={selectedStyle.label} size="small" variant="outlined" />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Output Panel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content', border: '2px solid #D32F2F' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Generated Diagram
              </Typography>

              {isGenerating ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={60} sx={{ color: '#D32F2F', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Creating your diagram...
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    This may take a few moments
                  </Typography>
                </Box>
              ) : generatedDiagram ? (
                <Box>
                  {/* Diagram Image */}
                  {generatedDiagram.image && (
                    <Paper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                      <img
                        src={`data:image/png;base64,${generatedDiagram.image}`}
                        alt="Generated Diagram"
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                        }}
                      />
                    </Paper>
                  )}

                  {/* Diagram Information */}
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type: {generatedDiagram.type}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Style: {generatedDiagram.style}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleDownloadDiagram}
                        sx={{ borderColor: '#D32F2F', color: '#D32F2F' }}
                      >
                        Download
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleReset}
                        sx={{ borderColor: '#D32F2F', color: '#D32F2F' }}
                      >
                        Create New
                      </Button>
                    </Stack>
                  </Stack>
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
                  <AutoAwesome sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Your generated diagram will appear here
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 1 }}
                  >
                    Fill in the form and click "Generate Diagram"
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
            💡 Tips for Better Diagrams
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                For Data Visualizations:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Be specific about what data you want to show
                <br />
                • Mention the type of comparison or trend
                <br />• Include context about the data source
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                For Process Diagrams:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Describe the process step by step
                <br />
                • Mention decision points and outcomes
                <br />• Include start and end points
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DiagramMaker;
