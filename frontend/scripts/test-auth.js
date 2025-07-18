#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 *
 * This script runs the authentication tests and provides a summary
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Authentication Flow Tests...\n');

try {
  // Set environment variables for development mode
  process.env.NODE_ENV = 'development';
  process.env.VITEST_MODE = 'development';

  // Run the basic auth flow test first
  const basicTestCommand =
    'npx vitest run src/__tests__/components/AuthFlowBasic.test.tsx --reporter=verbose';

  console.log('Running basic tests first...');
  execSync(basicTestCommand, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITEST_MODE: 'development',
    },
  });

  console.log('\nBasic tests passed! Running full auth flow tests...\n');

  // Run the specific auth flow test
  const testCommand =
    'npx vitest run src/__tests__/components/AuthFlow.test.tsx --reporter=verbose';

  console.log('Running: ' + testCommand);
  console.log('Environment: NODE_ENV=' + process.env.NODE_ENV);
  console.log('='.repeat(50));

  execSync(testCommand, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITEST_MODE: 'development',
    },
  });

  console.log('\n✅ Authentication tests completed successfully!');
} catch (error) {
  console.error('\n❌ Authentication tests failed!');
  console.error('Error:', error.message);
  process.exit(1);
}
