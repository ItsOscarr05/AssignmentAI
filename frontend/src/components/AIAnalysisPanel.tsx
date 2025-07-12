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
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTokenLimitContext } from '../contexts/TokenLimitContext';
import { TokenLimitWarning } from './common/TokenLimitWarning';

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

  const { hasEnoughTokens, loading: tokenLoading } = useTokenLimitContext();

  // Token estimates for each operation
  const tokenEstimates = {
    analyze: 1000,
    plagiarism: 750,
    grade: 500,
    feedback: 500,
  };

  const canPerformOperation = (operation: keyof typeof tokenEstimates) => {
    return hasEnoughTokens(tokenEstimates[operation]);
  };

  const handleAnalyze = async () => {
    if (!canPerformOperation('analyze')) {
      setError('Insufficient tokens to analyze submission. Please upgrade your plan.');
      return;
    }

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

  const handlePlagiarismCheck = async () => {
    if (!canPerformOperation('plagiarism')) {
      setError('Insufficient tokens to check plagiarism. Please upgrade your plan.');
      return;
    }

    setLoading(prev => ({ ...prev, plagiarism: true }));
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/plagiarism`, {
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

  const handleGrade = async () => {
    if (!canPerformOperation('grade')) {
      setError('Insufficient tokens to grade submission. Please upgrade your plan.');
      return;
    }

    setLoading(prev => ({ ...prev, grade: true }));
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to grade submission');
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
    if (!canPerformOperation('feedback')) {
      setError('Insufficient tokens to generate feedback. Please upgrade your plan.');
      return;
    }

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

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analyze Submission
              </Typography>
              <TokenLimitWarning tokensNeeded={tokenEstimates.analyze} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Get detailed analysis of the submission including strengths, weaknesses, and
                suggestions.
              </Typography>
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={loading.analyze || !canPerformOperation('analyze') || tokenLoading}
                startIcon={loading.analyze ? <CircularProgress size={20} /> : <AssessmentIcon />}
                fullWidth
              >
                {loading.analyze ? 'Analyzing...' : 'Analyze Submission'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plagiarism Check
              </Typography>
              <TokenLimitWarning tokensNeeded={tokenEstimates.plagiarism} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Check for potential plagiarism and similarity with other sources.
              </Typography>
              <Button
                variant="contained"
                onClick={handlePlagiarismCheck}
                disabled={loading.plagiarism || !canPerformOperation('plagiarism') || tokenLoading}
                startIcon={
                  loading.plagiarism ? <CircularProgress size={20} /> : <CheckCircleIcon />
                }
                fullWidth
              >
                {loading.plagiarism ? 'Checking...' : 'Check Plagiarism'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Smart Grade
              </Typography>
              <TokenLimitWarning tokensNeeded={tokenEstimates.grade} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Get an AI-powered grade and detailed scoring analysis.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGrade}
                disabled={loading.grade || !canPerformOperation('grade') || tokenLoading}
                startIcon={loading.grade ? <CircularProgress size={20} /> : <GradeIcon />}
                fullWidth
              >
                {loading.grade ? 'Grading...' : 'Grade Submission'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Feedback
              </Typography>
              <TokenLimitWarning tokensNeeded={tokenEstimates.feedback} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate comprehensive feedback for the student.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateFeedback}
                disabled={loading.feedback || !canPerformOperation('feedback') || tokenLoading}
                startIcon={loading.feedback ? <CircularProgress size={20} /> : <FeedbackIcon />}
                fullWidth
              >
                {loading.feedback ? 'Generating...' : 'Generate Feedback'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Display */}
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
                  Plagiarism Check Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  Probability: {plagiarismResults.probability}%
                </Typography>
                <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {plagiarismResults.analysis}
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
