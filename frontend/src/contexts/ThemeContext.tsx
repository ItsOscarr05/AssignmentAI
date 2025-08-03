import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeContextType } from '../types';

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  darkThemeColor: 'navy',
  toggleTheme: () => {},
  setDarkThemeColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [darkThemeColor, setDarkThemeColor] = useState<'navy' | 'charcoal' | 'slate' | 'graphite'>(
    'navy'
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedDarkColor = localStorage.getItem('darkThemeColor') as
      | 'navy'
      | 'charcoal'
      | 'slate'
      | 'graphite';
    if (savedDarkColor) {
      setDarkThemeColor(savedDarkColor);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSetDarkThemeColor = (color: 'navy' | 'charcoal' | 'slate' | 'graphite') => {
    setDarkThemeColor(color);
    localStorage.setItem('darkThemeColor', color);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, darkThemeColor, toggleTheme, setDarkThemeColor: handleSetDarkThemeColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
