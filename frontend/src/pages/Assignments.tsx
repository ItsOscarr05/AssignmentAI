import {
  AssignmentOutlined as AssignmentOutlinedIcon,
  AutorenewOutlined as AutorenewIcon,
  CheckCircleOutline as CheckCircleIcon,
  Clear as ClearIcon,
  DeleteOutlined as DeleteIcon,
  Edit as EditIcon,
  HourglassEmpty as HourglassIcon,
  InfoOutlined as InfoIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AssignmentEditDialog from '../components/assignments/AssignmentEdit';
import SubjectSelector from '../components/assignments/SubjectSelector';
import ViewOriginalPopup from '../components/assignments/ViewOriginalPopup';
import { useAspectRatio } from '../hooks/useAspectRatio';
import { api } from '../services/api';
import { assignments } from '../services/api/assignments';
import { fileUploadService } from '../services/fileUploadService';
import { mapToCoreSubject } from '../services/subjectService';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';
import { DateFormat, getDefaultDateFormat } from '../utils/dateFormat';
import { parseUTCTimestamp } from '../utils/timezone';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  status: string;
  description: string;
  createdAt: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
  }>;
  file_uploads?: Array<{
    id: number;
    filename: string;
    original_filename: string;
    file_type: string;
    is_link: boolean;
    link_url?: string;
    link_title?: string;
    created_at: string;
  }>;
}

