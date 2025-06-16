import { http, HttpResponse } from 'msw';
import API_BASE_URL from '../../config/api';

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

  // Mock token usage endpoint for development/testing
  http.get(`${API_BASE_URL}/user/token-usage`, () => {
    return HttpResponse.json({
      plan: 'Free',
      total: 30000,
      used: 13589,
    });
  }),

  // Mock weekly activity endpoint for development/testing
  http.get(`${API_BASE_URL}/user/activity`, () => {
    return HttpResponse.json([
      { date: 'Mon', chats: 2, files: 1, links: 0, summarize: 0, extract: 0, rewrite: 0 },
      { date: 'Tue', chats: 1, files: 1, links: 0, summarize: 1, extract: 0, rewrite: 0 },
      { date: 'Wed', chats: 0, files: 1, links: 0, summarize: 0, extract: 1, rewrite: 0 },
      { date: 'Thu', chats: 0, files: 1, links: 1, summarize: 0, extract: 0, rewrite: 1 },
      { date: 'Fri', chats: 0, files: 1, links: 0, summarize: 0, extract: 0, rewrite: 1 },
      { date: 'Sat', chats: 0, files: 0, links: 0, summarize: 0, extract: 0, rewrite: 0 },
      { date: 'Sun', chats: 0, files: 0, links: 0, summarize: 0, extract: 0, rewrite: 0 },
    ]);
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
];
