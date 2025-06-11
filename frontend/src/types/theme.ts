import '@emotion/react';

declare module '@emotion/react' {
  export interface Theme {
    colors: {
      // Status colors
      success: string;
      error: string;
      warning: string;
      info: string;

      // Base colors
      background: string;
      text: string;
      textSecondary: string;
      primary: string;
      primaryDark: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    typography: {
      fontFamily: string;
      fontSize: {
        small: string;
        medium: string;
        large: string;
      };
      fontWeight: {
        light: number;
        regular: number;
        medium: number;
        bold: number;
      };
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
    };
    transitions: {
      default: string;
      fast: string;
      slow: string;
    };
  }
}
