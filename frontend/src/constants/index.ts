// API Endpoints
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

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

// File Types
export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt'],
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif'],
  CODE: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c'],
} as const;

// File Size Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  DOCUMENT: 5 * 1024 * 1024, // 5MB
  IMAGE: 2 * 1024 * 1024, // 2MB
  CODE: 1 * 1024 * 1024, // 1MB
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
