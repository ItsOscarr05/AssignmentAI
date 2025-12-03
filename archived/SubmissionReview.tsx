import { Alert, Box, CircularProgress, Container, Grid, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AIAnalysisPanel from '../components/ai/AIAnalysisPanel';

interface Submission {
  id: number;
  content: string;
  assignment: {
    id: number;
    title: string;
  };
  student: {
    id: number;
    name: string;
  };
  submitted_at: string;
  status: string;
}

const SubmissionReview: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }
        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An error occurred while loading the submission'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Submission not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Submission Review
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Assignment: {submission.assignment.title}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Submitted by: {submission.student.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Submitted at: {new Date(submission.submitted_at).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submission Content
            </Typography>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                backgroundColor: 'grey.50',
                p: 2,
                borderRadius: 1,
                maxHeight: '400px',
                overflow: 'auto',
              }}
            >
              {submission.content}
            </Box>
          </Paper>

          <AIAnalysisPanel
            submissionId={parseInt(submissionId!)}
            onAnalysisComplete={results => {
              console.log('Analysis complete:', results);
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Removed RubricManager */}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SubmissionReview;
