import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { companyApi } from "./api";

interface AuthContextType {
  company: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = companyApi.getToken();
    if (token) {
      companyApi.getMe()
        .then((data: any) => setCompany(data.company ?? data))
        .catch(() => companyApi.setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await companyApi.login(email, password);
    setCompany(data.company);
  };

  const logout = async () => {
    await companyApi.logout();
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ company, isAuthenticated: !!company, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
