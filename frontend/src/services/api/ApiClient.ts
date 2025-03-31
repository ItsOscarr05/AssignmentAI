import {
  ApiClientConfig,
  ApiError,
  ApiInterceptor,
  ApiRequestConfig,
  ApiResponse,
} from "./types";

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private interceptors: ApiInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = config.headers || {};
  }

  addInterceptor(interceptor: ApiInterceptor) {
    this.interceptors.push(interceptor);
  }

  private async applyRequestInterceptors(
    config: ApiRequestConfig
  ): Promise<ApiRequestConfig> {
    let modifiedConfig = { ...config };
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        modifiedConfig = interceptor.onRequest(modifiedConfig);
      }
    }
    return modifiedConfig;
  }

  private async applyResponseInterceptors(
    response: ApiResponse
  ): Promise<ApiResponse> {
    let modifiedResponse = { ...response };
    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        modifiedResponse = interceptor.onResponse(modifiedResponse);
      }
    }
    return modifiedResponse;
  }

  private async applyErrorInterceptors(error: ApiError): Promise<never> {
    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        return interceptor.onError(error);
      }
    }
    throw error;
  }

  private async request<T>(
    method: string,
    url: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const finalConfig = await this.applyRequestInterceptors({
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${url}`, {
        method,
        ...finalConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = await response.json();
        return this.applyErrorInterceptors(error);
      }

      const data = await response.json();
      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
      };

      return this.applyResponseInterceptors(apiResponse);
    } catch (error) {
      if (error instanceof Error) {
        const apiError: ApiError = {
          code: "REQUEST_ERROR",
          message: error.message,
        };
        return this.applyErrorInterceptors(apiError);
      }
      throw error;
    }
  }

  async get<T>(
    url: string,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", url, config);
  }

  async post<T>(
    url: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", url, { ...config, data });
  }

  async put<T>(
    url: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", url, { ...config, data });
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", url, { ...config, data });
  }

  async delete<T>(
    url: string,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", url, config);
  }
}
