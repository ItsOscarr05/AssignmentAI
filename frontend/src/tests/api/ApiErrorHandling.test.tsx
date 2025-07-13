import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';

// Mock axios
vi.mock('axios');

// Mock axios.isAxiosError
vi.mocked(axios.isAxiosError).mockImplementation((error): error is AxiosError => {
  return error && typeof error === 'object' && 'isAxiosError' in error;
});

// Utility to reset all axios spies
function resetAxiosSpies() {
  vi.restoreAllMocks();
}

describe('API Error Handling', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    resetAxiosSpies();
    queryClient.clear();
  });

  describe('Network Errors', () => {
    it('should handle network connection errors', async () => {
      const networkError = new Error('Network Error') as AxiosError;
      networkError.isAxiosError = true;
      networkError.code = 'ERR_NETWORK';
      networkError.message = 'Network Error';
      // Simulate what axios would do
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      vi.spyOn(axios, 'get').mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe(
          'Unable to connect to the server. Please check your internet connection.'
        );
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded') as AxiosError;
      timeoutError.isAxiosError = true;
      timeoutError.code = 'ECONNABORTED';
      timeoutError.message = 'timeout of 5000ms exceeded';
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      vi.spyOn(axios, 'get').mockRejectedValueOnce(timeoutError);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe('Request timed out. Please try again.');
      });
    });
  });

  describe('API Response Errors', () => {
    it('should handle 400 Bad Request errors', async () => {
      const badRequestError = new Error('Invalid input') as AxiosError;
      badRequestError.isAxiosError = true;
      badRequestError.response = {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Invalid input' },
        headers: {},
        config: {} as any,
      } as AxiosResponse;
      vi.spyOn(axios, 'post').mockRejectedValueOnce(badRequestError);

      const { result } = renderHook(
        () => useApi(() => axios.post('/test-endpoint', { data: 'invalid' })),
        { wrapper }
      );

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe('Invalid input');
      });
    });

    it('should handle 401 Unauthorized errors', async () => {
      const unauthorizedError = new Error('Unauthorized access') as AxiosError;
      unauthorizedError.isAxiosError = true;
      unauthorizedError.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Unauthorized access' },
        headers: {},
        config: {} as any,
      } as AxiosResponse;
      vi.spyOn(axios, 'get').mockRejectedValueOnce(unauthorizedError);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe('Unauthorized access');
      });
    });

    it('should handle 404 Not Found errors', async () => {
      const notFoundError = new Error('Resource not found') as AxiosError;
      notFoundError.isAxiosError = true;
      notFoundError.response = {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Resource not found' },
        headers: {},
        config: {} as any,
      } as AxiosResponse;
      vi.spyOn(axios, 'get').mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe('Resource not found');
      });
    });

    it('should handle 500 Internal Server errors', async () => {
      const serverError = new Error('Internal server error') as AxiosError;
      serverError.isAxiosError = true;
      serverError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Internal server error' },
        headers: {},
        config: {} as any,
      } as AxiosResponse;
      vi.spyOn(axios, 'get').mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe('Internal server error');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should clear error state on successful request', async () => {
      const successResponse = { data: { message: 'Success' } };
      vi.spyOn(axios, 'get').mockResolvedValueOnce(successResponse);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      // Set initial error state
      result.current.error = 'Previous error';
      expect(result.current.error).toBe('Previous error');

      // Make successful request
      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle retry logic for failed requests', async () => {
      const networkError = new Error('Network Error') as AxiosError;
      networkError.isAxiosError = true;
      networkError.code = 'ERR_NETWORK';
      networkError.message = 'Network Error';
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      const successResponse = { data: { message: 'Success' } };

      const getSpy = vi.spyOn(axios, 'get');
      getSpy
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      // Simulate manual retries
      await result.current.execute(); // 1st attempt (fail)
      await result.current.execute(); // 2nd attempt (fail)
      await result.current.execute(); // 3rd attempt (success)

      await waitFor(() => {
        expect(result.current.data).toEqual(successResponse);
      });
    });
  });

  describe('Request Cancellation', () => {
    it('should handle request cancellation', async () => {
      const cancelError = new axios.Cancel('Request cancelled') as AxiosError;
      cancelError.isAxiosError = true;
      vi.spyOn(axios, 'isCancel').mockReturnValue(true);
      vi.spyOn(axios, 'get').mockRejectedValueOnce(cancelError);

      const { result } = renderHook(() => useApi(() => axios.get('/test-endpoint')), { wrapper });

      await result.current.execute();
      await waitFor(() => {
        expect(result.current.error).toBe('Request was cancelled');
      });
    });
  });
});
