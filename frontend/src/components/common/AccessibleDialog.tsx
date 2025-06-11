import { Dialog, DialogProps } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { announceToScreenReader, ROLES } from '../../utils/accessibility';

interface AccessibleDialogProps extends DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
}

const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  children,
  title,
  description,
  onClose,
  open,
  ...props
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && dialogRef.current) {
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Tab') {
          const focusableElements = dialogRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements?.length) return;

          const firstFocusableElement = focusableElements[0] as HTMLElement;
          const lastFocusableElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              event.preventDefault();
              lastFocusableElement.focus();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              event.preventDefault();
              firstFocusableElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      announceToScreenReader(`${title} dialog opened`);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, title]);

  return (
    <Dialog
      ref={dialogRef}
      role={ROLES.DIALOG}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      onClose={onClose}
      open={open}
      {...props}
    >
      <h2 id="dialog-title" style={{ margin: 0 }}>
        {title}
      </h2>
      {description && (
        <p id="dialog-description" style={{ margin: '8px 0 0' }}>
          {description}
        </p>
      )}
      {children}
    </Dialog>
  );
};

export default AccessibleDialog;
