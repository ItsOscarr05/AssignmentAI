import React, { Suspense, lazy } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import ErrorBoundaryWrapper from "./components/common/ErrorBoundary";
import LoadingSpinner from "./components/common/LoadingSpinner";
import SkipLink from "./components/common/SkipLink";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { useAriaLive } from "./hooks/useAriaLive";

// Lazy load components
const AssignmentRoutes = lazy(
  () => import("./components/assignments/AssignmentRoutes")
);
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const RegisterForm = lazy(() => import("./components/auth/RegisterForm"));
const NotFound = lazy(() => import("./components/common/NotFound"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const MainLayout = lazy(() => import("./components/layout/MainLayout"));
const Profile = lazy(() => import("./components/profile/Profile"));
const Settings = lazy(() => import("./components/settings/Settings"));

// Loading fallback component
const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
    }}
  >
    <LoadingSpinner size="40px" />
  </div>
);

const App: React.FC = () => {
  const { announce } = useAriaLive({ politeness: "polite" });

  React.useEffect(() => {
    // Announce page changes to screen readers
    announce("Page loaded");
  }, [announce]);

  return (
    <ErrorBoundaryWrapper>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <SkipLink />
            <main id="main-content" role="main">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />

                  {/* Protected routes */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route
                      path="/assignments/*"
                      element={<AssignmentRoutes />}
                    />
                  </Route>

                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundaryWrapper>
  );
};

export default App;
