import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignments } from "../services/api";
import { AssignmentGenerationRequest } from "../types/ai";

interface FormData {
  subject: string;
  grade_level: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    subject: "",
    grade_level: "",
    topic: "",
    difficulty: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const request: AssignmentGenerationRequest = {
        subject: formData.subject,
        grade_level: formData.grade_level,
        topic: formData.topic,
        difficulty: formData.difficulty,
      };

      const response = await assignments.generateAssignment(request);
      if (response.success && response.assignment) {
        navigate("/assignments");
      } else {
        setError(response.error || "Failed to create assignment");
      }
    } catch (err) {
      console.error("Failed to create assignment:", err);
      setError("Failed to create assignment. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 800, mx: "auto", p: 3 }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create New Assignment
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <TextField
          fullWidth
          label="Subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Grade Level"
          name="grade_level"
          value={formData.grade_level}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Topic"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          margin="normal"
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Difficulty</InputLabel>
          <Select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            label="Difficulty"
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </Select>
        </FormControl>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Create Assignment"}
        </Button>
      </Paper>
    </Box>
  );
};

export default CreateAssignment;
