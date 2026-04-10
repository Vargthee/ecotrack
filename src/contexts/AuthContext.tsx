import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "user" | "driver" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  joinedAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "user@ecotrack.com": {
    password: "user123",
    user: { id: "1", name: "Demo User", email: "user@ecotrack.com", role: "user", joinedAt: "2025-01-15" },
  },
  "driver@ecotrack.com": {
    password: "driver123",
    user: { id: "2", name: "Demo Driver", email: "driver@ecotrack.com", role: "driver", joinedAt: "2025-02-10" },
  },
  "admin@ecotrack.com": {
    password: "admin123",
    user: { id: "3", name: "Admin", email: "admin@ecotrack.com", role: "admin", joinedAt: "2024-06-01" },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = sessionStorage.getItem("ecotrack_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const entry = MOCK_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password || entry.user.role !== role) return false;
    setUser(entry.user);
    sessionStorage.setItem("ecotrack_user", JSON.stringify(entry.user));
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    if (role === "admin") return false;
    const newUser: AuthUser = { id: String(Date.now()), name, email, role, joinedAt: new Date().toISOString().split("T")[0] };
    setUser(newUser);
    sessionStorage.setItem("ecotrack_user", JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("ecotrack_user");
    sessionStorage.removeItem("ecotrack_admin_auth");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading: false, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
