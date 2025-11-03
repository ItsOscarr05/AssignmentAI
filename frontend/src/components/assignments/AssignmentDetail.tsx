import {
  AccessTime as AccessTimeIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Assignment } from '../../types/assignment';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import FileUpload from '../common/FileUpload';
import { Toast } from '../common/Toast';

interface AssignmentDetailProps {
  assignment?: Assignment;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onView?: (assignment: Assignment) => void;
  onSubmit?: (files: File[]) => void;
  loading?: boolean;
  error?: Error;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

interface Submission {
  id: string;
  status: 'submitted' | 'late' | 'graded';
  submittedAt: string;
  score?: number;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
  assignment: propAssignment,
  onEdit,
  onSubmit,
  loading: propLoading,
  error: propError,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(propAssignment || null);
  const [loading, setLoading] = useState(propLoading || false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    if (propError) {
      setToast({
        open: true,
        message: propError.message,
        severity: 'error',
      });
    }
  }, [propError]);

  useEffect(() => {
    if (!propAssignment) {
      fetchAssignment();
    }
  }, [id, propAssignment]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load assignment');
      }
      const data = await response.json();
      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      setToast({
        open: true,
        message: 'Failed to load assignment',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }
      setToast({
        open: true,
        message: 'Assignment deleted successfully',
        severity: 'success',
      });
      navigate('/assignments');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setToast({
        open: true,
        message: 'Failed to delete assignment',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(attachments);
      } else {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });

        const response = await fetch(`/api/assignments/${assignment.id}/submit`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Submission failed');
        }
      }

      setSubmissionDialogOpen(false);
      setAttachments([]);
      setToast({
        open: true,
        message: 'Assignment submitted successfully',
        severity: 'success',
      });
      fetchAssignment(); // Refresh assignment data
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Submission failed',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading assignment details...</Typography>
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Assignment not found</Typography>
      </Box>
    );
  }

  const formattedDueDate = new Date(assignment.due_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedCreatedDate = new Date(assignment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {assignment.title}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip
              label={assignment.status}
              color={
                assignment.status === 'published'
                  ? 'success'
                  : assignment.status === 'draft'
                  ? 'warning'
                  : 'error'
              }
              className="MuiChip-colorSuccess"
            />
            <IconButton
              color="primary"
              onClick={() => onEdit?.(assignment)}
              title="Edit Assignment"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              title="Delete Assignment"
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Subject" secondary={assignment.subject} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Grade Level" secondary={assignment.grade_level} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText primary="Created" secondary={`Created: ${formattedCreatedDate}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText primary="Due Date" secondary={`Due: ${formattedDueDate}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Maximum Submissions" secondary={assignment.maxSubmissions} />
              </ListItem>
              {assignment.allowLateSubmissions && (
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Late Submission Penalty"
                    secondary={`${assignment.lateSubmissionPenalty}%`}
                  />
                </ListItem>
              )}
            </List>

            {assignment.attachments.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Attachments
                </Typography>
                <List>
                  {assignment.attachments.map((attachment: Attachment) => (
                    <ListItem
                      key={attachment.id}
                      secondaryAction={
                        <IconButton edge="end" href={attachment.url} target="_blank">
                          <DownloadIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <AttachFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={attachment.name}
                        secondary={`${(attachment.size / 1024).toFixed(2)} KB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Submission Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Total Submissions"
                    secondary={`${assignment.submissions.length} submissions`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="On Time"
                    secondary={
                      assignment.submissions.filter((s: Submission) => s.status === 'submitted')
                        .length
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Late"
                    secondary={
                      assignment.submissions.filter((s: Submission) => s.status === 'late').length
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Graded"
                    secondary={
                      assignment.submissions.filter((s: Submission) => s.status === 'graded').length
                    }
                  />
                </ListItem>
              </List>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setSubmissionDialogOpen(true)}
                disabled={assignment.status !== 'published'}
              >
                Submit Assignment
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Dialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <FileUpload
            files={attachments}
            onChange={setAttachments}
            multiple
            accept={['.pdf', '.doc', '.docx', '.txt']}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || attachments.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default AssignmentDetail;
