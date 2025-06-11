import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface AssignmentDraft {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'individual' | 'group';
  maxGrade: number;
}

interface BulkCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (assignments: AssignmentDraft[]) => void;
  templates: Array<{
    id: string;
    title: string;
    description: string;
    type: 'individual' | 'group';
    defaultMaxGrade: number;
  }>;
}

const BulkCreateDialog: React.FC<BulkCreateDialogProps> = ({
  open,
  onClose,
  onSave,
  templates,
}) => {
  const [assignments, setAssignments] = useState<AssignmentDraft[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleAddAssignment = () => {
    const newAssignment: AssignmentDraft = {
      id: Date.now().toString(),
      title: '',
      description: '',
      dueDate: '',
      type: 'individual',
      maxGrade: 100,
    };
    setAssignments([...assignments, newAssignment]);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(assignments.filter(assignment => assignment.id !== id));
  };

  const handleUpdateAssignment = (
    id: string,
    field: keyof AssignmentDraft,
    value: string | number
  ) => {
    setAssignments(
      assignments.map(assignment =>
        assignment.id === id ? { ...assignment, [field]: value } : assignment
      )
    );
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setAssignments(
      assignments.map(assignment => ({
        ...assignment,
        description: template.description,
        type: template.type,
        maxGrade: template.defaultMaxGrade,
      }))
    );
  };

  const handleSave = () => {
    onSave(assignments);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Bulk Create Assignments</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Apply Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="Apply Template"
                  onChange={e => setSelectedTemplate(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="outlined" onClick={handleApplyTemplate} disabled={!selectedTemplate}>
                Apply Template
              </Button>
            </Grid>
          </Grid>

          <Divider>
            <Typography variant="subtitle1">Assignments</Typography>
          </Divider>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Max Grade</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={assignment.title}
                        onChange={e =>
                          handleUpdateAssignment(assignment.id, 'title', e.target.value)
                        }
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="datetime-local"
                        value={assignment.dueDate}
                        onChange={e =>
                          handleUpdateAssignment(assignment.id, 'dueDate', e.target.value)
                        }
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={assignment.type}
                          onChange={e =>
                            handleUpdateAssignment(
                              assignment.id,
                              'type',
                              e.target.value as 'individual' | 'group'
                            )
                          }
                        >
                          <MenuItem value="individual">Individual</MenuItem>
                          <MenuItem value="group">Group</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={assignment.maxGrade}
                        onChange={e =>
                          handleUpdateAssignment(assignment.id, 'maxGrade', Number(e.target.value))
                        }
                        required
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddAssignment}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add Assignment
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={assignments.length === 0}>
          Create Assignments
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkCreateDialog;
