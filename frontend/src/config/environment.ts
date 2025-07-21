// Environment Configuration
// This file makes it easy to switch between development and production modes

export interface EnvironmentConfig {
  mode: 'development' | 'production' | 'test';
  apiBaseUrl: string;
  enableDebugLogs: boolean;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  testTimeout: number;
  mockData: boolean;
}

// Development Configuration
const developmentConfig: EnvironmentConfig = {
  mode: 'development',
  apiBaseUrl: 'http://localhost:8000/api',
  enableDebugLogs: true,
  enableAnalytics: false,
  enableErrorReporting: false,
  testTimeout: 10000,
  mockData: true,
};

// Production Configuration
const productionConfig: EnvironmentConfig = {
  mode: 'production',
  apiBaseUrl: 'https://api.assignmentai.com/api',
  enableDebugLogs: false,
  enableAnalytics: true,
  enableErrorReporting: true,
  testTimeout: 5000,
  mockData: false,
};

// Test Configuration
const testConfig: EnvironmentConfig = {
  mode: 'test',
  apiBaseUrl: 'http://localhost:8000/api',
  enableDebugLogs: true,
  enableAnalytics: false,
  enableErrorReporting: false,
  testTimeout: 10000,
  mockData: true,
};

// Easy mode switching - just change this line!
const CURRENT_MODE: EnvironmentConfig['mode'] = 'development';

// Export the current configuration
export const config: EnvironmentConfig = (() => {
  if (CURRENT_MODE === 'development') {
    return developmentConfig;
  } else if (CURRENT_MODE === 'production') {
    return productionConfig;
  } else if (CURRENT_MODE === 'test') {
    return testConfig;
  }
  return developmentConfig;
})();

// Helper functions
export const isDevelopment = () => config.mode === 'development';
export const isProduction = () => config.mode === 'production';
export const isTest = () => config.mode === 'test';

// Environment variables
export const env = {
  NODE_ENV: config.mode,
  VITE_API_BASE_URL: config.apiBaseUrl,
  VITE_ENABLE_DEBUG: config.enableDebugLogs.toString(),
  VITE_ENABLE_ANALYTICS: config.enableAnalytics.toString(),
  VITE_ENABLE_ERROR_REPORTING: config.enableErrorReporting.toString(),
  VITE_TEST_TIMEOUT: config.testTimeout.toString(),
  VITE_MOCK_DATA: config.mockData.toString(),
};

// Console helper for easy debugging
export const debug = {
  log: (...args: any[]) => {
    if (config.enableDebugLogs) {
      console.log(`[${config.mode.toUpperCase()}]`, ...args);
    }
  },
  warn: (...args: any[]) => {
    if (config.enableDebugLogs) {
      console.warn(`[${config.mode.toUpperCase()}]`, ...args);
    }
  },
  error: (...args: any[]) => {
    if (config.enableDebugLogs) {
      console.error(`[${config.mode.toUpperCase()}]`, ...args);
    }
  },
};

export default config;
