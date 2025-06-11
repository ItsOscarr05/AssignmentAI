import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    return {
      message,
      status: error.response?.status,
      code: error.code,
    };
  } else if (error instanceof Error) {
    toast.error(error.message);
    return {
      message: error.message,
    };
  } else {
    const message = 'An unexpected error occurred';
    toast.error(message);
    return {
      message,
    };
  }
};
