vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';

let api, AuthService;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  api = (await import('../../services/api')).api;
  AuthService = (await import('../../services/auth/AuthService')).AuthService;
});

describe('AuthService', () => {
  it('should call login endpoint with credentials', async () => {
    const mockResponse = {
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'student',
        },
        token: 'mock-token',
      },
    };
    api.post.mockResolvedValue(mockResponse);

    const result = await AuthService.login('test@example.com', 'password');
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('should call register endpoint with user data', async () => {
    const mockResponse = {
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'student',
        },
        token: 'mock-token',
      },
    };
    api.post.mockResolvedValue(mockResponse);

    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password',
    };

    const result = await AuthService.register(userData);
    expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
    expect(result).toEqual(mockResponse.data);
  });

  it('should call logout endpoint', async () => {
    await AuthService.logout();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('should fetch current user data', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'student',
    };
    api.get.mockResolvedValue({ data: mockUser });

    const result = await AuthService.getCurrentUser();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockUser);
  });
});
