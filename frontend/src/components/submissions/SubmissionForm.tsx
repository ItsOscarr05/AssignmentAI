import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Assignment } from '../../types';

interface SubmissionFormData {
  title: string;
  assignment_id: number;
  description: string;
  file: File | null;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  comments: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  submittedAt: string;
  status: string;
  submissionCount: number;
}

interface SubmissionFormProps {
  assignment: Assignment;
  submission?: Submission | null;
  onSubmit?: (data: { assignmentId: string; files: File[] }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  assignment,
  submission,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [formData, setFormData] = useState<SubmissionFormData>({
    title: '',
    assignment_id: Number(assignment.id),
    description: '',
    file: null,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
    if (submission) {
      setFormData({
        title: submission.content,
        assignment_id: Number(submission.assignmentId),
        description: submission.comments,
        file: null,
      });
    }
  }, [submission]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<number>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const validateFile = (file: File): string | null => {
    console.log('Validating file:', { name: file.name, size: file.size, type: file.type });
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      console.log('Invalid file type');
      return 'Invalid file type';
    }
    if (file.size >= MAX_FILE_SIZE) {
      console.log('File too large:', file.size, '>=', MAX_FILE_SIZE);
      return 'File too large';
    }
    console.log('File validation passed');
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File change event triggered');
    setError(null);
    setUploadStatus(null);
    setFiles([]); // Clear files immediately

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', { name: file.name, size: file.size, type: file.type });
      const error = validateFile(file);
      if (error) {
        console.log('File validation error:', error);
        setError(error);
        return;
      }
      setFiles([file]);
      setUploadStatus('File uploaded');
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return false;
      }
      return true;
    });
    setFiles(validFiles);
    setUploadStatus('Files uploaded');
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Current error state:', error);
    setError(null);
    setUploadStatus(null);

    if (files.length === 0) {
      console.log('No files selected, setting error');
      const errorMessage = 'At least one file is required';
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
      return;
    }

    try {
      if (onSubmit) {
        console.log('Using onSubmit prop');
        await onSubmit({ assignmentId: assignment.id, files });
      } else {
        console.log('Using direct API call');
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('assignment_id', formData.assignment_id.toString());
        formDataToSend.append('description', formData.description);
        files.forEach(file => formDataToSend.append('files', file));

        if (id) {
          await api.put(`/submissions/${id}`, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await api.post('/submissions', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        navigate('/submissions');
      }
    } catch (error) {
      console.error('Error saving submission:', error);
      setError('Failed to save submission');
    }
  };

  useEffect(() => {
    console.log('Error state changed:', error);
  }, [error]);

  const handleCancel = () => {
    if (files.length > 0) {
      if (window.confirm('Are you sure you want to discard your changes?')) {
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {id ? 'Edit Submission' : 'New Submission'}
        </Typography>

        <Alert
          severity="error"
          sx={{
            mb: 2,
            display: error ? 'flex' : 'none',
          }}
          role="alert"
          data-testid="error-alert"
        >
          {error}
        </Alert>

        {isPastDue && (
          <Alert severity="warning" sx={{ mb: 2 }} role="alert" data-testid="late-submission-alert">
            This assignment is past due
            {assignment.lateSubmissionPenalty > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Late submission penalty: {assignment.lateSubmissionPenalty}%
              </Typography>
            )}
          </Alert>
        )}

        {submission && assignment.maxSubmissions && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            role="alert"
            data-testid="submission-count-alert"
          >
            You have {assignment.maxSubmissions - submission.submissionCount} submission
            {assignment.maxSubmissions - submission.submissionCount !== 1 ? 's' : ''} remaining
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
            inputProps={{
              'aria-label': 'Title',
              'data-testid': 'text-field',
            }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
            inputProps={{
              'aria-label': 'Description',
              'data-testid': 'text-field',
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="assignment-select-label">Assignment</InputLabel>
            <Select
              labelId="assignment-select-label"
              value={formData.assignment_id}
              name="assignment_id"
              onChange={handleChange}
              label="Assignment"
              inputProps={{
                'aria-label': 'Assignment',
                'data-testid': 'select',
              }}
            >
              {assignments.map(assignment => (
                <MenuItem key={assignment.id} value={Number(assignment.id)}>
                  {assignment.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.300',
              borderRadius: 1,
              p: 3,
              mt: 2,
              textAlign: 'center',
              bgcolor: isDragging ? 'action.hover' : 'background.paper',
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input"
              data-testid="file-input"
              accept={ALLOWED_FILE_TYPES.join(',')}
            />
            <label htmlFor="file-input">
              <Button component="span" variant="outlined" startIcon={<UploadIcon />} sx={{ mb: 2 }}>
                Choose Files
              </Button>
            </label>
            <Typography variant="body2" color="textSecondary">
              or drag and drop files here
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT
            </Typography>
          </Box>

          {files.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files:
              </Typography>
              {files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">{file.name}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    aria-label="Remove file"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {uploadStatus && (
            <Alert severity="success" sx={{ mt: 2 }} role="alert" data-testid="upload-status-alert">
              {uploadStatus}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              aria-label="Cancel"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                (assignment.maxSubmissions &&
                  submission?.submissionCount >= assignment.maxSubmissions)
              }
              aria-label="Submit"
            >
              {loading ? <CircularProgress size={24} /> : submitText}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
