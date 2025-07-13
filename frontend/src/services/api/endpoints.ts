// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  OAUTH_CALLBACK: '/auth/oauth/callback',
} as const;

// User endpoints
export const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
  ENABLE_2FA: '/users/enable-2fa',
  DISABLE_2FA: '/users/disable-2fa',
  VERIFY_2FA: '/users/verify-2fa',
} as const;

// Assignment endpoints
export const ASSIGNMENT_ENDPOINTS = {
  LIST: '/assignments',
  CREATE: '/assignments',
  DETAIL: (id: string) => `/assignments/${id}`,
  UPDATE: (id: string) => `/assignments/${id}`,
  DELETE: (id: string) => `/assignments/${id}`,
  SUBMIT: (id: string) => `/assignments/${id}/submit`,
} as const;

// Submission endpoints
export const SUBMISSION_ENDPOINTS = {
  LIST: '/submissions',
  CREATE: '/submissions',
  DETAIL: (id: string) => `/submissions/${id}`,
  UPDATE: (id: string) => `/submissions/${id}`,
  DELETE: (id: string) => `/submissions/${id}`,
  FEEDBACK: (id: string) => `/submissions/${id}/feedback`,
} as const;

// Analytics endpoints
export const ANALYTICS_ENDPOINTS = {
  USAGE: '/analytics/usage',
  PERFORMANCE: '/analytics/performance',
  FEEDBACK: '/analytics/feedback',
} as const;
