import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Lightbulb as LightbulbIcon,
  Print as PrintIcon,
  Share as ShareIcon,
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
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SubmissionAnalysis } from "../../types/ai";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Toast } from "../common/Toast";

const AIFeedbackViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<SubmissionAnalysis | null>(null);
  const [feedback, setFeedback] = useState("");
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    fetchFeedback();
  }, [id]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/submissions/${id}/feedback`);

      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setFeedback(data.feedback);
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to load feedback",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setPrintDialogOpen(true);
  };

  const handleDownload = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/submissions/${id}/download-feedback`);

      if (!response.ok) {
        throw new Error("Failed to download feedback");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to download feedback",
        severity: "error",
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Assignment Feedback",
          text: `View your feedback for submission ${id}`,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(window.location.href);
        setToast({
          open: true,
          message: "Link copied to clipboard",
          severity: "success",
        });
      }
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to share feedback",
        severity: "error",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!analysis) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography variant="h6">No feedback available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Your Feedback</Typography>
        <Box>
          <IconButton onClick={handlePrint} title="Print Feedback">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={handleDownload} title="Download Feedback">
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={handleShare} title="Share Feedback">
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Score and Overall Feedback */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Your Score
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
              Your Strengths
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

        {/* Teacher's Feedback */}
        {feedback && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Teacher's Feedback
              </Typography>
              <Typography variant="body1" paragraph>
                {feedback}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Print Dialog */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Print Feedback</Typography>
            <IconButton onClick={() => setPrintDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="h5" gutterBottom>
              Assignment Feedback
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Score: {analysis.score}%
            </Typography>
            <Divider sx={{ my: 2 }} />
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
            <Divider sx={{ my: 2 }} />
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
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Suggestions
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
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Detailed Analysis
            </Typography>
            <Typography variant="body1" paragraph>
              {analysis.detailed_analysis}
            </Typography>
            {feedback && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Teacher's Feedback
                </Typography>
                <Typography variant="body1" paragraph>
                  {feedback}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              window.print();
              setPrintDialogOpen(false);
            }}
          >
            Print
          </Button>
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

export default AIFeedbackViewer;
