import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../services/api';
import { AuthService } from '../../services/auth/AuthService';

vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
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
  });

  describe('register', () => {
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
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      await AuthService.logout();
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getCurrentUser', () => {
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
});
