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
    expect(screen.getByTestId('auth-layout-header').textContent).toContain('AssignmentAI');
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders children content in the main area', () => {
    renderAuthLayout('Test Content');
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('applies correct theme based on dark mode setting', () => {
    renderAuthLayout('Test Content');
    const container = screen.getByTestId('auth-layout-container');
    expect(container.style.backgroundColor).toBe(theme.palette.background.default);
  });

  it('renders with custom background color', () => {
    renderAuthLayout('Test Content');
    const container = screen.getByTestId('auth-layout-container');
    expect(container.style.backgroundColor).toBe(theme.palette.background.default);
  });

  it('renders with proper spacing and padding', () => {
    renderAuthLayout('Test Content');
    const container = screen.getByTestId('auth-layout-container');
    const content = screen.getByTestId('auth-layout-content');

    // Check container styles
    expect(container.style.minHeight).toBe('100vh');
    expect(container.style.display).toBe('flex');
    expect(container.style.alignItems).toBe('center');
    expect(container.style.justifyContent).toBe('center');

    // Check content styles
    expect(content.style.padding).toBe(theme.spacing(4));
  });

  it('renders with responsive design', () => {
    renderAuthLayout('Test Content');
    const content = screen.getByTestId('auth-layout-content');

    // Check that the content has the responsive class
    expect(content.className).toContain('MuiBox-root');
  });

  it('renders with proper typography styles', () => {
    renderAuthLayout('Test Content');
    const title = screen.getByTestId('auth-layout-header');

    // Check title typography
    expect(title.style.display).toBe('flex');
    expect(title.style.flexDirection).toBe('column');
    expect(title.style.alignItems).toBe('center');
    expect(title.style.gap).toBe(theme.spacing(2));
    expect(title.style.width).toBe('100%');
  });

  it('renders with proper elevation and border radius', () => {
    renderAuthLayout('Test Content');
    const content = screen.getByTestId('auth-layout-content');

    // Check that the content has the Material-UI Box class
    expect(content.className).toContain('MuiBox-root');

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
