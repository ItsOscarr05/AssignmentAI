import { createTheme, ThemeOptions } from '@mui/material/styles';

// Base theme configuration
const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    caption: {
      fontSize: '0.7em',
      lineHeight: 1.4,
      fontWeight: 400,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
      fontSize: '0.65rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#d32f2f',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          variants: [],
          fontSize: '0.8rem !important',
          padding: '6px 12px',
        },
        sizeSmall: {
          fontSize: '0.8rem !important',
          padding: '2px 12px',
          minHeight: '24px !important',
          minWidth: 'auto',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(211, 47, 47, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.12)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        caption: {
          fontSize: 'calc(0.7 * var(--app-font-size, 16px)) !important',
          lineHeight: 1.4,
          fontWeight: 400,
        },
        subtitle1: {
          fontSize: 'calc(1.3 * var(--app-font-size, 16px)) !important',
          fontWeight: 600,
          lineHeight: 1.3,
        },
        h6: {
          fontSize: 'calc(1.4 * var(--app-font-size, 16px)) !important',
          fontWeight: 600,
          lineHeight: 1.3,
        },
      },
    },
  },
};

// Light theme palette
const lightPalette = {
  primary: {
    main: '#d32f2f',
    light: '#ff6659',
    dark: '#9a0007',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#f44336',
    light: '#ff7961',
    dark: '#ba000d',
    contrastText: '#ffffff',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
  },
  error: {
    main: '#d32f2f',
  },
  warning: {
    main: '#ffa000',
  },
  info: {
    main: '#1976d2',
  },
  success: {
    main: '#2e7d32',
  },
};

// Create and export light theme
export const lightTheme = createTheme({
  ...baseTheme,
  palette: lightPalette,
});

// Export theme as default (light theme)
export const theme = lightTheme;

// Export dark theme as a separate chunk
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    ...lightPalette,
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
});
