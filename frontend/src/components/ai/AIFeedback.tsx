import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTokenLimitContext } from '../../contexts/TokenLimitContext';
import { ai } from '../../services/ai';
import { TokenLimitWarning } from '../common/TokenLimitWarning';

export const AIFeedback: React.FC = () => {
  useParams<{ id: string }>();
  const [submission, setSubmission] = useState('');
  const [maxPoints, setMaxPoints] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { hasEnoughTokens, loading: tokenLoading } = useTokenLimitContext();

  // Estimate tokens needed for feedback generation
  const tokensNeeded = 500; // Conservative estimate for feedback generation
  const canGenerateFeedback = hasEnoughTokens(tokensNeeded);

  const handleGenerateFeedback = async () => {
    if (!canGenerateFeedback) {
      setError('Insufficient tokens to generate feedback. Please upgrade your plan.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ai.generateFeedback({
        submission,
        maxPoints,
      });
      setFeedback(response.feedback);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            AI Feedback Generator
          </Typography>

          {/* Token Limit Warning */}
          <TokenLimitWarning tokensNeeded={tokensNeeded} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mb: 3 }}>
            <TextField
              required
              fullWidth
              multiline
              rows={10}
              label="Submission Content"
              value={submission}
              onChange={e => setSubmission(e.target.value)}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              required
              fullWidth
              type="number"
              label="Maximum Points"
              value={maxPoints}
              onChange={e => setMaxPoints(Number(e.target.value))}
              inputProps={{ min: 0, max: 1000 }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleGenerateFeedback}
            disabled={loading || !submission || !canGenerateFeedback || tokenLoading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Feedback'}
          </Button>

          {feedback && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Generated Feedback:
              </Typography>
              <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{feedback}</Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
