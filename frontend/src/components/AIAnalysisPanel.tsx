import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Feedback as FeedbackIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface AnalysisResult {
  analysis: string;
  feedback: string;
  raw_response: string;
}

interface PlagiarismResult {
  analysis: string;
  raw_response: string;
  probability: number;
}

interface GradeResult {
  grade_analysis: string;
  raw_response: string;
  score: number;
}

interface FeedbackResult {
  content: string;
  type: string;
  created_at: string;
}

interface AIAnalysisPanelProps {
  submissionId: number;
  onAnalysisComplete?: (results: AnalysisResult) => void;
  onPlagiarismComplete?: (results: PlagiarismResult) => void;
  onGradeComplete?: (results: GradeResult) => void;
  onFeedbackComplete?: (results: FeedbackResult) => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  submissionId,
  onAnalysisComplete,
  onPlagiarismComplete,
  onGradeComplete,
  onFeedbackComplete,
}) => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    analyze: false,
    plagiarism: false,
    grade: false,
    feedback: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [plagiarismResults, setPlagiarismResults] = useState<PlagiarismResult | null>(null);
  const [gradeResults, setGradeResults] = useState<GradeResult | null>(null);
  const [feedbackResults, setFeedbackResults] = useState<FeedbackResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(prev => ({ ...prev, analyze: true }));
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze submission');
      }

      const results: AnalysisResult = await response.json();
      setAnalysisResults(results);
      onAnalysisComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, analyze: false }));
    }
  };

  const handleCheckPlagiarism = async () => {
    setLoading(prev => ({ ...prev, plagiarism: true }));
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/check-plagiarism`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }

      const results: PlagiarismResult = await response.json();
      setPlagiarismResults(results);
      onPlagiarismComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, plagiarism: false }));
    }
  };

  const handleSmartGrade = async () => {
    setLoading(prev => ({ ...prev, grade: true }));
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/smart-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to generate grade');
      }

      const results: GradeResult = await response.json();
      setGradeResults(results);
      onGradeComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, grade: false }));
    }
  };

  const handleGenerateFeedback = async () => {
    setLoading(prev => ({ ...prev, feedback: true }));
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/generate-feedback`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const results: FeedbackResult = await response.json();
      setFeedbackResults(results);
      onFeedbackComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        AI Analysis Tools
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip title="Analyze submission content and provide detailed feedback">
            <Button
              fullWidth
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={handleAnalyze}
              disabled={loading.analyze}
            >
              {loading.analyze ? <CircularProgress size={24} /> : 'Analyze Submission'}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip title="Check for potential plagiarism in the submission">
            <Button
              fullWidth
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleCheckPlagiarism}
              disabled={loading.plagiarism}
            >
              {loading.plagiarism ? <CircularProgress size={24} /> : 'Check Plagiarism'}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip title="Generate an AI-powered grade based on the submission">
            <Button
              fullWidth
              variant="contained"
              startIcon={<GradeIcon />}
              onClick={handleSmartGrade}
              disabled={loading.grade}
            >
              {loading.grade ? <CircularProgress size={24} /> : 'Smart Grade'}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip title="Generate detailed feedback for the student">
            <Button
              fullWidth
              variant="contained"
              startIcon={<FeedbackIcon />}
              onClick={handleGenerateFeedback}
              disabled={loading.feedback}
            >
              {loading.feedback ? <CircularProgress size={24} /> : 'Generate Feedback'}
            </Button>
          </Tooltip>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {analysisResults && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {analysisResults.analysis}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {plagiarismResults && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Plagiarism Check
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {plagiarismResults.analysis}
                </Typography>
                <Typography variant="subtitle1" color="error" sx={{ mt: 2 }}>
                  Plagiarism Probability: {plagiarismResults.probability}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {gradeResults && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Smart Grade
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  Score: {gradeResults.score}
                </Typography>
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {gradeResults.grade_analysis}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {feedbackResults && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generated Feedback
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {feedbackResults.content}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: 'block' }}
                >
                  Generated on: {new Date(feedbackResults.created_at).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AIAnalysisPanel;
