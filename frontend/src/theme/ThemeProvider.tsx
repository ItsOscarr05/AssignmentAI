import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { createDarkTheme, lightTheme } from '../theme';

type ThemeMode = 'light' | 'dark';
type DarkThemeColor = 'navy' | 'charcoal' | 'slate' | 'graphite';

interface ThemeContextType {
  mode: ThemeMode;
  darkThemeColor: DarkThemeColor;
  toggleTheme: () => void;
  setDarkThemeColor: (color: DarkThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [darkThemeColor, setDarkThemeColor] = useState<DarkThemeColor>('navy');

  const toggleTheme = useCallback(() => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const setDarkColor = useCallback((color: DarkThemeColor) => {
    setDarkThemeColor(color);
  }, []);

  const theme =
    mode === 'light'
      ? lightTheme
      : createDarkTheme(
          darkThemeColor === 'navy'
            ? '#000814'
            : darkThemeColor === 'charcoal'
            ? '#1a1a1a'
            : darkThemeColor === 'slate'
            ? '#2d3748'
            : '#4a5568' // graphite
        );

  return (
    <ThemeContext.Provider
      value={{ mode, darkThemeColor, toggleTheme, setDarkThemeColor: setDarkColor }}
    >
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
