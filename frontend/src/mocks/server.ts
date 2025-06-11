import type { DefaultBodyType, PathParams } from 'msw';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  // Auth endpoints
  http.post<PathParams, DefaultBodyType>('/api/auth/login', async () => {
    return HttpResponse.json({
      token: 'mock-token',
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    });
  }),

  // Assignment endpoints
  http.get<PathParams, DefaultBodyType>('/api/assignments', async () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        dueDate: '2024-03-01',
        status: 'pending',
      },
    ]);
  }),

  // Analytics endpoints
  http.get<PathParams, DefaultBodyType>('/api/analytics/performance', async () => {
    return HttpResponse.json({
      overallScore: 85,
      completionRate: 90,
      subjectPerformance: [
        { subject: 'Math', score: 90 },
        { subject: 'Science', score: 85 },
      ],
      weeklyProgress: [
        { week: 'Week 1', progress: 80 },
        { week: 'Week 2', progress: 85 },
      ],
    });
  }),

  // Settings endpoints
  http.get<PathParams, DefaultBodyType>('/api/settings', async () => {
    return HttpResponse.json({
      notifications: {
        email: true,
        push: true,
        assignments: true,
        grades: true,
      },
      appearance: {
        theme: 'light',
        fontSize: 'medium',
        density: 'comfortable',
      },
      language: {
        language: 'en',
        timezone: 'UTC',
      },
      privacy: {
        profileVisibility: 'public',
        activityStatus: true,
      },
    });
  })
);
