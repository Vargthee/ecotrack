import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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

function mapApiUser(u: any): AuthUser {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    phone: u.phone ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUser(mapApiUser(data));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, _role: UserRole): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(mapApiUser(data));
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    if (role === "admin") return false;
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(mapApiUser(data));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    sessionStorage.removeItem("ecotrack_user");
    sessionStorage.removeItem("ecotrack_admin_auth");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
