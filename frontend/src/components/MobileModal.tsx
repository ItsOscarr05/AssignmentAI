import { useGesture } from "@use-gesture/react";
import React, { useEffect, useRef } from "react";
import { useBreakpoints } from "../hooks/useMediaQuery";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useBreakpoints();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Gesture support for swipe to close
  const bind = useGesture({
    onDrag: ({ movement: [_, my], direction: [_, dy], velocity: [_, vy] }) => {
      if (my > 50 && dy > 0 && vy > 0.5) {
        onClose();
      }
    },
    onTouchStart: () => {
      if (modalRef.current) {
        modalRef.current.style.transition = "none";
      }
    },
    onTouchEnd: () => {
      if (modalRef.current) {
        modalRef.current.style.transition = "transform 0.3s ease-out";
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div
        ref={modalRef}
        className="modal-content"
        {...bind()}
        style={{
          transform: `translateY(${bind().movement?.[1] || 0}px)`,
        }}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
