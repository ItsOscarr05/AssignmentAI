import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PrivateRoute from '../../components/routing/PrivateRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth');

describe('Routing Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Protection', () => {
    const DummyProtectedComponent = () => <div>Protected Content</div>;
    const LoginComponent = () => <div>Login Page</div>;

    it('should redirect to login when accessing protected route while unauthenticated', async () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <DummyProtectedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should allow access to protected route when authenticated', async () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginComponent />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <DummyProtectedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    const NavigationTestComponent = () => {
      const navigate = useNavigate();
      const location = useLocation();
      return (
        <div>
          <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button onClick={() => navigate(-1)}>Go Back</button>
          <button onClick={() => navigate('/profile', { replace: true })}>Go to Profile</button>
          <div data-testid="location">{location.pathname}</div>
        </div>
      );
    };

    it('should handle forward navigation', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationTestComponent />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go to Dashboard'));
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
      });
    });

    it('should handle back navigation', async () => {
      render(
        <MemoryRouter initialEntries={['/', '/dashboard']}>
          <NavigationTestComponent />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go Back'));
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/');
      });
    });

    it('should handle replace navigation', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavigationTestComponent />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go to Profile'));
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/profile');
      });
    });
  });

  describe('Route Parameters', () => {
    interface AssignmentDetailProps {
      id: string;
    }

    const AssignmentDetail = ({ id }: AssignmentDetailProps) => <div>Assignment {id} Details</div>;

    it('should handle route parameters correctly', async () => {
      render(
        <MemoryRouter initialEntries={['/assignment/123']}>
          <Routes>
            <Route path="/assignment/:id" element={<AssignmentDetail id="123" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Assignment 123 Details')).toBeInTheDocument();
      });
    });

    it('should handle optional route parameters', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <Routes>
            <Route path="/assignments/:filter?" element={<div>Assignments List</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Assignments List')).toBeInTheDocument();
      });
    });
  });

  describe('Route Guards', () => {
    const AdminRoute = ({ children }: { children: React.ReactNode }) => {
      const { user } = useAuth();
      return user?.role === 'admin' ? <>{children}</> : <div>Access Denied</div>;
    };

    it('should prevent access to admin routes for non-admin users', async () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        user: { role: 'user' },
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Panel</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should allow access to admin routes for admin users', async () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        user: { role: 'admin' },
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Panel</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });
    });
  });

  describe('Route Transitions', () => {
    const LoadingComponent = () => <div>Loading...</div>;

    it('should show loading state during route transition', async () => {
      (useAuth as any).mockReturnValue({
        isAuthenticated: true,
        loading: true,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <LoadingComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });
});