const Assignments: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { breakpoint } = useAspectRatio();

  // Get user's date format preference (default to locale-based format if not set)
  const userDateFormat =
    (localStorage.getItem('dateFormat') as DateFormat) ||
    getDefaultDateFormat(navigator.language || 'en-US');

  // Simple date formatting function based on user preference
  const formatDateWithPreference = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>(location.state?.status || 'all');
  const [filterName, setFilterName] = useState(
    location.state?.name || location.state?.searchFilter || ''
  );
  const [filterSubject, setFilterSubject] = useState(location.state?.subject || 'all');
  const [filterTimeframe, setFilterTimeframe] = useState(location.state?.timeframe || 'total');
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [dateView, setDateView] = useState<'year' | 'month'>('year');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState<string | null>(null);
  const [subjectEditDialogOpen, setSubjectEditDialogOpen] = useState(false);
  const [itemToEditSubject, setItemToEditSubject] = useState<any>(null);
  const [newSubject, setNewSubject] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [originalFileContent, setOriginalFileContent] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewItemType, setPreviewItemType] = useState<string>('');
  const [previewItemData, setPreviewItemData] = useState<any>(null);

  // File uploads state
  const [fileUploads, setFileUploads] = useState<any[]>([]);

  useEffect(() => {
    if (filterTimeframe !== 'total') {
      setFilterDate(null);
    }
  }, [filterTimeframe]);

  useEffect(() => {
    if (filterDate) {
      setFilterTimeframe('total');
    }
  }, [filterDate]);

  useEffect(() => {
    if (location.state?.rowsPerPage !== undefined) {
      setRowsPerPage(location.state.rowsPerPage);
    }
    if (location.state?.status) {
      setFilterStatus(location.state.status);
    }
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    // Scroll to top when navigation state changes (e.g., after clicking dashboard cards)
    window.scrollTo(0, 0);
  }, [location.state]);

  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [loading] = useState(false);

  // Custom styles
  const cardStyle = {
    backgroundColor: (theme: any) =>
      theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    transition: 'all 0.2s ease-in-out',
    border: '2px solid red',
    '&:hover': {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
  };

  const tableStyle = {
    border: '2px solid red',
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, assignmentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignmentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
  };

  const handleDeleteClick = (assignmentId: string) => {
    handleMenuClose();
    // Look in combinedActivities since that's what's displayed in the table
    const assignment = combinedActivities.find(a => a.id === assignmentId);
    if (assignment) {
      setAssignmentToDelete(assignment);
      setDeleteDialogOpen(true);
    }
  };

  const handleEditSubject = (assignmentId: string) => {
    handleMenuClose();
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
      // Update the subject based on item type
      if (itemToEditSubject.type === 'assignment') {
        const assignmentId = itemToEditSubject.id.replace('assignment-', '');
        await assignments.update(assignmentId, { subject: newSubject });
        toast.success('Subject updated successfully');
        await fetchAssignments();
      } else if (itemToEditSubject.type === 'file_upload') {
        // For file uploads, store the custom subject in upload_metadata
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

  const handleViewCompletedFile = async (assignmentId: string) => {
    handleMenuClose();

    try {
      const item = combinedActivities.find(a => a.id === assignmentId);

      if (item?.type === 'file_upload') {
        // Extract the actual file ID from the combined ID
        const fileId = assignmentId.replace('file-', '');
        const fileUpload = fileUploads.find(f => f.id.toString() === fileId);

        if (fileUpload) {
          // Try to get the filled content from the file processing system
          try {
            // Extract the correct file ID from the file path
            // The file path format is: uploads/user_id/filename_with_timestamp_uuid
            const filePathParts = fileUpload.file_path.split('/');
            const fileName = filePathParts[filePathParts.length - 1];

            // The filename format is: timestamp_uuid.ext, we need the UUID part
            const nameWithoutExt = fileName.split('.')[0];
            const parts = nameWithoutExt.split('_');
            // Get the UUID part (usually the last part after the timestamp)
            const extractedFileId = parts[parts.length - 1];

            console.log(
              'Trying to process file with ID:',
              extractedFileId,
              'from filename:',
              fileName
            );

            const response = await api.post('/file-processing/process-existing', {
              file_id: extractedFileId,
              action: 'fill',
            });

            if (response.data.filled_content && response.data.filled_content.text) {
              // Show the filled content
              const completedFileName = `[COMPLETED] ${
                fileUpload.original_filename || fileUpload.filename
              }`;
              setPreviewFileName(completedFileName);
              setOriginalFileContent(response.data.filled_content.text);
              setPreviewItemType('completed_file');
              setPreviewItemData(item);
              setFilePreviewOpen(true);
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
              // Get the most recent completed session
              const completedSession =
                sessions.find((s: any) => s.status === 'completed') ||
                sessions[sessions.length - 1];

              if (completedSession.current_content) {
                // Show the completed content from the completion session
                const completedFileName = `[COMPLETED] ${
                  fileUpload.original_filename || fileUpload.filename
                }`;
                setPreviewFileName(completedFileName);
                setOriginalFileContent(completedSession.current_content);
                setPreviewItemType('completed_file');
                setPreviewItemData(item);
                setFilePreviewOpen(true);
                return;
              }
            }
          } catch (sessionError) {
            console.log('No completion session found, falling back to extracted content');
          }

          // Also check if file upload already has completion sessions loaded
          if (fileUpload.completion_sessions && fileUpload.completion_sessions.length > 0) {
            const latestSession =
              fileUpload.completion_sessions[fileUpload.completion_sessions.length - 1];
            if (latestSession.current_content) {
              const completedFileName = `[COMPLETED] ${
                fileUpload.original_filename || fileUpload.filename
              }`;
              setPreviewFileName(completedFileName);
              setOriginalFileContent(latestSession.current_content);
              setPreviewItemType('completed_file');
              setPreviewItemData(item);
              setFilePreviewOpen(true);
              return;
            }
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
            setFilePreviewOpen(true);
          } else {
            toast.error('No content available for this file');
          }
        } else {
          toast.error('File upload not found');
        }
      } else if (item?.type === 'assignment') {
        // For assignments, navigate to the assignment detail page
        navigate(`/dashboard/assignments/${assignmentId.replace('assignment-', '')}`);
      }
    } catch (error) {
      console.error('Error viewing completed file:', error);
      toast.error('Failed to load completed file');
    }
  };

  // Define fetchAssignments only once, inside the component
  const fetchAssignments = async () => {
    try {
      const data = await assignments.getAll();
      setAssignmentsList(
        data.map((a: any) => ({
          ...a,
          subject: a.subject || (a.title ? mapToCoreSubject(a.title) : 'Unknown'),
          description: a.description || '',
          attachments: a.attachments || [],
        }))
      );
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to fetch assignments.');
    }
  };

  // Fetch file uploads
  const fetchFileUploads = async () => {
    try {
      const response = await fileUploadService.getAll(0, 100);
      setFileUploads(response.items || []);
    } catch (error) {
      console.error('Failed to fetch file uploads:', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchFileUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Combine all activities (assignments, file uploads, workshop history)
  // ONLY show: regular assignments + file uploads (excluding links and chats)
  const combinedActivities = React.useMemo(() => {
    const activities: any[] = [];

    // Add assignments
    assignmentsList.forEach(assignment => {
      activities.push({
        id: `assignment-${assignment.id}`,
        type: 'assignment',
        title: assignment.title,
        subject: assignment.subject,
        status: assignment.status,
        description: assignment.description,
        createdAt: assignment.createdAt,
        tokensUsed: 0,
        activityType: 'Assignment',
        icon: '📝',
      });
    });

    // Add file uploads (EXCLUDE links - only show regular file uploads)
    fileUploads.forEach(upload => {
      // Skip links - only show regular file uploads
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
        activityType: 'File Upload',
        icon: '📄',
      });
    });

    // SKIP workshop history entirely (no file processing, link processing, or chat sessions)
    // This ensures only real assignments and file uploads are shown

    // Sort by creation date (newest first)
    return activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [assignmentsList, fileUploads]);

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;
    setDeleteLoading(true);
    try {
      // Find the item in combinedActivities to get its type
      const item = combinedActivities.find(a => a.id === assignmentToDelete.id);
      console.log('🗑️ Deleting item:', assignmentToDelete);
      console.log('🗑️ Item type:', item?.type);
      console.log('🗑️ Item ID:', assignmentToDelete.id);

      if (item?.type === 'assignment') {
        // Delete actual assignment
        console.log('🗑️ Deleting assignment via API...');
        await assignments.delete(assignmentToDelete.id);
        toast.success(`Assignment "${assignmentToDelete.title}" deleted successfully`);
        await fetchAssignments();
        console.log('🗑️ Assignment deleted and list refreshed');
      } else if (item?.type === 'file_upload') {
        // Delete file upload - extract the actual file ID from the combined ID
        const fileId = assignmentToDelete.id.replace('file-', '');
        console.log('🗑️ Deleting file upload with ID:', fileId);
        await fileUploadService.delete(parseInt(fileId));
        toast.success(`File "${assignmentToDelete.title}" deleted successfully`);
        await fetchFileUploads();
        console.log('🗑️ File upload deleted and list refreshed');
      }

      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditAssignmentId(null);
  };

  const handleFilePreviewClose = () => {
    setFilePreviewOpen(false);
    setOriginalFileContent(null);
    setPreviewFileName('');
    setPreviewItemType('');
    setPreviewItemData(null);
  };

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'Not Started':
        return <HourglassIcon sx={{ color: 'warning.main' }} />;
      case 'In Progress':
        return <AutorenewIcon sx={{ color: 'info.main' }} />;
      default:
        return null;
    }
  };

  // Subject to color mapping (same as DashboardPieChart)
  const subjectColorMap: Record<string, string> = {
    Math: '#D32F2F',
    Mathematics: '#D32F2F',
    English: '#FFD600',
    Literature: '#FFD600',
    Science: '#388E3C',
    Biology: '#388E3C',
    Chemistry: '#388E3C',
    Physics: '#388E3C',
    History: '#1976D2',
    'Social Studies': '#1976D2',
    Language: '#4FC3F7',
    'Foreign Language': '#4FC3F7',
    Spanish: '#4FC3F7',
    French: '#4FC3F7',
    Technology: '#B39DDB',
    Tech: '#B39DDB',
    'Computer Science': '#B39DDB',
    IT: '#B39DDB',
    Business: '#81C784',
    Economics: '#81C784',
    Accounting: '#81C784',
    Arts: '#8E24AA',
    Art: '#8E24AA',
    Music: '#8E24AA',
    Fitness: '#FFA000',
    Health: '#FFA000',
    PE: '#FFA000',
    'Health / PE': '#FFA000',
    'Career & Technical Ed': '#16A3A6',
    Career: '#16A3A6',
    CTE: '#16A3A6',
    Engineering: '#009688',
    Culinary: '#009688',
    Marketing: '#81C784',
    Finance: '#81C784',
    Drama: '#8E24AA',
    Band: '#8E24AA',
    Dance: '#8E24AA',
    Photography: '#8E24AA',
    Choir: '#8E24AA',
    Painting: '#8E24AA',
    Drawing: '#8E24AA',
    Mandarin: '#4FC3F7',
    Latin: '#4FC3F7',
    Japanese: '#4FC3F7',
    German: '#4FC3F7',
    Italian: '#4FC3F7',
    Algebra: '#D32F2F',
    Geometry: '#D32F2F',
    Civics: '#1976D2',
    Government: '#1976D2',
    Geography: '#1976D2',
    Astronomy: '#388E3C',
    Earth: '#388E3C',
    Writing: '#FFD600',
    Composition: '#FFD600',
    Reading: '#FFD600',
    Robotics: '#B39DDB',
    Visual: '#8E24AA',
    World: '#1976D2',
  };

  const getSubjectColor = (subject: string | undefined) => {
    if (!subject || typeof subject !== 'string') return 'inherit';
    // Try direct match
    if (subjectColorMap[subject]) return subjectColorMap[subject];
    // Try case-insensitive match
    const found = Object.keys(subjectColorMap).find(
      key => key.toLowerCase() === subject.toLowerCase()
    );
    if (found) return subjectColorMap[found];
    // Try partial match
    for (const key of Object.keys(subjectColorMap)) {
      if (subject.toLowerCase().includes(key.toLowerCase())) return subjectColorMap[key];
    }
    return 'inherit';
  };

  // Get unique subjects for dropdown
  const uniqueSubjects = Array.from(new Set(combinedActivities.map(a => a.subject))).sort();

  const filteredAssignments = combinedActivities
    .filter(activity => {
      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      const matchesName =
        filterName.trim() === '' || activity.title.toLowerCase().includes(filterName.toLowerCase());
      const matchesSubject = filterSubject === 'all' || activity.subject === filterSubject;

      const activityDate = dayjs(activity.createdAt);
      const matchesTimeframe = (() => {
        if (filterTimeframe === 'total') return true;
        const now = dayjs();
        if (filterTimeframe === 'daily') return now.isSame(activityDate, 'day');
        if (filterTimeframe === 'weekly') return now.isSame(activityDate, 'week');
        if (filterTimeframe === 'monthly') return now.isSame(activityDate, 'month');
        if (filterTimeframe === 'yearly') return now.isSame(activityDate, 'year');
        return true;
      })();

      const matchesDate =
        !filterDate ||
        (dateView === 'year' && activityDate.isSame(filterDate, 'year')) ||
        (dateView === 'month' && activityDate.isSame(filterDate, 'month'));

      return matchesStatus && matchesName && matchesSubject && matchesDate && matchesTimeframe;
    })
    .sort((a, b) => {
      // If subject filter is "all", sort by date only (newest first)
      if (filterSubject === 'all') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      // If a specific subject is selected, sort by status priority first, then by date
      const statusPriority = {
        Completed: 1,
        'In Progress': 2,
        'Not Started': 3,
      };

      const statusA = statusPriority[a.status as keyof typeof statusPriority] || 4;
      const statusB = statusPriority[b.status as keyof typeof statusPriority] || 4;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // If status is the same, sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getAssignmentStats = () => {
    // Count from combinedActivities (assignments + file uploads) instead of just assignmentsList
    const total = combinedActivities.length;
    const completed = combinedActivities.filter(a => a.status === 'Completed').length;
    const subjectDistribution = combinedActivities.reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, completed, subjectDistribution };
  };

  const stats = getAssignmentStats();

  const displayedRows =
    rowsPerPage === -1
      ? filteredAssignments.slice(0, 500)
      : filteredAssignments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
          minHeight: '100vh',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            ...cardStyle,
            mb: breakpoint === 'tall' ? 2 : 4,
            p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2),
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 2) }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: breakpoint === 'tall' ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: breakpoint === 'tall' ? 'flex-start' : 'center',
                gap: breakpoint === 'tall' ? 1 : 0,
              }}
            >
              <Box>
                <Typography
                  variant={breakpoint === 'tall' ? 'h6' : breakpoint === 'square' ? 'h5' : 'h4'}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 400,
                    borderBottom: 'none',
                    pb: 0,
                    display: 'inline-block',
                    fontSize: getAspectRatioStyle(
                      aspectRatioStyles.typography.h2.fontSize,
                      breakpoint,
                      '1.25rem'
                    ),
                  }}
                >
                  Assignments
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt:
                      breakpoint === 'tall'
                        ? 0.5
                        : breakpoint === 'square'
                        ? 1
                        : breakpoint === 'standard'
                        ? 1.5
                        : breakpoint === 'wide'
                        ? 2
                        : 2.5,
                    fontSize: getAspectRatioStyle(
                      aspectRatioStyles.typography.body1.fontSize,
                      breakpoint,
                      '0.75rem'
                    ),
                  }}
                >
                  Manage and track all your academic assignments in one place
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Total Assignments: {stats.total}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Completed Assignments: {stats.completed}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Filters and Search */}
        <Grid
          container
          spacing={getAspectRatioStyle(aspectRatioStyles.grid.gap, breakpoint, 2)}
          sx={{
            mb:
              breakpoint === 'tall'
                ? 2
                : breakpoint === 'square'
                ? 3
                : breakpoint === 'standard'
                ? 4
                : breakpoint === 'wide'
                ? 5
                : 6,
            alignItems: 'center',
          }}
        >
          {/* Search Bar - Full Width on Mobile, First Position */}
          <Grid item xs={12} md={3}>
            <TextField
              placeholder="Filter by name..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                  borderRadius: 2,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'red',
                  borderWidth: '2px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'red',
                  borderWidth: '2px',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'red',
                  borderWidth: '2px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {filterName && (
                      <IconButton
                        aria-label="clear filter"
                        onClick={() => setFilterName('')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* 2x2 Grid for Mobile: Status, Subject, Timeframe, Date Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                    borderRadius: 3,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Subject</InputLabel>
              <Select
                value={filterSubject}
                label="Subject"
                onChange={e => setFilterSubject(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                    borderRadius: 3,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {uniqueSubjects.map(subject => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'red' }}>Timeframe</InputLabel>
              <Select
                value={filterTimeframe}
                label="Timeframe"
                onChange={e => setFilterTimeframe(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                    borderRadius: 3,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'red',
                    borderWidth: '2px',
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
          </Grid>
          <Grid item xs={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Filter by date"
                value={filterDate}
                onChange={setFilterDate}
                views={['year', 'month']}
                openTo="year"
                onViewChange={(view: any) => {
                  if (view === 'year' || view === 'month') {
                    setDateView(view);
                  }
                }}
                format={dateView === 'year' ? 'YYYY' : 'MM/YYYY'}
                slotProps={{
                  field: { clearable: true, onClear: () => setFilterDate(null) },
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.background.default
                            : '#ffffff',
                        borderRadius: 2,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'red',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'red',
                        borderWidth: '2px',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'red',
                        borderWidth: '2px',
                      },
                    },
                    InputLabelProps: {
                      sx: {
                        color: 'red',
                        '&.Mui-focused': {
                          color: 'red',
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        {/* Assignments Table */}
        <TableContainer
          sx={{
            ...tableStyle,
            overflow: 'hidden',
            maxWidth: '100%',
            width: '100%',
            backgroundColor: theme =>
              theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
            borderRadius: 3,
          }}
        >
          <Table sx={{ width: '100%' }}>
            <TableHead
              sx={{
                backgroundColor: theme =>
                  theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
              }}
            >
              <TableRow
                sx={{
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                }}
              >
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '40%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Title
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '20%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Subject
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '15%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Status
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Status Icons Legend:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                              <Typography variant="body2">Completed</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <AutorenewIcon sx={{ color: 'info.main', fontSize: 16 }} />
                              <Typography variant="body2">In Progress</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                              <Typography variant="body2">Not Started</Typography>
                            </Box>
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '15%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Date Created
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', md: '1rem' },
                    width: { xs: '10%', md: 'auto' },
                    p: { xs: 1, md: 2 },
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRows.length === 0 ? (
                <TableRow
                  sx={{
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                  }}
                >
                  <TableCell colSpan={6} align="center" sx={{ p: 0 }}>
                    <Box
                      minHeight={530}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <AssignmentOutlinedIcon
                        sx={{ fontSize: 64, color: 'red', mb: 2, opacity: 0.5 }}
                      />
                      <Typography variant="h4" color="text.secondary" gutterBottom>
                        No Assignments Yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Start by uploading content or asking AI about an assignment.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map(assignment => (
                  <TableRow
                    key={assignment.id}
                    sx={{
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark'
                          ? theme.palette.background.default
                          : '#ffffff',
                    }}
                  >
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}
                        >
                          {assignment.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                        >
                          {assignment.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Typography
                        sx={{
                          color: getSubjectColor(assignment.subject),
                          fontSize: { xs: '0.75rem', md: '1rem' },
                        }}
                      >
                        {assignment.subject}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, md: 1 } }}>
                        {getStatusIcon(assignment.status)}
                        <Typography
                          sx={{
                            fontSize: { xs: '0.75rem', md: '1rem' },
                            display: { xs: 'none', md: 'inline' },
                          }}
                        >
                          {assignment.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <Typography sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}>
                        {formatDateWithPreference(parseUTCTimestamp(assignment.createdAt))}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, md: 2 } }}>
                      <IconButton onClick={e => handleMenuClick(e, assignment.id)} size="small">
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && selectedAssignment === assignment.id}
                        onClose={handleMenuClose}
                      >
                        {(assignment.type === 'assignment' ||
                          assignment.type === 'file_upload') && (
                          <>
                            <MenuItem onClick={() => handleEditSubject(assignment.id)}>
                              <EditIcon sx={{ mr: 1 }} /> Edit Subject
                            </MenuItem>
                            <MenuItem onClick={() => handleViewCompletedFile(assignment.id)}>
                              <VisibilityIcon sx={{ mr: 1 }} /> View File
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleDeleteClick(assignment.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon sx={{ mr: 1 }} /> Delete
                            </MenuItem>
                          </>
                        )}
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
            component="div"
            count={filteredAssignments.length}
            rowsPerPage={rowsPerPage}
            page={rowsPerPage === -1 ? 0 : page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={event => {
              const value = parseInt(event.target.value, 10);
              setRowsPerPage(value === -1 ? -1 : value);
              setPage(0);
            }}
          />
        </TableContainer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          PaperProps={{
            sx: {
              border: '2px solid',
              borderColor: 'error.main',
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle id="delete-dialog-title">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeleteIcon />
              Delete Item
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete "{assignmentToDelete?.title}"? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDeleteCancel}
              color="primary"
              variant="outlined"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteLoading}
            >
              {deleteLoading ? <CircularProgress size={22} color="inherit" /> : 'Delete'}
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
            <Button onClick={handleSubjectEditSave} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <AssignmentEditDialog
          open={editDialogOpen}
          onClose={handleEditDialogClose}
          assignmentId={editAssignmentId || ''}
        />

        {/* File Preview Modal */}
        <ViewOriginalPopup
          open={filePreviewOpen}
          onClose={handleFilePreviewClose}
          fileName={previewFileName}
          fileContent={originalFileContent}
          loading={false}
          itemType={previewItemType}
          itemData={previewItemData}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Assignments;
