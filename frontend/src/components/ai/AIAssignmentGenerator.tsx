import { zodResolver } from '@hookform/resolvers/zod';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
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
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { assignments } from '../../services/api';
import { AssignmentGenerationRequest } from '../../types/ai';
import { Toast } from '../common/Toast';

const generationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  subject: z.string().min(1, 'Subject is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  grade_level: z.string().min(1, 'Grade level is required'),
  estimated_duration: z.number().min(1, 'Duration must be at least 1 minute'),
  max_points: z.number().min(1, 'Maximum points must be at least 1'),
});

type GenerationFormData = z.infer<typeof generationSchema>;

const AIAssignmentGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const form = useForm<GenerationFormData>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      difficulty: 'medium',
      grade_level: '',
      estimated_duration: 30,
      max_points: 100,
    },
  });

  const handleAddItem = (items: string[], setItems: (items: string[]) => void) => {
    setItems([...items, '']);
  };

  const handleRemoveItem = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number
  ) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number,
    value: string
  ) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const onSubmit = async (data: GenerationFormData) => {
    console.log('Form submission started with data:', data);
    console.log('Current requirements:', requirements);
    console.log('Current learning objectives:', learningObjectives);

    if (requirements.filter(Boolean).length === 0) {
      console.log('Validation failed: No requirements provided');
      setToast({
        open: true,
        message: 'At least one requirement is required',
        severity: 'error',
      });
      return;
    }

    if (learningObjectives.filter(Boolean).length === 0) {
      console.log('Validation failed: No learning objectives provided');
      setToast({
        open: true,
        message: 'At least one learning objective is required',
        severity: 'error',
      });
      return;
    }

    try {
      console.log('Setting loading state to true');
      setLoading(true);
      const request: AssignmentGenerationRequest = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        difficulty: data.difficulty,
        type: 'essay', // Default type
        timeLimit: data.estimated_duration,
        additionalContext: requirements.filter(Boolean).join('\n'),
      };
      console.log('Sending request to API:', request);
      const response = await assignments.generateAssignment(request);
      console.log('Received API response:', response);

      if (response.content) {
        console.log('Setting success toast');
        setToast({
          open: true,
          message: 'Assignment generated successfully',
          severity: 'success',
        });
      } else {
        console.log('Setting error toast - no content in response');
        setToast({
          open: true,
          message: 'Failed to generate assignment',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('API call failed:', error);
      setToast({
        open: true,
        message: 'Failed to generate assignment',
        severity: 'error',
      });
    } finally {
      console.log('Setting loading state to false');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Assignment Generator
      </Typography>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={form.handleSubmit(onSubmit)} data-testid="assignment-form">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                {...form.register('title')}
                error={!!form.formState.errors.title}
                helperText={form.formState.errors.title?.message}
                disabled={loading}
                data-testid="text-field"
                id="title"
                InputLabelProps={{
                  htmlFor: 'title',
                  'data-testid': 'title-label',
                }}
                inputProps={{
                  'aria-label': 'Title',
                  'data-testid': 'title-input',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                {...form.register('description')}
                error={!!form.formState.errors.description}
                helperText={form.formState.errors.description?.message}
                disabled={loading}
                data-testid="text-field"
                id="description"
                InputLabelProps={{
                  htmlFor: 'description',
                  'data-testid': 'description-label',
                }}
                inputProps={{
                  'aria-label': 'Description',
                  'data-testid': 'description-input',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject"
                {...form.register('subject')}
                error={!!form.formState.errors.subject}
                helperText={form.formState.errors.subject?.message}
                disabled={loading}
                data-testid="text-field"
                id="subject"
                InputLabelProps={{
                  htmlFor: 'subject',
                  'data-testid': 'subject-label',
                }}
                inputProps={{
                  'aria-label': 'Subject',
                  'data-testid': 'subject-input',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!form.formState.errors.difficulty}>
                <InputLabel id="difficulty-label" htmlFor="difficulty">
                  Difficulty Level
                </InputLabel>
                <Select
                  labelId="difficulty-label"
                  id="difficulty"
                  label="Difficulty Level"
                  {...form.register('difficulty')}
                  defaultValue="medium"
                  disabled={loading}
                  inputProps={{
                    'aria-label': 'Difficulty Level',
                    'data-testid': 'difficulty-input',
                  }}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
                {form.formState.errors.difficulty && (
                  <FormHelperText>{form.formState.errors.difficulty.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              {requirements.map((requirement, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Requirement ${index + 1}`}
                    value={requirement}
                    onChange={e =>
                      handleItemChange(requirements, setRequirements, index, e.target.value)
                    }
                    error={requirements.length === 1 && !requirement}
                    helperText={
                      requirements.length === 1 && !requirement
                        ? 'At least one requirement is required'
                        : ''
                    }
                    disabled={loading}
                    data-testid="text-field"
                    id={`requirement-${index + 1}`}
                    InputLabelProps={{
                      htmlFor: `requirement-${index + 1}`,
                      'data-testid': `requirement-label-${index + 1}`,
                    }}
                    inputProps={{
                      'aria-label': `Requirement ${index + 1}`,
                      'data-testid': `requirement-input-${index + 1}`,
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveItem(requirements, setRequirements, index)}
                    disabled={requirements.length === 1 || loading}
                    aria-label={`Remove requirement ${index + 1}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddItem(requirements, setRequirements)}
                sx={{ mt: 1 }}
                disabled={loading}
                aria-label="Add requirement"
              >
                Add Requirement
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Learning Objectives
              </Typography>
              {learningObjectives.map((objective, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Learning Objective ${index + 1}`}
                    value={objective}
                    onChange={e =>
                      handleItemChange(
                        learningObjectives,
                        setLearningObjectives,
                        index,
                        e.target.value
                      )
                    }
                    error={learningObjectives.length === 1 && !objective}
                    helperText={
                      learningObjectives.length === 1 && !objective
                        ? 'At least one learning objective is required'
                        : ''
                    }
                    disabled={loading}
                    data-testid="text-field"
                    id={`objective-${index + 1}`}
                    InputLabelProps={{
                      htmlFor: `objective-${index + 1}`,
                      'data-testid': `objective-label-${index + 1}`,
                    }}
                    inputProps={{
                      'aria-label': `Learning Objective ${index + 1}`,
                      'data-testid': `objective-input-${index + 1}`,
                    }}
                  />
                  <IconButton
                    onClick={() =>
                      handleRemoveItem(learningObjectives, setLearningObjectives, index)
                    }
                    disabled={learningObjectives.length === 1 || loading}
                    aria-label={`Remove learning objective ${index + 1}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddItem(learningObjectives, setLearningObjectives)}
                sx={{ mt: 1 }}
                disabled={loading}
                aria-label="Add learning objective"
              >
                Add Learning Objective
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                disabled={!!loading}
                data-testid="generate-button"
                aria-label="Generate assignment"
                sx={{
                  '&.Mui-disabled': {
                    pointerEvents: 'none',
                    opacity: 0.7,
                  },
                }}
              >
                {loading ? 'Generating...' : 'Generate Assignment'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
        data-testid="snackbar"
        data-severity={toast.severity}
      />
    </Box>
  );
};

export default AIAssignmentGenerator;
