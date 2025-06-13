// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Feature Flags
export const FEATURES = {
  ENABLE_2FA: true,
  ENABLE_BIOMETRIC: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
};

// AI Model Configuration
export const AI_MODELS = {
  FREE: {
    model: 'gpt-4-0125-preview',
    tokenLimit: 30000,
    label: 'GPT-4.1 Nano',
  },
  PLUS: {
    model: 'gpt-3.5-turbo-0125',
    tokenLimit: 50000,
    label: 'GPT-3.5 Turbo',
  },
  PRO: {
    model: 'gpt-4-turbo-preview',
    tokenLimit: 75000,
    label: 'GPT-4 Turbo',
  },
  MAX: {
    model: 'gpt-4',
    tokenLimit: 100000,
    label: 'GPT-4',
  },
};

// Default Settings
export const DEFAULT_SETTINGS = {
  darkMode: false,
  language: 'en',
  fontSize: 14,
  animations: true,
  compactMode: false,
  soundEffects: true,
  volume: 70,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  timeZone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  autoTranslate: false,
  showOriginalText: true,
  useMetricSystem: false,
  use24HourFormat: false,
  hapticFeedback: true,
  notificationSounds: true,
  typingSounds: false,
  completionSounds: true,
  aiModel: AI_MODELS.FREE.model,
  maxTokens: 1000,
  temperature: 0.7,
  contextLength: 10,
  autoComplete: true,
  codeSnippets: true,
  aiSuggestions: true,
  realTimeAnalysis: true,
  notifications: {
    email: true,
    desktop: true,
    sound: true,
    assignments: true,
    deadlines: true,
    feedback: true,
    updates: true,
  },
  twoFactorAuth: false,
  biometricLogin: false,
  dataCollection: true,
  shareAnalytics: true,
  showOnlineStatus: true,
  allowTracking: false,
  autoLock: true,
  lockTimeout: 5,
  passwordExpiry: 90,
  sessionTimeout: 30,
};

// Model Comparison Data
export const MODEL_COMPARISON = [
  {
    model: 'GPT-4',
    speed: 'Medium',
    accuracy: 'Very High',
    cost: 'High',
    bestFor: ['Complex Analysis', 'Creative Writing', 'Code Generation'],
  },
  {
    model: 'GPT-3.5 Turbo',
    speed: 'Fast',
    accuracy: 'High',
    cost: 'Medium',
    bestFor: ['Quick Responses', 'Basic Analysis', 'Simple Tasks'],
  },
  {
    model: 'Claude 3',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'High',
    bestFor: ['Research', 'Analysis', 'Long-form Content'],
  },
];
