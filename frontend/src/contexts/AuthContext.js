import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Check if token is expired
      if (parsedUser.token && isTokenValid(parsedUser.token)) {
        setUser(parsedUser);
        setupAxiosInterceptors(parsedUser.token);
      } else {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const isTokenValid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  };

  const setupAxiosInterceptors = (token) => {
    axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await logout();
        }
        return Promise.reject(error);
      }
    );
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      const userData = response.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setupAxiosInterceptors(userData.token);
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during login");
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        userData
      );
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during registration"
      );
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      // Clear axios default headers
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
