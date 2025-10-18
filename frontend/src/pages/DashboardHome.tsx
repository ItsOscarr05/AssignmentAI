import {
  AssignmentOutlined as AssignmentIcon,
  AutoAwesomeOutlined,
  CheckCircleOutline as CheckCircleIcon,
  Edit as EditIcon,
  InfoOutlined as InfoOutlinedIcon,
  LightbulbOutlined,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import React, { Suspense, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SubjectSelector from '../components/assignments/SubjectSelector';
import ViewOriginalPopup from '../components/assignments/ViewOriginalPopup';
import DashboardPieChart from '../components/dashboard/DashboardPieChart';
import { useAuth } from '../contexts/AuthContext';
import { type Assignment } from '../data/mockData';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { useTokenLimit } from '../hooks/useTokenLimit';
import { useTokenUsage } from '../hooks/useTokenUsage';
import { api } from '../services/api';
import { assignments as assignmentsService } from '../services/api/assignments';
import { fileUploadService } from '../services/fileUploadService';
import { mapToCoreSubject } from '../services/subjectService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

import { DateFormat, getDefaultDateFormat } from '../utils/dateFormat';
import { parseUTCTimestamp } from '../utils/timezone';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { breakpoint } = useAspectRatio();

  // Get user's date format preference (default to locale-based format if not set)
  const userDateFormat =
    (localStorage.getItem('dateFormat') as DateFormat) ||
    getDefaultDateFormat(navigator.language || 'en-US');

  // Simple date formatting function based on user preference
  const formatDateWithPreference = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? parseUTCTimestamp(date) : date;
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    switch (userDateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in progress' | 'completed' | 'not started'>('all');
  const [page, setPage] = useState(0);
  const [distributionFilter, setDistributionFilter] = useState('total');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);
  const [fileUploads, setFileUploads] = useState<any[]>([]);

  // Edit Subject state
  const [subjectEditDialogOpen, setSubjectEditDialogOpen] = useState(false);
  const [itemToEditSubject, setItemToEditSubject] = useState<any>(null);
  const [newSubject, setNewSubject] = useState('');

  // Delete functionality state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View File popup state
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [originalFileContent, setOriginalFileContent] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewItemType, setPreviewItemType] = useState<string>('');
  const [previewItemData, setPreviewItemData] = useState<any>(null);

  // Get token usage data
  const { subscription } = useTokenLimit();
  const { usedTokens: monthlyTokenUsage, tokenUsageData } = useTokenUsage(subscription);

  // Fetch real assignments and file uploads
  useEffect(() => {
    // Fetch assignments
    api
      .get('/assignments')
      .then(res => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.assignments)
          ? res.data.assignments
          : [];
        setAssignments(data);
      })
      .catch(() => {
        setError('Failed to fetch assignments.');
        setAssignments([]);
      });

    // Fetch all file uploads for combined activities
    fileUploadService
      .getAll()
      .then(response => {
        setFileUploads(response.items);
      })
      .catch(() => {
        setFileUploads([]);
      });
  }, []);

  // Create combined activities (same logic as Assignments page)
  const combinedActivities = useMemo(() => {
    const activities: any[] = [];

    // Add assignments
    assignments.forEach(assignment => {
      activities.push({
        id: `assignment-${assignment.id}`,
        type: 'assignment',
        title: assignment.title,
        subject: assignment.subject,
        status: assignment.status,
        createdAt: assignment.createdAt,
        tokensUsed: assignment.tokensUsed || 0,
      });
    });

    // Add file uploads (excluding links to match Assignments page)
    fileUploads.forEach(upload => {
      // Skip links - they're not shown in the Assignments page
      if (upload.is_link) return;

      // Check for custom subject in metadata, otherwise derive from filename
      const customSubject = upload.upload_metadata?.custom_subject;
      const derivedSubject = mapToCoreSubject(
        upload.original_filename || upload.filename || 'Unknown'
      );

      activities.push({
        id: `file-${upload.id}`,
        type: 'file_upload',
        title: upload.original_filename,
        subject: customSubject || derivedSubject,
        status: 'Completed',
        description: `File: ${upload.file_type}`,
        createdAt: upload.created_at,
        tokensUsed: 0,
      });
    });

    // Skip workshop history to match Assignments page behavior

    return activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [assignments, fileUploads]);

  // Calculate stats from combined activities
  const assignmentsGenerated = combinedActivities.length;
  const assignmentsCompletedCount = assignments.filter(a => a.status === 'Completed').length;

  // Calculate lifetime token usage from all feature usage
  const lifetimeTokenUsage = tokenUsageData
    ? Object.values(tokenUsageData.feature_usage).reduce(
        (sum: number, usage: any) => sum + (usage.tokens_used || 0),
        0
      )
    : 0;

  const stats = [
    {
      title: 'Total Assignments',
      value: assignmentsGenerated.toString(),
      icon: <AssignmentIcon />,
      color: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 120%)',
    },
    {
      title: 'Completed',
      value: assignmentsCompletedCount.toString(),
      icon: <CheckCircleIcon />,
      color: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 120%)',
    },
    {
      title: 'In Progress',
      value: assignments.filter(a => a.status === 'In Progress').length.toString(),
      icon: <PendingIcon />,
      color: 'linear-gradient(135deg, #FFC127 0%, #FFA000 120%)',
    },
  ];

  // Calculate activity insights for existing cards
  const activityInsights = useMemo(() => {
    const completedActivities = combinedActivities.filter(a => a.status === 'Completed').length;

    return {
      assignmentsGenerated,
      completedActivities,
    };
  }, [assignmentsGenerated, combinedActivities]);

  // Rainbow order for pie chart (counterclockwise, starting with red)
  const rainbowOrder = [
    'Math',
    'Fitness',
    'Literature',
    'Business',
    'Science',
    'Career & Technical Ed',
    'Language',
    'History',
    'Technology',
    'Music & Arts',
  ];

  const pieChartData = useMemo(() => {
    const now = dayjs();
    const source = combinedActivities;
    const filteredActivities =
      distributionFilter === 'total'
        ? source
        : source.filter(a => {
            const activityDate = dayjs(a.createdAt);
            if (distributionFilter === 'daily') return now.isSame(activityDate, 'day');
            if (distributionFilter === 'weekly') return now.isSame(activityDate, 'week');
            if (distributionFilter === 'monthly') return now.isSame(activityDate, 'month');
            if (distributionFilter === 'yearly') return now.isSame(activityDate, 'year');
            return true;
          });

    const subjectCounts: Record<string, number> = {};
    filteredActivities.forEach(activity => {
      const core = activity.subject || mapToCoreSubject(activity.title);
      if (rainbowOrder.includes(core)) {
        subjectCounts[core] = (subjectCounts[core] || 0) + 1;
      }
    });

    return rainbowOrder
      .filter(core => subjectCounts[core])
      .map(core => ({ name: core, value: subjectCounts[core] }));
  }, [distributionFilter, combinedActivities]);

  // Filter combined activities for the Recent & Active section
  const filteredActivities = combinedActivities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'in progress') return activity.status.toLowerCase() === 'in progress';
    if (filter === 'completed') return activity.status.toLowerCase() === 'completed';
    if (filter === 'not started') return activity.status.toLowerCase() === 'not started';
    return true;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.assignments)
        ? response.data.assignments
        : [];
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchFileUploads = async () => {
    try {
      const response = await fileUploadService.getAll();
      setFileUploads(response.items);
    } catch (error) {
      console.error('Error fetching file uploads:', error);
    }
  };

  // Edit Subject handlers
  const handleEditSubject = (assignmentId: string) => {
    const item = combinedActivities.find(a => a.id === assignmentId);
    if (item) {
      setItemToEditSubject(item);
      setNewSubject(item.subject || '');
      setSubjectEditDialogOpen(true);
    }
  };

  const handleSubjectEditSave = async () => {
    if (!itemToEditSubject || !newSubject.trim()) {
      toast.error('Please select a valid subject');
      return;
    }

    try {
      if (itemToEditSubject.type === 'assignment') {
        const assignmentId = itemToEditSubject.id.replace('assignment-', '');
        await assignmentsService.update(assignmentId, { subject: newSubject });
        toast.success('Subject updated successfully');
        await fetchAssignments();
      } else if (itemToEditSubject.type === 'file_upload') {
        const fileId = itemToEditSubject.id.replace('file-', '');
        const fileUpload = fileUploads.find(f => f.id.toString() === fileId);
        if (fileUpload) {
          const updatedMetadata = {
            ...fileUpload.upload_metadata,
            custom_subject: newSubject,
          };
          await fileUploadService.update(parseInt(fileId), {
            upload_metadata: updatedMetadata,
          });
          toast.success('Subject updated successfully');
          await fetchFileUploads();
        }
      }
      setSubjectEditDialogOpen(false);
      setItemToEditSubject(null);
      setNewSubject('');
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
    }
  };

  // Delete handlers
  const handleDeleteClick = (assignmentId: string) => {
    const assignment = combinedActivities.find(a => a.id === assignmentId);
    if (assignment) {
      setAssignmentToDelete(assignment);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;
    setDeleteLoading(true);
    try {
      if (assignmentToDelete.type === 'assignment') {
        const assignmentId = assignmentToDelete.id.replace('assignment-', '');
        await assignmentsService.delete(assignmentId);
        toast.success(`Assignment "${assignmentToDelete.title}" deleted successfully`);
        await fetchAssignments();
      } else if (assignmentToDelete.type === 'file_upload') {
        const fileId = assignmentToDelete.id.replace('file-', '');
        await fileUploadService.delete(parseInt(fileId));
        toast.success(`File "${assignmentToDelete.title}" deleted successfully`);
        await fetchFileUploads();
      }
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  // View File handler
  const handleViewCompletedFile = async (assignmentId: string) => {
    setPreviewLoading(true);
    setFilePreviewOpen(true);

    try {
      const item = combinedActivities.find(a => a.id === assignmentId);
      setPreviewItemType(item?.type || '');
      setPreviewItemData(item);

      if (item?.type === 'file_upload') {
        const fileId = assignmentId.replace('file-', '');
        const fileUpload = fileUploads.find(f => f.id.toString() === fileId);

        if (fileUpload) {
          // Try to get the filled content from the file processing system
          try {
            const filePathParts = fileUpload.file_path.split('/');
            const fileName = filePathParts[filePathParts.length - 1];
            const nameWithoutExt = fileName.split('.')[0];
            const parts = nameWithoutExt.split('_');
            const extractedFileId = parts[parts.length - 1];

            const response = await api.post('/file-processing/process-existing', {
              file_id: extractedFileId,
              action: 'fill',
            });

            if (response.data.filled_content && response.data.filled_content.text) {
              const completedFileName = `[COMPLETED] ${
                fileUpload.original_filename || fileUpload.filename
              }`;
              setPreviewFileName(completedFileName);
              setOriginalFileContent(response.data.filled_content.text);
              setPreviewItemType('completed_file');
              setPreviewItemData(item);
              setPreviewLoading(false);
              return;
            }
          } catch (fillError) {
            console.log('File processing failed, trying completion session...', fillError);
          }

          // Try to get completion session for this file
          try {
            const response = await api.get(`/file-completion-chat/sessions?file_id=${fileId}`);
            const sessions = response.data;

            if (sessions && sessions.length > 0) {
              const completedSession =
                sessions.find((s: any) => s.status === 'completed') ||
                sessions[sessions.length - 1];

              if (completedSession.current_content) {
                const completedFileName = `[COMPLETED] ${
                  fileUpload.original_filename || fileUpload.filename
                }`;
                setPreviewFileName(completedFileName);
                setOriginalFileContent(completedSession.current_content);
                setPreviewItemType('completed_file');
                setPreviewItemData(item);
                setPreviewLoading(false);
                return;
              }
            }
          } catch (sessionError) {
            console.log('No completion session found, falling back to extracted content');
          }

          // Fallback to extracted content if no filled content or completion session
          if (fileUpload.extracted_content) {
            const completedFileName = `[ORIGINAL] ${
              fileUpload.original_filename || fileUpload.filename
            }`;
            setPreviewFileName(completedFileName);
            setOriginalFileContent(
              fileUpload.extracted_content +
                '\n\n--- NOTE ---\nThis is the original file content. To view the completed version, please use the Workshop or File Completion features to process this file.'
            );
            setPreviewItemType('completed_file');
            setPreviewItemData(item);
          } else {
            toast.error('No content available for this file');
          }
        } else {
          toast.error('File upload not found');
        }
      } else if (item?.type === 'assignment') {
        // For assignments, show assignment details or navigate
        toast.info('Opening assignment details...');
        navigate(`/dashboard/assignments/${assignmentId.replace('assignment-', '')}`);
      }
    } catch (error) {
      console.error('Error viewing completed file:', error);
      toast.error('Failed to load completed file');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFilePreviewClose = () => {
    setFilePreviewOpen(false);
    setOriginalFileContent(null);
    setPreviewFileName('');
    setPreviewItemType('');
    setPreviewItemData(null);
  };

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        overflow: 'hidden',
        width: '100%',
        padding: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
      }}
    >
      {/* Top Section: Welcome */}
      <Grid
        container
        spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 2)}
        sx={{ mb: 2, width: '100%' }}
      >
        <Grid item xs={12} md={12}>
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              display: 'flex',
              flexDirection: breakpoint === 'tall' ? 'column' : 'row',
              alignItems: breakpoint === 'tall' ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap:
                breakpoint === 'tall'
                  ? 1
                  : breakpoint === 'square'
                  ? 2
                  : breakpoint === 'standard'
                  ? 2
                  : breakpoint === 'wide'
                  ? 6
                  : 8,
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            {/* Welcome Content - Full Width */}
            <Box sx={{ flex: '1 1 100%', textAlign: 'center' }}>
              <Typography
                variant={
                  breakpoint === 'tall'
                    ? 'h5'
                    : breakpoint === 'square'
                    ? 'h4'
                    : breakpoint === 'standard'
                    ? 'h3'
                    : breakpoint === 'wide'
                    ? 'h2'
                    : breakpoint === 'ultra-wide'
                    ? 'h1'
                    : 'h1'
                }
                sx={{
                  fontWeight: 700,
                  color: '#D32F2F',
                  fontSize: getAspectRatioStyle(
                    aspectRatioStyles.typography.h1.fontSize,
                    breakpoint,
                    '1.5rem'
                  ),
                  mb: breakpoint === 'tall' || breakpoint === 'standard' ? 1 : 2,
                }}
              >
                Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: breakpoint === 'tall' || breakpoint === 'standard' ? 1 : 2 }}
              >
                Ready to tackle your assignments?
              </Typography>
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  maxWidth: '80%',
                  mx: 'auto',
                }}
              >
                AI Tip: Try asking me to analyze your assignment structure or suggest improvements!
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Middle Section: Recent & Active Assignments + Pie Chart */}
      <Grid
        container
        spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 3)}
        sx={{ mb: 3, width: '100%' }}
      >
        <Grid item xs={12} md={breakpoint === 'standard' ? 12 : 8}>
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box
              display="flex"
              flexDirection={breakpoint === 'tall' || breakpoint === 'standard' ? 'column' : 'row'}
              justifyContent="space-between"
              alignItems={
                breakpoint === 'tall' || breakpoint === 'standard' ? 'flex-start' : 'center'
              }
              mb={
                breakpoint === 'tall'
                  ? 1
                  : breakpoint === 'square'
                  ? 2
                  : breakpoint === 'standard'
                  ? 3
                  : breakpoint === 'wide'
                  ? 4
                  : 5
              }
              gap={
                breakpoint === 'tall'
                  ? 1
                  : breakpoint === 'square'
                  ? 2
                  : breakpoint === 'standard'
                  ? 3
                  : breakpoint === 'wide'
                  ? 4
                  : 5
              }
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: theme => (theme.palette.mode === 'dark' ? '#ffffff' : '#000000'),
                }}
              >
                Recent & Active Assignments
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Button
                  size="small"
                  variant={filter === 'all' ? 'contained' : 'outlined'}
                  color={filter === 'all' ? 'error' : 'inherit'}
                  onClick={() => setFilter('all')}
                  sx={
                    filter === 'all'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  All
                </Button>
                <Button
                  size="small"
                  variant={filter === 'not started' ? 'contained' : 'outlined'}
                  color={filter === 'not started' ? 'error' : 'inherit'}
                  onClick={() => setFilter('not started')}
                  sx={
                    filter === 'not started'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  Not Started
                </Button>
                <Button
                  size="small"
                  variant={filter === 'in progress' ? 'contained' : 'outlined'}
                  color={filter === 'in progress' ? 'error' : 'inherit'}
                  onClick={() => setFilter('in progress')}
                  sx={
                    filter === 'in progress'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  In Progress
                </Button>
                <Button
                  size="small"
                  variant={filter === 'completed' ? 'contained' : 'outlined'}
                  color={filter === 'completed' ? 'error' : 'inherit'}
                  onClick={() => setFilter('completed')}
                  sx={
                    filter === 'completed'
                      ? { minWidth: 'auto', px: 1 }
                      : {
                          borderColor: '#D32F2F',
                          color: '#D32F2F',
                          fontWeight: 700,
                          minWidth: 'auto',
                          px: 1,
                        }
                  }
                >
                  Completed
                </Button>
              </Stack>
            </Box>
            <Box
              sx={{
                minHeight:
                  breakpoint === 'tall'
                    ? 250
                    : breakpoint === 'square'
                    ? 300
                    : breakpoint === 'standard'
                    ? 340
                    : 400,
                overflow: 'hidden',
              }}
            >
              <Table sx={{ width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '25%', md: '30%' },
                        maxWidth: { xs: '150px', md: '250px' },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      Assignment Name
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '15%', md: '15%' },
                        p: { xs: 1, md: 2 },
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      File Status
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '15%', md: '15%' },
                        p: { xs: 1, md: 2 },
                      }}
                    >
                      Last Updated
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#D32F2F',
                        fontWeight: 700,
                        width: { xs: '45%', md: '40%' },
                        p: { xs: 1, md: 2 },
                        pl: { xs: 2, md: 3 },
                      }}
                    >
                      File Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ p: 0 }}>
                        <Box
                          minHeight={265}
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          height="100%"
                        >
                          <AssignmentOutlinedIcon
                            sx={{ fontSize: 54, color: 'red', mb: 2, opacity: 0.5 }}
                          />
                          <Typography variant="h5" color="text.secondary" gutterBottom>
                            No Assignments Yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Start by uploading your first assignment
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.slice(page * 5, page * 5 + 5).map(activity => (
                      <TableRow key={activity.id}>
                        <TableCell
                          sx={{
                            p: { xs: 1, md: 2 },
                            maxWidth: { xs: '150px', md: '250px' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Tooltip title={activity.title} arrow placement="top">
                            <span
                              style={{ cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
                              onClick={() =>
                                navigate('/dashboard/assignments', {
                                  state: { searchFilter: activity.title },
                                })
                              }
                              onMouseOver={e =>
                                (e.currentTarget.style.textDecoration = 'underline')
                              }
                              onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              {activity.title}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          <span
                            style={{
                              color:
                                activity.status === 'Completed'
                                  ? '#388E3C'
                                  : activity.status === 'In Progress'
                                  ? '#1976D2'
                                  : activity.status === 'Not Started'
                                  ? '#FFA726'
                                  : '#8E24AA',
                              fontWeight: 600,
                            }}
                          >
                            {activity.status}
                          </span>
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          {formatDateWithPreference(activity.createdAt)}
                        </TableCell>
                        <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: 0.5,
                              flexWrap: 'nowrap',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                            }}
                          >
                            {/* Consistent actions for all items - matches Assignments page */}
                            {(activity.type === 'assignment' ||
                              activity.type === 'file_upload') && (
                              <>
                                <Tooltip title="Edit Subject" arrow placement="top">
                                  <Button
                                    size="small"
                                    sx={{
                                      color: '#1976D2',
                                      minWidth: 'auto',
                                      px: { xs: 0.25, sm: 0.5 },
                                      py: 0.25,
                                      fontSize: '0.75rem',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => handleEditSubject(activity.id)}
                                  >
                                    <EditIcon sx={{ fontSize: 16, mr: { xs: 0, sm: 0.25 } }} />
                                    <Box
                                      sx={{
                                        display: {
                                          xs: 'none',
                                          sm: 'inline',
                                          '@media (max-height: 600px) and (max-width: 480px)':
                                            'none', // Hide on phones (tall aspect ratio)
                                        },
                                      }}
                                    >
                                      Edit Subject
                                    </Box>
                                  </Button>
                                </Tooltip>
                                <Tooltip title="View File" arrow placement="top">
                                  <Button
                                    size="small"
                                    sx={{
                                      color: '#009688',
                                      minWidth: 'auto',
                                      px: { xs: 0.25, sm: 0.5 },
                                      py: 0.25,
                                      fontSize: '0.75rem',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => handleViewCompletedFile(activity.id)}
                                  >
                                    <VisibilityOutlinedIcon
                                      sx={{ fontSize: 16, mr: { xs: 0, sm: 0.25 } }}
                                    />
                                    <Box
                                      sx={{
                                        display: {
                                          xs: 'none',
                                          sm: 'inline',
                                          '@media (max-height: 600px) and (max-width: 480px)':
                                            'none', // Hide on phones (tall aspect ratio)
                                        },
                                      }}
                                    >
                                      View File
                                    </Box>
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Delete" arrow placement="top">
                                  <Button
                                    size="small"
                                    sx={{
                                      color: '#f44336',
                                      minWidth: 'auto',
                                      px: { xs: 0.25, sm: 0.5 },
                                      py: 0.25,
                                      fontSize: '0.75rem',
                                      whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => handleDeleteClick(activity.id)}
                                  >
                                    <DeleteOutlinedIcon
                                      sx={{ fontSize: 16, mr: { xs: 0, sm: 0.25 } }}
                                    />
                                    <Box
                                      sx={{
                                        display: {
                                          xs: 'none',
                                          sm: 'inline',
                                          '@media (max-height: 600px) and (max-width: 480px)':
                                            'none', // Hide on phones (tall aspect ratio)
                                        },
                                      }}
                                    >
                                      Delete
                                    </Box>
                                  </Button>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}
            >
              <TablePagination
                component="div"
                rowsPerPageOptions={[]}
                count={filteredActivities.length}
                rowsPerPage={5}
                page={page}
                onPageChange={handleChangePage}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                color="error"
                onClick={() => navigate('/dashboard/assignments')}
                sx={{ ml: 2, minWidth: 140 }}
              >
                View All Assignments
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={breakpoint === 'standard' ? 12 : 4}>
          {/* Assignment Disstribution Pie Chart */}
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              minHeight:
                breakpoint === 'tall'
                  ? 350
                  : breakpoint === 'square'
                  ? 450
                  : breakpoint === 'standard'
                  ? 520
                  : 600,
              height:
                breakpoint === 'tall'
                  ? 400
                  : breakpoint === 'square'
                  ? 500
                  : breakpoint === 'standard'
                  ? 550
                  : 650,
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                }}
              >
                Assignment Subject Distribution
              </Typography>
              <Tooltip title="Select a section to navigate to assignments" arrow>
                <InfoOutlinedIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            </Box>
            <Box
              sx={{
                height:
                  breakpoint === 'tall'
                    ? 200
                    : breakpoint === 'square'
                    ? 300
                    : breakpoint === 'standard'
                    ? 350
                    : 450,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pieChartData.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <AssignmentOutlinedIcon
                    sx={{ fontSize: 80, color: 'red', mb: 3, opacity: 0.5 }}
                  />
                  <Typography
                    variant="h4"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontWeight: 'normal' }}
                  >
                    No Subjects Yet
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'normal' }}>
                    Start by creating your first assignment
                  </Typography>
                </Box>
              ) : (
                <Suspense fallback={<div>Loading chart...</div>}>
                  <DashboardPieChart
                    data={pieChartData}
                    stats={stats}
                    distributionFilter={distributionFilter}
                  />
                </Suspense>
              )}
            </Box>
            {pieChartData.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel id="distribution-filter-label" sx={{ color: '#D32F2F' }}>
                    Timeframe
                  </InputLabel>
                  <Select
                    labelId="distribution-filter-label"
                    id="distribution-filter"
                    value={distributionFilter}
                    label="Timeframe"
                    onChange={e => setDistributionFilter(e.target.value)}
                    sx={{
                      color: '#D32F2F',
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D32F2F',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D32F2F',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D32F2F',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#D32F2F',
                      },
                      '& .MuiSelect-select': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.background.paper
                            : '#ffffff',
                      },
                    }}
                  >
                    <MenuItem value="total">Lifetime</MenuItem>
                    <MenuItem value="yearly">This Year</MenuItem>
                    <MenuItem value="monthly">This Month</MenuItem>
                    <MenuItem value="weekly">This Week</MenuItem>
                    <MenuItem value="daily">Today</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section: AI Activity & Insights + AssignmentAI Suggests */}
      <Grid
        container
        spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 3)}
        sx={{ mb: 3, width: '100%' }}
      >
        <Grid item xs={12} md={12}>
          <Paper
            sx={{
              p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 120%)`
                  : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 120%)',
              border: '2px solid #D32F2F',
              overflow: 'hidden',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
              }}
            >
              AI Activity Insights
            </Typography>
            {activityInsights.assignmentsGenerated === 0 &&
            activityInsights.completedActivities === 0 &&
            (monthlyTokenUsage ?? 0) === 0 &&
            (lifetimeTokenUsage ?? 0) === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 120,
                  width: '100%',
                }}
              >
                <LightbulbOutlined sx={{ fontSize: 60, color: '#D32F2F', mb: 2, opacity: 0.5 }} />
                <Typography
                  variant="h5"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontWeight: 'normal' }}
                >
                  No Insights Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'normal' }}>
                  Start using AI features to see activity insights
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={{ xs: 1, md: 2 }}>
                <Grid item xs={6}>
                  <Paper
                    onClick={() =>
                      navigate('/dashboard/assignments', { state: { rowsPerPage: -1 } })
                    }
                    sx={{
                      p: { xs: 1, md: 2 },
                      textAlign: 'center',
                      boxShadow: 'none',
                      border: '1.5px solid #1976D2',
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: '#1565C0',
                      },
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <AssignmentIcon sx={{ color: '#1976D2', mb: 3 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Assignments Generated
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1976D2', fontWeight: 700 }}>
                        {activityInsights.assignmentsGenerated}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    onClick={() =>
                      navigate('/dashboard/assignments', {
                        state: { rowsPerPage: -1, status: 'Completed' },
                      })
                    }
                    sx={{
                      p: { xs: 1, md: 2 },
                      textAlign: 'center',
                      boxShadow: 'none',
                      border: '1.5px solid #388E3C',
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: '#2E7D32',
                      },
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <CheckCircleIcon sx={{ color: '#388E3C', mb: 3 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Assignments Completed
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#388E3C', fontWeight: 700 }}>
                        {activityInsights.completedActivities}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    onClick={() => navigate('/dashboard/ai-tokens')}
                    sx={{
                      p: { xs: 1, md: 2 },
                      textAlign: 'center',
                      boxShadow: 'none',
                      border: '1.5px solid #8E24AA',
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <TrendingUpIcon sx={{ color: '#8E24AA', mb: 3 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Monthly Token Usage
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#8E24AA', fontWeight: 700 }}>
                        {(monthlyTokenUsage ?? 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    onClick={() => navigate('/dashboard/ai-tokens')}
                    sx={{
                      p: { xs: 1, md: 2 },
                      textAlign: 'center',
                      boxShadow: 'none',
                      border: '1.5px solid #FFA000',
                      background: theme =>
                        theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <AutoAwesomeOutlined sx={{ color: '#FFA000', mb: 3 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Lifetime Token Usage
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#FFA000', fontWeight: 700 }}>
                        {(lifetimeTokenUsage ?? 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
      {/* Dialog for Open in Workshop */}
      <Dialog
        open={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        aria-labelledby="open-workshop-dialog-title"
      >
        <DialogTitle id="open-workshop-dialog-title">Open in Workshop</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to open <b>{selectedAssignment?.title}</b> in the workshop?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAssignment(null)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              navigate('/dashboard/workshop', {
                state: {
                  assignment: selectedAssignment,
                  reopen: true,
                },
              });
              setSelectedAssignment(null);
            }}
            color="primary"
            variant="contained"
          >
            Open in Workshop
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add View Assignment Dialog below the Workshop dialog */}
      <Dialog
        open={!!viewAssignment}
        onClose={() => setViewAssignment(null)}
        aria-labelledby="view-assignment-dialog-title"
      >
        <DialogTitle id="view-assignment-dialog-title">Assignment Details</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <b>Title:</b> {viewAssignment?.title}
            <br />
            <b>Status:</b> {viewAssignment?.status}
            <br />
            <b>Created At:</b>{' '}
            {viewAssignment ? formatDateWithPreference(viewAssignment.createdAt) : ''}
            <br />
            <b>Word Count:</b> {viewAssignment?.wordCount}
            <br />
            <b>Tokens Used:</b> {viewAssignment?.tokensUsed}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAssignment(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Edit Dialog */}
      <Dialog
        open={subjectEditDialogOpen}
        onClose={() => setSubjectEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid #D32F2F',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>Edit Subject</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the subject for "{itemToEditSubject?.title}"
          </DialogContentText>
          <SubjectSelector value={newSubject} onChange={setNewSubject} label="Subject" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubjectEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubjectEditSave} variant="contained" color="error">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        PaperProps={{
          sx: {
            border: '2px solid #f44336',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlinedIcon sx={{ color: '#f44336' }} />
          Delete Item
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{assignmentToDelete?.title}"? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View File Popup */}
      <ViewOriginalPopup
        open={filePreviewOpen}
        onClose={handleFilePreviewClose}
        fileContent={originalFileContent}
        fileName={previewFileName}
        loading={previewLoading}
        itemType={previewItemType}
        itemData={previewItemData}
      />
    </Box>
  );
};

export default DashboardHome;
