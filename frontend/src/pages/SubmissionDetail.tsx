import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { submissions } from "../services/api";
import { Assignment, Submission } from "../types";

interface SubmissionWithAssignment extends Submission {
  assignment: Assignment;
}

const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<SubmissionWithAssignment | null>(
    null
  );
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setError(null);
        const data = await submissions.getById(Number(id));
        setSubmission(data as SubmissionWithAssignment);
        if (data.feedback) {
          setFeedback(data.feedback);
        }
        if (data.grade) {
          setScore(data.grade);
        }
      } catch (err) {
        console.error("Failed to fetch submission:", err);
        setError("Failed to load submission details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submissions.update(Number(id), {
        grade: score || undefined,
        feedback,
      });
      toast.success("Submission graded successfully");
    } catch (err) {
      console.error("Failed to grade submission:", err);
      toast.error("Failed to grade submission");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!submission) {
    return <div>Submission not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Submission for {submission.assignment.title}
          </Typography>
          <Typography color="textSecondary" paragraph>
            {submission.assignment.subject} -{" "}
            {submission.assignment.grade_level}
          </Typography>

          <Box className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Typography variant="subtitle2" color="textSecondary">
                Submitted At
              </Typography>
              <Typography variant="body1">
                {new Date(submission.submitted_at).toLocaleString()}
              </Typography>
            </div>
            <div>
              <Typography variant="subtitle2" color="textSecondary">
                Assignment Due Date
              </Typography>
              <Typography variant="body1">
                {new Date(submission.assignment.due_date).toLocaleDateString()}
              </Typography>
            </div>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>
            Submission Content
          </Typography>
          <Typography variant="body1" paragraph>
            {submission.content}
          </Typography>

          {user?.role === "teacher" && (
            <form onSubmit={handleSubmit}>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" gutterBottom>
                Grade Submission
              </Typography>
              <Box className="space-y-4">
                <TextField
                  label="Score"
                  type="number"
                  fullWidth
                  value={score || ""}
                  onChange={(e) => setScore(Number(e.target.value))}
                  required
                  InputProps={{
                    inputProps: {
                      min: 0,
                      max: submission.assignment.points,
                    },
                  }}
                />
                <TextField
                  label="Feedback"
                  multiline
                  rows={4}
                  fullWidth
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    Submit Grade
                  </Button>
                </Box>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionDetail;
