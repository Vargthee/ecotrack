import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "user" | "driver";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  joinedAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "user@ecotrack.com": {
    password: "user123",
    user: { id: "u1", name: "Adewale Johnson", email: "user@ecotrack.com", role: "user", joinedAt: "2026-01-15" },
  },
  "driver@ecotrack.com": {
    password: "driver123",
    user: { id: "d1", name: "Ibrahim Musa", email: "driver@ecotrack.com", role: "driver", joinedAt: "2025-11-20" },
  },
};

function getStoredUser(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem("ecotrack_user");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const login = useCallback(async (email: string, _password: string, role: UserRole): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 500));
    const entry = MOCK_USERS[email];
    if (entry && entry.password === _password && entry.user.role === role) {
      sessionStorage.setItem("ecotrack_user", JSON.stringify(entry.user));
      setUser(entry.user);
      return true;
    }
    // Allow any registration to succeed as mock
    const mockUser: AuthUser = {
      id: `mock_${Date.now()}`,
      name: email.split("@")[0],
      email,
      role,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    sessionStorage.setItem("ecotrack_user", JSON.stringify(mockUser));
    setUser(mockUser);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: UserRole): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 500));
    const newUser: AuthUser = {
      id: `mock_${Date.now()}`,
      name,
      email,
      role,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    sessionStorage.setItem("ecotrack_user", JSON.stringify(newUser));
    setUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("ecotrack_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
