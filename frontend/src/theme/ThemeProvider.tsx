import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createDarkTheme, lightTheme } from '../theme';

type ThemeMode = 'light' | 'dark';
type DarkThemeColor = 'navy' | 'charcoal' | 'darkGray' | 'pitchBlack';

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
  // Load theme preferences from localStorage on component mount
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode');
    return (savedMode as ThemeMode) || 'light';
  });

  const [darkThemeColor, setDarkThemeColor] = useState<DarkThemeColor>(() => {
    const savedColor = localStorage.getItem('dark-theme-color');
    return (savedColor as DarkThemeColor) || 'navy';
  });

  // Save theme mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Save dark theme color to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dark-theme-color', darkThemeColor);
  }, [darkThemeColor]);

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
            : darkThemeColor === 'darkGray'
            ? '#282828'
            : '#141414' // pitchBlack
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
