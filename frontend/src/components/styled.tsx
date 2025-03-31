import { Box, Container, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
  position: "relative",
  overflow: "hidden",
  padding: theme.spacing(4),
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  borderRadius: "16px",
  boxShadow: "0 4px 30px rgba(220, 38, 38, 0.1)",
  border: "1px solid rgba(220, 38, 38, 0.1)",
}));

export const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  marginBottom: theme.spacing(3),
  textAlign: "center",
})) as typeof Typography;

export const StyledSubtitle = styled(Typography)(({ theme }) => ({
  color: "#666",
  marginBottom: theme.spacing(3),
  textAlign: "center",
})) as typeof Typography;

export const BackgroundBubbles = styled(Box)(({ theme }) => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  zIndex: 0,
  "& > div": {
    position: "absolute",
    background: "rgba(220, 38, 38, 0.05)",
    borderRadius: "50%",
    animation: "float 8s infinite",
  },
  "& > div:nth-of-type(1)": {
    width: "300px",
    height: "300px",
    top: "10%",
    left: "10%",
    animationDuration: "8s",
  },
  "& > div:nth-of-type(2)": {
    width: "200px",
    height: "200px",
    top: "60%",
    right: "15%",
    animationDuration: "6s",
  },
  "& > div:nth-of-type(3)": {
    width: "150px",
    height: "150px",
    bottom: "10%",
    left: "20%",
    animationDuration: "7s",
  },
}));
