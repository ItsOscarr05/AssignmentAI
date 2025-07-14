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

const SkipLink: React.FC<SkipLinkProps> = ({
  text = 'Skip to main content',
  target = 'main-content',
  color,
  variant,
  className,
  style,
  focusClassName,
  focusStyle,
  zIndex = 100,
  position = 'absolute',
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
  const mergedStyle: React.CSSProperties = {
    background: 'var(--color-primary, #1976d2)',
    color: 'white',
    ...style,
    ...(isFocused && focusStyle ? focusStyle : {}),
    ...(color && { color }),
    ...(variant === 'outlined' && { border: '1px solid currentColor' }),
    position: position as React.CSSProperties['position'],
    top: isFocused ? 0 : -40,
    left: 0,
    padding: 8,
    zIndex,
    transition: 'top 0.2s',
    textDecoration: 'none',
    outline: isFocused ? 'none' : undefined,
    boxShadow: isFocused ? '0 0 0 2px var(--color-primary, #1976d2)' : undefined,
    ...((isFocused && focusStyle) || {}),
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
    <a
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
    </a>
  );
};

export default SkipLink;
