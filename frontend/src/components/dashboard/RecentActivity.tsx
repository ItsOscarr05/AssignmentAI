import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Feedback as FeedbackIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'submission' | 'grade' | 'feedback' | 'assignment';
  title: string;
  description: string;
  timestamp: string;
  assignmentId: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const navigate = useNavigate();

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'submission':
        return <CheckCircleIcon color="success" />;
      case 'grade':
        return <GradeIcon color="primary" />;
      case 'feedback':
        return <FeedbackIcon color="info" />;
      case 'assignment':
        return <AssignmentIcon color="secondary" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <List>
        {activities.map(activity => (
          <ListItem
            key={activity.id}
            button
            onClick={() => navigate(`/assignments/${activity.assignmentId}`)}
            sx={{
              mb: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
            <ListItemText
              primary={activity.title}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
        {activities.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No recent activity.
          </Typography>
        )}
      </List>
    </Box>
  );
};
