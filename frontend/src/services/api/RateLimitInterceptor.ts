import { ApiError, ApiInterceptor, ApiRequestConfig, ApiResponse, RateLimitInfo } from './types';

export class RateLimitInterceptor implements ApiInterceptor {
  private rateLimitInfo: RateLimitInfo | null = null;
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Error processing queued request:', error);
        }
      }
    }
    this.processing = false;
  }

  private updateRateLimitInfo(headers: Record<string, string>) {
    const limit = parseInt(headers['x-ratelimit-limit'] || '0');
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const reset = parseInt(headers['x-ratelimit-reset'] || '0');

    if (!isNaN(limit) && !isNaN(remaining) && !isNaN(reset)) {
      this.rateLimitInfo = { limit, remaining, reset };
    }
  }

  private async waitForRateLimit(): Promise<void> {
    if (!this.rateLimitInfo) return;

    const now = Date.now();
    if (this.rateLimitInfo.remaining <= 0 && this.rateLimitInfo.reset > now) {
      const waitTime = this.rateLimitInfo.reset - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  async onRequest(config: ApiRequestConfig): Promise<ApiRequestConfig> {
    await this.waitForRateLimit();
    return config;
  }

  async onResponse<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    if (response.headers) {
      this.updateRateLimitInfo(response.headers);
    }
    return response;
  }

  async onError(error: ApiError): Promise<ApiError> {
    if (error.status === 429) {
      // Too Many Requests
      const retryAfter = parseInt(error.details?.retryAfter || '60');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    }
    return error;
  }

  queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
}
