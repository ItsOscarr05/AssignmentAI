import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { CSRFProtection, InputValidation, RateLimiting, XSSPrevention } from '../../utils/security';
import { TokenData, tokenManager } from '../auth/TokenManager';

export interface SecureApiConfig {
  baseURL: string;
  timeout?: number;
  enableCSRF?: boolean;
  enableRateLimiting?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipCSRF?: boolean;
  skipRateLimit?: boolean;
  retryOnAuthFailure?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

export class SecureApiClient {
  private client: AxiosInstance;
  private config: SecureApiConfig;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(config: SecureApiConfig) {
    this.config = {
      timeout: 10000,
      enableCSRF: true,
      enableRateLimiting: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig & ApiRequestConfig) => {
        // Add authentication token
        if (!config.skipAuth) {
          const token = await tokenManager.getValidToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add CSRF token
        if (this.config.enableCSRF && !config.skipCSRF) {
          const csrfToken = CSRFProtection.getToken();
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
        }

        // Check rate limiting
        if (this.config.enableRateLimiting && !config.skipRateLimit) {
          const rateLimitKey = `${config.method}:${config.url}`;
          if (RateLimiting.isRateLimited(rateLimitKey, 100, 60000)) {
            // 100 requests per minute
            throw new Error('Rate limit exceeded');
          }
        }

        // Sanitize request data
        if (config.data && typeof config.data === 'object') {
          config.data = this.sanitizeRequestData(config.data);
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        // Sanitize response data
        if (response.data) {
          response.data = this.sanitizeResponseData(response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle token refresh on 401 errors
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          originalRequest.retryOnAuthFailure !== false
        ) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokenData = await tokenManager.refreshToken();
            if (tokenData) {
              // Retry failed requests
              this.processQueue(null, tokenData);
              return this.client(originalRequest);
            } else {
              this.processQueue(new Error('Token refresh failed'), null);
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Process failed request queue
   */
  private processQueue(error: any, tokenData: TokenData | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(tokenData);
      }
    });
    this.failedQueue = [];
  }

  /**
   * Sanitize request data
   */
  private sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return XSSPrevention.escapeHTML(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeRequestData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeRequestData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Sanitize response data
   */
  private sanitizeResponseData(data: any): any {
    if (typeof data === 'string') {
      // Check for dangerous content
      if (XSSPrevention.containsDangerousContent(data)) {
        return XSSPrevention.sanitizeHTML(data);
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeResponseData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Make a request with retry logic
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const response = await this.client.request(config);
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          break;
        }

        // Wait before retrying
        if (attempt < this.config.maxRetries!) {
          await this.delay(this.config.retryDelay! * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry on 4xx errors (except 429)
    if (
      error.response?.status >= 400 &&
      error.response?.status < 500 &&
      error.response?.status !== 429
    ) {
      return true;
    }

    // Don't retry on network errors after first attempt
    if (error.code === 'NETWORK_ERROR') {
      return true;
    }

    return false;
  }

  /**
   * Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload file with security validation
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    allowedTypes: string[],
    maxSizeMB: number,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    // Validate file
    if (!InputValidation.isValidFileType(file, allowedTypes)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (!InputValidation.isValidFileSize(file, maxSizeMB)) {
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    // Sanitize filename
    const sanitizedFile = new File([file], InputValidation.sanitizeFilename(file.name), {
      type: file.type,
    });

    const formData = new FormData();
    formData.append('file', sanitizedFile);

    return this.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Download file securely
   */
  async downloadFile(url: string, filename?: string, config?: ApiRequestConfig): Promise<void> {
    const response = await this.get(url, {
      ...config,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Set CSRF token
   */
  setCSRFToken(token: string): void {
    CSRFProtection.storeToken(token);
  }

  /**
   * Clear CSRF token
   */
  clearCSRFToken(): void {
    CSRFProtection.clearToken();
  }

  /**
   * Get rate limiting info
   */
  getRateLimitInfo(
    key: string,
    maxAttempts: number
  ): {
    remaining: number;
    timeUntilReset: number;
  } {
    return {
      remaining: RateLimiting.getRemainingAttempts(key, maxAttempts),
      timeUntilReset: RateLimiting.getTimeUntilReset(key),
    };
  }

  /**
   * Clear rate limiting for a key
   */
  clearRateLimit(key: string): void {
    RateLimiting.clear(key);
  }

  /**
   * Validate and sanitize URL
   */
  validateURL(url: string): string | null {
    return XSSPrevention.sanitizeURL(url);
  }

  /**
   * Get underlying axios instance (for advanced use cases)
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecureApiConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update axios instance
    this.client.defaults.baseURL = this.config.baseURL;
    this.client.defaults.timeout = this.config.timeout;
  }
}

// Create default secure API client instance
export const secureApiClient = new SecureApiClient({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  enableCSRF: true,
  enableRateLimiting: true,
  maxRetries: 3,
  retryDelay: 1000,
});

export default SecureApiClient;
