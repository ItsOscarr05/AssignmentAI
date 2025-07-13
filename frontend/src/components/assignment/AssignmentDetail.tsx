import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useState } from 'react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  status: string;
  dueDate: string;
  createdAt: string;
  submissions: number;
  averageScore?: number;
  requirements?: string[];
  resources?: Array<{ title: string; url: string; type: string }>;
}

interface AssignmentDetailProps {
  assignment: Assignment;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onView?: (assignment: Assignment) => void;
  loading?: boolean;
  error?: Error;
  onSubmit?: (file: File) => Promise<void>;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
  assignment,
  onEdit,
  onDelete,
  onView,
  loading = false,
  error,
  onSubmit,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB
        setSubmitError('File too large');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!file) return;
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(file);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress role="progressbar" aria-label="Loading assignment details" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error" role="alert">
          {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 4 }} role="main" aria-label="Assignment Details">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {assignment.title}
          </Typography>
          <Chip
            color={getStatusColor(assignment.status)}
            sx={{ textTransform: 'capitalize' }}
            role="status"
            label={<span aria-live="polite">{assignment.status}</span>}
          />
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={assignment.difficulty}
            color={getDifficultyColor(assignment.difficulty)}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
          <Chip
            label={assignment.topic}
            color="primary"
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        <Typography variant="body1" paragraph>
          {assignment.description}
        </Typography>

        {/* Submission Form */}
        <Box mt={3} mb={3}>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="submission-input">Submission</label>
            <input
              id="submission-input"
              type="file"
              aria-label="Submission"
              aria-required="true"
              onChange={handleFileChange}
            />
            <button type="submit" tabIndex={0} disabled={submitting}>
              Submit
            </button>
            {submitError && (
              <Typography color="error" role="alert">
                {submitError}
              </Typography>
            )}
          </form>
        </Box>

        {assignment.requirements && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            {assignment.requirements.length > 0 ? (
              <ul>
                {assignment.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            ) : (
              <Typography color="text.secondary">No requirements specified</Typography>
            )}
          </Box>
        )}

        {assignment.resources && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Resources
            </Typography>
            {assignment.resources.length > 0 ? (
              <ul>
                {assignment.resources.map((resource, index) => (
                  <li key={index}>
                    {resource.title} ({resource.type})
                  </li>
                ))}
              </ul>
            ) : (
              <Typography color="text.secondary">No resources available</Typography>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">
              Created: {format(new Date(assignment.createdAt), 'MMM d, yyyy')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {`${assignment.submissions} ${
                assignment.submissions === 1 ? 'submission' : 'submissions'
              }`}
              {assignment.averageScore !== undefined && ` • ${assignment.averageScore}% average`}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} mt={3}>
          {onView && (
            <button
              onClick={() => onView(assignment)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              tabIndex={0}
            >
              View
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(assignment)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              tabIndex={0}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              tabIndex={0}
            >
              Delete
            </button>
          )}
        </Box>
      </CardContent>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Assignment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{assignment.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setShowDeleteDialog(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            tabIndex={0}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDelete?.(assignment);
              setShowDeleteDialog(false);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            tabIndex={0}
            data-testid="confirm-delete-btn"
          >
            Confirm
          </button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AssignmentDetail;
