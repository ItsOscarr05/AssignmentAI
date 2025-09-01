import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { preferences } from '../services/api';

interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  isLoading: boolean;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

interface FontSizeProviderProps {
  children: ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  // Load font size from localStorage and backend on mount
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        // First try to load from localStorage for immediate response
        const savedFontSize = localStorage.getItem('app-font-size');
        if (savedFontSize) {
          const size = parseInt(savedFontSize);
          if (size >= 12 && size <= 28) {
            setFontSizeState(size);
            document.documentElement.style.setProperty('--app-font-size', `${size}px`);
          }
        }

        // Then load from backend to ensure consistency
        try {
          const userPreferences = await preferences.get();
          if (userPreferences.font_size) {
            const backendSize = parseInt(userPreferences.font_size);
            if (backendSize >= 12 && backendSize <= 28) {
              setFontSizeState(backendSize);
              document.documentElement.style.setProperty('--app-font-size', `${backendSize}px`);
              localStorage.setItem('app-font-size', backendSize.toString());
            }
          }
        } catch (error) {
          console.warn('Failed to load font size from backend:', error);
        }
      } catch (error) {
        console.error('Error loading font size:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFontSize();
  }, []);

  const setFontSize = async (size: number) => {
    if (size < 12 || size > 28) return;

    setFontSizeState(size);

    // Apply immediately to DOM
    document.documentElement.style.setProperty('--app-font-size', `${size}px`);

    // Save to localStorage for immediate persistence
    localStorage.setItem('app-font-size', size.toString());

    // Save to backend
    try {
      await preferences.update({
        font_size: size.toString(),
      });
    } catch (error) {
      console.error('Failed to save font size to backend:', error);
    }
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, isLoading }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};
