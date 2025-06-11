import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // Test login endpoint
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'test@example.com',
    password: 'password123',
  });
  check(loginRes, {
    'login status is 200': r => r.status === 200,
    'login response time < 500ms': r => r.timings.duration < 500,
  });

  // Test assignments endpoint
  const assignmentsRes = http.get(`${BASE_URL}/assignments`);
  check(assignmentsRes, {
    'assignments status is 200': r => r.status === 200,
    'assignments response time < 500ms': r => r.timings.duration < 500,
  });

  // Test create assignment endpoint
  const createAssignmentRes = http.post(`${BASE_URL}/assignments`, {
    title: 'Test Assignment',
    description: 'Test Description',
    dueDate: '2024-12-31',
  });
  check(createAssignmentRes, {
    'create assignment status is 201': r => r.status === 201,
    'create assignment response time < 500ms': r => r.timings.duration < 500,
  });

  sleep(1);
}
