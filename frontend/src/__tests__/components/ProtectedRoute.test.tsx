import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockLocationValue: {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  key: string;
} = {
  pathname: '/protected',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocationValue,
    Navigate: ({ to, state, replace }: { to: string; state?: any; replace?: boolean }) => {
      mockNavigate(to, { state, replace });
      if (to === '/login') {
        return <div>Login Page</div>;
      }
      if (to === '/unauthorized') {
        return <div>Unauthorized Page</div>;
      }
      return null;
    },
  };
});

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  const renderProtectedRoute = (props = {}) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute {...props}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    renderProtectedRoute();

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'student' },
      isAuthenticated: true,
      isLoading: false,
    });

    renderProtectedRoute();

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('redirects to unauthorized when role does not match', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'student' },
      isAuthenticated: true,
      isLoading: false,
    });

    renderProtectedRoute({ requiredRole: 'teacher' });

    expect(screen.getByText('Unauthorized Page')).toBeTruthy();
  });

  it('preserves location state when redirecting', () => {
    const customLocation = {
      pathname: '/custom-path',
      search: '?param=value',
      hash: '#section',
      state: { someData: 'value' },
      key: 'custom',
    };

    mockLocationValue = customLocation;
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    renderProtectedRoute();

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: customLocation },
      replace: true,
    });
  });

  it('handles nested routes correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'student' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>
                  <h1>Parent Content</h1>
                  <div>Child Content</div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Parent Content')).toBeTruthy();
    expect(screen.getByText('Child Content')).toBeTruthy();
  });
});
