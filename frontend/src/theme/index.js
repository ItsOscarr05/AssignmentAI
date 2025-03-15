import { createTheme } from "@mui/material/styles";

// Color palette with WCAG 2.1 AA compliant contrast ratios
const lightPalette = {
  primary: {
    main: "#1976d2",
    light: "#42a5f5",
    dark: "#1565c0",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#9c27b0",
    light: "#ba68c8",
    dark: "#7b1fa2",
    contrastText: "#ffffff",
  },
  error: {
    main: "#d32f2f",
    light: "#ef5350",
    dark: "#c62828",
    contrastText: "#ffffff",
  },
  warning: {
    main: "#ed6c02",
    light: "#ff9800",
    dark: "#e65100",
    contrastText: "#ffffff",
  },
  info: {
    main: "#0288d1",
    light: "#03a9f4",
    dark: "#01579b",
    contrastText: "#ffffff",
  },
  success: {
    main: "#2e7d32",
    light: "#4caf50",
    dark: "#1b5e20",
    contrastText: "#ffffff",
  },
};

// High contrast palette
const highContrastPalette = {
  primary: {
    main: "#000000",
    light: "#333333",
    dark: "#000000",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#ffffff",
    light: "#ffffff",
    dark: "#cccccc",
    contrastText: "#000000",
  },
  error: {
    main: "#ff0000",
    light: "#ff3333",
    dark: "#cc0000",
    contrastText: "#ffffff",
  },
  warning: {
    main: "#ffff00",
    light: "#ffff33",
    dark: "#cccc00",
    contrastText: "#000000",
  },
  info: {
    main: "#0000ff",
    light: "#3333ff",
    dark: "#0000cc",
    contrastText: "#ffffff",
  },
  success: {
    main: "#008000",
    light: "#33cc33",
    dark: "#006600",
    contrastText: "#ffffff",
  },
};

export const createAccessibleTheme = ({
  highContrast = false,
  largeText = false,
  reducedMotion = false,
}) => {
  return createTheme({
    palette: {
      mode: "light",
      ...(highContrast ? highContrastPalette : lightPalette),
    },
    typography: {
      fontFamily: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ].join(","),
      ...(largeText && {
        fontSize: 16, // Base font size
        h1: { fontSize: "2.5rem" },
        h2: { fontSize: "2rem" },
        h3: { fontSize: "1.75rem" },
        h4: { fontSize: "1.5rem" },
        h5: { fontSize: "1.25rem" },
        h6: { fontSize: "1.1rem" },
        body1: { fontSize: "1.1rem" },
        body2: { fontSize: "1rem" },
      }),
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableRipple: reducedMotion,
        },
        styleOverrides: {
          root: {
            minWidth: "44px", // Minimum touch target size
            minHeight: "44px",
          },
        },
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: reducedMotion,
        },
        styleOverrides: {
          root: {
            padding: "12px", // Ensures minimum touch target size
          },
        },
      },
      MuiLink: {
        defaultProps: {
          underline: "always", // Better accessibility for links
        },
        styleOverrides: {
          root: {
            "&:focus": {
              outline: "2px solid currentColor",
              outlineOffset: "2px",
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          inputProps: {
            "aria-label": "input", // Default aria-label
          },
        },
      },
    },
    transitions: reducedMotion
      ? {
          create: () => "none", // Disable animations when reduced motion is preferred
        }
      : undefined,
  });
};
