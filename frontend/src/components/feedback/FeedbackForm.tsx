import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

interface RubricScore {
  criterionId: string;
  score: number;
  comments: string;
}

interface Feedback {
  id: string;
  submissionId: string;
  graderId: string;
  grade: number;
  comments: string;
  rubricScores: RubricScore[];
  submittedAt: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  status: string;
}

interface Rubric {
  id: string;
  assignmentId: string;
  criteria: RubricCriterion[];
}

interface FeedbackFormProps {
  submission: Submission;
  rubric: Rubric;
  feedback?: Feedback | null;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ submission, rubric, feedback }) => {
  const [grade, setGrade] = useState(feedback?.grade || 0);
  const [comments, setComments] = useState(feedback?.comments || '');
  const [rubricScores, setRubricScores] = useState<RubricScore[]>(
    feedback?.rubricScores ||
      rubric.criteria.map(c => ({
        criterionId: c.id,
        score: 0,
        comments: '',
      }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [rubricError, setRubricError] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState({
    grade: false,
    comments: false,
    rubric: false,
  });
  const navigate = useNavigate();

  // Calculate total grade from rubric scores
  useEffect(() => {
    if (!feedback) {
      // Only calculate total if not editing existing feedback
      const totalScore = rubricScores.reduce((sum, score) => sum + score.score, 0);
      setGrade(totalScore);
    }
  }, [rubricScores, feedback]);

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= 100) {
      setGrade(value);
      setGradeError(null);
    } else {
      setGradeError('Grade must be between 0 and 100');
    }
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComments(e.target.value);
  };

  const handleRubricScoreChange = (criterionId: string, score: number) => {
    setRubricScores(prev => prev.map(s => (s.criterionId === criterionId ? { ...s, score } : s)));
    setRubricError(null);
  };

  const handleRubricCommentsChange = (criterionId: string, comments: string) => {
    setRubricScores(prev =>
      prev.map(s => (s.criterionId === criterionId ? { ...s, comments } : s))
    );
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      grade: false,
      comments: false,
      rubric: false,
    };

    // Validate grade
    if (!grade || grade < 0 || grade > 100) {
      setGradeError('Grade must be between 0 and 100');
      errors.grade = true;
      isValid = false;
    } else {
      setGradeError(null);
    }

    // Validate comments
    if (!comments.trim()) {
      setError('Comments are required');
      errors.comments = true;
      isValid = false;
    } else {
      setError(null);
    }

    // Validate rubric scores
    const unscoredCriteria = rubricScores.filter(score => score.score === 0);
    if (unscoredCriteria.length > 0) {
      setRubricError('Please score all rubric criteria');
      errors.rubric = true;
      isValid = false;
    } else {
      setRubricError(null);
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run validation immediately and return if invalid
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (feedback) {
        await api.put(`/feedback/${feedback.id}`, {
          grade,
          comments,
          rubricScores,
        });
      } else {
        await api.post('/feedback', {
          submissionId: submission.id,
          grade,
          comments,
          rubricScores,
        });
      }
      navigate('/feedback');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Feedback Form
      </Typography>

      {error && !validationErrors.comments && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Grade Input */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Grade"
              type="number"
              value={grade}
              onChange={handleGradeChange}
              inputProps={{
                min: 0,
                max: 100,
                'aria-invalid': validationErrors.grade,
              }}
              required
              error={!!gradeError || validationErrors.grade}
              helperText={gradeError}
            />
          </Grid>

          {/* Comments Input */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Comments"
              multiline
              rows={4}
              value={comments}
              onChange={handleCommentsChange}
              required
              error={validationErrors.comments}
              helperText={validationErrors.comments ? 'Comments are required' : ''}
              inputProps={{
                'data-testid': 'main-comments',
                'aria-invalid': validationErrors.comments,
              }}
            />
          </Grid>

          {/* Submission Content */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Submission Content
            </Typography>
            <Box component="pre" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              {submission.content}
            </Box>
          </Grid>

          {/* Rubric Scoring */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Rubric Scoring
            </Typography>
            {rubricError && (
              <Typography color="error" sx={{ mb: 2 }} data-testid="rubric-error">
                {rubricError}
              </Typography>
            )}
            {rubric.criteria.map(criterion => {
              const score = rubricScores.find(s => s.criterionId === criterion.id);
              const isInvalid = validationErrors.rubric && (!score?.score || score.score === 0);
              return (
                <Box key={criterion.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {criterion.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {criterion.description}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={isInvalid}>
                        <InputLabel error={isInvalid}>Score</InputLabel>
                        <Select
                          value={score?.score || 0}
                          onChange={e =>
                            handleRubricScoreChange(criterion.id, Number(e.target.value))
                          }
                          label="Score"
                          error={isInvalid}
                          inputProps={{
                            'data-testid': `rubric-score-${criterion.id}`,
                          }}
                        >
                          {Array.from({ length: criterion.maxScore + 1 }, (_, i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Max score: {criterion.maxScore}</FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Comments"
                        value={score?.comments || ''}
                        onChange={e => handleRubricCommentsChange(criterion.id, e.target.value)}
                        inputProps={{ 'data-testid': `rubric-comments-${criterion.id}` }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              );
            })}
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? (
                <CircularProgress size={24} />
              ) : feedback ? (
                'Update Feedback'
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};
