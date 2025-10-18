import React, { createContext, ReactNode, useContext, useEffect } from 'react';

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
  // Fixed font size at 20px
  const fontSize = 20;
  const isLoading = false;

  // Set the CSS variable on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', '20px');
  }, []);

  // No-op function for compatibility
  const setFontSize = (size: number) => {
    // Font size is now fixed at 20px, so this does nothing
    console.log('Font size is fixed at 20px');
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
