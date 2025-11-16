import { zodResolver } from '@hookform/resolvers/zod';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  subject: z.string().min(1, 'Subject is required'),
  grade_level: z.string().min(1, 'Grade level is required'),
  due_date: z.date().min(new Date(), 'Due date must be in the future'),
  max_score: z.coerce.number().min(0, 'Maximum score must be a positive number'),
  attachments: z.array(z.string()).optional(),
});

type AssignmentFormData = z.infer<typeof schema>;

interface AssignmentFormProps {
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  initialData?: Partial<AssignmentFormData>;
  isSubmitting?: boolean;
}

const subjects = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education',
  'Other',
];

const gradeLevels = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College',
  'University',
];

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      grade_level: '',
      due_date: new Date(),
      max_score: 100,
      attachments: [],
      ...initialData,
    },
  });

  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!submitButtonRef.current) return;
    if (isSubmitting) {
      submitButtonRef.current.setAttribute('disabled', 'true');
    } else {
      submitButtonRef.current.removeAttribute('disabled');
    }
  }, [isSubmitting]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const currentAttachments = watch('attachments') || [];
      setValue('attachments', [...currentAttachments, ...response.data.urls]);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const removeAttachment = (index: number) => {
    const currentAttachments = watch('attachments') || [];
    setValue(
      'attachments',
      currentAttachments.filter((_, i) => i !== index)
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create Assignment
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  data-testid="text-field"
                />
              )}
            />
            {errors.title && <p data-testid="title-error">{errors.title.message}</p>}
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  data-testid="text-field"
                />
              )}
            />
            {errors.description && (
              <p data-testid="description-error">{errors.description.message}</p>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.subject}>
                  <InputLabel id="subject-label">Subject</InputLabel>
                  <Select
                    {...field}
                    label="Subject"
                    labelId="subject-label"
                    id="subject"
                    data-testid="select"
                  >
                    {subjects.map(subject => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText data-testid="form-helper-text">
                    {errors.subject?.message}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="grade_level"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.grade_level}>
                  <InputLabel id="grade-level-label">Grade Level</InputLabel>
                  <Select
                    {...field}
                    label="Grade Level"
                    labelId="grade-level-label"
                    id="grade-level"
                    data-testid="select"
                  >
                    {gradeLevels.map(level => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText data-testid="form-helper-text">
                    {errors.grade_level?.message}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <div data-testid="date-picker">
                    <DatePicker
                      label="Due Date"
                      {...field}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.due_date,
                          helperText: errors.due_date?.message,
                        },
                      }}
                    />
                  </div>
                )}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="max_score"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.max_score}>
                  <TextField
                    {...field}
                    label="Maximum Score"
                    type="number"
                    fullWidth
                    error={!!errors.max_score}
                    inputProps={{ min: 0 }}
                    data-testid="text-field"
                    onChange={e => {
                      const value = e.target.value;
                      field.onChange(value === '' ? '' : Number(value));
                    }}
                  />
                  <FormHelperText data-testid="form-helper-text">
                    {errors.max_score?.message}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                data-testid="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={isSubmitting}
                >
                  Upload Files
                </Button>
              </label>
            </Box>
          </Grid>

          {watch('attachments')?.map((url, index) => (
            <Grid item xs={12} key={url}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{url.split('/').pop()}</Typography>
                <IconButton
                  size="small"
                  onClick={() => removeAttachment(index)}
                  data-testid={`delete-attachment-${index}`}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              ref={submitButtonRef}
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export { AssignmentForm };
