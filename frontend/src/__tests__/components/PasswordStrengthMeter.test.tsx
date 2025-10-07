import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { ThemeProvider } from '../../contexts/ThemeContext';

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
      expect(screen.getByRole('meter')).toBeTruthy();
      expect(screen.getByText(/password strength/i)).toBeTruthy();
    });

    it('renders with custom label', () => {
      renderPasswordStrengthMeter({ label: 'Custom Label' });
      expect(screen.getByText('Custom Label')).toBeTruthy();
    });

    it('renders with custom class name', () => {
      renderPasswordStrengthMeter({ className: 'custom-class' });
      expect(screen.getByRole('meter').parentElement?.className).toContain('custom-class');
    });
  });

  describe('Strength Calculation', () => {
    it('shows very weak for empty password', () => {
      renderPasswordStrengthMeter({ password: '' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/very weak/i);
      expect(screen.getByRole('meter').style.width).toBe('0%');
    });

    it('shows weak for short password', () => {
      renderPasswordStrengthMeter({ password: 'abc123' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/weak/i);
      expect(screen.getByRole('meter').style.width).toBe('25%');
    });

    it('shows medium for password with mixed characters', () => {
      renderPasswordStrengthMeter({ password: 'Abc123!' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/medium/i);
      expect(screen.getByRole('meter').style.width).toBe('50%');
    });

    it('shows strong for long password with mixed characters', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/strong/i);
      expect(screen.getByRole('meter').style.width).toBe('75%');
    });

    it('shows very strong for complex password', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#$%^&*()' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/very strong/i);
      expect(screen.getByRole('meter').style.width).toBe('100%');
    });
  });

  describe('Color Indicators', () => {
    it('shows red for very weak password', () => {
      renderPasswordStrengthMeter({ password: '' });
      expect(screen.getByRole('meter').className).toContain('bg-red-500');
    });

    it('shows orange for weak password', () => {
      renderPasswordStrengthMeter({ password: 'abc123' });
      expect(screen.getByRole('meter').className).toContain('bg-orange-500');
    });

    it('shows yellow for medium password', () => {
      renderPasswordStrengthMeter({ password: 'Abc123!' });
      expect(screen.getByRole('meter').className).toContain('bg-yellow-500');
    });

    it('shows light green for strong password', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#' });
      expect(screen.getByRole('meter').className).toContain('bg-green-400');
    });

    it('shows dark green for very strong password', () => {
      renderPasswordStrengthMeter({ password: 'Abcd123!@#$%^&*()' });
      expect(screen.getByRole('meter').className).toContain('bg-green-600');
    });
  });

  describe('Requirements Display', () => {
    it('shows length requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/at least 8 characters/i)).toBeTruthy();
    });

    it('shows uppercase requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/uppercase letter/i)).toBeTruthy();
    });

    it('shows lowercase requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/lowercase letter/i)).toBeTruthy();
    });

    it('shows number requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/number/i)).toBeTruthy();
    });

    it('shows special character requirement', () => {
      renderPasswordStrengthMeter({ showRequirements: true });
      expect(screen.getByText(/special character/i)).toBeTruthy();
    });

    it('updates requirement status based on password', () => {
      renderPasswordStrengthMeter({
        password: 'Abcd123!',
        showRequirements: true,
      });
      expect(screen.getByTestId('length-requirement').className).toContain('text-green-500');
      expect(screen.getByTestId('uppercase-requirement').className).toContain('text-green-500');
      expect(screen.getByTestId('lowercase-requirement').className).toContain('text-green-500');
      expect(screen.getByTestId('number-requirement').className).toContain('text-green-500');
      expect(screen.getByTestId('special-requirement').className).toContain('text-green-500');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderPasswordStrengthMeter();
      const meter = screen.getByRole('meter');
      expect(meter.getAttribute('aria-label')).toBe('Password Strength');
      expect(meter.getAttribute('aria-valuemin')).toBe('0');
      expect(meter.getAttribute('aria-valuemax')).toBe('100');
    });

    it('updates ARIA value based on strength', () => {
      renderPasswordStrengthMeter({ password: 'Abc123!' });
      const meter = screen.getByRole('meter');
      expect(meter.getAttribute('aria-valuenow')).toBe('50');
      expect(meter.getAttribute('aria-valuetext')).toBe('Medium strength password');
    });

    it('announces strength changes', () => {
      const { rerender } = renderPasswordStrengthMeter();

      rerender(
        <ThemeProvider>
          <PasswordStrengthMeter password="Abc123!" />
        </ThemeProvider>
      );

      expect(screen.getByRole('status').textContent).toMatch(/password strength: medium/i);
    });
  });

  describe('Edge Cases', () => {
    it('handles null password', () => {
      renderPasswordStrengthMeter({ password: null });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/very weak/i);
    });

    it('handles undefined password', () => {
      renderPasswordStrengthMeter({ password: undefined });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/very weak/i);
    });

    it('handles extremely long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'b1!';
      renderPasswordStrengthMeter({ password: longPassword });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/very strong/i);
    });

    it('handles passwords with unicode characters', () => {
      renderPasswordStrengthMeter({ password: 'Пароль123!' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/medium/i);
    });

    it('handles passwords with whitespace', () => {
      renderPasswordStrengthMeter({ password: 'Pass word 123!' });
      expect(screen.getByTestId('strength-text').textContent).toMatch(/strong/i);
    });
  });
});
