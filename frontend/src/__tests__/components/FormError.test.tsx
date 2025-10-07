import { ThemeProvider } from '@emotion/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormError from '../../components/common/FormError';

const theme = {
  colors: {
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
    background: '#f5f5f5',
    text: '#222',
    textSecondary: '#666',
    primary: '#1976d2',
    primaryDark: '#1565c0',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: 'Arial',
    fontSize: {
      small: '12px',
      medium: '16px',
      large: '20px',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  breakpoints: {
    mobile: '0px',
    tablet: '600px',
    desktop: '1200px',
  },
  shadows: {
    sm: '0px 1px 2px rgba(0,0,0,0.05)',
    md: '0px 2px 4px rgba(0,0,0,0.1)',
    lg: '0px 4px 8px rgba(0,0,0,0.15)',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
  transitions: {
    default: '0.2s',
    fast: '0.1s',
    slow: '0.3s',
  },
};

describe('FormError', () => {
  it('renders error message', () => {
    render(
      <ThemeProvider theme={theme}>
        <FormError message="Test error" />
      </ThemeProvider>
    );
    expect(screen.getByText('Test error')).toBeTruthy();
  });

  it('renders with custom className', () => {
    render(
      <ThemeProvider theme={theme}>
        <FormError message="Test error" className="custom-class" />
      </ThemeProvider>
    );
    const errorContainer = screen.getByTestId('form-error');
    expect(errorContainer.className).toContain('custom-class');
  });
});
