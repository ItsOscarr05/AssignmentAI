import styled, { keyframes } from "@emotion/styled";
import React from "react";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonBase = styled.div<{
  width?: string;
  height?: string;
  borderRadius?: string;
}>`
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "20px"};
  border-radius: ${({ borderRadius }) => borderRadius || "4px"};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.background} 25%,
    ${({ theme }) => theme.colors.backgroundHover} 37%,
    ${({ theme }) => theme.colors.background} 63%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 1.4s infinite;
`;

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className,
}) => {
  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={className}
    />
  );
};

export default Skeleton;
