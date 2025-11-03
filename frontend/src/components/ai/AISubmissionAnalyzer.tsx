import {
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SubmissionAnalysis } from '../../types/ai';
import FileUpload from '../common/FileUpload';
import LoadingSpinner from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';

interface Submission {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
}

const AISubmissionAnalyzer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SubmissionAnalysis | null>(null);
  const [feedback, setFeedback] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submissions');
      if (!response.ok) {
        throw new Error('Failed to load submissions');
      }
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load submissions',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSelect = async (submission: Submission) => {
    setSelectedSubmission(submission);
    try {
      setLoading(true);
      const response = await fetch(`/api/submissions/${submission.id}/feedback`);
      if (!response.ok) {
        throw new Error('Failed to load feedback');
      }
      const data = await response.json();
      setAnalysis(data.analysis);
      setFeedback(data.feedback);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load feedback',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', newFiles[0]);

        const response = await fetch(`/api/submissions/${id}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to analyze submission');
        }

        const result = await response.json();
        setAnalysis(result.analysis);
        setFeedback(result.feedback);
        setToast({
          open: true,
          message: 'Submission analyzed successfully',
          severity: 'success',
        });
      } catch (error) {
        setToast({
          open: true,
          message: 'Failed to analyze submission',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedback) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/submissions/${id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error('Failed to save feedback');
      }

      setToast({
        open: true,
        message: 'Feedback saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to save feedback',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Submission Analyzer
      </Typography>

      <Grid container spacing={3}>
        {/* Submission History */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Submission History
            </Typography>
            {submissions.length === 0 ? (
              <Typography>No submissions found</Typography>
            ) : (
              <List>
                {submissions.map(submission => (
                  <ListItem
                    key={submission.id}
                    button
                    selected={selectedSubmission?.id === submission.id}
                    onClick={() => handleSubmissionSelect(submission)}
                  >
                    <ListItemText primary={submission.title} />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Submission Files
            </Typography>
            <FileUpload
              files={files}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              maxSize={10 * 1024 * 1024} // 10MB
              multiple
            />
          </Paper>

          {selectedSubmission && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Submission Details
              </Typography>
              <Typography paragraph>{selectedSubmission.content}</Typography>
              <Typography paragraph>Status: {selectedSubmission.status}</Typography>
              <Typography paragraph>
                Created: {new Date(selectedSubmission.createdAt).toLocaleDateString()}
              </Typography>
            </Paper>
          )}

          {analysis && (
            <Grid container spacing={3}>
              {/* Score and Overall Feedback */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Score
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h3">{analysis.score}%</Typography>
                    <Chip
                      label={analysis.score >= 70 ? 'Pass' : 'Needs Improvement'}
                      color={analysis.score >= 70 ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Strengths */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Strengths
                  </Typography>
                  <List>
                    {analysis.strengths.map((strength, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={strength} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Areas for Improvement */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Areas for Improvement
                  </Typography>
                  <List>
                    {analysis.weaknesses.map((weakness, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={weakness} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Suggestions */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Suggestions
                  </Typography>
                  <List>
                    {analysis.suggestions.map((suggestion, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <LightbulbIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Feedback Editor */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Feedback
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveFeedback}
                  >
                    Save Feedback
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default AISubmissionAnalyzer;
