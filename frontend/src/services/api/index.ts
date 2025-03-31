import { AuthService } from "../auth/AuthService";
import { ApiClient } from "./ApiClient";
import { ErrorHandler } from "./ErrorHandler";

// Create API client instance
const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
  timeout: 30000,
});

// Create auth service instance
const authService = new AuthService(apiClient);

// Create error handler instance
const errorHandler = new ErrorHandler(authService);

// Add error handler to API client
apiClient.addInterceptor(errorHandler);

// Add auth interceptor to add token to requests
apiClient.addInterceptor({
  onRequest: (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
});

export * from "./types";
export { apiClient, authService, errorHandler };
