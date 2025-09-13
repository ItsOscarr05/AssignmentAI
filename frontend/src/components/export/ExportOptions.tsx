import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Google as GoogleIcon,
  PictureAsPdf as PdfIcon,
  Settings as SettingsIcon,
  Description as WordIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { assignmentInputService } from '../../services/assignmentInput';

interface ExportOptions {
  format: 'pdf' | 'docx' | 'google-docs';
  includeMetadata: boolean;
  includeComments: boolean;
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'wide' | 'narrow';
  customTitle: string;
}

interface ExportOptionsProps {
  content: string;
  onExport?: (format: string, filename: string) => void;
  className?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ content, onExport, className }) => {
  const [exportFormats, setExportFormats] = useState<any>({});
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'google-docs'>('pdf');
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeComments: false,
    pageSize: 'a4',
    orientation: 'portrait',
    margins: 'normal',
    customTitle: 'Assignment',
  });

  useEffect(() => {
    loadExportFormats();
  }, []);

  const loadExportFormats = async () => {
    try {
      const formats = await assignmentInputService.getExportFormats();
      setExportFormats(formats);
    } catch (err) {
      console.error('Failed to load export formats:', err);
    }
  };

  const handleExport = async () => {
    if (!content.trim()) {
      setError('No content to export');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const response = await assignmentInputService.exportAssignment(selectedFormat, {
        content,
        format: selectedFormat,
        options: {
          customTitle: exportOptions.customTitle,
          includeMetadata: exportOptions.includeMetadata,
          includeComments: exportOptions.includeComments,
          pageSize: exportOptions.pageSize,
          orientation: exportOptions.orientation,
          margins: exportOptions.margins,
        },
      });

      // Handle different export types
      if (selectedFormat === 'google-docs') {
        // For Google Docs, copy content to clipboard
        await assignmentInputService.copyToClipboard(response.content as string);
        alert('Content copied to clipboard! Paste it into Google Docs.');
      } else {
        // For PDF and DOCX, download the file
        assignmentInputService.downloadFile(response.content as Blob, response.filename);
      }

      if (onExport) {
        onExport(selectedFormat, response.filename);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to export assignment');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <PdfIcon />;
      case 'docx':
        return <WordIcon />;
      case 'google-docs':
        return <GoogleIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  const getFormatDescription = (format: string) => {
    return exportFormats[format]?.description || 'Export format';
  };

  return (
    <Paper elevation={3} className={className} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Export Assignment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose your preferred export format and download your assignment
      </Typography>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Format Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Export Format
        </Typography>
        <List>
          {Object.entries(exportFormats).map(([format, details]: [string, any]) => (
            <ListItem
              key={format}
              button
              selected={selectedFormat === format}
              onClick={() => setSelectedFormat(format as any)}
              sx={{
                border: 1,
                borderColor: selectedFormat === format ? 'primary.main' : 'divider',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemIcon>{getFormatIcon(format)}</ListItemIcon>
              <ListItemText primary={details.name} secondary={details.description} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Export Settings */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setShowSettings(true)}
          sx={{ mb: 2 }}
        >
          Export Settings
        </Button>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isExporting || !content.trim()}
            startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            size="large"
          >
            {isExporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
          </Button>

          {selectedFormat === 'google-docs' && (
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleExport}
              disabled={isExporting || !content.trim()}
            >
              Copy to Clipboard
            </Button>
          )}
        </Box>
      </Box>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Custom Title */}
            <TextField
              label="Custom Title"
              value={exportOptions.customTitle}
              onChange={e => setExportOptions(prev => ({ ...prev, customTitle: e.target.value }))}
              fullWidth
            />

            {/* Metadata Options */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Include in Export</FormLabel>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeMetadata}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))
                    }
                  />
                }
                label="Generation metadata (date, source, etc.)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeComments}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, includeComments: e.target.checked }))
                    }
                  />
                }
                label="Comments and notes"
              />
            </FormControl>

            {/* Page Settings (for PDF) */}
            {selectedFormat === 'pdf' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Page Size</InputLabel>
                  <Select
                    value={exportOptions.pageSize}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, pageSize: e.target.value as any }))
                    }
                    label="Page Size"
                  >
                    <MenuItem value="a4">A4</MenuItem>
                    <MenuItem value="letter">Letter</MenuItem>
                  </Select>
                </FormControl>

                <FormControl component="fieldset">
                  <FormLabel component="legend">Orientation</FormLabel>
                  <RadioGroup
                    value={exportOptions.orientation}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, orientation: e.target.value as any }))
                    }
                    row
                  >
                    <FormControlLabel value="portrait" control={<Radio />} label="Portrait" />
                    <FormControlLabel value="landscape" control={<Radio />} label="Landscape" />
                  </RadioGroup>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Margins</InputLabel>
                  <Select
                    value={exportOptions.margins}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, margins: e.target.value as any }))
                    }
                    label="Margins"
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="wide">Wide</MenuItem>
                    <MenuItem value="narrow">Narrow</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button onClick={() => setShowSettings(false)} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Format Information */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Format Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getFormatDescription(selectedFormat)}
        </Typography>
        {exportFormats[selectedFormat]?.capabilities && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Capabilities: {exportFormats[selectedFormat].capabilities.join(', ')}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
