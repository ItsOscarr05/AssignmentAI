import { ApiInterceptor, ApiRequestConfig, ApiResponse, CacheConfig } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheInterceptor implements ApiInterceptor {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private getCacheKey(config: ApiRequestConfig): string {
    const { method, url, params } = config;
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return `${method}:${url}${queryString}`;
  }

  private isCacheable(config: ApiRequestConfig): boolean {
    // Only cache GET requests
    return config.method === 'GET' && !config.headers?.['Cache-Control']?.includes('no-cache');
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private cleanupCache(): void {
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const entriesToRemove = entries.slice(0, entries.length - this.config.maxSize);
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  async onRequest(config: ApiRequestConfig): Promise<ApiRequestConfig> {
    if (!this.config.enabled || !this.isCacheable(config)) {
      return config;
    }

    const cacheKey = this.getCacheKey(config);
    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry && !this.isExpired(cachedEntry)) {
      // Return cached data
      return {
        ...config,
        cached: true,
        cachedData: cachedEntry.data,
      };
    }

    return config;
  }

  async onResponse<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    const config = response.config as ApiRequestConfig;

    if (!this.config.enabled || !this.isCacheable(config)) {
      return response;
    }

    const cacheKey = this.getCacheKey(config);
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    this.cleanupCache();
    return response;
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern: RegExp): void {
    for (const [key] of this.cache) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
