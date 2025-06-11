import { styled } from '@mui/material/styles';
import React, { useState } from 'react';

interface SkipLinkProps {
  text?: string;
  target?: string;
  color?: string;
  variant?: string;
  className?: string;
  style?: React.CSSProperties;
  focusClassName?: string;
  focusStyle?: React.CSSProperties;
  zIndex?: number;
  position?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLAnchorElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLAnchorElement>) => void;
}

const SkipLinkContainer = styled('a')<{ zIndex?: number; position?: string }>(
  ({ theme, zIndex, position }) => ({
    position: position || 'absolute',
    top: -40,
    left: 0,
    background: theme.palette.primary.main,
    color: 'white',
    padding: 8,
    zIndex: zIndex || 100,
    transition: 'top 0.2s',
    textDecoration: 'none',

    '&:focus': {
      top: 0,
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
    },
  })
);

const SkipLink: React.FC<SkipLinkProps> = ({
  text = 'Skip to main content',
  target = 'main-content',
  color,
  variant,
  className,
  style,
  focusClassName,
  focusStyle,
  onClick,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLAnchorElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Merge custom style with focus style when focused
  const mergedStyle = {
    ...style,
    ...(isFocused && focusStyle ? focusStyle : {}),
    ...(color && { color }),
    ...(variant === 'outlined' && { border: '1px solid currentColor' }),
  };

  // Merge classes, including focus class when focused
  const classes = [
    className,
    color && `text-${color}`,
    variant === 'outlined' && 'border',
    'focus:outline-none focus:ring-2',
    isFocused && focusClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <SkipLinkContainer
      href={`#${target}`}
      className={classes}
      style={mergedStyle}
      onClick={onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={text}
      tabIndex={0}
      {...props}
    >
      {text.includes('<') ? <span dangerouslySetInnerHTML={{ __html: text }} /> : text}
    </SkipLinkContainer>
  );
};

export default SkipLink;
