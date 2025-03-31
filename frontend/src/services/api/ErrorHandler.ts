import { AuthService } from "../auth/AuthService";
import { ApiError, ApiInterceptor } from "./types";

export class ErrorHandler implements ApiInterceptor {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  onError = async (error: ApiError): Promise<never> => {
    // Handle authentication errors
    if (error.code === "UNAUTHORIZED" || error.code === "TOKEN_EXPIRED") {
      try {
        // Try to refresh the token
        await this.authService.refreshToken();
        // Retry the original request
        return Promise.reject(error);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        this.handleAuthError();
        return Promise.reject(error);
      }
    }

    // Handle other specific error codes
    switch (error.code) {
      case "FORBIDDEN":
        this.handleForbiddenError();
        break;
      case "NOT_FOUND":
        this.handleNotFoundError();
        break;
      case "VALIDATION_ERROR":
        this.handleValidationError(error);
        break;
      case "SERVER_ERROR":
        this.handleServerError();
        break;
      default:
        this.handleGenericError(error);
    }

    return Promise.reject(error);
  };

  private handleAuthError() {
    // Clear auth state and redirect to login
    this.authService.logout();
    window.location.href = "/login";
  }

  private handleForbiddenError() {
    // Show forbidden error message
    this.showErrorToast("You do not have permission to perform this action");
  }

  private handleNotFoundError() {
    // Show not found error message
    this.showErrorToast("The requested resource was not found");
  }

  private handleValidationError(error: ApiError) {
    // Show validation error message with details
    const message = error.details
      ? Object.values(error.details).join(", ")
      : "Please check your input and try again";
    this.showErrorToast(message);
  }

  private handleServerError() {
    // Show server error message
    this.showErrorToast("An unexpected error occurred. Please try again later");
  }

  private handleGenericError(error: ApiError) {
    // Show generic error message
    this.showErrorToast(error.message || "An error occurred");
  }

  private showErrorToast(message: string) {
    // Dispatch a custom event that the Toast component will listen for
    const event = new CustomEvent("showToast", {
      detail: {
        message,
        severity: "error",
      },
    });
    window.dispatchEvent(event);
  }
}
