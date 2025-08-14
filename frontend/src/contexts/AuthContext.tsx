import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/api';
import { AuthService } from '../services/auth/AuthService';
import { tokenManager } from '../services/auth/TokenManager';
import { RegisterData } from '../services/authManager';
import { securityMonitor } from '../services/security/SecurityMonitor';
import { AuthContextType, LoginRequest, TokenWith2FA, User } from '../types';
import { setAuthContextUpdateUser } from '../utils/authBridge';
import { InputValidation } from '../utils/security';

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockUser, setIsMockUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Remove the checkAuth() call to prevent overriding the stored user
    // checkAuth();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedIsMockUser = localStorage.getItem('isMockUser') === 'true';

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsMockUser(storedIsMockUser);
    }
    setIsLoading(false);
  }, []);

  // Remove unused parameters from handleCallback
  const handleCallback = async () => {
    // This function is now a no-op since the backend handles the callback and redirects with the token.
    return;
  };

  const login = async (credentials: LoginRequest): Promise<TokenWith2FA> => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate input
      if (!InputValidation.isValidEmail(credentials.email)) {
        throw new Error('Invalid email format');
      }

      // Log login attempt
      securityMonitor.logLoginAttempt(credentials.email, false, 'Attempting login');

      const response = await AuthService.login(credentials);

      // Log successful login
      securityMonitor.logLoginAttempt(credentials.email, true);

      if (response.requires_2fa) {
        // Store temporary token for 2FA verification
        setTempToken(response.access_token);
        setRequires2FA(true);

        // Log 2FA requirement
        securityMonitor.log2FAEvent('2fa_verification', false, undefined, '2FA required for login');

        return response;
      } else {
        // Regular login successful
        await handleSuccessfulLogin(response);
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      setError(errorMessage);

      // Log failed login attempt
      securityMonitor.logLoginAttempt(credentials.email, false, errorMessage);

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string, isBackupCode: boolean = false): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate 2FA code format
      if (!isBackupCode && !InputValidation.isValid2FACode(code)) {
        throw new Error('Invalid 2FA code format');
      }
      if (isBackupCode && !InputValidation.isValidBackupCode(code)) {
        throw new Error('Invalid backup code format');
      }

      const response = await AuthService.verify2FA(code, isBackupCode);

      // Log successful 2FA verification
      securityMonitor.log2FAEvent('2fa_verification', true);

      await handleSuccessfulLogin(response);
      setRequires2FA(false);
      setTempToken(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || '2FA verification failed';
      setError(errorMessage);

      // Log failed 2FA verification
      securityMonitor.log2FAEvent('2fa_verification', false, undefined, errorMessage);

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulLogin = async (response: TokenWith2FA) => {
    // Store tokens using token manager
    tokenManager.storeTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      expires_in: response.expires_in,
      token_type: response.token_type,
    });

    // Also set the token in localStorage and axios default header for compatibility
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
      // Import the api instance from config/api if not already
      // @ts-ignore
      import('../config/api').then(({ default: api }) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
      });
    }

    // Get user data
    let userData = response.user;
    if (!userData) {
      try {
        const currentUser = await AuthService.getCurrentUser();
        // Convert the current user response to match the expected format
        userData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          is_verified: true, // Assume verified if we can get current user
          is_active: true,
        };
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    }

    if (userData) {
      // Safely handle undefined name
      const name = typeof userData.name === 'string' ? userData.name : '';
      const [firstName, ...rest] = name.split(' ');
      const lastName = rest.join(' ');
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: name,
        role: 'student', // Default role, can be updated from user profile
        firstName: firstName || '',
        lastName: lastName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isMockUser', 'false');
      setIsMockUser(false);

      // Log session creation
      securityMonitor.logSessionEvent('session_created', 'session-id', user.id);
    }

    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all authentication data
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
      setError(null);
      setIsMockUser(false);

      // Clear tokens using token manager
      tokenManager.clearTokens();

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isMockUser');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token'); // Also clear AuthManager token
      localStorage.removeItem('refresh_token');

      // Log logout event
      securityMonitor.logEvent('logout', 'low', {});

      navigate('/');
    }
  };

  const logoutAll = async () => {
    try {
      await AuthService.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      // Clear all authentication data
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
      setError(null);
      setIsMockUser(false);

      // Clear tokens using token manager
      tokenManager.clearTokens();

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isMockUser');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token'); // Also clear AuthManager token
      localStorage.removeItem('refresh_token');

      // Log logout all event
      securityMonitor.logEvent('logout', 'low', { logoutAll: true });

      navigate('/');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...userData } : null));
    if (user) {
      localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
    }
  };

  // Set the updateUser function in ProfileService so it can update user data
  useEffect(() => {
    setAuthContextUpdateUser(updateUser);
  }, []);

  const register = async (userData: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate input
      if (!InputValidation.isValidEmail(userData.email)) {
        throw new Error('Invalid email format');
      }

      const passwordValidation = InputValidation.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      if (userData.password !== userData.confirm_password) {
        throw new Error('Passwords do not match');
      }

      // Send only the required fields to the backend using the auth.register method
      const response = await auth.register({
        email: userData.email,
        password: userData.password,
        full_name: `${userData.firstName} ${userData.lastName}`.trim(),
      });

      // Log successful registration
      securityMonitor.logEvent('profile_update', 'low', {
        action: 'registration',
        email: userData.email,
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const mockLogin = () => {
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'dev@example.com',
      name: 'Development User',
      role: 'teacher',
      firstName: 'Development',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create a mock token for development
    const mockToken = 'mock-access-token-for-development';
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('token', mockToken); // Also store for AuthManager compatibility
    localStorage.setItem('token_expiry', (Date.now() + 3600000).toString()); // 1 hour from now

    setUser(mockUser);
    setIsMockUser(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('isMockUser', 'true');

    // Log mock login
    securityMonitor.logEvent('login_success', 'low', {
      isMockUser: true,
      email: mockUser.email,
    });

    navigate('/dashboard');
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.forgotPassword(email);

      // Log password reset request
      securityMonitor.logEvent('password_reset', 'low', {
        email: InputValidation.isValidEmail(email) ? email : 'invalid-email',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePassword = async (token: string, newPassword: string) => {
    try {
      // Validate password
      const passwordValidation = InputValidation.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      await AuthService.resetPassword(token, newPassword);

      // Log password change
      securityMonitor.logEvent('password_change', 'medium', {});
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || 'Password update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    isMockUser,
    requires2FA,
    tempToken,
    handleCallback,
    login,
    verify2FA,
    logout,
    logoutAll,
    updateUser,
    register,
    mockLogin,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
