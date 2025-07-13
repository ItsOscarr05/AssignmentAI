import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div data-testid="loading-spinner" className="flex h-screen items-center justify-center">
      <div className="relative">
        {/* Background circle */}
        <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
        {/* Animated circle */}
        <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
