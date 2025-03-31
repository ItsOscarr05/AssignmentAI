import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Lightbulb as LightbulbIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
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
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { SubmissionAnalysis } from "../../types/ai";
import { FileUpload } from "../common/FileUpload";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Toast } from "../common/Toast";

const AISubmissionAnalyzer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SubmissionAnalysis | null>(null);
  const [feedback, setFeedback] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const handleFileUpload = async (files: File[]) => {
    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      // TODO: Replace with actual API call
      const response = await fetch(`/api/submissions/${id}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze submission");
      }

      const result = await response.json();
      setAnalysis(result.analysis);
      setFeedback(result.feedback);
      setToast({
        open: true,
        message: "Submission analyzed successfully",
        severity: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to analyze submission",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedback) return;

    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/submissions/${id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error("Failed to save feedback");
      }

      setToast({
        open: true,
        message: "Feedback saved successfully",
        severity: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to save feedback",
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
        AI Submission Analyzer
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Submission Files
        </Typography>
        <FileUpload
          onUpload={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt"
          maxSize={10 * 1024 * 1024} // 10MB
          multiple
        />
      </Paper>

      {analysis && (
        <Grid container spacing={3}>
          {/* Score and Overall Feedback */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Score
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h3">{analysis.score}%</Typography>
                <Chip
                  label={analysis.score >= 70 ? "Pass" : "Needs Improvement"}
                  color={analysis.score >= 70 ? "success" : "warning"}
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Strengths */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Strengths
              </Typography>
              <List>
                {analysis.strengths.map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Areas for Improvement */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Areas for Improvement
              </Typography>
              <List>
                {analysis.weaknesses.map((weakness, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={weakness} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Suggestions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Suggestions for Improvement
              </Typography>
              <List>
                {analysis.suggestions.map((suggestion, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Detailed Analysis */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Analysis
              </Typography>
              <Typography variant="body1" paragraph>
                {analysis.detailed_analysis}
              </Typography>
            </Paper>
          </Grid>

          {/* Feedback Editor */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Feedback</Typography>
                <Box>
                  <IconButton onClick={() => setPreviewOpen(true)}>
                    <AssessmentIcon />
                  </IconButton>
                  <IconButton onClick={handleSaveFeedback}>
                    <SaveIcon />
                  </IconButton>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback here..."
              />
            </Paper>
          </Grid>
        </Grid>
      )}

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
            <Typography variant="h6">Preview Feedback</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <EditIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body1" paragraph>
              {feedback}
            </Typography>
            {analysis && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Score: {analysis.score}%
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  Key Strengths:
                </Typography>
                <List>
                  {analysis.strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="subtitle1" gutterBottom>
                  Areas for Improvement:
                </Typography>
                <List>
                  {analysis.weaknesses.map((weakness, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={weakness} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
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

export default AISubmissionAnalyzer;
