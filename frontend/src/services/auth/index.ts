import { AuthService } from './AuthService';

// Create a singleton instance
const authService = {
  login: AuthService.login,
  register: AuthService.register,
  logout: AuthService.logout,
  getCurrentUser: AuthService.getCurrentUser,
  refreshToken: AuthService.refreshToken,
  forgotPassword: AuthService.forgotPassword,
  resetPassword: AuthService.resetPassword,
  getInstance: () => authService,
};

export { AuthService, authService };
