import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Template, useTemplateStore } from '../../stores/templateStore';

interface TemplateFormData {
  title: string;
  description: string;
  type: string;
  category: string;
  is_public: boolean;
  content: Record<string, any>;
  created_by: number;
}

const initialFormData: TemplateFormData = {
  title: '',
  description: '',
  type: 'assignment',
  category: '',
  is_public: false,
  content: {},
  created_by: 0,
};

const TemplateManager: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const { templates, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } =
    useTemplateStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    ...initialFormData,
    created_by: user?.id ? Number(user.id) : 0,
  });
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    fetchTemplates(filterType, filterCategory);
  }, [filterType, filterCategory]);

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        title: template.title,
        description: template.description || '',
        type: template.type,
        category: template.category || '',
        is_public: template.is_public,
        content: template.content || {},
        created_by: template.created_by,
      });
      setIsEditing(true);
    } else {
      setSelectedTemplate(null);
      setFormData({
        ...initialFormData,
        created_by: user?.id ? Number(user.id) : 0,
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTemplate(null);
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedTemplate) {
        await updateTemplate(selectedTemplate.id, formData);
        enqueueSnackbar('Template updated successfully', { variant: 'success' });
      } else {
        await createTemplate(formData);
        enqueueSnackbar('Template created successfully', { variant: 'success' });
      }
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar('Failed to save template', { variant: 'error' });
    }
  };

  const handleDelete = async (template: Template) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(template.id);
        enqueueSnackbar('Template deleted successfully', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to delete template', { variant: 'error' });
      }
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Templates</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Create Template
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} mb={3}>
        <Select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          displayEmpty
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="assignment">Assignment</MenuItem>
          <MenuItem value="report">Report</MenuItem>
          <MenuItem value="feedback">Feedback</MenuItem>
        </Select>

        <TextField
          label="Category"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {templates.map(template => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{template.title}</Typography>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" onClick={() => handleOpenDialog(template)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(template)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Typography color="text.secondary">{template.description}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Type: {template.type}
                    </Typography>
                    {template.category && (
                      <Typography variant="caption" color="text.secondary">
                        Category: {template.category}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Usage: {template.usage_count} times
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              fullWidth
            >
              <MenuItem value="assignment">Assignment</MenuItem>
              <MenuItem value="report">Report</MenuItem>
              <MenuItem value="feedback">Feedback</MenuItem>
            </Select>
            <TextField
              label="Category"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              fullWidth
            />
            <TextField
              label="Content (JSON)"
              value={JSON.stringify(formData.content, null, 2)}
              onChange={e => {
                try {
                  const content = JSON.parse(e.target.value);
                  setFormData({ ...formData, content });
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              multiline
              rows={6}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.title || !formData.type}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateManager;
