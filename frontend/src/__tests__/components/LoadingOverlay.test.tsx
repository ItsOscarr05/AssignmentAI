import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import LoadingOverlay from '../common/LoadingOverlay';

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
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      renderLoadingOverlay({ message: 'Please wait...' });
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('does not render when isVisible is false', () => {
      renderLoadingOverlay({ isVisible: false });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderLoadingOverlay();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
    });
  });
});
