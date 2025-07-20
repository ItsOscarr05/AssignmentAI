import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Set test environment to development
process.env.NODE_ENV = 'development';

// Ensure React is in development mode for tests
process.env.REACT_APP_NODE_ENV = 'development';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});
