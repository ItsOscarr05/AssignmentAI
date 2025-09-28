// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const TOKEN_EXPIRY_KEY = 'token_expiry';

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

// Accessibility Roles
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

// ARIA Labels
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

// Assignment Status
export const ASSIGNMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
} as const;

// Grading Scale
export const GRADING_SCALE = {
  A: { min: 90, max: 100 },
  B: { min: 80, max: 89 },
  C: { min: 70, max: 79 },
  D: { min: 60, max: 69 },
  F: { min: 0, max: 59 },
} as const;

// File Types - Updated per PRD requirements
export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
  CODE: ['.py', '.js', '.java', '.cpp', '.c', '.html', '.css'],
  SPREADSHEETS: ['.csv', '.xls', '.xlsx'],
  DATA: ['.json', '.xml'],
} as const;

// MIME Types mapping per PRD requirements
export const MIME_TYPE_MAPPING = {
  // Document-based
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',

  // Image-based (OCR required)
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',

  // Code-based
  '.py': 'text/x-python',
  '.js': 'text/javascript',
  '.java': 'text/x-java-source',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.html': 'text/html',
  '.css': 'text/css',

  // Spreadsheet-based
  '.csv': 'text/csv',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Data formats
  '.json': 'application/json',
  '.xml': 'application/xml',
} as const;

// File Size Limits (in bytes) - Updated per PRD requirements (25MB max)
export const FILE_SIZE_LIMITS = {
  DOCUMENT: 25 * 1024 * 1024, // 25MB (PRD requirement)
  IMAGE: 25 * 1024 * 1024, // 25MB (PRD requirement)
  CODE: 25 * 1024 * 1024, // 25MB (PRD requirement)
  SPREADSHEET: 25 * 1024 * 1024, // 25MB (PRD requirement)
  MAX_SIZE: 25 * 1024 * 1024, // 25MB global limit per PRD
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM D, YYYY',
  TIME: 'h:mm A',
  DATETIME: 'MMMM D, YYYY h:mm A',
} as const;

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_ASSIGNMENTS: 'recent_assignments',
  USER_PREFERENCES: 'user_preferences',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ASSIGNMENT_CREATED: 'Assignment created successfully.',
  ASSIGNMENT_UPDATED: 'Assignment updated successfully.',
  ASSIGNMENT_DELETED: 'Assignment deleted successfully.',
  ASSIGNMENT_SUBMITTED: 'Assignment submitted successfully.',
  ASSIGNMENT_GRADED: 'Assignment graded successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 32,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    ALLOWED_CHARS: /^[a-zA-Z0-9_-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_ASSISTANCE: true,
  ENABLE_AUTO_GRADING: true,
  ENABLE_PLAGIARISM_CHECK: true,
  ENABLE_ANALYTICS: true,
} as const;
