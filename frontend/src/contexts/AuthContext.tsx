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
    // Clear any existing mock user flags since test users are removed
    localStorage.removeItem('isMockUser');
    setIsMockUser(false);

    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Always set mock user to false since test users are removed
      setIsMockUser(false);
    }
    setIsLoading(false);
  }, []);

  // Fetch profile after AuthContext is fully initialized
  useEffect(() => {
    if (user && !isMockUser && !user.name) {
      // Wait a bit for the context to be fully set up, then fetch profile
      const timer = setTimeout(() => {
        import('../services/ProfileService').then(({ useProfileStore }) => {
          const { fetchProfile } = useProfileStore.getState();
          fetchProfile();
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, isMockUser]);

  // Remove unused parameters from handleCallback
  const handleCallback = async () => {
    // This function is now a no-op since the backend handles the callback and redirects with the token.
    return;
  };

  const login = async (credentials: LoginRequest): Promise<TokenWith2FA> => {
    try {
      setError(null);
      setIsLoading(true);

      console.log('Login function called with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password,
        rememberMe: credentials.rememberMe,
      });

      // Validate input
      if (!InputValidation.isValidEmail(credentials.email)) {
        throw new Error('Invalid email format');
      }

      // Log login attempt
      securityMonitor.logLoginAttempt(credentials.email, false, 'Attempting login');

      const response = await AuthService.login(credentials);

      console.log('AuthService.login response:', response);

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
        console.log('Calling handleSuccessfulLogin with credentials:', credentials);
        await handleSuccessfulLogin(response, credentials);
        return response;
      }
    } catch (error: any) {
      console.log('Login error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Extract error message from response
      let errorMessage = 'Login failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

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

      await handleSuccessfulLogin(response, {
        email: localStorage.getItem('rememberedEmail') || '',
        password: '',
        rememberMe: false,
      });
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

  const handleSuccessfulLogin = async (response: TokenWith2FA, credentials: LoginRequest) => {
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

      // Store remember me preference and form data if enabled
      if (credentials.rememberMe) {
        console.log('Storing remember me data:', {
          email: userData.email,
          rememberMe: credentials.rememberMe,
          hasPassword: !!credentials.password,
        });
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', userData.email);
        // Store password for auto-fill (this is a common pattern for remember me)
        // The password is stored in the same session where the user explicitly enabled it
        localStorage.setItem('rememberedPassword', credentials.password);
      } else {
        console.log('Clearing remember me data');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

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
      // Don't clear remember me data - keep it for auto-fill on return
      // localStorage.removeItem('rememberMe');
      // localStorage.removeItem('rememberedEmail');
      // localStorage.removeItem('rememberedPassword');

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
      // Don't clear remember me data - keep it for auto-fill on return
      // localStorage.removeItem('rememberMe');
      // localStorage.removeItem('rememberedEmail');
      // localStorage.removeItem('rememberedPassword');

      // Log logout all event
      securityMonitor.logEvent('logout', 'low', { logoutAll: true });

      navigate('/');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    console.log('AuthContext: updateUser called with:', userData);
    console.log('AuthContext: current user before update:', user);

    setUser(prev => {
      if (prev) {
        const updatedUser = { ...prev, ...userData };
        console.log('AuthContext: updated user:', updatedUser);
        // Update localStorage immediately with the new user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return null;
    });
  };

  // Set the updateUser function in ProfileService so it can update user data
  useEffect(() => {
    console.log('AuthContext: Setting updateUser function:', updateUser);
    setAuthContextUpdateUser(updateUser);
  }, [updateUser]);

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

    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
