import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { assignments } from '../../services/api';

interface AssignmentEditDialogProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
}

interface AssignmentFormData {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
}

const subjectOptions = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Art',
  'Music',
  'Technology',
  'Business',
  'Other',
];

const AssignmentEditDialog: React.FC<AssignmentEditDialogProps> = ({
  open,
  onClose,
  assignmentId,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
  });

  useEffect(() => {
    if (!open) return;
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const assignment = await assignments.getById(assignmentId);
        setFormData({
          title: assignment.title,
          description: assignment.description,
          subject: assignment.subject || '',
          dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({ ...prev, subject: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dueDate: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await assignments.update(assignmentId, {
        ...formData,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>Edit Assignment</DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ fontSize: 18 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ fontSize: 16 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select value={formData.subject} label="Subject" onChange={handleSelectChange}>
                    {subjectOptions.map(subject => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </form>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', p: 3 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{ borderColor: 'red', color: 'red', fontWeight: 600, minWidth: 120 }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          type="submit"
          sx={{ fontWeight: 600, minWidth: 140 }}
          disabled={loading}
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentEditDialog;
