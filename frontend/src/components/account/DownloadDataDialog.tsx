import { Close, DownloadOutlined, FileDownloadOutlined } from '@mui/icons-material';
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
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface DownloadDataDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (exportData: {
    format: 'json' | 'pdf' | 'csv' | 'xml';
    dataTypes: {
      assignments: boolean;
      preferences: boolean;
      activity: boolean;
      analytics: boolean;
    };
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const DownloadDataDialog: React.FC<DownloadDataDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'csv' | 'xml'>('json');
  const [exportDataTypes, setExportDataTypes] = useState({
    assignments: true,
    preferences: true,
    activity: true,
    analytics: false,
  });

  const handleSubmit = async () => {
    // Check if at least one data type is selected
    const selectedTypes = Object.values(exportDataTypes).filter(Boolean);
    if (selectedTypes.length === 0) {
      return;
    }

    await onSubmit({ format: exportFormat, dataTypes: exportDataTypes });
  };

  const handleClose = () => {
    // Reset to default values when closing
    setExportFormat('json');
    setExportDataTypes({
      assignments: true,
      preferences: true,
      activity: true,
      analytics: false,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          border: 2,
          borderColor: 'error.main',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
          position: 'sticky',
          top: 0,
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          zIndex: 2,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileDownloadOutlined />
            Download Your Data
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.secondary'),
          }}
        >
          Choose what data you'd like to download from your account and select your preferred export
          format.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Export Format Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 2,
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            Export Format
          </Typography>
          <FormControl fullWidth>
            <Select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as 'json' | 'pdf' | 'csv' | 'xml')}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                  '& fieldset': {
                    borderColor: theme =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.23)'
                        : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'error.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'error.main',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                },
              }}
            >
              <MenuItem value="json">JSON (JavaScript Object Notation)</MenuItem>
              <MenuItem value="pdf">PDF (Portable Document Format)</MenuItem>
              <MenuItem value="csv">CSV (Comma-Separated Values)</MenuItem>
              <MenuItem value="xml">XML (Extensible Markup Language)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Data Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 2,
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            Data to Export
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={exportDataTypes.assignments}
                  onChange={e =>
                    setExportDataTypes({
                      ...exportDataTypes,
                      assignments: e.target.checked,
                    })
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'error.main',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  Assignments and Submissions
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportDataTypes.preferences}
                  onChange={e =>
                    setExportDataTypes({
                      ...exportDataTypes,
                      preferences: e.target.checked,
                    })
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'error.main',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  User Preferences and Settings
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportDataTypes.activity}
                  onChange={e =>
                    setExportDataTypes({
                      ...exportDataTypes,
                      activity: e.target.checked,
                    })
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'error.main',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  Activity History
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportDataTypes.analytics}
                  onChange={e =>
                    setExportDataTypes({
                      ...exportDataTypes,
                      analytics: e.target.checked,
                    })
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'error.main',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
                    fontWeight: 500,
                  }}
                >
                  Analytics Data (if enabled)
                </Typography>
              }
            />
          </FormGroup>
        </Box>

        <Alert
          severity="info"
          sx={{
            mt: 2,
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : undefined,
            color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
            '& .MuiAlert-icon': {
              color: theme => (theme.palette.mode === 'dark' ? 'white' : undefined),
            },
          }}
        >
          <Typography variant="caption">
            Data will be exported in {exportFormat.toUpperCase()} format and may take a few minutes
            to prepare.
            {exportFormat === 'pdf' &&
              ' PDF exports include formatted reports with charts and summaries.'}
            {exportFormat === 'csv' && ' CSV exports are ideal for spreadsheet applications.'}
            {exportFormat === 'xml' && ' XML exports provide structured data with metadata.'}
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
          p: 2,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={{
            color: theme => (theme.palette.mode === 'dark' ? 'white' : 'text.primary'),
            '&:hover': {
              backgroundColor: theme =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : <DownloadOutlined />}
          sx={{
            backgroundColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
            '&:disabled': {
              backgroundColor: 'error.light',
            },
          }}
        >
          {isLoading ? 'Preparing Export...' : 'Download Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadDataDialog;
