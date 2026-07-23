import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, getToken, type Company } from "./api";

interface AuthState {
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setCompany(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api<{ company: Company } | Company>("/api/company/auth/me");
      const c =
        res && typeof res === "object" && "company" in res
          ? (res as { company: Company }).company
          : (res as Company);
      setCompany(c);
    } catch {
      setToken(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ token: string; company: Company }>(
      "/api/company/auth/login",
      { method: "POST", json: { email, password } },
    );
    setToken(res.token);
    setCompany(res.company);
  }

  function logout() {
    setToken(null);
    setCompany(null);
  }

  return (
    <AuthCtx.Provider value={{ company, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
