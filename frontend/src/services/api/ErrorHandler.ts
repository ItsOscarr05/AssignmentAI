import { AxiosError } from 'axios';
import { AuthService } from '../auth/AuthService';

interface ApiError extends AxiosError {
  response?: {
    data: { [key: string]: any; message?: string };
    status: number;
    headers: Record<string, string>;
    statusText: string;
    config: any;
  };
}

export class ErrorHandler {
  private authService: typeof AuthService;

  constructor() {
    this.authService = AuthService;
  }

  public handleError(error: ApiError): Promise<any> {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return this.handleAuthError();
        case 403:
          return this.handleForbiddenError();
        case 404:
          return this.handleNotFoundError();
        case 429:
          return this.handleRateLimitError(error);
        default:
          return this.handleGenericError(error);
      }
    }
    return Promise.reject(error);
  }

  private handleAuthError() {
    this.authService.logout();
    window.location.href = '/login';
    return Promise.reject(new Error('Authentication failed'));
  }

  private handleForbiddenError() {
    return Promise.reject(new Error('You do not have permission to perform this action'));
  }

  private handleNotFoundError() {
    return Promise.reject(new Error('The requested resource was not found'));
  }

  private handleRateLimitError(error: ApiError) {
    const retryAfter = error.response?.headers['retry-after'];
    if (retryAfter) {
      const delay = parseInt(retryAfter, 10) * 1000;
      return new Promise(resolve => setTimeout(resolve, delay)).then(() => {
        return this.retryRequest();
      });
    }
    return Promise.reject(new Error('Rate limit exceeded'));
  }

  private handleGenericError(error: ApiError) {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }

  private retryRequest() {
    // Implementation of retry logic
    return Promise.reject(new Error('Retry not implemented'));
  }
}
