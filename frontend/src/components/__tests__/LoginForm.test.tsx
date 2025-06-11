import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../test/test-utils';
import { LoginForm } from '../LoginForm';

// Mock the auth service
vi.mock('../../services/auth', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      const errorMessage = screen.getByText('Invalid email address');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      const errorMessage = screen.getByText('Password must be at least 6 characters');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('shows error message for invalid credentials', () => {
    const testError = 'Invalid credentials';
    render(<LoginForm testLoginError={testError} />);

    const errorMessages = screen.getAllByRole('alert');
    expect(errorMessages.some(el => el.textContent === testError)).toBe(true);
  });

  it('handles form submission with valid credentials', async () => {
    const mockOnSubmit = vi.fn();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('clears error messages when user types', async () => {
    render(<LoginForm testLoginError="Invalid credentials" />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await waitFor(() => {
      const errorMessages = screen.queryAllByRole('alert', { name: /invalid credentials/i });
      expect(errorMessages.length).toBe(0);
    });
  });

  it('handles remember me checkbox', () => {
    render(<LoginForm />);

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberMeCheckbox).toBeInTheDocument();

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });
});
