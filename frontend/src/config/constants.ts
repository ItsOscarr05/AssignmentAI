export const API_BASE_URL = 'http://localhost:3001/api';
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  MAIN: 'main',
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
  ADD: 'Add new',
  MENU: 'Menu',
} as const;
