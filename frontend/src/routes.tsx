import { AnimatePresence } from 'framer-motion';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load all large page components
const About = lazy(() => import('./pages/About'));
const AISettings = lazy(() => import('./pages/AISettings'));
const AITokens = lazy(() => import('./pages/AITokens'));
const Assignments = lazy(() => import('./pages/Assignments'));
const Contact = lazy(() => import('./pages/Contact'));
const CreateAssignment = lazy(() => import('./pages/CreateAssignment'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Help = lazy(() => import('./pages/Help'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const PricePlan = lazy(() => import('./pages/PricePlan'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Profile = lazy(() => import('./pages/Profile'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Settings = lazy(() => import('./pages/Settings'));
const Terms = lazy(() => import('./pages/Terms'));
const Workshop = lazy(() => import('./pages/Workshop'));
const AssignmentDetail = lazy(() => import('./components/assignments/AssignmentDetail'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const suspenseFallback = <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

// Wrap the router with AuthProvider
export const AppRouter = () => (
  <BrowserRouter>
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <Landing />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <Login />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <Register />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <ForgotPassword />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <ResetPassword />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <About />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <Contact />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <Privacy />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={suspenseFallback}>
                <PageTransition>
                  <Terms />
                </PageTransition>
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </Suspense>
              </PrivateRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <DashboardHome />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="assignments"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <Assignments />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="assignments/create"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <CreateAssignment />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="assignments/:id"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <AssignmentDetail />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="assignments/:id/edit"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <CreateAssignment />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="workshop"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <Workshop />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <Settings />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="price-plan"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <PricePlan />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="profile"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <Profile />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="help"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <Help />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="ai-settings"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <AISettings />
                  </PageTransition>
                </Suspense>
              }
            />
            <Route
              path="ai-tokens"
              element={
                <Suspense fallback={suspenseFallback}>
                  <PageTransition>
                    <AITokens />
                  </PageTransition>
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  </BrowserRouter>
);
