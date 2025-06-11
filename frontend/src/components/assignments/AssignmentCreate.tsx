import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../../contexts/AIContext';
import { assignments } from '../../services/api';

interface AssignmentFormData {
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  points: number;
  allowLateSubmissions: boolean;
  latePenalty: number;
  aiGenerated: boolean;
  aiPrompt?: string;
}

const AssignmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const { isProcessing, setIsProcessing, setGeneratedText } = useAI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    dueDate: '',
    points: 100,
    allowLateSubmissions: true,
    latePenalty: 10,
    aiGenerated: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAIGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsProcessing(true);

      const prompt = `Generate an assignment for ${formData.subject} at ${formData.gradeLevel} level worth ${formData.points} points.`;
      setGeneratedText(prompt);

      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      setFormData(prev => ({
        ...prev,
        title: `AI Generated ${formData.subject} Assignment`,
        description: `This is an AI-generated assignment for ${formData.gradeLevel} ${formData.subject} worth ${formData.points} points.`,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to generate assignment');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await assignments.create({
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        grade_level: formData.gradeLevel,
        due_date: formData.dueDate,
        points: formData.points,
        allow_late_submissions: formData.allowLateSubmissions,
        late_penalty: formData.latePenalty,
      });
      navigate('/assignments');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Create New Assignment
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.aiGenerated}
                      onChange={handleChange}
                      name="aiGenerated"
                    />
                  }
                  label="Use AI to generate assignment"
                />
              </Grid>
              {formData.aiGenerated && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleAIGenerate}
                    disabled={loading || isProcessing || !formData.subject || !formData.gradeLevel}
                    fullWidth
                  >
                    {isProcessing ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={formData.subject}
                    onChange={handleSelectChange}
                    label="Subject"
                  >
                    <MenuItem value="math">Mathematics</MenuItem>
                    <MenuItem value="science">Science</MenuItem>
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="history">History</MenuItem>
                    <MenuItem value="computer_science">Computer Science</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Grade Level</InputLabel>
                  <Select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleSelectChange}
                    label="Grade Level"
                  >
                    <MenuItem value="elementary">Elementary</MenuItem>
                    <MenuItem value="middle">Middle School</MenuItem>
                    <MenuItem value="high">High School</MenuItem>
                    <MenuItem value="college">College</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="datetime-local"
                  label="Due Date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Points"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 1000 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowLateSubmissions}
                      onChange={handleChange}
                      name="allowLateSubmissions"
                    />
                  }
                  label="Allow late submissions"
                />
              </Grid>
              {formData.allowLateSubmissions && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Late Penalty (%)"
                    name="latePenalty"
                    value={formData.latePenalty}
                    onChange={handleChange}
                    inputProps={{ min: 0, max: 100 }}
                    helperText="Percentage of points deducted per day late"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Assignment'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AssignmentCreate;
