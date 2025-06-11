import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Submission } from '../../types';

interface SubmissionListProps {
  submissions: Submission[];
  onView: (submission: Submission) => void;
  onEdit: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  loading?: boolean;
  error?: string;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  submissions,
  onView,
  onEdit,
  onDelete,
  loading = false,
  error = undefined,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    const newStatus = e.target.value;
    console.log('Status change event:', {
      event: e,
      newStatus,
      currentStatusFilter: statusFilter,
    });
    setStatusFilter(newStatus);
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch =
      searchTerm === '' || submission.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === '' || submission.status.toLowerCase() === statusFilter.toLowerCase();

    console.log('Filtering submission:', {
      submission,
      statusFilter,
      matchesStatus,
      matchesSearch,
      submissionStatus: submission.status.toLowerCase(),
      filterStatus: statusFilter.toLowerCase(),
    });

    return matchesSearch && matchesStatus;
  });

  console.log('Current state:', {
    statusFilter,
    searchTerm,
    filteredSubmissions,
    allSubmissions: submissions,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress role="progressbar" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Submissions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/submissions/new')}
        >
          New Submission
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search submissions..."
          fullWidth
          inputProps={{
            'data-testid': 'text-field',
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Filter by Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            label="Filter by Status"
            inputProps={{
              'aria-label': 'Filter by Status',
              'data-testid': 'select',
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="graded">Graded</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid
        container
        spacing={3}
        component="ul"
        role="list"
        aria-label="Submissions"
        data-testid="submissions-grid-container"
      >
        {filteredSubmissions.map(submission => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={submission.id}
            component="li"
            data-testid="submission-item"
          >
            <Box
              sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              data-testid={`submission-${submission.id}`}
            >
              <Typography variant="h6" gutterBottom>
                Submission {submission.id}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Content: {submission.content}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {submission.status}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
              </Typography>
              {submission.grade && (
                <Typography variant="body2" color="textSecondary">
                  Grade: {submission.grade}
                </Typography>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => onView(submission)}>
                  View
                </Button>
                <Button size="small" onClick={() => onEdit(submission)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => onDelete(submission)}>
                  Delete
                </Button>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
