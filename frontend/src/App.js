import React, { useEffect, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { queryClient } from "./lib/queryClient";
import { initSentry } from "./lib/sentry";
import { createAccessibleTheme } from "./theme";
import { useAccessibility } from "./contexts/AccessibilityContext";
import Loadable from "./components/Loadable";
import SecurityProvider from "./components/SecurityProvider";

// Lazy load components
const Login = Loadable(lazy(() => import("./components/Login")));
const Register = Loadable(lazy(() => import("./components/Register")));
const Dashboard = Loadable(lazy(() => import("./components/Dashboard")));
const AssignmentList = Loadable(
  lazy(() => import("./components/AssignmentList"))
);
const AssignmentForm = Loadable(
  lazy(() => import("./components/AssignmentForm"))
);

// Components loaded eagerly (important for initial render)
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import AssignmentErrorBoundary from "./components/AssignmentErrorBoundary";
import AccessibilityMenu from "./components/AccessibilityMenu";

// Initialize Sentry
initSentry();

// Create a Sentry routing integration
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

// App content with theme based on accessibility preferences
const AppContent = () => {
  const { highContrast, largeText, reducedMotion } = useAccessibility();
  const theme = createAccessibleTheme({
    highContrast,
    largeText,
    reducedMotion,
  });

  useEffect(() => {
    // Set user context in Sentry when available
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Navbar>
              <AccessibilityMenu />
            </Navbar>
            <SentryRoutes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <PrivateRoute>
                    <AssignmentErrorBoundary>
                      <AssignmentList />
                    </AssignmentErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </SentryRoutes>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </ThemeProvider>
  );
};

function App() {
  return (
    <SecurityProvider>
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
      </QueryClientProvider>
    </SecurityProvider>
  );
}

export default Sentry.withProfiler(App);
