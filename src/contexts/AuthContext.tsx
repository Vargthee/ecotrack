import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { queryClient, getStoredToken, setStoredToken, clearStoredToken } from "@/lib/queryClient";

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
  login: (email: string, password: string, role: UserRole) => Promise<string | null>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<string | null>;
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

async function extractError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    // If the response is HTML (e.g. a gateway error page), report the status
    if (text.trimStart().startsWith("<")) {
      return `Server error (${res.status}) — please try again or contact support`;
    }
    const data = JSON.parse(text);
    return data?.error || data?.message || `Request failed with status ${res.status}`;
  } catch {
    return `Server error (${res.status}) — please try again`;
  }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUser(mapApiUser(data));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, _role: UserRole): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await extractError(res);
        return res.status === 401 ? "Incorrect email or password" : msg;
      }
      const data = await res.json();
      if (data.token) setStoredToken(data.token);
      queryClient.clear();
      setUser(mapApiUser(data));
      return null;
    } catch {
      return "Network error — please try again";
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole): Promise<string | null> => {
    if (role === "admin") return "Admin accounts cannot be created here";
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const msg = await extractError(res);
        return res.status === 409 ? "An account with this email already exists" : msg;
      }
      const data = await res.json();
      if (data.token) setStoredToken(data.token);
      queryClient.clear();
      setUser(mapApiUser(data));
      return null;
    } catch {
      return "Network error — please try again";
    }
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    clearStoredToken();
    sessionStorage.removeItem("ecotrack_user");
    sessionStorage.removeItem("ecotrack_admin_auth");
    queryClient.clear();
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
