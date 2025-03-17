import { forwardRef } from 'react';
import { textField } from './TextField.css';
import { motion } from 'framer-motion';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size = 'md',
      leftElement,
      rightElement,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
    const state = error ? 'error' : success ? 'success' : undefined;

    return (
      <div className={textField.container}>
        {label && (
          <label htmlFor={inputId} className={textField.label}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {leftElement && (
            <div
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              {leftElement}
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            className={textField.input({ size, state })}
            style={{
              paddingLeft: leftElement ? '2.5rem' : undefined,
              paddingRight: rightElement ? '2.5rem' : undefined,
            }}
            aria-invalid={error}
            aria-describedby={helperText ? `${inputId}-helper-text` : undefined}
            {...props}
          />
          {rightElement && (
            <div
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              {rightElement}
            </div>
          )}
        </div>
        {helperText && (
          <p
            id={`${inputId}-helper-text`}
            className={textField.helperText}
            style={{ color: error ? 'var(--colors-error)' : undefined }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField'; 