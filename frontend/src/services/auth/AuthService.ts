import { ApiClient } from "../api/ApiClient";
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from "../api/types";

export class AuthService {
  private apiClient: ApiClient;
  private static TOKEN_KEY = "auth_token";
  private static REFRESH_TOKEN_KEY = "refresh_token";

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  private setTokens(token: string, refreshToken: string) {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
    localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(AuthService.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      const { token, refreshToken } = response.data;
      this.setTokens(token, refreshToken);
      return response.data;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>(
        "/auth/register",
        data
      );
      const { token, refreshToken } = response.data;
      this.setTokens(token, refreshToken);
      return response.data;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post("/auth/logout");
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await this.apiClient.post<AuthResponse>(
        "/auth/refresh",
        {
          refreshToken,
        } as RefreshTokenRequest
      );
      const { token, newRefreshToken } = response.data;
      this.setTokens(token, newRefreshToken);
      return response.data;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    await this.apiClient.post("/auth/reset-password", { email });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.apiClient.post("/auth/verify-email", { token });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await this.apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }
}
