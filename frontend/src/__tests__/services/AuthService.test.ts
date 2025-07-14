vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let api: AxiosInstance;
let AuthService: any;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  const apiModule = await import('../../services/api');
  const authModule = await import('../../services/auth/AuthService');
  api = apiModule.api;
  AuthService = authModule.AuthService;
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
    (api.post as any).mockResolvedValue(mockResponse);

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
    (api.post as any).mockResolvedValue(mockResponse);

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
    (api.get as any).mockResolvedValue({ data: mockUser });

    const result = await AuthService.getCurrentUser();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockUser);
  });
});
