import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { api } from '../../services/api';
import { Toast } from '../common/Toast';

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  status: string;
  grade: number | null;
  feedback: string;
  submittedAt: string;
  updatedAt: string;
}

interface Analysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvements: string[];
}

interface AIFeedbackAnalyzerProps {
  submission: Submission;
}

export default function AIFeedbackAnalyzer({ submission }: AIFeedbackAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as const });

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/ai/analyze-feedback', {
        submissionId: submission.id,
      });
      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to analyze feedback');
      console.error('Error analyzing feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Analyze Feedback
      </Typography>
      <Typography variant="h6" gutterBottom>
        Submission Details
      </Typography>
      <Typography paragraph>{submission.content}</Typography>
      <Typography paragraph>Grade: {submission.grade ?? 'Not graded yet'}</Typography>
      <Typography paragraph>{submission.feedback || 'No feedback provided'}</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAnalyze}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
      >
        Analyze
      </Button>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {analysis && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Strengths
          </Typography>
          <Typography paragraph>{analysis.strengths.join(', ')}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            Weaknesses
          </Typography>
          <Typography paragraph>{analysis.weaknesses.join(', ')}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            Suggestions
          </Typography>
          <Typography paragraph>{analysis.suggestions.join(', ')}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            Improvements
          </Typography>
          <Typography paragraph>{analysis.improvements.join(', ')}</Typography>
        </Box>
      )}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Paper>
  );
}
