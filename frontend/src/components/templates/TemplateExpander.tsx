import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { Template, useTemplateStore } from '../../stores/templateStore';

interface TemplateExpanderProps {
  template: Template;
  onExpanded: (expandedContent: any) => void;
}

const TemplateExpander: React.FC<TemplateExpanderProps> = ({ template, onExpanded }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { expandTemplate } = useTemplateStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [expandedContent, setExpandedContent] = useState<any>(null);

  const handleOpenDialog = () => {
    // Extract variables from template content
    const extractedVars = extractVariables(template.content);
    setVariables(extractedVars);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setVariables({});
    setExpandedContent(null);
  };

  const handleExpand = async () => {
    try {
      const result = await expandTemplate(template.id, variables);
      setExpandedContent(result);
      onExpanded(result);
      handleCloseDialog();
      enqueueSnackbar('Template expanded successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to expand template', { variant: 'error' });
    }
  };

  const extractVariables = (content: any): Record<string, string> => {
    const vars: Record<string, string> = {};

    const extractFromString = (str: string) => {
      const matches = str.match(/{{([^}]+)}}/g) || [];
      matches.forEach(match => {
        const varName = match.slice(2, -2).trim();
        vars[varName] = '';
      });
    };

    const processContent = (obj: any) => {
      if (typeof obj === 'string') {
        extractFromString(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(item => processContent(item));
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => processContent(value));
      }
    };

    processContent(content);
    return vars;
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpenDialog} sx={{ mt: 1 }}>
        Expand Template
      </Button>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Expand Template: {template.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {Object.entries(variables).map(([key, value]) => (
              <TextField
                key={key}
                label={key}
                value={value}
                onChange={e => setVariables({ ...variables, [key]: e.target.value })}
                fullWidth
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleExpand}
            disabled={Object.values(variables).some(v => !v)}
          >
            Expand
          </Button>
        </DialogActions>
      </Dialog>

      {expandedContent && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Expanded Content
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(expandedContent, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TemplateExpander;
