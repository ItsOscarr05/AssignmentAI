import { forwardRef } from 'react';
import { button } from './Button.css';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const buttonClass = button({
      variant,
      size,
      loading,
      fullWidth,
    });

    return (
      <motion.button
        ref={ref}
        className={buttonClass}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
        disabled={loading || props.disabled}
        {...props}
      >
        {leftIcon && !loading && <span className="icon-left">{leftIcon}</span>}
        {loading ? <span className="sr-only">Loading...</span> : children}
        {rightIcon && !loading && <span className="icon-right">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button'; 