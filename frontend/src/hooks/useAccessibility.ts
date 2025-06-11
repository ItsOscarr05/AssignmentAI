import { useEffect, useRef } from 'react';

interface UseAccessibilityOptions {
  trapFocus?: boolean;
  onEscape?: () => void;
  initialFocus?: boolean;
}

export function useAccessibility({
  trapFocus = false,
  onEscape,
  initialFocus = false,
}: UseAccessibilityOptions = {}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Handle initial focus
    if (initialFocus) {
      element.focus();
    }

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (!trapFocus) return;

      // Trap focus within the element
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [trapFocus, onEscape, initialFocus]);

  return ref;
}
