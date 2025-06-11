import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AIContextType {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  generatedText: string;
  setGeneratedText: (text: string) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedText, setGeneratedText] = useState('');

  return (
    <AIContext.Provider value={{ isProcessing, setIsProcessing, generatedText, setGeneratedText }}>
      {children}
    </AIContext.Provider>
  );
};
