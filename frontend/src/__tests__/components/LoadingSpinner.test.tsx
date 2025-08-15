import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  const renderLoadingSpinner = () => {
    return render(
      <ThemeProvider theme={theme}>
        <LoadingSpinner />
      </ThemeProvider>
    );
  };

  it('renders loading spinner with correct structure', () => {
    renderLoadingSpinner();

    // Check for the main container
    const container = screen.getByTestId('loading-spinner');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('flex', 'h-screen', 'items-center', 'justify-center');

    // Check for the spinner elements
    const spinnerContainer = container.firstChild;
    expect(spinnerContainer).toHaveClass('relative');

    // Check for the background circle
    const backgroundCircle = spinnerContainer?.firstChild;
    expect(backgroundCircle).toHaveClass(
      'h-12',
      'w-12',
      'rounded-full',
      'border-4',
      'border-gray-200'
    );

    // Check for the animated circle
    const animatedCircle = spinnerContainer?.lastChild;
    expect(animatedCircle).toHaveClass(
      'absolute',
      'top-0',
      'left-0',
      'h-12',
      'w-12',
      'animate-spin',
      'rounded-full',
      'border-4',
      'border-primary-600',
      'border-t-transparent'
    );
  });
});
