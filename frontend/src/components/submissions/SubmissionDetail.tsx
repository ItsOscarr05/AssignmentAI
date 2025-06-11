import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Submission } from '../../types/submission';

const STATUS_COLORS = {
  pending: 'warning',
  submitted: 'info',
  graded: 'success',
  late: 'error',
} as const;

export const SubmissionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const response = await api.get(`/submissions/${id}`);
      setSubmission(response.data);
    } catch (error) {
      console.error('Error fetching submission:', error);
      setError('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await api.delete(`/submissions/${id}`);
        navigate('/submissions');
      } catch (error) {
        console.error('Error deleting submission:', error);
        setError('Failed to delete submission');
      }
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const response = await api.get(`/submissions/download/${filePath}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filePath.split('/').pop() || 'submission');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!submission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Submission not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom data-testid="submission-title">
              {submission.title}
            </Typography>
            <Chip
              label={submission.status}
              color={STATUS_COLORS[submission.status as keyof typeof STATUS_COLORS]}
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="textSecondary" component="span">
              Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box>
            {submission.file_path && (
              <Tooltip title="Download">
                <IconButton onClick={() => handleDownload(submission.file_path!)} sx={{ mr: 1 }}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Edit">
              <IconButton onClick={() => navigate(`/submissions/${id}/edit`)} sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Assignment Details
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Assignment:</strong> {submission.assignment_title}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Subject:</strong> {submission.assignment_subject}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Due Date:</strong>{' '}
              {new Date(submission.assignment_due_date).toLocaleDateString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Submission Details
            </Typography>
            {submission.score !== null && (
              <Typography variant="body1" gutterBottom>
                <strong>Score:</strong> {submission.score}/{submission.max_score}
              </Typography>
            )}
            {submission.feedback && (
              <Typography variant="body1" gutterBottom>
                <strong>Feedback:</strong> {submission.feedback}
              </Typography>
            )}
            {submission.file_path && (
              <Typography variant="body1" gutterBottom>
                <strong>File:</strong> {submission.file_path.split('/').pop()}
              </Typography>
            )}
          </Grid>

          {submission.description && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">{submission.description}</Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/submissions')}>
            Back to Submissions
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
