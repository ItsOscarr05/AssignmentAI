import { AuthService } from './AuthService';

// Define the AuthResponse interface locally to match what AuthService returns
interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    fullName?: string;
    role: 'student' | 'teacher' | 'admin';
    bio?: string;
    location?: string;
    website?: string;
    avatar?: string;
    avatarUrl?: string;
    institution?: string;
    preferences?: {
      theme: 'light' | 'dark';
      notifications: boolean;
      language: string;
    };
    createdAt: string;
    updatedAt: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
  user_id: string;
  email: string;
  role: string;
  permissions?: string[];
}

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<AuthResponse> | null = null;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private constructor() {
    this.setupTokenRefresh();
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store tokens securely
   */
  public storeTokens(tokenData: TokenData): void {
    try {
      // Store access token
      localStorage.setItem(this.TOKEN_KEY, tokenData.access_token);

      // Store refresh token if provided
      if (tokenData.refresh_token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refresh_token);
      }

      // Calculate and store expiry time
      const expiryTime = Date.now() + tokenData.expires_in * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

      // Set up automatic refresh
      this.scheduleTokenRefresh(tokenData.expires_in);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      this.clearTokens();
    }
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get the current refresh token
   */
  public getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;

      const expiry = parseInt(expiryTime, 10);
      const now = Date.now();

      // Consider token expired if it expires within 5 minutes
      return now >= expiry - 5 * 60 * 1000;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Check if token will expire soon (within 10 minutes)
   */
  public isTokenExpiringSoon(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;

      const expiry = parseInt(expiryTime, 10);
      const now = Date.now();

      // Consider expiring soon if it expires within 10 minutes
      return now >= expiry - 10 * 60 * 1000;
    } catch (error) {
      console.error('Failed to check if token is expiring soon:', error);
      return true;
    }
  }

  /**
   * Refresh the access token
   */
  public async refreshToken(): Promise<TokenData | null> {
    try {
      // Prevent multiple simultaneous refresh attempts
      if (this.refreshPromise) {
        const result = await this.refreshPromise;
        return this.transformToTokenData(result);
      }

      const refreshToken = this.getRefreshToken();
      // If there's no refresh token (e.g., mock login), skip refresh gracefully
      if (!refreshToken) {
        return null;
      }

      // Try to refresh the token
      this.refreshPromise = AuthService.refreshToken();
      const authResponse = await this.refreshPromise;

      // Transform AuthResponse to TokenData
      const tokenData = this.transformToTokenData(authResponse, refreshToken);

      // Store the new tokens
      this.storeTokens(tokenData);

      return tokenData;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Only clear tokens if we actually attempted a refresh using a refresh token
      if (this.getRefreshToken()) {
        this.clearTokens();
      }
      return null;
    } finally {
      this.refreshPromise = null;
    }
  }

  private transformToTokenData(authResponse: any, refreshToken?: string): TokenData {
    return {
      access_token: authResponse.access_token || authResponse.token,
      token_type: authResponse.token_type || 'bearer',
      expires_in: authResponse.expires_in || 3600, // Default to 1 hour
      refresh_token: refreshToken || authResponse.refresh_token,
    };
  }

  /**
   * Get a valid access token (refresh if necessary)
   */
  public async getValidToken(): Promise<string | null> {
    try {
      // If token is expired or expiring soon, refresh it
      if (this.isTokenExpired() || this.isTokenExpiringSoon()) {
        const tokenData = await this.refreshToken();
        return tokenData?.access_token || null;
      }

      return this.getAccessToken();
    } catch (error) {
      console.error('Failed to get valid token:', error);
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  public clearTokens(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Decode JWT token (without verification - for client-side use only)
   */
  public decodeToken(token: string): DecodedToken | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get user information from token
   */
  public getUserFromToken(): DecodedToken | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      return this.decodeToken(token);
    } catch (error) {
      console.error('Failed to get user from token:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: string): boolean {
    try {
      const user = this.getUserFromToken();
      if (!user || !user.permissions) return false;

      return user.permissions.includes(permission);
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  public hasAnyPermission(permissions: string[]): boolean {
    try {
      const user = this.getUserFromToken();
      if (!user || !user.permissions) return false;

      return permissions.some(permission => user.permissions!.includes(permission));
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  public hasAllPermissions(permissions: string[]): boolean {
    try {
      const user = this.getUserFromToken();
      if (!user || !user.permissions) return false;

      return permissions.every(permission => user.permissions!.includes(permission));
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    try {
      // Refresh token 5 minutes before expiry
      const refreshTime = (expiresIn - 5 * 60) * 1000;

      setTimeout(async () => {
        // Only attempt refresh if we have a refresh token to use
        if (!this.isTokenExpired() && this.getRefreshToken()) {
          await this.refreshToken();
        }
      }, refreshTime);
    } catch (error) {
      console.error('Failed to schedule token refresh:', error);
    }
  }

  /**
   * Set up automatic token refresh on page load
   */
  private setupTokenRefresh(): void {
    try {
      // Check if token needs refresh on page load
      if (this.isTokenExpiringSoon() && !this.isTokenExpired() && this.getRefreshToken()) {
        this.refreshToken();
      }

      // Set up periodic checks for token expiry
      setInterval(() => {
        if (this.isTokenExpiringSoon() && !this.isTokenExpired() && this.getRefreshToken()) {
          this.refreshToken();
        }
      }, 60000); // Check every minute
    } catch (error) {
      console.error('Failed to setup token refresh:', error);
    }
  }

  /**
   * Validate token format
   */
  public isValidTokenFormat(token: string): boolean {
    try {
      // Basic JWT format validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Check if parts are base64 encoded
      const header = this.isBase64(parts[0]);
      const payload = this.isBase64(parts[1]);
      const signature = this.isBase64(parts[2]);

      return header && payload && signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if string is valid base64
   */
  private isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token expiry time
   */
  public getTokenExpiryTime(): Date | null {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return null;

      return new Date(parseInt(expiryTime, 10));
    } catch (error) {
      console.error('Failed to get token expiry time:', error);
      return null;
    }
  }

  /**
   * Get time until token expires (in seconds)
   */
  public getTimeUntilExpiry(): number {
    try {
      const expiryTime = this.getTokenExpiryTime();
      if (!expiryTime) return 0;

      const now = new Date();
      const diff = expiryTime.getTime() - now.getTime();

      return Math.max(0, Math.floor(diff / 1000));
    } catch (error) {
      console.error('Failed to get time until expiry:', error);
      return 0;
    }
  }
}

export const tokenManager = TokenManager.getInstance();
export default TokenManager;
