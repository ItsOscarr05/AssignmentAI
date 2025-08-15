import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../test/test-utils';
import Toast from '../ui/Toast';

const renderToast = (props = {}) => {
  return render(<Toast message="Test message" type="info" onClose={vi.fn()} {...props} />);
};

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderToast();
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      renderToast({ message: 'Custom message' });
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('renders with custom type', () => {
      renderToast({ type: 'success' });
      expect(screen.getByRole('alert')).toHaveClass('bg-success');
    });

    it('renders with custom duration', () => {
      renderToast({ duration: 5000 });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with custom position', () => {
      renderToast({ position: 'top-right' });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('top-4');
      expect(alert).toHaveClass('right-4');
    });
  });

  describe('Functionality', () => {
    it('handles close button click', () => {
      const onClose = vi.fn();
      renderToast({ onClose });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('auto-closes after duration', () => {
      const onClose = vi.fn();
      renderToast({ duration: 3000, onClose });

      vi.advanceTimersByTime(3000);

      expect(onClose).toHaveBeenCalled();
    });

    it('pauses auto-close on hover', () => {
      const onClose = vi.fn();
      renderToast({ duration: 3000, onClose });

      const toast = screen.getByRole('alert');
      fireEvent.mouseEnter(toast);

      vi.advanceTimersByTime(3000);

      expect(onClose).not.toHaveBeenCalled();

      fireEvent.mouseLeave(toast);

      vi.advanceTimersByTime(3000);

      expect(onClose).toHaveBeenCalled();
    });

    it('handles click event', () => {
      const onClick = vi.fn();
      renderToast({ onClick });

      const toast = screen.getByRole('alert');
      fireEvent.click(toast);

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderToast();

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });

    it('has proper button attributes', () => {
      renderToast();

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close toast');
    });

    it('has proper focus management', () => {
      renderToast();

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('renders without close button', () => {
      renderToast({ showCloseButton: false });
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('renders without icon', () => {
      renderToast({ showIcon: false });
      expect(screen.queryByTestId('toast-icon')).not.toBeInTheDocument();
    });

    it('renders with long message', () => {
      const longMessage = 'A'.repeat(1000);
      renderToast({ message: longMessage });
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles zero duration', () => {
      const onClose = vi.fn();
      renderToast({ duration: 0, onClose });

      vi.advanceTimersByTime(0);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('handles negative duration', () => {
      const onClose = vi.fn();
      renderToast({ duration: -1000, onClose });

      vi.advanceTimersByTime(0);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
