import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import Skeleton from '../common/Skeleton';

const renderSkeleton = (props = {}) => {
  return render(
    <ThemeProvider>
      <Skeleton {...props} />
    </ThemeProvider>
  );
};

describe('Skeleton', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderSkeleton();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with custom width', () => {
      renderSkeleton({ width: '200px' });
      expect(screen.getByRole('status')).toHaveStyle({ width: '200px' });
    });

    it('renders with custom height', () => {
      renderSkeleton({ height: '100px' });
      expect(screen.getByRole('status')).toHaveStyle({ height: '100px' });
    });

    it('renders with custom color', () => {
      renderSkeleton({ color: 'warning' });
      expect(screen.getByRole('status')).toHaveClass('bg-warning');
    });

    it('renders with custom animation', () => {
      renderSkeleton({ animation: 'pulse' });
      expect(screen.getByRole('status')).toHaveClass('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSkeleton();

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });

    it('has proper role', () => {
      renderSkeleton();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has proper tabIndex', () => {
      renderSkeleton();
      expect(screen.getByRole('status')).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      renderSkeleton({
        className: 'custom-class',
      });
      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });

    it('applies custom style', () => {
      renderSkeleton({
        style: { backgroundColor: 'red' },
      });
      const skeleton = screen.getByRole('status');
      // Accept both 'red' and 'rgb(255, 0, 0)' for robustness
      expect(getComputedStyle(skeleton).backgroundColor).toMatch(/red|rgb\(255, 0, 0\)/);
    });

    it('applies custom animation className', () => {
      renderSkeleton({
        animationClassName: 'custom-animation-class',
      });
      expect(screen.getByRole('status')).toHaveClass('custom-animation-class');
    });

    it('applies custom animation style', () => {
      renderSkeleton({
        animationStyle: { color: 'blue' },
      });
      const skeleton = screen.getByRole('status');
      // Accept both 'blue' and 'rgb(0, 0, 255)' for robustness
      expect(getComputedStyle(skeleton).color).toMatch(/blue|rgb\(0, 0, 255\)/);
    });
  });

  describe('Edge Cases', () => {
    it('renders with zero width', () => {
      renderSkeleton({ width: '0px' });
      expect(screen.getByRole('status')).toHaveStyle({ width: '0px' });
    });

    it('renders with zero height', () => {
      renderSkeleton({ height: '0px' });
      expect(screen.getByRole('status')).toHaveStyle({ height: '0px' });
    });

    it('renders with negative dimensions', () => {
      renderSkeleton({ width: '-100px', height: '-100px' });
      expect(screen.getByRole('status')).toHaveStyle({
        width: '-100px',
        height: '-100px',
      });
    });

    it('renders with percentage dimensions', () => {
      renderSkeleton({ width: '50%', height: '50%' });
      expect(screen.getByRole('status')).toHaveStyle({
        width: '50%',
        height: '50%',
      });
    });

    it('renders with viewport dimensions', () => {
      renderSkeleton({ width: '50vw', height: '50vh' });
      expect(screen.getByRole('status')).toHaveStyle({
        width: '50vw',
        height: '50vh',
      });
    });

    it('renders with rem dimensions', () => {
      renderSkeleton({ width: '2rem', height: '2rem' });
      expect(screen.getByRole('status')).toHaveStyle({
        width: '2rem',
        height: '2rem',
      });
    });

    it('renders with em dimensions', () => {
      renderSkeleton({ width: '2em', height: '2em' });
      expect(screen.getByRole('status')).toHaveStyle({
        width: '2em',
        height: '2em',
      });
    });
  });
});
