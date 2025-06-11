import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import React from 'react';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #09f;
  animation: ${spin} 1s ease-in-out infinite;
`;

export const LoadingSpinner: React.FC = () => {
  return <SpinnerContainer />;
};

export default LoadingSpinner;
