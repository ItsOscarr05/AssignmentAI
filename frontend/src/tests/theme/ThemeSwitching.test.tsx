import { createTheme } from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ThemeProvider as CustomThemeProvider,
  useTheme as useThemeContext,
} from '../../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useThemeContext();
  return (
    <button onClick={toggleTheme}>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</button>
  );
};

describe('Theme Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Theme Toggle', () => {
    it('should toggle between light and dark themes', async () => {
      render(
        <CustomThemeProvider>
          <ThemeToggleButton />
        </CustomThemeProvider>
      );

      // Initial state (light mode)
      expect(screen.getByText('Switch to dark mode')).toBeInTheDocument();

      // Toggle to dark mode
      fireEvent.click(screen.getByText('Switch to dark mode'));
      await waitFor(() => {
        expect(screen.getByText('Switch to light mode')).toBeInTheDocument();
      });

      // Toggle back to light mode
      fireEvent.click(screen.getByText('Switch to light mode'));
      await waitFor(() => {
        expect(screen.getByText('Switch to dark mode')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme preference to localStorage', async () => {
      render(
        <CustomThemeProvider>
          <ThemeToggleButton />
        </CustomThemeProvider>
      );

      fireEvent.click(screen.getByText('Switch to dark mode'));
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
    });

    it('should restore theme preference from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <CustomThemeProvider>
          <ThemeToggleButton />
        </CustomThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Switch to light mode')).toBeInTheDocument();
      });
    });
  });

  describe('Component Styling', () => {
    const StyledComponent = () => {
      const theme = useTheme();
      return (
        <div
          style={{
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          }}
        >
          Themed Content
        </div>
      );
    };

    it('should apply light theme styles', () => {
      const lightTheme = createTheme({ palette: { mode: 'light' } });
      render(
        <ThemeProvider theme={lightTheme}>
          <StyledComponent />
        </ThemeProvider>
      );

      const themedElement = screen.getByText('Themed Content');
      const styles = window.getComputedStyle(themedElement);
      expect(styles.backgroundColor).toBe(lightTheme.palette.background.default);
      expect(styles.color).toBe(lightTheme.palette.text.primary);
    });

    it('should apply dark theme styles', () => {
      const darkTheme = createTheme({ palette: { mode: 'dark' } });
      render(
        <ThemeProvider theme={darkTheme}>
          <StyledComponent />
        </ThemeProvider>
      );

      const themedElement = screen.getByText('Themed Content');
      const styles = window.getComputedStyle(themedElement);
      expect(styles.backgroundColor).toBe(darkTheme.palette.background.default);
      expect(styles.color).toBe(darkTheme.palette.text.primary);
    });
  });

  describe('Theme Context', () => {
    it('should provide theme context to nested components', async () => {
      const NestedComponent = () => {
        const { theme } = useThemeContext();
        return <div>Current theme: {theme}</div>;
      };

      render(
        <CustomThemeProvider>
          <NestedComponent />
        </CustomThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Current theme: light')).toBeInTheDocument();
      });
    });

    it('should update theme context for all nested components', async () => {
      const NestedComponent = () => {
        const { theme } = useThemeContext();
        return <div>Current theme: {theme}</div>;
      };

      render(
        <CustomThemeProvider>
          <div>
            <NestedComponent />
            <ThemeToggleButton />
          </div>
        </CustomThemeProvider>
      );

      fireEvent.click(screen.getByText('Switch to dark mode'));
      await waitFor(() => {
        expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Transitions', () => {
    it('should apply transition effects when switching themes', async () => {
      const TransitionComponent = () => {
        const theme = useTheme();
        return (
          <div
            style={{
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            }}
          >
            Transition Content
          </div>
        );
      };

      render(
        <CustomThemeProvider>
          <TransitionComponent />
          <ThemeToggleButton />
        </CustomThemeProvider>
      );

      const transitionElement = screen.getByText('Transition Content');
      const styles = window.getComputedStyle(transitionElement);
      expect(styles.transition).toBe('background-color 0.3s ease-in-out, color 0.3s ease-in-out');

      fireEvent.click(screen.getByText('Switch to dark mode'));
      await waitFor(() => {
        const updatedStyles = window.getComputedStyle(transitionElement);
        expect(updatedStyles.backgroundColor).not.toBe(styles.backgroundColor);
      });
    });
  });
});
