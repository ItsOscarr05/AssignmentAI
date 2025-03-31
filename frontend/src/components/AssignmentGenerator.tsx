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
import { assignments } from "../services/api";
import { AssignmentGenerationRequest, GeneratedAssignment } from "../types/ai";

interface FormData {
  subject: string;
  grade_level: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

const AssignmentGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    subject: "",
    grade_level: "",
    topic: "",
    difficulty: "medium",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAssignment, setGeneratedAssignment] =
    useState<GeneratedAssignment | null>(null);

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
    setIsGenerating(true);
    setError(null);
    setGeneratedAssignment(null);

    try {
      const request: AssignmentGenerationRequest = {
        subject: formData.subject,
        grade_level: formData.grade_level,
        topic: formData.topic,
        difficulty: formData.difficulty,
      };

      const response = await assignments.generateAssignment(request);
      if (response.success && response.assignment) {
        setGeneratedAssignment(response.assignment);
      } else {
        setError(response.error || "Failed to generate assignment");
      }
    } catch (err) {
      console.error("Failed to generate assignment:", err);
      setError("Failed to generate assignment. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 800, mx: "auto", p: 3 }}
    >
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Generate Assignment
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
          disabled={isGenerating}
          sx={{ mt: 2 }}
        >
          {isGenerating ? (
            <CircularProgress size={24} />
          ) : (
            "Generate Assignment"
          )}
        </Button>
      </Paper>

      {generatedAssignment && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {generatedAssignment.title}
          </Typography>
          <Typography paragraph>{generatedAssignment.description}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            Learning Objectives:
          </Typography>
          <ul>
            {generatedAssignment.content.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
          <Typography variant="subtitle1" gutterBottom>
            Instructions:
          </Typography>
          <Typography paragraph>
            {generatedAssignment.content.instructions}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Requirements:
          </Typography>
          <ul>
            {generatedAssignment.content.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
          <Typography variant="subtitle1" gutterBottom>
            Evaluation Criteria:
          </Typography>
          <ul>
            {generatedAssignment.content.evaluation_criteria.map(
              (criterion, index) => (
                <li key={index}>{criterion}</li>
              )
            )}
          </ul>
          <Typography variant="subtitle1" gutterBottom>
            Estimated Duration:
          </Typography>
          <Typography paragraph>
            {generatedAssignment.content.estimated_duration}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Resources:
          </Typography>
          <ul>
            {generatedAssignment.content.resources.map((resource, index) => (
              <li key={index}>{resource}</li>
            ))}
          </ul>
        </Paper>
      )}
    </Box>
  );
};

export default AssignmentGenerator;
