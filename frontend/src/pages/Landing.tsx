import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Fade,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const StyledHeroSection = styled(Box)(({ theme }) => ({
  minHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(45deg, #1a1a1a 30%, #b71c1c 90%)"
      : "linear-gradient(45deg, #ffffff 30%, #ffebee 90%)",
  padding: theme.spacing(8, 0),
  textAlign: "center",
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-8px)",
  },
  background: theme.palette.mode === "dark" ? "#2d2d2d" : "#ffffff",
  border: `1px solid ${theme.palette.mode === "dark" ? "#b71c1c" : "#ffcdd2"}`,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: "25px",
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  textTransform: "none",
  fontSize: "1.1rem",
  background: theme.palette.mode === "dark" ? "#b71c1c" : "#d32f2f",
  color: "#ffffff",
  "&:hover": {
    background: theme.palette.mode === "dark" ? "#d32f2f" : "#b71c1c",
  },
}));

const features = [
  {
    title: "AI-Powered Assignments",
    description:
      "Generate customized assignments tailored to your curriculum using advanced AI technology.",
    icon: <AutoFixHighIcon sx={{ fontSize: 40 }} />,
    path: "/create-assignment",
  },
  {
    title: "Smart Grading",
    description:
      "Automated grading system that provides detailed feedback and suggestions for improvement.",
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    path: "/submissions",
  },
  {
    title: "Assignment Management",
    description:
      "Efficiently organize and track all your assignments in one place.",
    icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
    path: "/assignments",
  },
  {
    title: "Time-Saving Tools",
    description:
      "Reduce your workload with our suite of time-saving features and automation tools.",
    icon: <AccessTimeIcon sx={{ fontSize: 40 }} />,
    path: "/dashboard",
  },
];

const Landing: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box>
      <StyledHeroSection>
        <Fade in timeout={1000}>
          <Container maxWidth="lg">
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#d32f2f",
                mb: 4,
              }}
            >
              AssignmentAI
            </Typography>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 500,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                mb: 6,
              }}
            >
              Work Less, Save More
            </Typography>
            <Box sx={{ mb: 8 }}>
              <ActionButton
                variant="contained"
                size="large"
                onClick={() => navigate(user ? "/dashboard" : "/register")}
                sx={{ mr: 2, mb: isMobile ? 2 : 0 }}
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </ActionButton>
              {!user && (
                <ActionButton
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    background: "transparent",
                    border: `2px solid ${
                      theme.palette.mode === "dark" ? "#b71c1c" : "#d32f2f"
                    }`,
                    "&:hover": {
                      background: "rgba(211, 47, 47, 0.1)",
                      border: `2px solid ${
                        theme.palette.mode === "dark" ? "#d32f2f" : "#b71c1c"
                      }`,
                    },
                  }}
                >
                  Login
                </ActionButton>
              )}
            </Box>
          </Container>
        </Fade>
      </StyledHeroSection>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.mode === "dark" ? "#ffffff" : "#d32f2f",
            mb: 6,
          }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Fade in timeout={1000 + index * 200}>
                <FeatureCard>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <IconButton
                      sx={{
                        mb: 2,
                        color:
                          theme.palette.mode === "dark" ? "#b71c1c" : "#d32f2f",
                      }}
                    >
                      {feature.icon}
                    </IconButton>
                    <Typography
                      gutterBottom
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        color:
                          theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      sx={{
                        color:
                          theme.palette.mode === "dark" ? "#cccccc" : "#666666",
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(feature.path)}
                      sx={{
                        color:
                          theme.palette.mode === "dark" ? "#b71c1c" : "#d32f2f",
                        borderColor:
                          theme.palette.mode === "dark" ? "#b71c1c" : "#d32f2f",
                        "&:hover": {
                          borderColor:
                            theme.palette.mode === "dark"
                              ? "#d32f2f"
                              : "#b71c1c",
                          background: "rgba(211, 47, 47, 0.1)",
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </CardActions>
                </FeatureCard>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Landing;
