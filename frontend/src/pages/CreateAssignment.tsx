import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { analyzeAssignment } from '../services/aiAnalysis';

interface AssignmentFormData {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  file: File | null;
}

interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const CreateAssignment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    priority: 'medium',
    file: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (isEditMode) {
      // TODO: Replace with actual API call
      const fetchAssignment = async () => {
        try {
          const response = await fetch(`/api/assignments/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch assignment');
          }
          const data = await response.json();
          setFormData({
            title: data.title,
            description: data.description,
            subject: data.subject,
            dueDate: data.dueDate,
            priority: data.priority.toLowerCase(),
            file: null,
          });
          if (data.aiAnalysis) {
            setAiAnalysis(data.aiAnalysis);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
        }
      };
      fetchAssignment();
    }
  }, [id, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        file,
      }));

      // Start AI analysis
      setAnalyzing(true);
      try {
        const analysis = await analyzeAssignment(file);
        setAiAnalysis(analysis);
      } catch (err) {
        console.error('Failed to analyze file:', err);
        setError('Failed to analyze file. Please try again.');
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value);
        }
      });

      if (aiAnalysis) {
        formDataToSend.append('aiAnalysis', JSON.stringify(aiAnalysis));
      }

      const url = isEditMode ? `/api/assignments/${id}` : '/api/assignments';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} assignment`);
      }

      toast.success(`Assignment ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate('/dashboard/assignments');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'create'} assignment`
      );
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'create'} assignment`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
      }}
    >
      <Container maxWidth="md" sx={{ my: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 6 },
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: 40, marginBottom: 16 }} />
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
              className="page-title"
            >
              {isEditMode ? 'Edit Assignment' : 'Create New Assignment'}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                letterSpacing: '0.01em',
                fontSize: '1.1rem',
              }}
            >
              {isEditMode
                ? 'Update the details below to modify your assignment'
                : 'Fill in the details below to create a new assignment'}
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="title"
                  label="Assignment Title"
                  value={formData.title}
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="subject"
                  label="Subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  name="dueDate"
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    label="Priority"
                    onChange={handleSelectChange}
                    sx={{
                      '& .MuiInputLabel-root': {
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                      },
                      '& .MuiSelect-select': {
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                      },
                    }}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  disabled={analyzing}
                  sx={{
                    height: '56px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {analyzing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isEditMode ? (
                    'Change Assignment File'
                  ) : (
                    'Upload Assignment File'
                  )}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </Button>
                {formData.file && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    Selected file: {formData.file.name}
                  </Typography>
                )}
              </Grid>

              {aiAnalysis && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h6" gutterBottom>
                      AI Analysis
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Summary
                    </Typography>
                    <Typography paragraph>{aiAnalysis.summary}</Typography>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Key Points
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {aiAnalysis.keyPoints.map((point, index) => (
                        <Typography component="li" key={index} paragraph>
                          {point}
                        </Typography>
                      ))}
                    </Box>

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Recommendations
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {aiAnalysis.recommendations.map((rec, index) => (
                        <Typography component="li" key={index} paragraph>
                          {rec}
                        </Typography>
                      ))}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Estimated Time
                        </Typography>
                        <Typography>{aiAnalysis.estimatedTime}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Difficulty
                        </Typography>
                        <Typography>{aiAnalysis.difficulty}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {error && (
              <Typography
                color="error"
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                }}
              >
                {error}
              </Typography>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/dashboard/assignments')}
                sx={{
                  py: 1.5,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || analyzing}
                sx={{
                  py: 1.5,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {loading
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                  ? 'Update Assignment'
                  : 'Create Assignment'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateAssignment;
