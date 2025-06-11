import { CircularProgress } from '@mui/material';
import React from 'react';

interface LoadingSpinnerProps {
  size?: string | number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size }) => {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <CircularProgress size={size} />
    </div>
  );
};

export default LoadingSpinner;
