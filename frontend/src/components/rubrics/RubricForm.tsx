import {
  Add as AddIcon,
  ArrowDownward,
  ArrowUpward,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { createRubric, updateRubric } from '../../api/client';
import { Assignment, Rubric, RubricCriterion } from '../../types';

interface RubricFormProps {
  assignment: Assignment;
  rubric?: Rubric;
  onSubmit: (data: Partial<Rubric>) => void;
}

const RubricForm: React.FC<RubricFormProps> = ({ rubric, onSubmit, assignment }) => {
  const [title, setTitle] = useState<string>(rubric?.title || '');
  const [description, setDescription] = useState<string>(rubric?.description || '');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(rubric?.criteria || []);
  const [passingScore, setPassingScore] = useState<number>(rubric?.passingScore || 0);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotalMaxScore = (criteria: RubricCriterion[]): number => {
    return criteria.reduce((total, criterion) => total + criterion.maxScore, 0);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Name is required';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    }

    if (passingScore <= 0) {
      errors.passingScore = 'Passing score must be greater than 0';
    }

    const totalMaxScore = calculateTotalMaxScore(criteria);
    if (passingScore > totalMaxScore) {
      errors.passingScore = 'Passing score cannot exceed total max score';
    }

    if (criteria.length === 0) {
      errors.criteria = 'At least one criterion is required';
    }

    criteria.forEach((criterion, index) => {
      if (!criterion.name.trim()) {
        errors[`criteria.${index}.name`] = 'Criterion name is required';
      }

      if (!criterion.description.trim()) {
        errors[`criteria.${index}.description`] = 'Criterion description is required';
      }

      if (criterion.maxScore <= 0) {
        errors[`criteria.${index}.maxScore`] = 'Max score must be greater than 0';
      }

      if (criterion.weight <= 0 || criterion.weight > 100) {
        errors[`criteria.${index}.weight`] = 'Weight must be between 0 and 100';
      }
    });

    // Check for duplicate criterion names
    const criterionNames = criteria.map(c => c.name.toLowerCase());
    const uniqueNames = new Set(criterionNames);
    if (uniqueNames.size !== criterionNames.length) {
      errors.criteria = 'Criterion names must be unique';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const data = await (rubric
        ? updateRubric(rubric.id, {
            title,
            description,
            criteria,
            passingScore,
          })
        : createRubric({
            title,
            description,
            criteria,
            passingScore,
          }));

      await onSubmit(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save rubric';
      setError(errorMessage);
      console.error('Error saving rubric:', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCriterion = () => {
    setCriteria(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        description: '',
        maxScore: 0,
        weight: 0,
        points: 0,
        levels: [],
      },
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveCriterion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === criteria.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCriteria = [...criteria];
    [newCriteria[index], newCriteria[newIndex]] = [newCriteria[newIndex], newCriteria[index]];

    setCriteria(newCriteria);
  };

  const handleCriterionChange = (index: number, field: keyof RubricCriterion, value: any) => {
    setCriteria(prev =>
      prev.map((criterion, i) => (i === index ? { ...criterion, [field]: value } : criterion))
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {rubric ? 'Edit Rubric' : 'Create Rubric'}
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          {assignment.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {assignment.description}
        </Typography>

        {error && (
          <Typography color="error" gutterBottom data-testid="error-message" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          fullWidth
          label="Name"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={!!validationErrors.title}
          helperText={validationErrors.title}
          margin="normal"
          required
          inputProps={{
            'data-testid': 'name-input',
          }}
          InputLabelProps={{
            'aria-label': 'Name',
          }}
          data-testid="name-field"
        />

        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          error={!!validationErrors.description}
          helperText={validationErrors.description}
          margin="normal"
          required
          multiline
          rows={3}
          inputProps={{
            'data-testid': 'description-input',
          }}
          InputLabelProps={{
            'aria-label': 'Description',
          }}
          data-testid="description-field"
        />

        <TextField
          fullWidth
          label="Passing Score"
          type="number"
          value={passingScore}
          onChange={e => {
            const value = Number(e.target.value);
            setPassingScore(value);
          }}
          error={!!validationErrors.passingScore}
          helperText={validationErrors.passingScore}
          margin="normal"
          required
          inputProps={{
            'data-testid': 'passing-score-input',
          }}
          InputLabelProps={{
            'aria-label': 'Passing Score',
          }}
          data-testid="passing-score-field"
        />

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
          Criteria
        </Typography>

        {validationErrors.criteria && (
          <FormHelperText error>{validationErrors.criteria}</FormHelperText>
        )}

        {validationErrors.passingScore && (
          <FormHelperText error data-testid="passing-score-error">
            {validationErrors.passingScore}
          </FormHelperText>
        )}

        {criteria.map((criterion, index) => (
          <Paper key={criterion.id || index} sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2">Criterion {index + 1}</Typography>
              <Box>
                <IconButton
                  onClick={() => handleMoveCriterion(index, 'up')}
                  disabled={index === 0}
                  size="small"
                >
                  <ArrowUpward />
                </IconButton>
                <IconButton
                  onClick={() => handleMoveCriterion(index, 'down')}
                  disabled={index === criteria.length - 1}
                  size="small"
                >
                  <ArrowDownward />
                </IconButton>
                <IconButton onClick={() => handleRemoveCriterion(index)} size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Criterion Name"
              value={criterion.name}
              onChange={e => handleCriterionChange(index, 'name', e.target.value)}
              error={!!validationErrors[`criteria.${index}.name`]}
              helperText={validationErrors[`criteria.${index}.name`]}
              margin="normal"
              required
              inputProps={{
                'data-testid': `criterion-name-${index}`,
              }}
              InputLabelProps={{
                'aria-label': 'Criterion Name',
              }}
              data-testid={`criterion-name-field-${index}`}
            />

            <TextField
              fullWidth
              label="Criterion Description"
              value={criterion.description}
              onChange={e => handleCriterionChange(index, 'description', e.target.value)}
              error={!!validationErrors[`criteria.${index}.description`]}
              helperText={validationErrors[`criteria.${index}.description`]}
              margin="normal"
              required
              multiline
              rows={2}
              inputProps={{
                'data-testid': `criterion-description-${index}`,
              }}
              InputLabelProps={{
                'aria-label': 'Criterion Description',
              }}
              data-testid={`criterion-description-field-${index}`}
            />

            <TextField
              fullWidth
              label="Max Score"
              type="number"
              value={criterion.maxScore}
              onChange={e => handleCriterionChange(index, 'maxScore', Number(e.target.value))}
              error={!!validationErrors[`criteria.${index}.maxScore`]}
              helperText={validationErrors[`criteria.${index}.maxScore`]}
              margin="normal"
              required
              inputProps={{
                'data-testid': `criterion-max-score-${index}`,
              }}
              InputLabelProps={{
                'aria-label': 'Max Score',
              }}
              data-testid={`criterion-max-score-field-${index}`}
            />

            <TextField
              fullWidth
              label="Weight (%)"
              type="number"
              value={criterion.weight * 100}
              onChange={e => handleCriterionChange(index, 'weight', Number(e.target.value) / 100)}
              error={!!validationErrors[`criteria.${index}.weight`]}
              helperText={validationErrors[`criteria.${index}.weight`]}
              margin="normal"
              required
              inputProps={{
                'data-testid': `criterion-weight-${index}`,
              }}
              InputLabelProps={{
                'aria-label': 'Weight',
              }}
              data-testid={`criterion-weight-field-${index}`}
            />
          </Paper>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddCriterion}
          variant="outlined"
          color="primary"
          sx={{ mb: 2 }}
        >
          Add Criterion
        </Button>

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            Save Rubric
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RubricForm;
