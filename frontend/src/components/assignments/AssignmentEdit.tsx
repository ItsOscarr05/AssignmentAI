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
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignments } from '../../services/api';

interface AssignmentFormData {
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  type: 'essay' | 'quiz' | 'project' | 'homework';
  allowLateSubmissions: boolean;
  lateSubmissionPenalty: number;
}

const assignmentTypes = ['essay', 'quiz', 'project', 'homework'] as const;
type AssignmentType = (typeof assignmentTypes)[number];

const AssignmentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    dueDate: '',
    type: 'homework',
    allowLateSubmissions: true,
    lateSubmissionPenalty: 10,
  });

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const assignment = await assignments.getById(id!);
        setFormData({
          title: assignment.title,
          description: assignment.description,
          subject: assignment.subject || '',
          gradeLevel: assignment.gradeLevel || '',
          dueDate: assignment.dueDate,
          type: assignment.type,
          allowLateSubmissions: assignment.allowLateSubmissions ?? true,
          lateSubmissionPenalty: assignment.lateSubmissionPenalty ?? 10,
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await assignments.update(id!, {
        ...formData,
        type: formData.type as AssignmentType,
      });
      navigate('/assignments');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.title) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Edit Assignment
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
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    label="Type"
                  >
                    <MenuItem value="essay">Essay</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="project">Project</MenuItem>
                    <MenuItem value="homework">Homework</MenuItem>
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowLateSubmissions}
                      onChange={handleChange}
                      name="allowLateSubmissions"
                    />
                  }
                  label="Allow Late Submissions"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Late Submission Penalty (%)"
                  name="lateSubmissionPenalty"
                  value={formData.lateSubmissionPenalty}
                  onChange={handleChange}
                  disabled={!formData.allowLateSubmissions}
                  InputProps={{
                    inputProps: { min: 0, max: 100 },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/assignments')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" color="primary" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AssignmentEdit;
