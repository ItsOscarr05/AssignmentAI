import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import theme from '../../theme';
import SkipLink from '../common/SkipLink';

const renderSkipLink = (props = {}) => {
  return render(
    <MuiThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme as any}>
        <SkipLink {...props} />
      </EmotionThemeProvider>
    </MuiThemeProvider>
  );
};

describe('SkipLink', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderSkipLink();
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('renders with custom text', () => {
      renderSkipLink({ text: 'Skip to content' });
      expect(screen.getByText('Skip to content')).toBeInTheDocument();
    });

    it('renders with custom target', () => {
      renderSkipLink({ target: 'main-content' });
      expect(screen.getByRole('link')).toHaveAttribute('href', '#main-content');
    });

    it('renders with custom color', () => {
      renderSkipLink({ color: 'warning' });
      expect(screen.getByRole('link')).toHaveClass('text-warning');
    });

    it('renders with custom variant', () => {
      renderSkipLink({ variant: 'outlined' });
      expect(screen.getByRole('link')).toHaveClass('border');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSkipLink();
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Skip to main content');
    });

    it('has proper focus styles', () => {
      renderSkipLink();
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none');
      expect(link).toHaveClass('focus:ring-2');
    });

    it('has proper tabIndex', () => {
      renderSkipLink();
      expect(screen.getByRole('link')).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      renderSkipLink({
        className: 'custom-class',
      });
      expect(screen.getByRole('link')).toHaveClass('custom-class');
    });

    it('applies custom style', () => {
      const customStyle = { backgroundColor: 'red' };
      renderSkipLink({ style: customStyle });
      const link = screen.getByRole('link');
      expect(link).toHaveStyle('background-color: rgb(255, 0, 0)');
    });

    it('applies custom focus className when focused', () => {
      renderSkipLink({
        focusClassName: 'custom-focus-class',
      });
      const link = screen.getByRole('link');
      fireEvent.focus(link);
      expect(link).toHaveClass('custom-focus-class');
    });

    it('applies custom focus style when focused', () => {
      const focusStyle = { color: 'blue' };
      renderSkipLink({ focusStyle });
      const link = screen.getByRole('link');
      fireEvent.focus(link);
      expect(link).toHaveStyle('color: rgb(0, 0, 255)');
    });
  });

  describe('Functionality', () => {
    it('handles click event', () => {
      const onClick = vi.fn();
      renderSkipLink({ onClick });
      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(onClick).toHaveBeenCalled();
    });

    it('handles focus event', () => {
      const onFocus = vi.fn();
      renderSkipLink({ onFocus });
      const link = screen.getByRole('link');
      fireEvent.focus(link);
      expect(onFocus).toHaveBeenCalled();
    });

    it('handles blur event', () => {
      const onBlur = vi.fn();
      renderSkipLink({ onBlur });
      const link = screen.getByRole('link');
      fireEvent.blur(link);
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty text', () => {
      renderSkipLink({ text: '' });
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('renders with long text', () => {
      const longText = 'A'.repeat(1000);
      renderSkipLink({ text: longText });
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('renders with HTML in text', () => {
      renderSkipLink({ text: '<span>Skip to content</span>' });
      expect(screen.getByText('Skip to content')).toBeInTheDocument();
    });

    it('renders with custom z-index', () => {
      renderSkipLink({ zIndex: 1000 });
      expect(screen.getByRole('link')).toHaveStyle({ zIndex: 1000 });
    });

    it('renders with custom position', () => {
      renderSkipLink({ position: 'fixed' });
      expect(screen.getByRole('link')).toHaveStyle({ position: 'fixed' });
    });
  });
});
