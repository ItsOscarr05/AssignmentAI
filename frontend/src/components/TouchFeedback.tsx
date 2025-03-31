import { useGesture } from "@use-gesture/react";
import React, { useEffect, useRef, useState } from "react";
import { useBreakpoints } from "../hooks/useMediaQuery";

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  feedbackColor?: string;
  feedbackOpacity?: number;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  className = "",
  feedbackColor = "rgba(0, 0, 0, 0.1)",
  feedbackOpacity = 0.5,
  disabled = false,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
}) => {
  const { isMobile } = useBreakpoints();
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  const bind = useGesture({
    onPointerDown: () => {
      if (disabled) return;
      setIsPressed(true);
      onPressIn?.();

      // Set up long press detection
      longPressTimeout.current = setTimeout(() => {
        setIsLongPressed(true);
        onLongPress?.();
      }, 500);
    },
    onPointerUp: () => {
      if (disabled) return;
      setIsPressed(false);
      setIsLongPressed(false);
      onPressOut?.();

      // Clear long press timeout
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = undefined;
      }

      // If not long pressed, trigger normal press
      if (!isLongPressed) {
        onPress?.();
      }
    },
    onPointerCancel: () => {
      if (disabled) return;
      setIsPressed(false);
      setIsLongPressed(false);
      onPressOut?.();

      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = undefined;
      }
    },
    onPointerMove: ({ movement: [mx, my] }) => {
      // Cancel long press if moved too far
      if (Math.abs(mx) > 10 || Math.abs(my) > 10) {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = undefined;
        }
      }
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
    };
  }, []);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`touch-feedback ${className} ${disabled ? "disabled" : ""}`}
      {...bind()}
      style={{
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
      {(isPressed || isLongPressed) && !disabled && (
        <div
          className="feedback-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: feedbackColor,
            opacity: feedbackOpacity,
            borderRadius: "inherit",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
