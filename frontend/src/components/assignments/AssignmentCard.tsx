import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import PendingIcon from '@mui/icons-material/Pending';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { Assignment } from '../../types';

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete: () => void;
  onEdit?: (id: string) => void;
  progressComponent?: React.ComponentType<{ progress: number }>;
  className?: string;
  style?: React.CSSProperties;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onDelete,
  onEdit,
  progressComponent: ProgressComponent,
  className,
  style,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon />;
      case 'draft':
        return <PendingIcon />;
      case 'archived':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'high':
        return <PriorityHighIcon />;
      case 'medium':
        return <WarningIcon />;
      case 'low':
        return <LowPriorityIcon />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={className}
      style={style}
      data-testid="assignment-card"
      role="article"
      aria-label={`Assignment: ${assignment.title}`}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              {assignment.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assignment.subject}
            </Typography>
          </Box>
          <Box>
            {onEdit && (
              <IconButton
                onClick={() => onEdit(assignment.id)}
                color="primary"
                aria-label="Edit assignment"
              >
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={handleDeleteClick} color="error" aria-label="Delete assignment">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            icon={getStatusIcon(assignment.status) as React.ReactElement}
            label={assignment.status}
            color={getStatusColor(assignment.status)}
            size="small"
            aria-live="polite"
            role="status"
          />
          {assignment.priority && (
            <Chip
              icon={getPriorityIcon(assignment.priority) as React.ReactElement}
              label={assignment.priority}
              color={getPriorityColor(assignment.priority)}
              size="small"
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Due: {format(new Date(assignment.dueDate), 'M/d/yyyy')}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {assignment.submissions} {assignment.submissions === 1 ? 'submission' : 'submissions'}
        </Typography>

        {assignment.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {assignment.description}
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          {ProgressComponent ? (
            <ProgressComponent progress={assignment.progress || 0} />
          ) : (
            <LinearProgress
              variant="determinate"
              value={assignment.progress || 0}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#CC0000',
                },
              }}
              aria-label="Assignment progress"
            />
          )}
        </Box>
      </CardContent>

      <Dialog open={showDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Assignment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{assignment.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AssignmentCard;
