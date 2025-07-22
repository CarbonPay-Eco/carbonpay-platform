"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // opcional: decodificar token JWT e setar user
      setUser({ token });
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    // Also set as cookie for server-side middleware
    document.cookie = `token=${token}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
    setIsAuthenticated(true);
    setUser({ token });
  };

  const logout = () => {
    localStorage.removeItem("token");
    // Remove cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
