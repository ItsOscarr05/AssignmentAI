import styled, { keyframes } from "@emotion/styled";
import React from "react";

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div<{ size?: string; color?: string }>`
  display: inline-block;
  width: ${({ size }) => size || "24px"};
  height: ${({ size }) => size || "24px"};
  border: 3px solid
    ${({ theme, color }) => color || theme.colors.backgroundHover};
  border-radius: 50%;
  border-top-color: ${({ theme, color }) => color || theme.colors.primary};
  animation: ${spin} 1s linear infinite;
`;

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  color,
  className,
}) => {
  return <SpinnerContainer size={size} color={color} className={className} />;
};

export default LoadingSpinner;
