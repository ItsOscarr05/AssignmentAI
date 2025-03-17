import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

export interface User {
  token: string;
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, "token">) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  };

  const setupAxiosInterceptors = (token: string) => {
    axios.interceptors.request.use(
      (config) => {
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  };

  const login = async (email: string, password: string): Promise<void> => {
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
    } catch (err) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      setError(error.response?.data?.message || "Failed to login");
      throw error;
    }
  };

  const register = async (userData: Omit<User, "token">): Promise<void> => {
    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        userData
      );
      const newUser = response.data;
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      setupAxiosInterceptors(newUser.token);
    } catch (err) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      setError(error.response?.data?.message || "Failed to register");
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      // Reset axios interceptors by creating a new instance
      axios.defaults.headers.common["Authorization"] = "";
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
