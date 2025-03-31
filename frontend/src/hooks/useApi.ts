import { useCallback, useState } from "react";
import { useToast } from "../contexts/ToastContext";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: any;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const { showToast } = useToast();

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        if (options.successMessage) {
          showToast(options.successMessage, "success");
        }
        options.onSuccess?.(result);
      } catch (err) {
        setError(err);
        if (options.errorMessage) {
          showToast(options.errorMessage, "error");
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
