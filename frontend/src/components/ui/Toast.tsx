import React, { useCallback, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// Extend the default theme
declare module '@emotion/react' {
  export interface Theme {
    colors: {
      success: string;
      error: string;
      warning: string;
      info: string;
      background: string;
      text: string;
      textSecondary: string;
      primary: string;
      primaryDark: string;
    };
  }
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onClick?: () => void;
  showCloseButton?: boolean;
  showIcon?: boolean;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  closeButtonClassName?: string;
  closeButtonStyle?: React.CSSProperties;
  className?: string;
  style?: React.CSSProperties;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
  position = 'bottom-right',
  onClick,
  showCloseButton = true,
  showIcon = true,
  className,
  style,
  iconClassName,
  iconStyle,
  closeButtonClassName,
  closeButtonStyle,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const startTimer = useCallback(() => {
    if (duration && duration > 0) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }
  }, [duration, onClose]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isPaused) {
      startTimer();
    }
    return clearTimer;
  }, [isPaused, startTimer, clearTimer]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    clearTimer();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimer();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-success';
      case 'error':
        return 'bg-error';
      case 'warning':
        return 'bg-warning';
      default:
        return 'bg-info';
    }
  };

  const baseClasses =
    'fixed p-3 rounded shadow-lg z-50 flex items-center gap-2 text-white animate-slide-in';
  const positionClasses = getPositionClasses();
  const typeClasses = getTypeClasses();
  const combinedClasses = twMerge(baseClasses, positionClasses, typeClasses, className);

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={combinedClasses}
      style={style}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showIcon && (
        <span
          className={twMerge('text-xl', iconClassName)}
          style={iconStyle}
          data-testid="toast-icon"
        >
          {getIcon()}
        </span>
      )}
      <span className="text-sm">{message}</span>
      {showCloseButton && (
        <button
          type="button"
          aria-label="Close toast"
          className={twMerge(
            'ml-2 p-1 opacity-80 hover:opacity-100 transition-opacity',
            closeButtonClassName
          )}
          style={closeButtonStyle}
          onClick={onClose}
          tabIndex={0}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Toast;
