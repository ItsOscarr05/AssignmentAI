import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const subjects = [
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
  "Elementary",
  "Middle School",
  "High School",
  "College",
  "Graduate",
];

const AssignmentForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: "",
    gradeLevel: "",
    assignmentText: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/assignments`,
        {
          subject: formData.subject,
          grade_level: formData.gradeLevel,
          assignment_text: formData.assignmentText,
        }
      );
      navigate(`/assignments/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to submit assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Submit Assignment
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              select
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Grade Level"
              name="gradeLevel"
              value={formData.gradeLevel}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              {gradeLevels.map((grade) => (
                <MenuItem key={grade} value={grade}>
                  {grade}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Assignment Text"
              name="assignmentText"
              value={formData.assignmentText}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              multiline
              rows={6}
              placeholder="Enter your assignment question or prompt here..."
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Assignment"}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AssignmentForm;
