import {
  AccessTime as AccessTimeIcon,
  Chat as ChatIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  PriorityHigh as PriorityIcon,
  Send as SendIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useSupport } from '../../hooks/useSupport';

const PriorityCustomerSupport: React.FC = () => {
  const { tickets, loading, error, createTicket } = useSupport();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: 'general' as string,
    status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
  });

  const supportChannels = [
    {
      name: 'Email Support',
      description: 'Get responses within 2-4 hours',
      icon: <EmailIcon data-testid="support-channel-icon" />,
      color: '#4caf50',
      available: true,
    },
    {
      name: 'Live Chat',
      description: 'Instant chat with support agents',
      icon: <ChatIcon data-testid="support-channel-icon" />,
      color: '#2196f3',
      available: true,
    },
    {
      name: 'Phone Support',
      description: 'Direct phone support during business hours',
      icon: <PhoneIcon data-testid="support-channel-icon" />,
      color: '#ff9800',
      available: true,
    },
    {
      name: 'Priority Queue',
      description: 'Faster response times for Max plan users',
      icon: <PriorityIcon data-testid="support-channel-icon" />,
      color: '#D32F2F',
      available: true,
    },
  ];

  const priorityLevels = [
    {
      level: 'critical',
      label: 'Critical',
      description: 'Critical issues affecting your work',
      responseTime: '2 hours',
      color: '#f44336',
    },
    {
      level: 'high',
      label: 'High',
      description: 'Important but not urgent issues',
      responseTime: '4 hours',
      color: '#ff9800',
    },
    {
      level: 'medium',
      label: 'Medium',
      description: 'General questions and feedback',
      responseTime: '24 hours',
      color: '#4caf50',
    },
    {
      level: 'low',
      label: 'Low',
      description: 'General questions and feedback',
      responseTime: '48 hours',
      color: '#666',
    },
  ];

  const handleCreateTicket = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      status: 'open',
    });
    setFormErrors({
      title: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {
      title: '',
      description: '',
    };

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    setFormErrors(errors);
    return !errors.title && !errors.description;
  };

  const handleSubmitTicket = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createTicket(formData);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityLevel = priorityLevels.find(p => p.level === priority);
    return priorityLevel?.color || '#666';
  };

  const getPriorityLabel = (priority: string) => {
    const priorityLevel = priorityLevels.find(p => p.level === priority);
    return priorityLevel?.label || 'Unknown';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading support tickets...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SupportIcon color="primary" />
            Priority Customer Support
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get priority support with dedicated assistance
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleCreateTicket}
          sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' } }}
        >
          Create Support Ticket
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Max Plan Benefit:</strong> Priority support is included with your Max plan.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Support Channels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <AccessTimeIcon color="primary" />
                Available Support Channels
              </Typography>
              <List>
                {supportChannels.map((channel, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: channel.color, width: 40, height: 40 }}>
                        {channel.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={channel.name} secondary={channel.description} />
                    <Chip
                      label={channel.available ? 'Available' : 'Unavailable'}
                      color={channel.available ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Levels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Priority Levels & Response Times
              </Typography>
              <Stack spacing={2}>
                {priorityLevels.map(level => (
                  <Box
                    key={level.level}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box>
                      <Typography variant="subtitle1">{level.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {level.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={level.responseTime}
                      color="primary"
                      size="small"
                      data-testid="chip"
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Support Tickets */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Support Tickets
              </Typography>
              {tickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No support tickets yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first support ticket to get started
                  </Typography>
                </Box>
              ) : (
                <List>
                  {tickets.map(ticket => (
                    <ListItem
                      key={ticket.id}
                      sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, mb: 1 }}
                    >
                      <ListItemText
                        primary={ticket.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {ticket.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                label={getPriorityLabel(ticket.priority)}
                                size="small"
                                sx={{ bgcolor: getPriorityColor(ticket.priority), color: 'white' }}
                                data-testid="priority-badge"
                              />
                              <Chip
                                label={ticket.status}
                                size="small"
                                color={ticket.status === 'resolved' ? 'success' : 'warning'}
                                data-testid="chip"
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, display: 'block' }}
                            >
                              Created:{' '}
                              {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Ticket Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              id="ticket-title"
              label="Ticket Title"
              fullWidth
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
            />
            <TextField
              id="ticket-description"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              helperText={
                formErrors.description || 'Please provide a detailed description of your issue'
              }
              error={!!formErrors.description}
              required
            />
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority-select"
                value={formData.priority}
                label="Priority"
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
              >
                {priorityLevels.map(level => (
                  <MenuItem key={level.level} value={level.level}>
                    {level.label} - {level.responseTime}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitTicket} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PriorityCustomerSupport;
