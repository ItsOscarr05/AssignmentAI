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
import RichTextEditor from '../editor/RichTextEditor';

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
    allowLateSubmissions: false,
    latePenalty: 10,
    aiGenerated: false,
    aiPrompt: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [name]: event.target.checked,
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      description: value,
    }));
  };

  const handleAIGeneration = async () => {
    if (!formData.aiPrompt) {
      setError('Please provide a prompt for AI generation');
      return;
    }

    setLoading(true);
    setError(null);
    setIsProcessing(true);

    try {
      const response = await assignments.generateAssignment({
        title: formData.title || 'AI Generated Assignment',
        description: formData.aiPrompt,
        subject: formData.subject,
        difficulty: 'medium',
        type: 'essay',
        additionalContext: formData.aiPrompt,
      });

      setFormData(prev => ({
        ...prev,
        description: response.content || '',
        aiGenerated: true,
      }));

      setGeneratedText(response.content || '');
    } catch (err) {
      setError('Failed to generate assignment content');
      console.error('AI generation error:', err);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const assignmentData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        grade_level: formData.gradeLevel,
        due_date: formData.dueDate,
        points: formData.points,
        allow_late_submissions: formData.allowLateSubmissions,
        late_penalty: formData.latePenalty,
      };

      await assignments.create(assignmentData);
      navigate('/assignments');
    } catch (err) {
      setError('Failed to create assignment');
      console.error('Assignment creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
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
              <TextField
                required
                fullWidth
                label="Assignment Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter assignment title"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  label="Subject"
                >
                  <MenuItem value="math">Mathematics</MenuItem>
                  <MenuItem value="science">Science</MenuItem>
                  <MenuItem value="english">English</MenuItem>
                  <MenuItem value="history">History</MenuItem>
                  <MenuItem value="computer_science">Computer Science</MenuItem>
                  <MenuItem value="art">Art</MenuItem>
                  <MenuItem value="music">Music</MenuItem>
                  <MenuItem value="physical_education">Physical Education</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  label="Grade Level"
                >
                  <MenuItem value="elementary">Elementary (K-5)</MenuItem>
                  <MenuItem value="middle">Middle School (6-8)</MenuItem>
                  <MenuItem value="high">High School (9-12)</MenuItem>
                  <MenuItem value="college">College/University</MenuItem>
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
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Points"
                name="points"
                value={formData.points}
                onChange={handleChange}
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowLateSubmissions}
                    onChange={handleSwitchChange('allowLateSubmissions')}
                  />
                }
                label="Allow Late Submissions"
              />
            </Grid>

            {formData.allowLateSubmissions && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Late Penalty (%)"
                  name="latePenalty"
                  value={formData.latePenalty}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 100 }}
                  helperText="Percentage of points deducted for late submissions"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.aiGenerated}
                    onChange={handleSwitchChange('aiGenerated')}
                  />
                }
                label="Use AI to Generate Content"
              />
            </Grid>

            {formData.aiGenerated && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="AI Prompt"
                  name="aiPrompt"
                  value={formData.aiPrompt}
                  onChange={handleChange}
                  placeholder="Describe what you want the AI to generate..."
                  helperText="Provide a detailed description of the assignment you want to create"
                />
                <Button
                  variant="outlined"
                  onClick={handleAIGeneration}
                  disabled={loading || isProcessing || !formData.aiPrompt}
                  sx={{ mt: 1 }}
                >
                  {loading || isProcessing ? <CircularProgress size={20} /> : 'Generate Content'}
                </Button>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Assignment Description
              </Typography>
              <RichTextEditor
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Enter detailed assignment description, requirements, and instructions..."
                collaborative={false}
                onSave={() => {
                  // Auto-save functionality can be implemented here
                  console.log('Content saved');
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/assignments')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Assignment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AssignmentCreate;
