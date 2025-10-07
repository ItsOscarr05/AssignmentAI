import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { theme } from '../../theme';

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
    expect(container).toBeTruthy();
    expect(container.className).toContain('flex');
    expect(container.className).toContain('h-screen');
    expect(container.className).toContain('items-center');
    expect(container.className).toContain('justify-center');

    // Check for the spinner elements
    const spinnerContainer = container.firstChild as HTMLElement;
    expect(spinnerContainer).toBeTruthy();
    expect(spinnerContainer.className).toContain('relative');

    // Check for the background circle
    const backgroundCircle = spinnerContainer.firstChild as HTMLElement;
    expect(backgroundCircle).toBeTruthy();
    expect(backgroundCircle.className).toContain('h-12');
    expect(backgroundCircle.className).toContain('w-12');
    expect(backgroundCircle.className).toContain('rounded-full');
    expect(backgroundCircle.className).toContain('border-4');
    expect(backgroundCircle.className).toContain('border-gray-200');

    // Check for the animated circle
    const animatedCircle = spinnerContainer.lastChild as HTMLElement;
    expect(animatedCircle).toBeTruthy();
    expect(animatedCircle.className).toContain('absolute');
    expect(animatedCircle.className).toContain('top-0');
    expect(animatedCircle.className).toContain('left-0');
    expect(animatedCircle.className).toContain('h-12');
    expect(animatedCircle.className).toContain('w-12');
    expect(animatedCircle.className).toContain('animate-spin');
    expect(animatedCircle.className).toContain('rounded-full');
    expect(animatedCircle.className).toContain('border-4');
    expect(animatedCircle.className).toContain('border-primary-600');
    expect(animatedCircle.className).toContain('border-t-transparent');
  });
});
