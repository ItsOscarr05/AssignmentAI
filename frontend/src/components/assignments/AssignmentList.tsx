import { Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Assignment } from '../../types';

type Order = 'asc' | 'desc';

interface AssignmentListProps {
  onDelete?: (assignment: Assignment) => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({ onDelete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Assignment>('createdAt');
  const [order, setOrder] = useState<Order>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['assignments', page, rowsPerPage, orderBy, order, searchQuery],
    queryFn: async () => {
      const response = await api.get('/assignments', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          sort_by: orderBy,
          sort_order: order,
          search: searchQuery,
        },
      });
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  const handleRequestSort = (property: keyof Assignment) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'published':
        return 'success';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusChange = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'draft' ? 'published' : 'draft';
    await api.put(`/assignments/${assignment.id}`, { status: newStatus });
    // Refetch the assignments to update the UI
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 2,
          }}
        >
          <Typography>Loading assignments...</Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 2,
          }}
        >
          <Typography color="error">Error loading assignments. Please try again later.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'error.main',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" color="error">
            Assignments
          </Typography>
          <Button
            component={Link}
            to="new"
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Create Assignment
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell variant="head">
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleRequestSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell variant="head">
                  <TableSortLabel
                    active={orderBy === 'subject'}
                    direction={orderBy === 'subject' ? order : 'asc'}
                    onClick={() => handleRequestSort('subject')}
                  >
                    Subject
                  </TableSortLabel>
                </TableCell>
                <TableCell variant="head">
                  <TableSortLabel
                    active={orderBy === 'dueDate'}
                    direction={orderBy === 'dueDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('dueDate')}
                  >
                    Due Date
                  </TableSortLabel>
                </TableCell>
                <TableCell variant="head">
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell variant="head">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((assignment: Assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell>{assignment.subject}</TableCell>
                  <TableCell>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Chip
                      label={assignment.status}
                      color={getStatusColor(assignment.status)}
                      size="small"
                      onClick={() => handleStatusChange(assignment)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      component={Link}
                      to={`${assignment.id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete?.(assignment)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default AssignmentList;
