#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api/v1`;

async function testLogin() {
  console.log('🔍 Testing login endpoint...');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!',
    });

    console.log('✅ Login successful:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Error:', error.message);
    return false;
  }
}

async function testHealth() {
  console.log('🔍 Testing health endpoint...');

  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Login Test\n');

  await testHealth();
  console.log('');
  await testLogin();
}

runTests().catch(console.error);
