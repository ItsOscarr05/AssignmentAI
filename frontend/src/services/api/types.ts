export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  headers?: Record<string, string>;
  config?: ApiRequestConfig;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  method?: string;
  url?: string;
  cached?: boolean;
  cachedData?: any;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
  withCredentials?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  newRefreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    two_factor_enabled: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
}

export interface TwoFactorConfirmResponse {
  backup_codes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TwoFactorBackupRequest {
  code: string;
}

export interface ApiInterceptor {
  onRequest?: (config: ApiRequestConfig) => Promise<ApiRequestConfig>;
  onResponse?: <T>(response: ApiResponse<T>) => Promise<ApiResponse<T>>;
  onError?: (error: ApiError) => Promise<ApiError>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items to cache
}

export interface WebSocketConfig {
  enabled: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId: string;
  customDimensions?: Record<string, string>;
}
