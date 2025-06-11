import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Define handlers for your API endpoints
const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-token',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json(
      {
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  }),

  // Assignment endpoints
  http.get('/api/assignments', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: '2024-04-01',
        status: 'pending',
      },
    ]);
  }),

  http.post('/api/assignments', () => {
    return HttpResponse.json(
      {
        id: 1,
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: '2024-04-01',
        status: 'pending',
      },
      { status: 201 }
    );
  }),

  // Profile endpoints
  http.get('/api/profile', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      preferences: {
        theme: 'light',
        language: 'en',
      },
    });
  }),

  // AI endpoints
  http.post('/api/ai/analyze', () => {
    return HttpResponse.json({
      analysis: 'Test analysis',
      score: 85,
      feedback: 'Test feedback',
    });
  }),
];

// Create the MSW server
export const server = setupServer(...handlers);
