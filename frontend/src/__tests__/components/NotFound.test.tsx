import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotFound from '../../components/common/NotFound';
import { ThemeProvider } from '../../contexts/ThemeContext';

const renderNotFound = (props = {}) => {
  return render(
    <ThemeProvider>
      <NotFound {...props} />
    </ThemeProvider>
  );
};

describe('NotFound', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderNotFound();
      expect(screen.getByText('404')).toBeTruthy();
      expect(screen.getByText('Page Not Found')).toBeTruthy();
      expect(screen.getByText('The page you are looking for does not exist.')).toBeTruthy();
      expect(screen.getByText('Go Back')).toBeTruthy();
    });

    it('renders with custom title', () => {
      renderNotFound({ title: 'Custom Title' });
      expect(screen.getByText('Custom Title')).toBeTruthy();
    });

    it('renders with custom description', () => {
      renderNotFound({ description: 'Custom Description' });
      expect(screen.getByText('Custom Description')).toBeTruthy();
    });

    it('renders with custom button text', () => {
      renderNotFound({ buttonText: 'Return Home' });
      expect(screen.getByText('Return Home')).toBeTruthy();
    });

    it('renders with custom icon', () => {
      renderNotFound({ icon: 'warning' });
      expect(screen.getByTestId('warning-icon')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates back when button is clicked', () => {
      const onBack = vi.fn();
      renderNotFound({ onBack });

      const button = screen.getByText('Go Back');
      fireEvent.click(button);

      expect(onBack).toHaveBeenCalled();
    });

    it('navigates to home when button is clicked', () => {
      const onHome = vi.fn();
      renderNotFound({ onHome });

      const button = screen.getByText('Go Back');
      fireEvent.click(button);

      expect(onHome).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderNotFound();

      const container = screen.getByRole('main');
      expect(container.getAttribute('aria-label')).toBe('404 page not found');
    });

    it('has proper heading structure', () => {
      renderNotFound();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toBe('404');
    });

    it('has proper button attributes', () => {
      renderNotFound();

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Go back to previous page');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      renderNotFound({
        className: 'custom-class',
      });
      expect(screen.getByRole('main').className).toContain('custom-class');
    });

    it('applies custom style', () => {
      renderNotFound({
        style: { backgroundColor: 'red' },
      });
      expect(screen.getByRole('main').style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('applies custom icon className', () => {
      renderNotFound({
        iconClassName: 'custom-icon-class',
      });
      expect(screen.getByTestId('error-icon').className).toContain('custom-icon-class');
    });

    it('applies custom icon style', () => {
      renderNotFound({
        iconStyle: { color: 'blue' },
      });
      expect(screen.getByTestId('error-icon').style.color).toBe('rgb(0, 0, 255)');
    });

    it('applies custom button className', () => {
      renderNotFound({
        buttonClassName: 'custom-button-class',
      });
      expect(screen.getByRole('button').className).toContain('custom-button-class');
    });

    it('applies custom button style', () => {
      renderNotFound({
        buttonStyle: { color: 'green' },
      });
      expect(screen.getByRole('button').style.color).toBe('rgb(0, 128, 0)');
    });
  });

  describe('Edge Cases', () => {
    it('renders without button', () => {
      renderNotFound({ showButton: false });
      expect(screen.queryByRole('button')).not.toBeTruthy();
    });

    it('renders without icon', () => {
      renderNotFound({ showIcon: false });
      expect(screen.queryByTestId('error-icon')).not.toBeTruthy();
    });

    it('renders with long description', () => {
      const longDescription = 'A'.repeat(1000);
      renderNotFound({ description: longDescription });
      expect(screen.getByText(longDescription)).toBeTruthy();
    });

    it('renders with HTML in description', () => {
      renderNotFound({ description: '<span>Custom Description</span>' });
      expect(screen.getByText('Custom Description')).toBeTruthy();
    });
  });
});
