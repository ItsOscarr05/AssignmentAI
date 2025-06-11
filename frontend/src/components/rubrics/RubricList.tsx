import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

interface Rubric {
  id: string;
  title: string;
  description: string;
  assignment_title: string;
  total_score: number;
  passing_score: number;
  created_at: string;
  updated_at: string;
  criteria: RubricCriterion[];
}

interface RubricListResponse {
  rubrics: Rubric[];
  total: number;
}

const RubricList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [assignmentFilter, setAssignmentFilter] = useState('');

  const { data, isLoading, error } = useQuery<RubricListResponse>({
    queryKey: ['rubrics', page, rowsPerPage, search, sortBy, sortOrder, assignmentFilter],
    queryFn: async () => {
      console.log('Making API call with params:', {
        page: page + 1,
        limit: rowsPerPage,
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        assignment: assignmentFilter,
      });
      const response = await api.get('/rubrics', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search,
          sort_by: sortBy,
          sort_order: sortOrder,
          assignment: assignmentFilter,
        },
      });
      console.log('API response:', response.data);
      return response.data;
    },
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Rows per page changed:', event.target.value);
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    console.log('Assignment filter changed:', event.target.value);
    setAssignmentFilter(event.target.value);
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        Error loading rubrics
      </Typography>
    );
  }

  const uniqueAssignments = Array.from(
    new Set(data?.rubrics.map(rubric => rubric.assignment_title) || [])
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Rubrics</Typography>
        <Box display="flex" gap={2}>
          <TextField
            placeholder="Search rubrics"
            value={search}
            onChange={handleSearch}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="assignment-filter-label">Filter by Assignment</InputLabel>
            <Select
              labelId="assignment-filter-label"
              value={assignmentFilter}
              onChange={handleSelectChange}
              label="Filter by Assignment"
              aria-label="Filter by Assignment"
            >
              <MenuItem value="">All Assignments</MenuItem>
              {uniqueAssignments.map((assignment: string) => (
                <MenuItem key={assignment} value={assignment}>
                  {assignment}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                Title
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Assignment</TableCell>
              <TableCell onClick={() => handleSort('total_score')} style={{ cursor: 'pointer' }}>
                Total Score
              </TableCell>
              <TableCell onClick={() => handleSort('passing_score')} style={{ cursor: 'pointer' }}>
                Passing Score
              </TableCell>
              <TableCell onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                Created
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.rubrics.map((rubric: Rubric) => (
              <TableRow
                key={rubric.id}
                hover
                onClick={() => navigate(`/rubrics/${rubric.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{rubric.title}</TableCell>
                <TableCell>{rubric.description}</TableCell>
                <TableCell>{rubric.assignment_title}</TableCell>
                <TableCell>{rubric.total_score}</TableCell>
                <TableCell>{rubric.passing_score}</TableCell>
                <TableCell>{new Date(rubric.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Rows per page"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        getItemAriaLabel={type => {
          if (type === 'first') {
            return 'Go to first page';
          }
          if (type === 'last') {
            return 'Go to last page';
          }
          if (type === 'next') {
            return 'Go to next page';
          }
          return 'Go to previous page';
        }}
      />
    </Box>
  );
};

export default RubricList;
