import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import React from 'react';

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
  width: ${({ width }) => width || '100%'};
  height: ${({ height }) => height || '20px'};
  border-radius: ${({ borderRadius }) => borderRadius || '4px'};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
  background-size: 1000px 100%;
  animation: ${shimmer} 1.4s infinite;
`;

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  animation?: string;
  animationClassName?: string;
  animationStyle?: React.CSSProperties;
  tabIndex?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className,
  style,
  color,
  animation,
  animationClassName,
  animationStyle,
  tabIndex = 0,
  ...props
}) => {
  const mergedClassName = [
    className,
    color ? `bg-${color}` : '',
    animation ? `animate-${animation}` : '',
    animationClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={mergedClassName}
      style={{ ...style, ...animationStyle }}
      role="status"
      aria-label="Loading"
      tabIndex={tabIndex}
      {...props}
    />
  );
};

export default Skeleton;
