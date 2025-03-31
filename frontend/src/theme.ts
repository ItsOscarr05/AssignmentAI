import { Theme } from "@emotion/react";

export const theme: Theme = {
  colors: {
    primary: "#2563EB", // Blue 600
    primaryDark: "#1D4ED8", // Blue 700
    primaryLight: "#60A5FA", // Blue 400
    background: "#FFFFFF",
    backgroundHover: "#F3F4F6", // Gray 100
    text: "#111827", // Gray 900
    textSecondary: "#4B5563", // Gray 600
    border: "#E5E7EB", // Gray 200
    error: "#DC2626", // Red 600
    errorLight: "#FEE2E2", // Red 100
    errorDark: "#B91C1C", // Red 700
    success: "#059669", // Green 600
    warning: "#D97706", // Yellow 600
    info: "#3B82F6", // Blue 500
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  typography: {
    fontFamily: {
      sans: "Inter, system-ui, -apple-system, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  transitions: {
    default: "0.2s ease-in-out",
    fast: "0.1s ease-in-out",
    slow: "0.3s ease-in-out",
  },
  zIndex: {
    dropdown: 1000,
    modal: 1100,
    tooltip: 1200,
    toast: 1300,
  },
};
