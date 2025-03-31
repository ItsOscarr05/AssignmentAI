import {
  AccessTime as AccessTimeIcon,
  Archive as ArchiveIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Publish as PublishIcon,
} from "@mui/icons-material";
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
} from "@mui/material";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Assignment } from "../../types/assignment";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { FileUpload } from "../common/FileUpload";
import { Toast } from "../common/Toast";

const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/assignments/${id}`);
      const data = await response.json();
      setAssignment(data);
    } catch (err) {
      setToast({
        open: true,
        message: "Failed to fetch assignment details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Assignment["status"]) => {
    if (!assignment) return;

    try {
      setSubmitting(true);
      // TODO: Replace with actual API call
      await fetch(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setToast({
        open: true,
        message: `Assignment ${newStatus} successfully`,
        severity: "success",
      });
      fetchAssignment();
    } catch (err) {
      setToast({
        open: true,
        message: `Failed to ${newStatus} assignment`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    try {
      setSubmitting(true);
      // TODO: Replace with actual API call
      await fetch(`/api/assignments/${assignment.id}`, {
        method: "DELETE",
      });

      setToast({
        open: true,
        message: "Assignment deleted successfully",
        severity: "success",
      });
      navigate("/assignments");
    } catch (err) {
      setToast({
        open: true,
        message: "Failed to delete assignment",
        severity: "error",
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
      const formData = new FormData();
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      // TODO: Replace with actual API call
      await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        body: formData,
      });

      setToast({
        open: true,
        message: "Submission successful",
        severity: "success",
      });
      setSubmissionDialogOpen(false);
      fetchAssignment();
    } catch (err) {
      setToast({
        open: true,
        message: "Failed to submit assignment",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setAttachments(files);
  };

  const handleFileRemove = () => {
    setAttachments([]);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Assignment not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">{assignment.title}</Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={assignment.status}
              color={
                assignment.status === "published"
                  ? "success"
                  : assignment.status === "archived"
                  ? "secondary"
                  : "default"
              }
            />
            <IconButton
              onClick={() => navigate(`/assignments/${assignment.id}/edit`)}
            >
              <EditIcon />
            </IconButton>
            {assignment.status === "draft" && (
              <IconButton
                onClick={() => handleStatusChange("published")}
                disabled={submitting}
              >
                <PublishIcon />
              </IconButton>
            )}
            {assignment.status === "published" && (
              <IconButton
                onClick={() => handleStatusChange("archived")}
                disabled={submitting}
              >
                <ArchiveIcon />
              </IconButton>
            )}
            <IconButton onClick={() => setDeleteDialogOpen(true)}>
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
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Due Date"
                  secondary={format(
                    new Date(assignment.dueDate),
                    "MMM d, yyyy"
                  )}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Maximum Submissions"
                  secondary={assignment.maxSubmissions}
                />
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
                  {assignment.attachments.map((attachment) => (
                    <ListItem
                      key={attachment.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          href={attachment.url}
                          target="_blank"
                        >
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
                    secondary={assignment.submissions.length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="On Time"
                    secondary={
                      assignment.submissions.filter(
                        (s) => s.status === "submitted"
                      ).length
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Late"
                    secondary={
                      assignment.submissions.filter((s) => s.status === "late")
                        .length
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Graded"
                    secondary={
                      assignment.submissions.filter(
                        (s) => s.status === "graded"
                      ).length
                    }
                  />
                </ListItem>
              </List>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setSubmissionDialogOpen(true)}
                disabled={assignment.status !== "published"}
              >
                Submit Assignment
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              accept=".pdf,.doc,.docx,.txt"
              maxSize={10 * 1024 * 1024} // 10MB
              multiple
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || attachments.length === 0}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Assignment"
        content="Are you sure you want to delete this assignment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

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
