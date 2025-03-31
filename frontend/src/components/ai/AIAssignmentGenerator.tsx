import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useFormValidation } from "../../hooks/useFormValidation";
import { AIGeneratedContent, AIGenerationOptions } from "../../types/ai";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Toast } from "../common/Toast";

const generationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  gradeLevel: z.string().min(1, "Grade level is required"),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute"),
  maxPoints: z.number().min(1, "Maximum points must be at least 1"),
});

const AIAssignmentGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedContent, setGeneratedContent] =
    useState<AIGeneratedContent | null>(null);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [learningObjectives, setLearningObjectives] = useState<string[]>([""]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useFormValidation(generationSchema);

  const handleAddItem = (
    items: string[],
    setItems: (items: string[]) => void
  ) => {
    setItems([...items, ""]);
  };

  const handleRemoveItem = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number
  ) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number,
    value: string
  ) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const onSubmit = async (data: AIGenerationOptions) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch("/api/ai/generate-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          requirements: requirements.filter(Boolean),
          learningObjectives: learningObjectives.filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate assignment");
      }

      const result = await response.json();
      setGeneratedContent(result.content);
      setToast({
        open: true,
        message: "Assignment generated successfully",
        severity: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to generate assignment",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatedContent),
      });

      if (!response.ok) {
        throw new Error("Failed to save assignment");
      }

      const result = await response.json();
      setToast({
        open: true,
        message: "Assignment saved successfully",
        severity: "success",
      });
      navigate(`/assignments/${result.id}`);
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to save assignment",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Assignment Generator
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject"
                {...register("subject")}
                error={!!errors.subject}
                helperText={errors.subject?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Topic"
                {...register("topic")}
                error={!!errors.topic}
                helperText={errors.topic?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.difficulty}>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  label="Difficulty Level"
                  {...register("difficulty")}
                  defaultValue="intermediate"
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
                {errors.difficulty && (
                  <Typography variant="caption" color="error">
                    {errors.difficulty.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grade Level"
                {...register("gradeLevel")}
                error={!!errors.gradeLevel}
                helperText={errors.gradeLevel?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Duration (minutes)"
                {...register("estimatedDuration", { valueAsNumber: true })}
                error={!!errors.estimatedDuration}
                helperText={errors.estimatedDuration?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Points"
                {...register("maxPoints", { valueAsNumber: true })}
                error={!!errors.maxPoints}
                helperText={errors.maxPoints?.message}
              />
            </Grid>

            {/* Requirements */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              <Stack spacing={2}>
                {requirements.map((req, index) => (
                  <Box key={index} display="flex" gap={1}>
                    <TextField
                      fullWidth
                      label={`Requirement ${index + 1}`}
                      value={req}
                      onChange={(e) =>
                        handleItemChange(
                          requirements,
                          setRequirements,
                          index,
                          e.target.value
                        )
                      }
                    />
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleRemoveItem(requirements, setRequirements, index)
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddItem(requirements, setRequirements)}
                >
                  Add Requirement
                </Button>
              </Stack>
            </Grid>

            {/* Learning Objectives */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Learning Objectives
              </Typography>
              <Stack spacing={2}>
                {learningObjectives.map((obj, index) => (
                  <Box key={index} display="flex" gap={1}>
                    <TextField
                      fullWidth
                      label={`Learning Objective ${index + 1}`}
                      value={obj}
                      onChange={(e) =>
                        handleItemChange(
                          learningObjectives,
                          setLearningObjectives,
                          index,
                          e.target.value
                        )
                      }
                    />
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleRemoveItem(
                          learningObjectives,
                          setLearningObjectives,
                          index
                        )
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() =>
                    handleAddItem(learningObjectives, setLearningObjectives)
                  }
                >
                  Add Learning Objective
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate("/assignments")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                >
                  Generate Assignment
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Preview Generated Assignment</Typography>
            <Box>
              <IconButton onClick={() => setPreviewOpen(false)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={handleSave}>
                <SaveIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {generatedContent && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {generatedContent.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {generatedContent.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Typography variant="body1" paragraph>
                {generatedContent.instructions}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Rubric
              </Typography>
              <Stack spacing={1}>
                {generatedContent.rubric.criteria.map((criterion, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Typography>{criterion.name}</Typography>
                    <Typography>{criterion.points} points</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle1">Total Points</Typography>
                  <Typography variant="subtitle1">
                    {generatedContent.rubric.totalPoints}
                  </Typography>
                </Box>
              </Stack>
              {generatedContent.sampleSolution && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Sample Solution
                  </Typography>
                  <Typography variant="body1">
                    {generatedContent.sampleSolution}
                  </Typography>
                </>
              )}
              {generatedContent.suggestedResources &&
                generatedContent.suggestedResources.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Suggested Resources
                    </Typography>
                    <Stack spacing={1}>
                      {generatedContent.suggestedResources.map(
                        (resource, index) => (
                          <Typography key={index} variant="body2">
                            • {resource}
                          </Typography>
                        )
                      )}
                    </Stack>
                  </>
                )}
              <Box sx={{ mt: 2 }}>
                {generatedContent.tags.map((tag, index) => (
                  <Chip key={index} label={tag} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default AIAssignmentGenerator;
