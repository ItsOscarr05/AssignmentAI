import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useUserState = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUserState must be used within an AuthProvider');
  }
  return context;
};
