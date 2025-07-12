import axios, { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        if (options.successMessage) {
          showToast(options.successMessage, 'success');
        }
        options.onSuccess?.(result);
      } catch (err) {
        let errorMessage = 'An unexpected error occurred';

        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError;
          if (axiosError.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out. Please try again.';
          } else if (axiosError.code === 'ERR_NETWORK') {
            errorMessage =
              'Unable to connect to the server. Please check your internet connection.';
          } else if (axiosError.response) {
            errorMessage = (axiosError.response.data as any)?.message || axiosError.message;
          } else if (axiosError.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (axios.isCancel(axiosError)) {
            errorMessage = 'Request was cancelled';
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        if (options.errorMessage) {
          showToast(options.errorMessage, 'error');
        } else {
          showToast(errorMessage, 'error');
        }
        options.onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, options, showToast]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
