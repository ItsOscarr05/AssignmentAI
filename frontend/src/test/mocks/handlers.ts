import { http, HttpResponse } from 'msw';
import API_BASE_URL from '../../config/api';
import { mockSubmissions } from './data';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
    });
  }),

  http.post(`${API_BASE_URL}/auth/register`, () => {
    return new HttpResponse(null, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      access_token: 'new-mock-token',
      token_type: 'bearer',
      expires_in: 3600,
    });
  }),

  http.post(`${API_BASE_URL}/auth/verify-email`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/user/profile`, () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
    });
  }),

  http.put(`${API_BASE_URL}/user/profile`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.put(`${API_BASE_URL}/user/preferences`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/user/sessions`, () => {
    return HttpResponse.json([
      {
        id: 1,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        last_activity: new Date().toISOString(),
      },
    ]);
  }),

  http.delete(`${API_BASE_URL}/user/sessions/:id`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // Assignment endpoints
  http.get(`${API_BASE_URL}/assignments`, () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Test Assignment',
        description: 'Test Description',
        due_date: new Date().toISOString(),
        status: 'active',
      },
    ]);
  }),

  http.get(`${API_BASE_URL}/assignments/:id`, () => {
    return HttpResponse.json({
      id: 1,
      title: 'Test Assignment',
      description: 'Test Description',
      due_date: new Date().toISOString(),
      status: 'active',
    });
  }),

  http.post(`${API_BASE_URL}/assignments`, () => {
    return HttpResponse.json({
      id: 1,
      title: 'New Assignment',
      description: 'New Description',
      due_date: new Date().toISOString(),
      status: 'active',
    });
  }),

  http.put(`${API_BASE_URL}/assignments/:id`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${API_BASE_URL}/assignments/:id`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // Submission endpoints
  http.get(`${API_BASE_URL}/submissions`, () => {
    return HttpResponse.json(mockSubmissions);
  }),

  http.get(`${API_BASE_URL}/submissions/:id`, () => {
    return HttpResponse.json(mockSubmissions[0]);
  }),

  http.post(`${API_BASE_URL}/submissions`, () => {
    return HttpResponse.json(mockSubmissions[0]);
  }),

  http.put(`${API_BASE_URL}/submissions/:id`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // Feedback endpoints
  http.get(`${API_BASE_URL}/feedback/:id`, () => {
    return HttpResponse.json({
      id: 1,
      submission_id: 1,
      content: 'Test feedback',
      created_at: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/feedback`, () => {
    return HttpResponse.json({
      id: 1,
      submission_id: 1,
      content: 'New feedback',
      created_at: new Date().toISOString(),
    });
  }),

  // Rubric endpoints
  http.get(`${API_BASE_URL}/rubrics`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Rubric',
        criteria: [
          {
            id: 1,
            name: 'Test Criterion',
            weight: 1,
            description: 'Test Description',
          },
        ],
      },
    ]);
  }),

  http.get(`${API_BASE_URL}/rubrics/:id`, () => {
    return HttpResponse.json({
      id: 1,
      name: 'Test Rubric',
      criteria: [
        {
          id: 1,
          name: 'Test Criterion',
          weight: 1,
          description: 'Test Description',
        },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/rubrics`, () => {
    return HttpResponse.json({
      id: 1,
      name: 'New Rubric',
      criteria: [
        {
          id: 1,
          name: 'New Criterion',
          weight: 1,
          description: 'New Description',
        },
      ],
    });
  }),

  http.put(`${API_BASE_URL}/rubrics/:id`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${API_BASE_URL}/rubrics/:id`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
