import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../contexts/AuthContext";
import axios from "axios";

interface Assignment {
  id: number;
  subject: string;
  grade_level: string;
  assignment_text: string;
}

interface Stats {
  total: number;
  completed: number;
}

// LoadingSpinner component
const LoadingSpinner: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          throw new Error("No user found");
        }

        // Fetch assignments
        const assignmentsResponse = await axios.get<Assignment[]>(
          `${process.env.REACT_APP_API_URL}/assignments/recent`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // Fetch stats
        const statsResponse = await axios.get<Stats>(
          `${process.env.REACT_APP_API_URL}/assignments/stats`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        setRecentAssignments(assignmentsResponse.data);
        setStats(statsResponse.data);
      } catch (err) {
        const error = err as Error & {
          response?: { data?: { message?: string } };
        };
        setError(
          error.response?.data?.message ||
            "An error occurred while fetching dashboard data"
        );
        console.error("Dashboard data fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.full_name || "User"}!
        </Typography>

        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">Total Assignments</Typography>
              <Typography variant="h3">{stats.total}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">Completed Assignments</Typography>
              <Typography variant="h3">{stats.completed}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Assignments */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Assignments
          </Typography>
          <Grid container spacing={3}>
            {recentAssignments.map((assignment) => (
              <Grid item xs={12} sm={6} md={4} key={assignment.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {assignment.subject}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Grade Level: {assignment.grade_level}
                    </Typography>
                    <Typography noWrap>
                      {assignment.assignment_text.substring(0, 100)}...
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/assignments/${assignment.id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/assignments/new")}
              >
                New Assignment
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/assignments")}
              >
                View All Assignments
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
