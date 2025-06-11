import { Add, Delete, Download } from '@mui/icons-material';
import {
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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { analytics } from '../../services/api';

interface Report {
  id: string;
  name: string;
  type: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    subjects: string[];
    students: string[];
    assignments: string[];
  };
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}

export const CustomReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [filters, setFilters] = useState({
    subjects: [] as string[],
    students: [] as string[],
    assignments: [] as string[],
  });

  useEffect(() => {
    fetchReports();
    fetchTemplates();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = (await analytics.getReports()) as unknown;
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format');
      }
      const typedReports = response.map(report => {
        if (
          typeof report === 'object' &&
          report !== null &&
          'id' in report &&
          'name' in report &&
          'type' in report &&
          'dateRange' in report &&
          'filters' in report &&
          'createdAt' in report &&
          'status' in report
        ) {
          return report as Report;
        }
        throw new Error('Invalid report format');
      });
      setReports(typedReports);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = (await analytics.getReportTemplates()) as unknown;
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format');
      }
      const typedTemplates = response.map(template => {
        if (
          typeof template === 'object' &&
          template !== null &&
          'id' in template &&
          'name' in template &&
          'description' in template &&
          'fields' in template
        ) {
          return template as ReportTemplate;
        }
        throw new Error('Invalid template format');
      });
      setTemplates(typedTemplates);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report templates');
    }
  };

  const handleCreateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
      if (!selectedTemplateData) {
        throw new Error('Template not found');
      }

      await analytics.createReport({
        templateId: selectedTemplate,
        dateRange,
        filters,
      });
      setShowCreateDialog(false);
      fetchReports();
    } catch (err: any) {
      setError(err.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setLoading(true);
    setError(null);
    try {
      await analytics.deleteReport(reportId);
      fetchReports();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await analytics.downloadReport(reportId);
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download report');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Custom Reports</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateDialog(true)}>
            Create Report
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date Range</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>
                    {format(new Date(report.dateRange.start), 'MMM d, yyyy')} -{' '}
                    {format(new Date(report.dateRange.end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Typography
                      color={
                        report.status === 'completed'
                          ? 'success.main'
                          : report.status === 'failed'
                          ? 'error.main'
                          : 'warning.main'
                      }
                    >
                      {report.status}
                    </Typography>
                  </TableCell>
                  <TableCell>{format(new Date(report.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={report.status !== 'completed'}
                    >
                      <Download />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteReport(report.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Report Template</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                label="Report Template"
              >
                {templates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" gutterBottom>
              Filters
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.subjects.length > 0}
                    onChange={e =>
                      setFilters({
                        ...filters,
                        subjects: e.target.checked ? ['all'] : [],
                      })
                    }
                  />
                }
                label="Include All Subjects"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.students.length > 0}
                    onChange={e =>
                      setFilters({
                        ...filters,
                        students: e.target.checked ? ['all'] : [],
                      })
                    }
                  />
                }
                label="Include All Students"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.assignments.length > 0}
                    onChange={e =>
                      setFilters({
                        ...filters,
                        assignments: e.target.checked ? ['all'] : [],
                      })
                    }
                  />
                }
                label="Include All Assignments"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateReport} variant="contained" disabled={!selectedTemplate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};
