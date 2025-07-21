import {
  Add as AddIcon,
  Category as CategoryIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  TextSnippet as TemplateIcon,
} from '@mui/icons-material';
import {
  Alert,
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
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';

const CustomAssignmentTemplates: React.FC = () => {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates,
  } = useTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    content: '',
    description: '',
    tags: [] as string[],
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    content: '',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = ['general', 'essay', 'mathematics', 'science', 'history'];

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'general',
      content: '',
      description: '',
      tags: [],
    });
    setFormErrors({
      name: '',
      description: '',
      content: '',
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      description: template.description,
      tags: template.tags || [],
    });
    setFormErrors({
      name: '',
      description: '',
      content: '',
    });
    setDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {
      name: '',
      description: '',
      content: '',
    };

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

    setFormErrors(errors);
    return !errors.name && !errors.description && !errors.content;
  };

  const handleSaveTemplate = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitError(null);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
      } else {
        await createTemplate(formData);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save template:', err);
      setSubmitError('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(templateId);
      } catch (err) {
        console.error('Failed to delete template:', err);
      }
    }
  };

  const handleCopyTemplate = (template: any) => {
    navigator.clipboard.writeText(template.content);
  };

  const handleUseTemplate = (template: any) => {
    console.log('Using template:', template.name);
    refreshTemplates();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading templates...
        </Typography>
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
            <TemplateIcon color="primary" />
            Custom Assignment Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your own assignment templates for repeated use
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
          sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' } }}
        >
          Create Template
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Max Plan Benefit:</strong> Custom templates are included with your Max plan.
        </Typography>
      </Alert>

      {templates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <TemplateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No templates found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first template to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTemplate}
              sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' } }}
            >
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {templates.map(template => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.description}
                      </Typography>
                      <Chip
                        label={template.category}
                        size="small"
                        color="primary"
                        icon={<CategoryIcon />}
                        sx={{ mr: 1 }}
                      />
                      <Chip label={`${template.usageCount} uses`} size="small" variant="outlined" />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTemplate(template)}
                        data-testid="edit-template-button"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyTemplate(template)}
                        data-testid="copy-template-button"
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(template.id)}
                        data-testid="delete-template-button"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxHeight: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && '...'}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUseTemplate(template)}
                      data-testid="use-template-button"
                    >
                      Use Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              id="template-name"
              label="Template Name"
              fullWidth
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
            <TextField
              id="template-description"
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              error={!!formErrors.description}
              helperText={formErrors.description}
              required
            />
            <FormControl fullWidth>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category-select"
                value={formData.category}
                label="Category"
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              id="template-content"
              label="Template Content"
              fullWidth
              multiline
              rows={8}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              helperText={
                formErrors.content ||
                'Enter the template content with placeholders in square brackets'
              }
              error={!!formErrors.content}
              required
            />
            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            startIcon={editingTemplate ? <SaveIcon /> : <AddIcon />}
          >
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomAssignmentTemplates;
