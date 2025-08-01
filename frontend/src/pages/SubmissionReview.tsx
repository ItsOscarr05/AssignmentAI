import { Alert, Box, CircularProgress, Container, Grid, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

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
  const { t } = useTranslation();
  const { submissionId } = useParams<{ submissionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (!response.ok) {
          throw new Error(t('pages.submissionReview.failedToFetchSubmission'));
        }
        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pages.submissionReview.anErrorOccurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, t]);

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
        <Alert severity="warning">{t('pages.submissionReview.submissionNotFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {t('pages.submissionReview.title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {t('pages.submissionReview.assignment')}: {submission.assignment.title}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {t('pages.submissionReview.submittedBy')}: {submission.student.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('pages.submissionReview.submittedAt')}:{' '}
              {new Date(submission.submitted_at).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('pages.submissionReview.submissionContent')}
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
