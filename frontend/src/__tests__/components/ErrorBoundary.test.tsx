import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { theme } from '../../theme';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// Component that renders normally
const NormalComponent = () => <div>Normal content</div>;

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      </ThemeProvider>
    );

    expect(screen.getByText('Normal content')).toBeTruthy();
  });

  it('renders error UI when there is an error', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </ThemeProvider>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(
      screen.getByText('We apologize for the inconvenience. Please try refreshing the page.')
    ).toBeTruthy();
    expect(screen.getByText('Refresh Page')).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('allows page refresh when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Workaround for window.location.reload being non-configurable
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });

    render(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </ThemeProvider>
    );

    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalled();

    // Restore original location and console
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    consoleSpy.mockRestore();
  });
});
