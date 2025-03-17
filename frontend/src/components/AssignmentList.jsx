import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const subjects = [
  "All",
  "Mathematics",
  "Science",
  "English",
  "History",
  "Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
];

const gradeLevels = [
  "All",
  "Elementary",
  "Middle School",
  "High School",
  "College",
  "Graduate",
];

const AssignmentList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    subject: "All",
    gradeLevel: "All",
    search: "",
  });

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  const fetchAssignments = async () => {
    try {
      const params = {
        ...(filters.subject !== "All" && { subject: filters.subject }),
        ...(filters.gradeLevel !== "All" && {
          grade_level: filters.gradeLevel,
        }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/assignments`,
        { params }
      );
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h4" component="h1">
              Assignments
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: "right" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/assignments/new")}
            >
              New Assignment
            </Button>
          </Grid>
        </Grid>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Subject"
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              fullWidth
            >
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Grade Level"
              name="gradeLevel"
              value={filters.gradeLevel}
              onChange={handleFilterChange}
              fullWidth
            >
              {gradeLevels.map((grade) => (
                <MenuItem key={grade} value={grade}>
                  {grade}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Assignments Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Grade Level</TableCell>
                <TableCell>Assignment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>{assignment.grade_level}</TableCell>
                    <TableCell>
                      {assignment.assignment_text.substring(0, 100)}...
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() =>
                          navigate(`/assignments/${assignment.id}`)
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={assignments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>
    </Container>
  );
};

export default AssignmentList;
