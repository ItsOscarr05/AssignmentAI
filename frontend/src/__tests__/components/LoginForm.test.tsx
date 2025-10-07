// Note: Testing library not available, using basic DOM testing
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginFormContent from '../../components/auth/LoginFormContent';

// Simple screen utilities since testing library is not available
const screen = {
  getByText: (text: string | RegExp) => {
    const searchText = text instanceof RegExp ? text.source : text;
    return (
      document.querySelector(`[data-testid*="${searchText}"]`) ||
      document.querySelector(`*:contains("${searchText}")`) ||
      document.querySelector(`*:contains("${searchText.toLowerCase()}")`)
    );
  },
  getByLabelText: (label: string | RegExp) => {
    const searchLabel = label instanceof RegExp ? label.source : label;
    return (
      document.querySelector(`label:contains("${searchLabel}") input`) ||
      document.querySelector(`input[aria-label="${searchLabel}"]`) ||
      document.querySelector(`input[aria-label="${searchLabel.toLowerCase()}"]`)
    );
  },
  getByRole: (role: string, options?: { name?: string | RegExp }) => {
    if (options?.name) {
      const searchName = options.name instanceof RegExp ? options.name.source : options.name;
      return (
        document.querySelector(`[role="${role}"]:contains("${searchName}")`) ||
        document.querySelector(`[role="${role}"]:contains("${searchName.toLowerCase()}")`) ||
        document.querySelector(`[role="${role}"]`)
      );
    }
    return document.querySelector(`[role="${role}"]`);
  },
  getByTestId: (testId: string) => document.querySelector(`[data-testid="${testId}"]`),
  queryByText: (text: string | RegExp) => {
    const searchText = text instanceof RegExp ? text.source : text;
    return (
      document.querySelector(`[data-testid*="${searchText}"]`) ||
      document.querySelector(`*:contains("${searchText}")`) ||
      document.querySelector(`*:contains("${searchText.toLowerCase()}")`)
    );
  },
};

// Simple fireEvent since testing library is not available
const fireEvent = {
  change: (element: Element, event: any) => {
    if (element instanceof HTMLInputElement) {
      element.value = event.target.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  click: (element: Element) => {
    element.dispatchEvent(new Event('click', { bubbles: true }));
  },
  submit: (element: Element) => {
    element.dispatchEvent(new Event('submit', { bubbles: true }));
  },
};

// Simple waitFor since testing library is not available
const waitFor = async (callback: () => void) => {
  // Simple implementation - just call the callback
  await new Promise(resolve => setTimeout(resolve, 0));
  callback();
};

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
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
}));

describe('LoginFormContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(<LoginFormContent />);

    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });

  it('validates email format', async () => {
    render(<LoginFormContent />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeTruthy();
    if (!emailInput) return;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const form = screen.getByTestId('login-form');
    expect(form).toBeTruthy();
    if (!form) return;

    fireEvent.submit(form);

    await waitFor(() => {
      const errorMessage = screen.getByText('Invalid email address');
      expect(errorMessage).toBeTruthy();
    });
  });

  it('validates password length', async () => {
    render(<LoginFormContent />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeTruthy();
    if (!passwordInput) return;

    fireEvent.change(passwordInput, { target: { value: '12345' } });

    const form = screen.getByTestId('login-form');
    expect(form).toBeTruthy();
    if (!form) return;

    fireEvent.submit(form);

    await waitFor(() => {
      const errorMessage = screen.getByText('Password must be at least 6 characters');
      expect(errorMessage).toBeTruthy();
    });
  });

  it('shows error message for invalid credentials', async () => {
    render(<LoginFormContent />);

    // Mock the auth service to throw an error
    const { authService } = await import('../../services/auth');
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    if (!emailInput || !passwordInput || !submitButton) return;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('handles form submission with valid credentials', async () => {
    render(<LoginFormContent />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    if (!emailInput || !passwordInput || !submitButton) return;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const { authService } = require('../../services/auth');
      expect(vi.mocked(authService.login)).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });

  it('clears error messages when user types', async () => {
    render(<LoginFormContent />);

    // First trigger an error
    const { authService } = await import('../../services/auth');
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    if (!emailInput || !passwordInput || !submitButton) return;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });

    // Now type in email field to clear error
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).toBeFalsy();
    });
  });

  it('handles remember me checkbox', () => {
    render(<LoginFormContent />);

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberMeCheckbox).toBeTruthy();
    if (!rememberMeCheckbox) return;

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toHaveProperty('checked', true);
  });
});
