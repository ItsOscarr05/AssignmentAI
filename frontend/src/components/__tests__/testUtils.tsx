import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../theme';
export * from '../../test/test-utils';

interface RenderOptions {
  route?: string;
  path?: string;
}

export const renderComponent = (
  Component: React.ComponentType<any>,
  props: any = {},
  options: RenderOptions = {}
) => {
  const { path = '/' } = options;

  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path={path} element={<Component {...props} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

// Mock data for common test scenarios
export const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
};

export const mockAssignment = {
  id: '1',
  title: 'Test Assignment',
  description: 'Test Description',
  dueDate: '2024-04-30T00:00:00Z',
  status: 'active',
  submissions: [],
};

export const mockSubmission = {
  id: 1,
  assignmentTitle: 'Test Assignment',
  studentName: 'Test User',
  status: 'submitted',
  grade: 85,
  feedback: 'Good work!',
  submittedAt: '2024-03-10T00:00:00Z',
};

// Mock functions
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
};

// Mock hooks
export const mockUseAuth = () => ({
  user: mockUser,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
});

export const mockUseNavigate = () => mockNavigate;
export const mockUseLocation = () => mockLocation;

// Test suites
describe('Test Utilities', () => {
  describe('renderComponent', () => {
    it('renders a component with default options', () => {
      const TestComponent = () => <div>Test Component</div>;
      renderComponent(TestComponent);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('renders a component with custom props', () => {
      const TestComponent = ({ text }: { text: string }) => <div>{text}</div>;
      renderComponent(TestComponent, { text: 'Custom Text' });
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });
  });

  describe('Mock Data', () => {
    it('has valid mock user data', () => {
      expect(mockUser).toHaveProperty('id');
      expect(mockUser).toHaveProperty('email');
      expect(mockUser).toHaveProperty('name');
      expect(mockUser).toHaveProperty('role');
    });

    it('has valid mock assignment data', () => {
      expect(mockAssignment).toHaveProperty('id');
      expect(mockAssignment).toHaveProperty('title');
      expect(mockAssignment).toHaveProperty('description');
      expect(mockAssignment).toHaveProperty('dueDate');
      expect(mockAssignment).toHaveProperty('status');
    });

    it('has valid mock submission data', () => {
      expect(mockSubmission).toHaveProperty('id');
      expect(mockSubmission).toHaveProperty('assignmentTitle');
      expect(mockSubmission).toHaveProperty('studentName');
      expect(mockSubmission).toHaveProperty('status');
      expect(mockSubmission).toHaveProperty('grade');
    });
  });

  describe('Mock Functions', () => {
    it('provides working mock navigation function', () => {
      const navigate = mockUseNavigate();
      navigate('/test');
      expect(mockNavigate).toHaveBeenCalledWith('/test');
    });

    it('provides working mock location object', () => {
      const location = mockUseLocation();
      expect(location).toEqual(mockLocation);
    });

    it('provides working mock auth hook', () => {
      const auth = mockUseAuth();
      expect(auth.user).toEqual(mockUser);
      expect(auth.isAuthenticated).toBe(true);
      expect(auth.login).toBeDefined();
      expect(auth.logout).toBeDefined();
      expect(auth.register).toBeDefined();
    });
  });
});
