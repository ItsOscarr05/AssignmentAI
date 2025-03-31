import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { Submission } from "../../types/submission";

const STATUS_COLORS = {
  pending: "warning",
  submitted: "info",
  graded: "success",
  late: "error",
} as const;

export const SubmissionList: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get("/submissions");
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this submission?")) {
      try {
        await api.delete(`/submissions/${id}`);
        setSubmissions(
          submissions.filter((submission) => submission.id !== id)
        );
      } catch (error) {
        console.error("Error deleting submission:", error);
      }
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const response = await api.get(`/submissions/download/${filePath}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filePath.split("/").pop() || "submission");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      search === "" ||
      submission.title.toLowerCase().includes(search.toLowerCase()) ||
      submission.assignment_title.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "" || submission.status.toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Submissions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/submissions/new")}
        >
          New Submission
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="graded">Graded</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredSubmissions.map((submission) => (
          <Grid item xs={12} sm={6} md={4} key={submission.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {submission.title}
                  </Typography>
                  <Chip
                    label={submission.status}
                    color={
                      STATUS_COLORS[
                        submission.status as keyof typeof STATUS_COLORS
                      ]
                    }
                    size="small"
                  />
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  Assignment: {submission.assignment_title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Submitted:{" "}
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </Typography>
                {submission.score && (
                  <Typography variant="body2" color="textSecondary">
                    Score: {submission.score}/{submission.max_score}
                  </Typography>
                )}
              </CardContent>
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                {submission.file_path && (
                  <Tooltip title="Download">
                    <IconButton
                      onClick={() => handleDownload(submission.file_path!)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Edit">
                  <IconButton
                    onClick={() =>
                      navigate(`/submissions/${submission.id}/edit`)
                    }
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => handleDelete(submission.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
