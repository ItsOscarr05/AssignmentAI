import { KeyboardEvent } from 'react';

export const ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
} as const;

export const ARIA_LABELS = {
  CLOSE: 'Close',
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  EDIT: 'Edit',
  SAVE: 'Save',
} as const;

export const handleKeyPress = (event: React.KeyboardEvent, callback: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  return (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
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
};

export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const ariaLive = document.createElement('div');
  ariaLive.setAttribute('aria-live', priority);
  ariaLive.setAttribute('aria-atomic', 'true');
  ariaLive.style.position = 'absolute';
  ariaLive.style.width = '1px';
  ariaLive.style.height = '1px';
  ariaLive.style.padding = '0';
  ariaLive.style.margin = '-1px';
  ariaLive.style.overflow = 'hidden';
  ariaLive.style.clip = 'rect(0, 0, 0, 0)';
  ariaLive.style.whiteSpace = 'nowrap';
  ariaLive.style.border = '0';

  document.body.appendChild(ariaLive);
  ariaLive.textContent = message;

  setTimeout(() => {
    document.body.removeChild(ariaLive);
  }, 1000);
};

export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

export const handleKeyboardNavigation = (
  event: KeyboardEvent<HTMLElement>,
  options: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }
) => {
  switch (event.key) {
    case KEYBOARD_KEYS.ENTER:
      options.onEnter?.();
      break;
    case KEYBOARD_KEYS.ESCAPE:
      options.onEscape?.();
      break;
    case KEYBOARD_KEYS.ARROW_UP:
      options.onArrowUp?.();
      break;
    case KEYBOARD_KEYS.ARROW_DOWN:
      options.onArrowDown?.();
      break;
    case KEYBOARD_KEYS.ARROW_LEFT:
      options.onArrowLeft?.();
      break;
    case KEYBOARD_KEYS.ARROW_RIGHT:
      options.onArrowRight?.();
      break;
    case KEYBOARD_KEYS.HOME:
      options.onHome?.();
      break;
    case KEYBOARD_KEYS.END:
      options.onEnd?.();
      break;
  }
};

export const getAriaLiveRegion = (priority: 'polite' | 'assertive' = 'polite') => ({
  'aria-live': priority,
  'aria-atomic': 'true',
});

export const getAriaLabel = (label: string, description?: string) => ({
  'aria-label': label,
  ...(description && { 'aria-describedby': description }),
});

export const getAriaExpanded = (expanded: boolean) => ({
  'aria-expanded': expanded,
});

export const getAriaHidden = (hidden: boolean) => ({
  'aria-hidden': hidden,
});

export const getAriaControls = (controlsId: string) => ({
  'aria-controls': controlsId,
});

export const getAriaCurrent = (
  current: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
) => ({
  'aria-current': current,
});

export const getAriaDisabled = (disabled: boolean) => ({
  'aria-disabled': disabled,
});

export const getAriaInvalid = (invalid: boolean) => ({
  'aria-invalid': invalid,
});

export const getAriaRequired = (required: boolean) => ({
  'aria-required': required,
});

export const getAriaSelected = (selected: boolean) => ({
  'aria-selected': selected,
});

export const getAriaChecked = (checked: boolean | 'mixed') => ({
  'aria-checked': checked,
});

export const getAriaPressed = (pressed: boolean | 'mixed') => ({
  'aria-pressed': pressed,
});

export const getAriaHasPopup = (
  hasPopup: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
) => ({
  'aria-haspopup': hasPopup,
});

export const getAriaOrientation = (orientation: 'horizontal' | 'vertical') => ({
  'aria-orientation': orientation,
});

export const getAriaSort = (sort: 'none' | 'ascending' | 'descending' | 'other') => ({
  'aria-sort': sort,
});

export const getAriaValue = (value: {
  min?: number;
  max?: number;
  now?: number;
  text?: string;
}) => ({
  ...(value.min !== undefined && { 'aria-valuemin': value.min }),
  ...(value.max !== undefined && { 'aria-valuemax': value.max }),
  ...(value.now !== undefined && { 'aria-valuenow': value.now }),
  ...(value.text && { 'aria-valuetext': value.text }),
});
