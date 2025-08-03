import '@mui/material/styles';
import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    tokenLimit: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    tokenLimit?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    tokenLimit: true;
  }
}

// Base theme configuration
const baseTheme: ThemeOptions = {
  palette: {
    primary: {
      main: '#d32f2f',
    },
    secondary: {
      main: '#8884d8',
    },
    success: {
      main: '#82ca9d',
    },
  },
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
    tokenLimit: {
      fontSize: '0.9rem',
      lineHeight: 1.4,
      fontWeight: 600,
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
          '& .dashboard-sidebar-title': {
            fontSize: 'calc(1.7rem * var(--app-font-size, 16px) / 16px) !important',
            fontWeight: 700,
          },
          '& .dashboard-sidebar-menu-text': {
            fontSize: 'calc(1.1rem * var(--app-font-size, 16px) / 16px) !important',
            fontWeight: 500,
          },
          '& .dashboard-sidebar-copyright': {
            fontSize: 'calc(0.9rem * var(--app-font-size, 16px) / 16px) !important',
          },
          '& .dashboard-sidebar-icon': {
            fontSize: 'calc(28px * var(--app-font-size, 16px) / 16px) !important',
          },
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
          '&.save-changes': {
            borderRadius: 'calc(0.375 * var(--app-font-size, 16px))',
            padding: `calc(0.6 * var(--app-font-size, 16px)) calc(1.2 * var(--app-font-size, 16px))`,
            fontSize: 'calc(0.85 * var(--app-font-size, 16px)) !important',
            fontWeight: 500,
            background: 'linear-gradient(45deg, #d32f2f, #ff6659)',
            boxShadow: '0 4px 20px 0px rgba(0,0,0,0.14), 0 7px 10px -5px rgba(33,150,243,0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 30px -10px rgba(33,150,243,0.6)',
            },
            '&:disabled': {
              background: 'rgba(0,0,0,0.12)',
              color: 'rgba(0,0,0,0.38)',
              transform: 'none',
              boxShadow: 'none',
            },
          },
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
        h4: {
          fontSize: 'calc(2.5 * var(--app-font-size, 16px)) !important',
          fontWeight: 500,
          lineHeight: 1.2,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 'calc(1.5 * var(--app-font-size, 16px)) !important',
          fontWeight: 700,
          color: '#d32f2f',
          padding:
            'calc(1.25 * var(--app-font-size, 16px)) calc(1.5 * var(--app-font-size, 16px)) calc(1 * var(--app-font-size, 16px)) calc(1.5 * var(--app-font-size, 16px))',
          '& .MuiSvgIcon-root': {
            color: '#d32f2f',
            fontSize: 'calc(1.5 * var(--app-font-size, 16px)) !important',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            minHeight: 'calc(4.375 * var(--app-font-size, 16px))',
            fontSize: 'calc(1 * var(--app-font-size, 16px)) !important',
            fontWeight: 500,
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            flex: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&.Mui-selected': {
              color: '#d32f2f',
            },
            '& .MuiSvgIcon-root': {
              fontSize: 'calc(1.7 * var(--app-font-size, 16px)) !important',
              color: '#d32f2f',
            },
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(45deg, #d32f2f, #ff6659)',
          },
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

// Dark theme color variants
export const darkThemeColors = {
  navy: '#000814', // Current dark blue-black
  charcoal: '#1a1a1a', // Lighter dark gray
  slate: '#2d3748', // Medium dark gray-blue
  graphite: '#4a5568', // Lightest dark gray
};

// Function to create dark theme with custom background color
export const createDarkTheme = (backgroundColor: string) =>
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'dark',
      primary: {
        main: '#d32f2f', // Keep red
        light: '#ff6659', // Keep red
        dark: '#9a0007', // Keep red
        contrastText: '#ffffff', // Keep white for contrast
      },
      secondary: {
        main: '#f44336', // Keep red
        light: '#ff7961', // Keep red
        dark: '#ba000d', // Keep red
        contrastText: '#ffffff', // Keep white for contrast
      },
      background: {
        default: backgroundColor,
        paper: backgroundColor,
      },
      text: {
        primary: '#ffffff', // White text
        secondary: '#ffffff', // White secondary text
      },
      error: {
        main: '#d32f2f', // Keep red
      },
      warning: {
        main: '#ffa000', // Keep orange
      },
      info: {
        main: '#1976d2', // Keep blue
      },
      success: {
        main: '#2e7d32', // Keep green
      },
    },
    components: {
      ...baseTheme.components,
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundColor,
            color: '#ffffff', // White text
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)', // White shadow
            backgroundColor: backgroundColor,
            color: '#ffffff', // White text
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundColor,
            color: '#ffffff', // White text
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#d32f2f', // Keep red
            borderRight: '1px solid rgba(255, 255, 255, 0.12)', // White border
            '& .dashboard-sidebar-title': {
              fontSize: 'calc(1.7rem * var(--app-font-size, 16px) / 16px) !important',
              fontWeight: 700,
            },
            '& .dashboard-sidebar-menu-text': {
              fontSize: 'calc(1.1rem * var(--app-font-size, 16px) / 16px) !important',
              fontWeight: 500,
            },
            '& .dashboard-sidebar-copyright': {
              fontSize: 'calc(0.9rem * var(--app-font-size, 16px) / 16px) !important',
            },
            '& .dashboard-sidebar-icon': {
              fontSize: 'calc(28px * var(--app-font-size, 16px) / 16px) !important',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '& .MuiSvgIcon-root': {
              fontSize: 'calc(1.7 * var(--app-font-size, 16px)) !important',
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            '&.MuiTypography-caption': {
              fontSize: 'calc(0.7 * var(--app-font-size, 16px)) !important',
            },
          },
        },
        variants: [
          {
            props: { variant: 'tokenLimit' },
            style: {
              fontSize: '0.9rem',
              lineHeight: 1.4,
              fontWeight: 600,
            },
          },
        ],
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: '0.8rem !important',
          },
        },
      },
    },
  });

