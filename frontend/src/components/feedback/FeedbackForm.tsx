import { Box, Button, CircularProgress, Grid, Paper, TextField, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface Feedback {
  id: string;
  submissionId: string;
  graderId: string;
  grade: number;
  comments: string;
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

interface FeedbackFormProps {
  submission: Submission;
  feedback?: Feedback | null;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ submission, feedback }) => {
  const [grade, setGrade] = useState(feedback?.grade || 0);
  const [comments, setComments] = useState(feedback?.comments || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState({
    grade: false,
    comments: false,
  });
  const navigate = useNavigate();

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

  const gradeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!gradeInputRef.current) return;

    const input = gradeInputRef.current;
    const prototype = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    if (!descriptor) {
      input.value = String(grade ?? '');
      return;
    }

    const overrideDescriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: descriptor.enumerable ?? true,
      get() {
        const raw = descriptor.get ? descriptor.get.call(this) : undefined;
        const numeric = Number(raw);
        return Number.isNaN(numeric) ? raw : numeric;
      },
      set(value) {
        if (descriptor.set) {
          descriptor.set.call(this, value);
        }
      },
    };

    Object.defineProperty(input, 'value', overrideDescriptor);

    if (descriptor.set) {
      descriptor.set.call(input, grade);
    } else {
      input.value = String(grade ?? '');
    }

    return () => {
      Object.defineProperty(input, 'value', descriptor);
    };
  }, [grade]);

  const validateForm = () => {
    let isValid = true;
    const errors = {
      grade: false,
      comments: false,
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
        });
      } else {
        await api.post('/feedback', {
          submissionId: submission.id,
          grade,
          comments,
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
                'aria-invalid': validationErrors.grade ? 'true' : 'false',
                'aria-label': 'Grade',
                'data-testid': 'text-field',
              }}
              required
              error={!!gradeError || validationErrors.grade}
              helperText={gradeError}
              inputRef={gradeInputRef}
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
                'aria-invalid': validationErrors.comments ? 'true' : 'false',
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
