import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'Test123!',
  });
  check(loginRes, {
    'login status is 200': r => r.status === 200,
    'login successful': r => r.json('token') !== undefined,
  }) || errorRate.add(1);

  const token = loginRes.json('token');

  // Test assignment creation
  const assignmentRes = http.post(
    `${BASE_URL}/api/assignments`,
    {
      title: 'Load Test Assignment',
      description: 'This is a load test assignment',
      dueDate: '2024-12-31',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  check(assignmentRes, {
    'assignment creation status is 200': r => r.status === 200,
  }) || errorRate.add(1);

  // Test file upload
  const fileRes = http.post(
    `${BASE_URL}/api/files/upload`,
    {
      file: http.file('test-file.txt', 'Hello World!'),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  check(fileRes, {
    'file upload status is 200': r => r.status === 200,
  }) || errorRate.add(1);

  // Test analytics
  const analyticsRes = http.get(`${BASE_URL}/api/analytics/performance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  check(analyticsRes, {
    'analytics status is 200': r => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
