import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LazyAssignments,
  LazyDashboard,
  LazyHelp,
  LazyLogin,
  LazyPricePlan,
  LazyProfile,
  LazyRegister,
  LazySettings,
  LoadingFallback,
} from './lazyComponents';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LazyLogin />} />
        <Route path="/register" element={<LazyRegister />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <LazyDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <LazyDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/assignments"
          element={
            <PrivateRoute>
              <LazyAssignments />
            </PrivateRoute>
          }
        />

        <Route
          path="/help"
          element={
            <PrivateRoute>
              <LazyHelp />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <LazyProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <LazySettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/price-plan"
          element={
            <PrivateRoute>
              <LazyPricePlan />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};
