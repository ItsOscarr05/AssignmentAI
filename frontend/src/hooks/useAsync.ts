import { useCallback, useState } from 'react';
import { ApiError, handleApiError } from '../utils/errorHandling';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseAsyncOptions {
  initialData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

export const useAsync = <T>(options: UseAsyncOptions = {}) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: options.initialData || null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (promise: Promise<T>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await promise;
        setState({ data, loading: false, error: null });
        options.onSuccess?.(data);
        return data;
      } catch (error) {
        const apiError = handleApiError(error);
        setState(prev => ({ ...prev, loading: false, error: apiError }));
        options.onError?.(apiError);
        throw apiError;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      data: options.initialData || null,
      loading: false,
      error: null,
    });
  }, [options.initialData]);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null,
  };
};
