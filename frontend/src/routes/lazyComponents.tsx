import { Box, CircularProgress } from '@mui/material';
import React, { lazy } from 'react';

// Lazy load components
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Assignments = lazy(() => import('../pages/Assignments'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Help = lazy(() => import('../pages/Help'));
const PricePlan = lazy(() => import('../pages/PricePlan'));

// Loading fallback component
export const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

// Export lazy components
export const LazyLogin = Login;
export const LazyRegister = Register;
export const LazyDashboard = Dashboard;
export const LazyAssignments = Assignments;
export const LazyProfile = Profile;
export const LazySettings = Settings;
export const LazyHelp = Help;
export const LazyPricePlan = PricePlan;
