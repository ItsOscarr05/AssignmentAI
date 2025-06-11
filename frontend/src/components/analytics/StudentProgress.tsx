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
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analytics } from '../../services/api';

interface StudentData {
  id: string;
  name: string;
  overallGrade: number;
  attendance: number;
  participation: number;
  improvement: number;
  recentGrades: {
    date: string;
    grade: number;
  }[];
}

interface StudentProgressData {
  students: StudentData[];
  classAverage: number;
  topPerformers: {
    id: string;
    name: string;
    grade: number;
  }[];
  areasForImprovement: {
    subject: string;
    averageGrade: number;
  }[];
}

export const StudentProgress: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentProgressData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analytics.getStudentProgress();
      const progressData = response as unknown as StudentProgressData;
      setData(progressData);
      if (progressData.students?.length > 0) {
        setSelectedStudent(progressData.students[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch student progress');
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

  const selectedStudentData = data.students.find(student => student.id === selectedStudent);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Class Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Class Average
                  </Typography>
                  <Typography variant="h4">{data.classAverage}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Performers
                  </Typography>
                  <Typography variant="h4">{data.topPerformers.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Areas for Improvement
                  </Typography>
                  <Typography variant="h4">{data.areasForImprovement.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Top Performers
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.topPerformers.map(student => (
                  <TableRow
                    key={student.id}
                    hover
                    onClick={() => setSelectedStudent(student.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="right">{student.grade}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Student Progress
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Overall Grade</TableCell>
                  <TableCell align="right">Attendance</TableCell>
                  <TableCell align="right">Participation</TableCell>
                  <TableCell align="right">Improvement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.students.map(student => (
                  <TableRow
                    key={student.id}
                    hover
                    onClick={() => setSelectedStudent(student.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="right">{student.overallGrade}%</TableCell>
                    <TableCell align="right">{student.attendance}%</TableCell>
                    <TableCell align="right">{student.participation}%</TableCell>
                    <TableCell align="right">
                      <Typography color={student.improvement >= 0 ? 'success.main' : 'error.main'}>
                        {student.improvement >= 0 ? '+' : ''}
                        {student.improvement}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {selectedStudentData && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedStudentData.name}'s Progress
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedStudentData.recentGrades}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="grade" stroke="#8884d8" name="Grade" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};
