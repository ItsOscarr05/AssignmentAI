import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter';

const renderPasswordStrengthMeter = (props = {}) => {
  return render(
    <ThemeProvider>
      <PasswordStrengthMeter password="" {...props} />
    </ThemeProvider>
  );
};

describe('PasswordStrengthMeter', () => {
  describe('Basic Rendering', () => {
    it('renders strength meter', () => {
      renderPasswordStrengthMeter();
      expect(screen.getByRole('meter')).toBeInTheDocument();
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      renderPasswordStrengthMeter({ label: 'Custom Label' });
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('renders with custom class name', () => {
      renderPasswordStrengthMeter({ className: 'custom-class' });
      expect(screen.getByRole('meter').parentElement).toHaveClass('custom-class');
    });
  });

  describe('Strength Calculation', () => {
    it('shows very weak for empty password', () => {
      renderPasswordStrengthMeter({ password: '' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/very weak/i);
      expect(screen.getByRole('meter')).toHaveStyle({ width: '0%' });
    });

    it('shows weak for short password', () => {
      renderPasswordStrengthMeter({ password: 'abc123' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/weak/i);
      expect(screen.getByRole('meter')).toHaveStyle({ width: '25%' });
    });

    it('shows medium for password with mixed characters', () => {
      renderPasswordStrengthMeter({ password: 'Abc123!' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/medium/i);
      expect(screen.getByRole('meter')).toHaveStyle({ width: '50%' });
    });

    it('shows strong for long password with mixed characters', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/strong/i);
      expect(screen.getByRole('meter')).toHaveStyle({ width: '75%' });
    });

    it('shows very strong for complex password', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#$%^&*()' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/very strong/i);
      expect(screen.getByRole('meter')).toHaveStyle({ width: '100%' });
    });
  });

  describe('Color Indicators', () => {
    it('shows red for very weak password', () => {
      renderPasswordStrengthMeter({ password: '' });
      expect(screen.getByRole('meter')).toHaveClass('bg-red-500');
    });

    it('shows orange for weak password', () => {
      renderPasswordStrengthMeter({ password: 'abc123' });
      expect(screen.getByRole('meter')).toHaveClass('bg-orange-500');
    });

    it('shows yellow for medium password', () => {
      renderPasswordStrengthMeter({ password: 'Abc123!' });
      expect(screen.getByRole('meter')).toHaveClass('bg-yellow-500');
    });

    it('shows light green for strong password', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#' });
      expect(screen.getByRole('meter')).toHaveClass('bg-green-400');
    });

    it('shows dark green for very strong password', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#$%^&*()' });
      expect(screen.getByRole('meter')).toHaveClass('bg-green-600');
    });
  });

  describe('Requirements Display', () => {
    it('shows length requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('shows uppercase requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    });

    it('shows lowercase requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
    });

    it('shows number requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/number/i)).toBeInTheDocument();
    });

    it('shows special character requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/special character/i)).toBeInTheDocument();
    });

    it('updates requirement status based on password', () => {
      renderPasswordStrengthMeter({
        password: 'Abcd123!',
        showRequirements: true,
      });
      expect(screen.getByTestId('length-requirement')).toHaveClass('text-green-500');
      expect(screen.getByTestId('uppercase-requirement')).toHaveClass('text-green-500');
      expect(screen.getByTestId('lowercase-requirement')).toHaveClass('text-green-500');
      expect(screen.getByTestId('number-requirement')).toHaveClass('text-green-500');
      expect(screen.getByTestId('special-requirement')).toHaveClass('text-green-500');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderPasswordStrengthMeter();
      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-label', 'Password Strength');
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '100');
    });

    it('updates ARIA value based on strength', () => {
      renderPasswordStrengthMeter({ password: 'Abc123!' });
      const meter = screen.getByRole('meter');
      expect(meter).toHaveAttribute('aria-valuenow', '50');
      expect(meter).toHaveAttribute('aria-valuetext', 'Medium strength password');
    });

    it('announces strength changes', () => {
      const { rerender } = renderPasswordStrengthMeter();

      rerender(
        <ThemeProvider>
          <PasswordStrengthMeter password="Abc123!" />
        </ThemeProvider>
      );

      expect(screen.getByRole('status')).toHaveTextContent(/password strength: medium/i);
    });
  });

  describe('Edge Cases', () => {
    it('handles null password', () => {
      renderPasswordStrengthMeter({ password: null });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/very weak/i);
    });

    it('handles undefined password', () => {
      renderPasswordStrengthMeter({ password: undefined });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/very weak/i);
    });

    it('handles extremely long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'b1!';
      renderPasswordStrengthMeter({ password: longPassword });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/very strong/i);
    });

    it('handles passwords with unicode characters', () => {
      renderPasswordStrengthMeter({ password: 'Пароль123!' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/medium/i);
    });

    it('handles passwords with whitespace', () => {
      renderPasswordStrengthMeter({ password: 'Pass word 123!' });
      expect(screen.getByTestId('strength-text')).toHaveTextContent(/strong/i);
    });
  });
});
