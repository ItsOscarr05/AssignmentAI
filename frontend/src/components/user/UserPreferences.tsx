import { Save as SaveIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { UserPreferences } from "../../types/user";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Toast } from "../common/Toast";

const UserPreferences: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
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
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch("/api/users/preferences");

      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to load preferences",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      // TODO: Replace with actual API call
      const response = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      setToast({
        open: true,
        message: "Preferences saved successfully",
        severity: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to save preferences",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignmentDisplayChange =
    (key: keyof UserPreferences["assignmentDisplay"]) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPreferences((prev) => ({
        ...prev!,
        assignmentDisplay: {
          ...prev!.assignmentDisplay,
          [key]: event.target.checked,
        },
      }));
    };

  const handleGradingPreferencesChange =
    (key: keyof UserPreferences["gradingPreferences"]) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPreferences((prev) => ({
        ...prev!,
        gradingPreferences: {
          ...prev!.gradingPreferences,
          [key]: event.target.checked,
        },
      }));
    };

  const handleDefaultGradeChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setPreferences((prev) => ({
      ...prev!,
      gradingPreferences: {
        ...prev!.gradingPreferences,
        defaultGrade: event.target.value as number,
      },
    }));
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setPreferences((prev) => ({
      ...prev!,
      itemsPerPage: event.target.value as number,
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!preferences) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography variant="h6">Failed to load preferences</Typography>
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
        <Typography variant="h4">Application Preferences</Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Assignment Display Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assignment Display
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.assignmentDisplay.showDueDates}
                    onChange={handleAssignmentDisplayChange("showDueDates")}
                  />
                }
                label="Show Due Dates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.assignmentDisplay.showGrades}
                    onChange={handleAssignmentDisplayChange("showGrades")}
                  />
                }
                label="Show Grades"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.assignmentDisplay.showFeedback}
                    onChange={handleAssignmentDisplayChange("showFeedback")}
                  />
                }
                label="Show Feedback"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.assignmentDisplay.groupByStatus}
                    onChange={handleAssignmentDisplayChange("groupByStatus")}
                  />
                }
                label="Group by Status"
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Grading Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Grading Preferences
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.gradingPreferences.autoGrade}
                    onChange={handleGradingPreferencesChange("autoGrade")}
                  />
                }
                label="Enable Auto-Grading"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.gradingPreferences.showRubric}
                    onChange={handleGradingPreferencesChange("showRubric")}
                  />
                }
                label="Show Rubric While Grading"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.gradingPreferences.allowComments}
                    onChange={handleGradingPreferencesChange("allowComments")}
                  />
                }
                label="Allow Comments"
              />
            </FormGroup>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Default Grade Scale</InputLabel>
              <Select
                value={preferences.gradingPreferences.defaultGrade}
                onChange={handleDefaultGradeChange}
                label="Default Grade Scale"
              >
                <MenuItem value={100}>100-point scale</MenuItem>
                <MenuItem value={50}>50-point scale</MenuItem>
                <MenuItem value={20}>20-point scale</MenuItem>
                <MenuItem value={10}>10-point scale</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Display Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Display Preferences
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Items per Page</InputLabel>
              <Select
                value={preferences.itemsPerPage}
                onChange={handleItemsPerPageChange}
                label="Items per Page"
              >
                <MenuItem value={10}>10 items</MenuItem>
                <MenuItem value={25}>25 items</MenuItem>
                <MenuItem value={50}>50 items</MenuItem>
                <MenuItem value={100}>100 items</MenuItem>
              </Select>
            </FormControl>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.showProgress}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev!,
                        showProgress: e.target.checked,
                      }))
                    }
                  />
                }
                label="Show Progress Indicators"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.showTooltips}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev!,
                        showTooltips: e.target.checked,
                      }))
                    }
                  />
                }
                label="Show Tooltips"
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* AI Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Assistant Preferences
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.aiSuggestions}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev!,
                        aiSuggestions: e.target.checked,
                      }))
                    }
                  />
                }
                label="Enable AI Suggestions"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.aiFeedback}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev!,
                        aiFeedback: e.target.checked,
                      }))
                    }
                  />
                }
                label="Enable AI Feedback"
              />
            </FormGroup>
            <Alert severity="info" sx={{ mt: 2 }}>
              AI features help provide intelligent suggestions and feedback to
              improve your experience.
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default UserPreferences;
