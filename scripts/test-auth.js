#!/usr/bin/env node

/**
 * Authentication System Test Script
 *
 * This script tests the authentication endpoints to ensure they're working correctly
 * before production deployment.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api/v1`;

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

let authToken = null;

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, headers = {}, useRootUrl = false) {
  try {
    const baseUrl = useRootUrl ? API_BASE_URL : API_URL;
    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  // Health endpoint is at root level, not under /api/v1
  const result = await makeRequest('GET', '/health', null, {}, true);

  if (result.success) {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed:', result.error);
    return false;
  }
}

async function testRegistration() {
  console.log('🔍 Testing user registration...');
  const result = await makeRequest('POST', '/auth/register', {
    email: testUser.email,
    password: testUser.password,
    name: `${testUser.firstName} ${testUser.lastName}`,
  });

  if (result.success) {
    console.log('✅ Registration successful');
    return true;
  } else {
    console.log('❌ Registration failed:', result.error);
    return false;
  }
}

async function testLogin() {
  console.log('🔍 Testing user login...');
  const result = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password,
  });

  if (result.success && result.data.access_token) {
    console.log('✅ Login successful');
    authToken = result.data.access_token;
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function testGetCurrentUser() {
  console.log('🔍 Testing get current user...');
  const result = await makeRequest('GET', '/auth/me', null, {
    Authorization: `Bearer ${authToken}`,
  });

  if (result.success) {
    console.log('✅ Get current user successful');
    return true;
  } else {
    console.log('❌ Get current user failed:', result.error);
    return false;
  }
}

async function testForgotPassword() {
  console.log('🔍 Testing forgot password...');
  const result = await makeRequest('POST', '/auth/forgot-password', {
    email: testUser.email,
  });

  if (result.success) {
    console.log('✅ Forgot password successful');
    return true;
  } else {
    console.log('❌ Forgot password failed:', result.error);
    return false;
  }
}

async function testLogout() {
  console.log('🔍 Testing logout...');
  const result = await makeRequest('POST', '/auth/logout', null, {
    Authorization: `Bearer ${authToken}`,
  });

  if (result.success) {
    console.log('✅ Logout successful');
    return true;
  } else {
    console.log('❌ Logout failed:', result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Authentication System Tests\n');
  console.log(`📡 Testing API at: ${API_URL}\n`);

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Registration', fn: testRegistration },
    { name: 'Login', fn: testLogin },
    { name: 'Get Current User', fn: testGetCurrentUser },
    { name: 'Forgot Password', fn: testForgotPassword },
    { name: 'Logout', fn: testLogout },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const success = await test.fn();
    if (success) passedTests++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All authentication tests passed! System is ready for production.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues before deploying to production.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testRegistration,
  testLogin,
  testGetCurrentUser,
  testForgotPassword,
  testLogout,
};
