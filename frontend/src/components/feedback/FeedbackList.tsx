import {
  Box,
  CircularProgress,
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
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { api } from '../../services/api';

interface FeedbackItem {
  id: string;
  submission_id: string;
  assignment_title: string;
  student_name: string;
  grade: number;
  status: 'completed' | 'in_progress';
  created_at: string;
  updated_at: string;
  comments: string;
  rubric_scores: Array<{
    criterion_id: string;
    score: number;
    comments: string;
  }>;
}

interface FeedbackResponse {
  feedback: FeedbackItem[];
  total: number;
}

type SortField = 'assignment_title' | 'student_name' | 'grade' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const FeedbackList: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery<FeedbackResponse>({
    queryKey: ['feedback', page, rowsPerPage, sortBy, sortOrder, search],
    queryFn: async () => {
      const response = await api.get('/feedback', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          sort_by: sortBy,
          sort_order: sortOrder,
          search: search || undefined,
        },
      });
      return response.data;
    },
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
        <Typography ml={2}>Loading feedback...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading feedback. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search feedback"
          value={search}
          onChange={handleSearchChange}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'assignment_title'}
                  direction={sortBy === 'assignment_title' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assignment_title')}
                >
                  Assignment
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'student_name'}
                  direction={sortBy === 'student_name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('student_name')}
                >
                  Student
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'grade'}
                  direction={sortBy === 'grade' ? sortOrder : 'asc'}
                  onClick={() => handleSort('grade')}
                >
                  Grade
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'status'}
                  direction={sortBy === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Rubric Feedback</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'created_at'}
                  direction={sortBy === 'created_at' ? sortOrder : 'asc'}
                  onClick={() => handleSort('created_at')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.feedback.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.assignment_title}</TableCell>
                <TableCell>{item.student_name}</TableCell>
                <TableCell>{item.grade}%</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.comments}</TableCell>
                <TableCell>
                  {item.rubric_scores.map(score => (
                    <Typography key={score.criterion_id} variant="body2">
                      {score.comments}
                    </Typography>
                  ))}
                </TableCell>
                <TableCell>{format(new Date(item.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={data?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default FeedbackList;
