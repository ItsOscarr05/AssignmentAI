import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Assignment } from '../../types/assignment';
import { FileUpload } from '../common/FileUpload';
import { useFormValidation } from '../../hooks/useFormValidation';
import { z } from 'zod';
import { Toast } from '../common/Toast';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.date(),
  maxSubmissions: z.number().min(1, 'Maximum submissions must be at least 1'),
  allowLateSubmissions: z.boolean(),
  lateSubmissionPenalty: z.number().min(0, 'Penalty cannot be negative'),
  tags: z.array(z.string()),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

const AssignmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useFormValidation<AssignmentFormData>(assignmentSchema, {
    defaultValues: {
      title: '',
      description: '',
      dueDate: new Date(),
      maxSubmissions: 1,
      allowLateSubmissions: false,
      lateSubmissionPenalty: 0,
      tags: [],
    },
  });

  const allowLateSubmissions = watch('allowLateSubmissions');

  useEffect(() => {
    if (id) {
      fetchAssignment();
    }
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/assignments/${id}`);
      const data: Assignment = await response.json();
      
      setValue('title', data.title);
      setValue('description', data.description);
      setValue('dueDate', new Date(data.dueDate));
      setValue('maxSubmissions', data.maxSubmissions);
      setValue('allowLateSubmissions', data.allowLateSubmissions);
      setValue('lateSubmissionPenalty', data.lateSubmissionPenalty);
      setValue('tags', data.tags);
    } catch (err) {
      setToast({
        open: true,
        message: 'Failed to fetch assignment',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'dueDate') {
          formData.append(key, value.toISOString());
        } else if (key === 'tags') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      // Append attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      // TODO: Replace with actual API call
      const response = await fetch(`/api/assignments${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save assignment');
      }

      setToast({
        open: true,
        message: `Assignment ${id ? 'updated' : 'created'} successfully`,
        severity: 'success',
      });

      navigate('/assignments');
    } catch (err) {
      setToast({
        open: true,
        message: `Failed to ${id ? 'update' : 'create'} assignment`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setAttachments(files);
  };

  const handleFileRemove = () => {
    setAttachments([]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {id ? 'Edit Assignment' : 'Create Assignment'}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Due Date"
                value={watch('dueDate')}
                onChange={(date) => setValue('dueDate', date || new Date())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dueDate,
                    helperText: errors.dueDate?.message,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Submissions"
                {...register('maxSubmissions', { valueAsNumber: true })}
                error={!!errors.maxSubmissions}
                helperText={errors.maxSubmissions?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    {...register('allowLateSubmissions')}
                    checked={allowLateSubmissions}
                  />
                }
                label="Allow Late Submissions"
              />
            </Grid>

            {allowLateSubmissions && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Late Submission Penalty (%)"
                  {...register('lateSubmissionPenalty', { valueAsNumber: true })}
                  error={!!errors.lateSubmissionPenalty}
                  helperText={errors.lateSubmissionPenalty?.message}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Attachments
              </Typography>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                accept=".pdf,.doc,.docx,.txt"
                maxSize={10 * 1024 * 1024} // 10MB
                multiple
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/assignments')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : id ? 'Update' : 'Create'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Toast
          open={toast.open}
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast({ ...toast, open: false })}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default AssignmentForm;
