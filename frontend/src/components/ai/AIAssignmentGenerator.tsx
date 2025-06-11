import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { api } from '../../services/api';

// Define the form schema
const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  subject: z.string().min(1, 'Subject is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  grade_level: z.string().min(1, 'Grade level is required'),
  estimated_duration: z.number().min(1, 'Duration must be at least 1 minute'),
  max_points: z.number().min(1, 'Points must be at least 1'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed'),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentGenerationResponse {
  generated_assignment: AssignmentFormData;
  message: string;
}

const AIAssignmentGenerator: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { trackUsage } = useUsageTracking('assignment_generation');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState<AssignmentFormData | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      difficulty: 'medium',
      grade_level: '',
      estimated_duration: 30,
      max_points: 100,
      requirements: [''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requirements',
  });

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      setIsGenerating(true);
      await trackUsage('generate');

      const response = await api.post<AssignmentGenerationResponse>(
        '/ai/generate-assignment',
        data
      );

      if (response.data.generated_assignment) {
        setGeneratedAssignment(response.data.generated_assignment);
        enqueueSnackbar('Assignment generated successfully!', { variant: 'success' });
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to generate assignment', {
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGenerated = () => {
    if (generatedAssignment) {
      reset(generatedAssignment);
      setGeneratedAssignment(null);
      enqueueSnackbar('Generated assignment loaded into form', { variant: 'success' });
    }
  };

  const handleAddRequirement = () => {
    const currentRequirements = control._formValues.requirements || [];
    append([...currentRequirements, '']);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            AI Assignment Generator
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    {...register('title')}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Subject"
                    {...register('subject')}
                    error={!!errors.subject}
                    helperText={errors.subject?.message}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.difficulty}>
                    <InputLabel>Difficulty</InputLabel>
                    <Select label="Difficulty" {...register('difficulty')}>
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                    {errors.difficulty && (
                      <FormHelperText>{errors.difficulty.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Grade Level"
                    {...register('grade_level')}
                    error={!!errors.grade_level}
                    helperText={errors.grade_level?.message}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Estimated Duration (minutes)"
                    {...register('estimated_duration', { valueAsNumber: true })}
                    error={!!errors.estimated_duration}
                    helperText={errors.estimated_duration?.message}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="number"
                label="Maximum Points"
                {...register('max_points', { valueAsNumber: true })}
                error={!!errors.max_points}
                helperText={errors.max_points?.message}
              />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Requirements
                </Typography>
                {fields.map((field, index) => (
                  <Box key={field.id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      {...register(`requirements.${index}`)}
                      error={!!errors.requirements?.[index]}
                      helperText={errors.requirements?.[index]?.message}
                    />
                    <IconButton
                      onClick={() => remove(index)}
                      color="error"
                      disabled={fields.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddRequirement}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Add Requirement
                </Button>
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={isGenerating}
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
                  },
                }}
              >
                {isGenerating ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Generating...
                  </>
                ) : (
                  'Generate Assignment'
                )}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {generatedAssignment && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Assignment
            </Typography>
            <Typography variant="body1" paragraph>
              {generatedAssignment.description}
            </Typography>
            <Button
              variant="contained"
              onClick={handleUseGenerated}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388E3C 30%, #66BB6A 90%)',
                },
              }}
            >
              Use Generated Assignment
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIAssignmentGenerator;
