import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { Assignment } from "../../types";

interface SubmissionFormData {
  title: string;
  assignment_id: number;
  description: string;
  file: File | null;
}

export const SubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [formData, setFormData] = useState<SubmissionFormData>({
    title: "",
    assignment_id: 0,
    description: "",
    file: null,
  });

  useEffect(() => {
    fetchAssignments();
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get("/assignments");
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError("Failed to load assignments");
    }
  };

  const fetchSubmission = async () => {
    try {
      const response = await api.get(`/submissions/${id}`);
      const submission = response.data;
      setFormData({
        title: submission.title,
        assignment_id: submission.assignment_id,
        description: submission.description || "",
        file: null,
      });
    } catch (error) {
      console.error("Error fetching submission:", error);
      setError("Failed to load submission");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        file: e.target.files![0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("assignment_id", formData.assignment_id.toString());
      formDataToSend.append("description", formData.description);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      if (id) {
        await api.put(`/submissions/${id}`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.post("/submissions", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      navigate("/submissions");
    } catch (error) {
      console.error("Error saving submission:", error);
      setError("Failed to save submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {id ? "Edit Submission" : "New Submission"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Assignment</InputLabel>
            <Select
              name="assignment_id"
              value={formData.assignment_id}
              onChange={handleChange}
              label="Assignment"
            >
              {assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              accept="*/*"
              style={{ display: "none" }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button variant="outlined" component="span" sx={{ mr: 2 }}>
                Upload File
              </Button>
              {formData.file && (
                <Typography variant="body2" color="textSecondary">
                  Selected file: {formData.file.name}
                </Typography>
              )}
            </label>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/submissions")}>
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
