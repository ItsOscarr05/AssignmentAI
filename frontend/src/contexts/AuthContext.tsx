import { createContext, ReactNode, useContext, useState } from "react";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    // TODO: Implement actual API call
    const mockUser: User = {
      id: 1,
      email,
      full_name: "Test User",
      role: "student",
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem("token", "mock-token");
  };

  const register = async (userData: Partial<User>, password: string) => {
    // TODO: Implement actual API call
    const mockUser: User = {
      id: 1,
      email: userData.email || "",
      full_name: userData.full_name || "",
      role: userData.role || "student",
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem("token", "mock-token");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
