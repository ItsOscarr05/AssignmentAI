import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
          <Typography component="h1" variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            You don't have permission to access this page. Please contact your
            administrator if you believe this is a mistake.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            Go Back
          </Button>
          <Button component={RouterLink} to="/dashboard" variant="outlined">
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;
