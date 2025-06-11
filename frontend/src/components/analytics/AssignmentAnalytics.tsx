import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { analytics } from '../../services/api';

interface AssignmentData {
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  improvement: number;
  subjectBreakdown: Array<{
    subject: string;
    average: number;
    trend: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AssignmentAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssignmentData | null>(null);

  useEffect(() => {
    fetchAssignmentData();
  }, []);

  const fetchAssignmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analytics.getAssignmentAnalytics();
      setData(response as AssignmentData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch assignment data');
    } finally {
      setLoading(false);
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

  if (!data) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Assignments
            </Typography>
            <Typography variant="h4">{data.totalAssignments}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Completed Assignments
            </Typography>
            <Typography variant="h4">{data.completedAssignments}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Average Grade
            </Typography>
            <Typography variant="h4">{data.averageGrade}%</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Improvement
            </Typography>
            <Typography variant="h4" color={data.improvement >= 0 ? 'success.main' : 'error.main'}>
              {data.improvement > 0 ? '+' : ''}
              {data.improvement}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Subject Performance
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.subjectBreakdown}
                dataKey="average"
                nameKey="subject"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.subjectBreakdown.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Subject Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="right">Average Grade</TableCell>
                  <TableCell align="right">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.subjectBreakdown.map(subject => (
                  <TableRow key={subject.subject}>
                    <TableCell>{subject.subject}</TableCell>
                    <TableCell align="right">{subject.average}%</TableCell>
                    <TableCell
                      align="right"
                      color={subject.trend >= 0 ? 'success.main' : 'error.main'}
                    >
                      {subject.trend > 0 ? '+' : ''}
                      {subject.trend}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};
