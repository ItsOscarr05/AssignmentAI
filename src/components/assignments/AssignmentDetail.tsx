import {
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssignments } from '../../contexts/AssignmentContext';
import { useAuth } from '../../contexts/AuthContext';

interface AssignmentDetailProps {
  id?: string;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ id: propId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propId || paramId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAssignment, deleteAssignment } = useAssignments();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getAssignment(id);
        setAssignment(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Failed to load assignment details');
        toast.error('Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id, getAssignment]);

  const handleDelete = async () => {
    if (!id || !user) return;
    try {
      await deleteAssignment(id);
      toast.success('Assignment deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading assignment details...</Typography>
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Assignment not found</Typography>
      </Box>
    );
  }

  const formattedCreatedDate = new Date(assignment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {assignment.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Subject" secondary={assignment.subject} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText primary="Created" secondary={`Created: ${formattedCreatedDate}`} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={assignment.status}
                      color={
                        assignment.status === 'completed'
                          ? 'success'
                          : assignment.status === 'in_progress'
                          ? 'warning'
                          : 'default'
                      }
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Priority"
                  secondary={
                    <Chip
                      label={assignment.priority}
                      color={
                        assignment.priority === 'high'
                          ? 'error'
                          : assignment.priority === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                      size="small"
                    />
                  }
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/assignments/${id}/edit`)}
                  >
                    Edit Assignment
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                  >
                    Delete Assignment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AssignmentDetail;
