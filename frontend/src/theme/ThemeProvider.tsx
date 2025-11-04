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
  // Default to 'light' for new users
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode');
    // If no saved mode, default to light (new user)
    if (!savedMode) {
      localStorage.setItem('theme-mode', 'light');
      return 'light';
    }
    return (savedMode as ThemeMode) || 'light';
  });

  const [darkThemeColor, setDarkThemeColor] = useState<DarkThemeColor>(() => {
    const savedColor = localStorage.getItem('dark-theme-color');
    return (savedColor as DarkThemeColor) || 'navy';
  });

  // Sync theme with backend preferences when user is logged in
  useEffect(() => {
    const syncThemeWithBackend = async () => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      // Only try to fetch preferences if user is authenticated
      if (!user || !token) {
        // No user logged in, ensure light mode for new sessions
        if (!localStorage.getItem('theme-mode')) {
          setMode('light');
          localStorage.setItem('theme-mode', 'light');
        }
        return;
      }

      try {
        const { preferences: preferencesService } = await import('../services/api');
        const userPreferences = await preferencesService.get();

        if (userPreferences && userPreferences.theme) {
          // Backend preference takes precedence
          const backendTheme = userPreferences.theme === 'dark' ? 'dark' : 'light';
          setMode(backendTheme);
          localStorage.setItem('theme-mode', backendTheme);
        } else {
          // No preferences in backend yet (new user), ensure light mode
          if (!localStorage.getItem('theme-mode')) {
            setMode('light');
            localStorage.setItem('theme-mode', 'light');
          }
        }
      } catch (error: any) {
        // If preferences fetch fails (401, network error, etc.), don't retry
        // Just use localStorage theme or default to light
        if (!localStorage.getItem('theme-mode')) {
          setMode('light');
          localStorage.setItem('theme-mode', 'light');
        }
        // Don't log or retry - just silently use localStorage/default
      }
    };

    syncThemeWithBackend();
  }, []);

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
            ? '#141414'
            : darkThemeColor === 'darkGray'
            ? '#121212'
            : '#000000' // pitchBlack
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
