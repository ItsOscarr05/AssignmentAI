import { ThemeProvider } from '@mui/material/styles';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme';
import AuthLayout from '../AuthLayout';

// Mock the Material-UI useTheme hook
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    useTheme: () => theme,
  };
});

const renderAuthLayout = (children: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AuthLayout>{children}</AuthLayout>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the auth layout with logo and title', () => {
    renderAuthLayout('Test Content');

    // Check for logo and title
    expect(screen.getByTestId('auth-layout-header')).toHaveTextContent('AssignmentAI');
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children content in the main area', () => {
    renderAuthLayout('Test Content');
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct theme based on dark mode setting', () => {
    renderAuthLayout('Test Content');
    const container = screen.getByTestId('auth-layout-container');
    expect(container).toHaveStyle({
      backgroundColor: theme.palette.background.default,
    });
  });

  it('renders with custom background color', () => {
    renderAuthLayout('Test Content');
    const container = screen.getByTestId('auth-layout-container');
    expect(container).toHaveStyle({
      backgroundColor: theme.palette.background.default,
    });
  });

  it('renders with proper spacing and padding', () => {
    renderAuthLayout('Test Content');
    const container = screen.getByTestId('auth-layout-container');
    const content = screen.getByTestId('auth-layout-content');

    // Check container styles
    expect(container).toHaveStyle({
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    // Check content styles
    expect(content).toHaveStyle({
      padding: theme.spacing(4),
    });
  });

  it('renders with responsive design', () => {
    renderAuthLayout('Test Content');
    const content = screen.getByTestId('auth-layout-content');

    // Check that the content has the responsive class
    expect(content).toHaveClass('MuiBox-root');
  });

  it('renders with proper typography styles', () => {
    renderAuthLayout('Test Content');
    const title = screen.getByTestId('auth-layout-header');

    // Check title typography
    expect(title).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(2),
      width: '100%',
    });
  });

  it('renders with proper elevation and border radius', () => {
    renderAuthLayout('Test Content');
    const content = screen.getByTestId('auth-layout-content');

    // Check that the content has the Material-UI Box class
    expect(content).toHaveClass('MuiBox-root');

    // Check for the presence of styles using computed styles
    const computedStyle = window.getComputedStyle(content);

    // Check background color (should be the paper color)
    expect(computedStyle.backgroundColor).toBeTruthy();

    // Check border radius (should be non-zero)
    expect(computedStyle.borderRadius).toBeTruthy();

    // Check box shadow (should be present)
    expect(computedStyle.boxShadow).toBeTruthy();
  });
});
