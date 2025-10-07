import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { ThemeProvider } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

const renderLoadingOverlay = (props: Partial<LoadingOverlayProps> = {}) => {
  return render(
    <ThemeProvider>
      <LoadingOverlay isVisible={true} {...props} />
    </ThemeProvider>
  );
};

describe('LoadingOverlay', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderLoadingOverlay();
      expect(screen.getByRole('progressbar')).toBeTruthy();
      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('renders with custom message', () => {
      renderLoadingOverlay({ message: 'Please wait...' });
      expect(screen.getByText('Please wait...')).toBeTruthy();
    });

    it('does not render when isVisible is false', () => {
      renderLoadingOverlay({ isVisible: false });
      expect(screen.queryByRole('progressbar')).not.toBeTruthy();
      expect(screen.queryByText('Loading...')).not.toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderLoadingOverlay();
      expect(screen.getByRole('progressbar').getAttribute('aria-busy')).toBe('true');
    });
  });
});