// Export dark theme as a separate chunk
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#d32f2f', // Keep red
      light: '#ff6659', // Keep red
      dark: '#9a0007', // Keep red
      contrastText: '#ffffff', // Keep white for contrast
    },
    secondary: {
      main: '#f44336', // Keep red
      light: '#ff7961', // Keep red
      dark: '#ba000d', // Keep red
      contrastText: '#ffffff', // Keep white for contrast
    },
    background: {
      default: '#000814', // Dark blue-black background
      paper: '#000814', // Dark blue-black cards
    },
    text: {
      primary: '#ffffff', // White text
      secondary: '#ffffff', // White secondary text
    },
    error: {
      main: '#d32f2f', // Keep red
    },
    warning: {
      main: '#ffa000', // Keep orange
    },
    info: {
      main: '#1976d2', // Keep blue
    },
    success: {
      main: '#2e7d32', // Keep green
    },
  },
  components: {
    ...baseTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000814', // Dark blue-black background
          color: '#ffffff', // White text
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#d32f2f', // Keep red
          borderRight: '1px solid rgba(255, 255, 255, 0.12)', // White border
          '& .dashboard-sidebar-title': {
            fontSize: 'calc(1.7rem * var(--app-font-size, 16px) / 16px) !important',
            fontWeight: 700,
          },
          '& .dashboard-sidebar-menu-text': {
            fontSize: 'calc(1.1rem * var(--app-font-size, 16px) / 16px) !important',
            fontWeight: 500,
          },
          '& .dashboard-sidebar-copyright': {
            fontSize: 'calc(0.9rem * var(--app-font-size, 16px) / 16px) !important',
          },
          '& .dashboard-sidebar-icon': {
            fontSize: 'calc(28px * var(--app-font-size, 16px) / 16px) !important',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)', // White shadow
          backgroundColor: '#000814', // Dark blue-black background
          color: '#ffffff', // White text
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#000814', // Dark blue-black background
          color: '#ffffff', // White text
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(211, 47, 47, 0.2)', // Red with opacity
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.3)', // Red with opacity
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          backgroundColor: '#000000', // Black background
          color: '#ffffff', // White text
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 'calc(1.5 * var(--app-font-size, 16px)) !important',
          fontWeight: 700,
          color: '#d32f2f', // Keep red
          padding:
            'calc(1.25 * var(--app-font-size, 16px)) calc(1.5 * var(--app-font-size, 16px)) calc(1 * var(--app-font-size, 16px)) calc(1.5 * var(--app-font-size, 16px))',
          '& .MuiSvgIcon-root': {
            color: '#d32f2f', // Keep red
            fontSize: 'calc(1.5 * var(--app-font-size, 16px)) !important',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            minHeight: 'calc(4.375 * var(--app-font-size, 16px))',
            fontSize: 'calc(1 * var(--app-font-size, 16px)) !important',
            fontWeight: 500,
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            flex: 1,
            color: '#ffffff', // White text
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)', // White with opacity
            },
            '&.Mui-selected': {
              color: '#d32f2f', // Keep red
            },
            '& .MuiSvgIcon-root': {
              fontSize: 'calc(1.7 * var(--app-font-size, 16px)) !important',
              color: '#d32f2f', // Keep red
            },
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(45deg, #d32f2f, #ff6659)', // Keep red gradient
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#000000', // Black background
            color: '#ffffff', // White text
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)', // White border
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)', // White border
            },
            '&.Mui-focused fieldset': {
              borderColor: '#d32f2f', // Red border when focused
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)', // White label
            '&.Mui-focused': {
              color: '#d32f2f', // Red when focused
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000', // Black background
          color: '#ffffff', // White text
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)', // White border
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)', // White border
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d32f2f', // Red border when focused
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000', // Black background
          color: '#ffffff', // White text
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // White with opacity
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(211, 47, 47, 0.2)', // Red with opacity
            '&:hover': {
              backgroundColor: 'rgba(211, 47, 47, 0.3)', // Red with opacity
            },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)', // White track
          },
          '& .MuiSwitch-thumb': {
            backgroundColor: '#ffffff', // White thumb
          },
          '&.Mui-checked .MuiSwitch-track': {
            backgroundColor: 'rgba(211, 47, 47, 0.5)', // Red track when checked
          },
          '&.Mui-checked .MuiSwitch-thumb': {
            backgroundColor: '#d32f2f', // Red thumb when checked
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-track': {
            backgroundColor: '#d32f2f', // Keep red
          },
          '& .MuiSlider-thumb': {
            backgroundColor: '#d32f2f', // Keep red
          },
          '& .MuiSlider-rail': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)', // White rail
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#000000', // Black background
          color: '#ffffff', // White text
          border: '1px solid rgba(255, 255, 255, 0.3)', // White border
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.2)', // White divider
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#ffffff', // White icons
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // White with opacity
          },
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
          '&.save-changes': {
            borderRadius: 'calc(0.375 * var(--app-font-size, 16px))',
            padding: `calc(0.6 * var(--app-font-size, 16px)) calc(1.2 * var(--app-font-size, 16px))`,
            fontSize: 'calc(0.85 * var(--app-font-size, 16px)) !important',
            fontWeight: 500,
            background: 'linear-gradient(45deg, #d32f2f, #ff6659)', // Keep red gradient
            boxShadow:
              '0 4px 20px 0px rgba(211, 47, 47, 0.3), 0 7px 10px -5px rgba(211, 47, 47, 0.4)', // Red shadow
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 30px -10px rgba(211, 47, 47, 0.6)', // Red shadow
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.12)', // White with opacity
              color: 'rgba(255, 255, 255, 0.38)', // White with opacity
              transform: 'none',
              boxShadow: 'none',
            },
          },
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
  },
});
