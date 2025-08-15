import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { LoginForm } from '../../src/components/LoginForm';
import { AuthProvider } from '../../src/contexts/AuthContext';

describe('Security Tests', () => {
  const renderWithAuth = (component: React.ReactNode) => {
    return render(React.createElement(AuthProvider, null, component));
  };

  it('should render without crashing', () => {
    const TestComponent = () => React.createElement('div', null, 'Test Content');
    render(React.createElement(TestComponent));
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  describe('Authentication', () => {
    it('should validate email format', async () => {
      renderWithAuth(React.createElement(LoginForm));

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should enforce password requirements', async () => {
      renderWithAuth(React.createElement(LoginForm));

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });
});
