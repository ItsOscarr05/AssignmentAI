import { createTheme, createThemeContract } from '@vanilla-extract/css';

const colors = {
  primary: null,
  secondary: null,
  background: null,
  surface: null,
  text: null,
  error: null,
  success: null,
  warning: null,
  info: null,
} as const;

const space = {
  none: null,
  xs: null,
  sm: null,
  md: null,
  lg: null,
  xl: null,
  '2xl': null,
} as const;

const fontSizes = {
  xs: null,
  sm: null,
  md: null,
  lg: null,
  xl: null,
  '2xl': null,
} as const;

export const vars = createThemeContract({
  colors,
  space,
  fontSizes,
});

export const lightTheme = createTheme(vars, {
  colors: {
    primary: '#0070f3',
    secondary: '#7928ca',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: '#111827',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  space: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '4rem',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
});

export const darkTheme = createTheme(vars, {
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  space: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '4rem',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
}); 