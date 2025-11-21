import { authAPI } from "@/services/api";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "citizen" | "admin";
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: "citizen" | "admin") => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    role: "citizen" | "admin";
  }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        await refreshUser();
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: "citizen" | "admin"
  ) => {
    try {
      const response = await authAPI.login(email, password, role);
      if (response.success && response.data) {
        const { token, user: userData } = response.data as {
          token: string;
          user: User;
        };
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[v0] Login error", error);
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    role: "citizen" | "admin";
  }) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success && response.data) {
        const { token, user: newUser } = response.data as {
          token: string;
          user: User;
        };
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[v0] Register error", error);
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data as User);
        localStorage.setItem("user", JSON.stringify(response.data));
      } else {
        logout();
      }
    } catch (error) {
      console.error("[v0] Refresh user error", error);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
