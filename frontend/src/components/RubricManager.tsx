import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: {
    level: string;
    description: string;
    points: number;
  }[];
}

interface RubricManagerProps {
  onRubricChange: (criteria: RubricCriterion[]) => void;
  initialCriteria: RubricCriterion[];
}

const RubricManager: React.FC<RubricManagerProps> = ({ onRubricChange, initialCriteria = [] }) => {
  const [rubric, setRubric] = useState<RubricCriterion[]>(initialCriteria);
  const [editingCriterion, setEditingCriterion] = useState<RubricCriterion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCriterion = () => {
    setEditingCriterion({
      id: Date.now().toString(),
      name: '',
      description: '',
      weight: 1,
      levels: [
        { level: 'Excellent', description: '', points: 100 },
        { level: 'Good', description: '', points: 80 },
        { level: 'Satisfactory', description: '', points: 60 },
        { level: 'Needs Improvement', description: '', points: 40 },
      ],
    });
    setIsDialogOpen(true);
  };

  const handleEditCriterion = (criterion: RubricCriterion) => {
    setEditingCriterion(criterion);
    setIsDialogOpen(true);
  };

  const handleDeleteCriterion = (criterionId: string) => {
    setRubric(rubric.filter(c => c.id !== criterionId));
  };

  const handleSaveCriterion = () => {
    if (!editingCriterion) return;

    // Validate the criterion
    if (!editingCriterion.name.trim()) {
      setError('Criterion name is required');
      return;
    }

    if (!editingCriterion.description.trim()) {
      setError('Criterion description is required');
      return;
    }

    if (editingCriterion.weight <= 0) {
      setError('Weight must be greater than 0');
      return;
    }

    // Check if all levels have descriptions
    const hasEmptyLevels = editingCriterion.levels.some(level => !level.description.trim());
    if (hasEmptyLevels) {
      setError('All levels must have descriptions');
      return;
    }

    setError(null);

    // Update or add the criterion
    setRubric(prev => {
      const index = prev.findIndex(c => c.id === editingCriterion.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = editingCriterion;
        return updated;
      }
      return [...prev, editingCriterion];
    });

    setIsDialogOpen(false);
    setEditingCriterion(null);
  };

  const handleSaveRubric = () => {
    if (rubric.length === 0) {
      setError('At least one criterion is required');
      return;
    }
    onRubricChange(rubric);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Rubric Manager</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddCriterion}>
          Add Criterion
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {rubric.map(criterion => (
          <Card key={criterion.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{criterion.name}</Typography>
                <Box>
                  <IconButton onClick={() => handleEditCriterion(criterion)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteCriterion(criterion.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography color="textSecondary" paragraph>
                {criterion.description}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Weight: {criterion.weight}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                {criterion.levels.map(level => (
                  <Grid item xs={12} sm={6} md={3} key={level.level}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {level.level}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {level.description}
                      </Typography>
                      <Typography variant="subtitle2" color="primary">
                        {level.points} points
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </List>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingCriterion?.id ? 'Edit Criterion' : 'Add Criterion'}</DialogTitle>
        <DialogContent>
          {editingCriterion && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Criterion Name"
                value={editingCriterion.name}
                onChange={e => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={editingCriterion.description}
                onChange={e =>
                  setEditingCriterion({
                    ...editingCriterion,
                    description: e.target.value,
                  })
                }
                multiline
                rows={3}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Weight"
                type="number"
                value={editingCriterion.weight}
                onChange={e =>
                  setEditingCriterion({
                    ...editingCriterion,
                    weight: Number(e.target.value),
                  })
                }
                margin="normal"
              />
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Performance Levels
              </Typography>
              {editingCriterion.levels.map((level, index) => (
                <Box key={level.level} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">{level.level}</Typography>
                  <TextField
                    fullWidth
                    label="Description"
                    value={level.description}
                    onChange={e => {
                      const updatedLevels = [...editingCriterion.levels];
                      updatedLevels[index] = {
                        ...level,
                        description: e.target.value,
                      };
                      setEditingCriterion({
                        ...editingCriterion,
                        levels: updatedLevels,
                      });
                    }}
                    multiline
                    rows={2}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Points"
                    type="number"
                    value={level.points}
                    onChange={e => {
                      const updatedLevels = [...editingCriterion.levels];
                      updatedLevels[index] = {
                        ...level,
                        points: Number(e.target.value),
                      };
                      setEditingCriterion({
                        ...editingCriterion,
                        levels: updatedLevels,
                      });
                    }}
                    margin="normal"
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCriterion} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveRubric}
          disabled={rubric.length === 0}
        >
          Save Rubric
        </Button>
      </Box>
    </Box>
  );
};

export default RubricManager;
