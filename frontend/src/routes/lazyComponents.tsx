import { lazy } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load all page components
export const LazyDashboard = lazy(() => import('../pages/DashboardSidebar'));
export const LazyAssignments = lazy(() => import('../pages/Assignments'));
export const LazyHelp = lazy(() => import('../pages/Help'));
export const LazyLogin = lazy(() => import('../pages/Login'));
export const LazyPricePlan = lazy(() => import('../pages/PricePlan'));
export const LazyProfile = lazy(() => import('../pages/Profile'));
export const LazyRegister = lazy(() => import('../pages/Register'));
export const LazySettings = lazy(() => import('../pages/Settings'));

// Loading component for Suspense fallback
export const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <LoadingSpinner />
  </div>
);
