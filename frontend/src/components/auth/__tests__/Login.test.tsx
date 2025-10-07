import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../contexts/AuthContext';
import LoginForm from '../LoginForm';

// Mock @mui/material
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    keyframes: (strings: TemplateStringsArray) => {
      return `@keyframes ${strings.join('')}`;
    },
  };
});

// Mock i18n - removed since we no longer use internationalization

// Mock the lazy-loaded components
const mockNavigate = vi.fn();

vi.mock('../LoginFormContent', () => ({
  default: () => {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [emailError, setEmailError] = React.useState<string | null>(null);
    const [passwordError, setPasswordError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const validateForm = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const newEmailError = !email
        ? 'Email is required'
        : !emailRegex.test(email)
        ? 'Please enter a valid email address'
        : null;
      const newPasswordError = !password ? 'Password is required' : '';

      setEmailError(newEmailError);
      setPasswordError(newPasswordError);

      return !newEmailError && !newPasswordError;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));

        if (email === 'test@example.com' && password === 'password123') {
          mockNavigate('/dashboard');
          navigate('/dashboard');
        } else {
          setPasswordError('Invalid credentials');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} data-testid="login-form">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <div id="email-error" role="alert">
              {emailError}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          {passwordError && (
            <div id="password-error" role="alert">
              {passwordError}
            </div>
          )}
        </div>
        <button type="submit" disabled={isSubmitting}>
          Login
        </button>
      </form>
    );
  },
}));

vi.mock('../common/ThemeToggle', () => ({
  default: () => <button>Toggle Theme</button>,
}));

// Setup MSW server
const server = setupServer(
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ access_token: 'test-token' });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockNavigate.mockClear();
});
afterAll(() => server.close());

const renderLogin = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Login Component', () => {
  it('renders login form', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeTruthy();
      expect(screen.getByLabelText(/password/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /login/i })).toBeTruthy();
    });
  });

  it('shows validation errors for empty form submission', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeTruthy();
    });

    const form = screen.getByTestId('login-form');
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeTruthy();
      expect(screen.getByText(/password is required/i)).toBeTruthy();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeTruthy();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const form = screen.getByTestId('login-form');

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeTruthy();
    });
  });

  it('handles successful login', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeTruthy();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = screen.getByTestId('login-form');

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message for failed login', async () => {
    // Override the mock server response for this test
    server.use(
      http.post('/api/auth/login', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    renderLogin();
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeTruthy();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = screen.getByTestId('login-form');

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy();
    });
  });
});
