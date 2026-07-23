// In development: API_BASE is empty → Vite proxy forwards /api/* to localhost:3000
// In production (Vercel): API_BASE is the full backend URL from VITE_API_URL
const API_BASE = (() => {
  // Try VITE env variable first (works in production)
  try {
    const env = import.meta.env?.VITE_API_URL;
    if (env) return env;
  } catch {}
  // In development, use empty string (Vite proxy handles it)
  return "";
})();

export const TOKEN_KEY = "company_token";

class CompanyApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; company: any }>(
      "/api/company/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async logout() {
    try {
      await this.request("/api/company/auth/logout", { method: "POST" });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return this.request<any>("/api/company/auth/me");
  }

  // ─── Employees ───────────────────────────────────────────────────────────────

  async getEmployees() {
    const data = await this.request<any>("/api/company/employees");
    return data.employees ?? data;
  }

  async getEmployee(id: string) {
    return this.request<any>(`/api/company/employees/${id}`);
  }

  async createEmployee(data: Record<string, any>) {
    return this.request<any>("/api/company/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: Record<string, any>) {
    return this.request<any>(`/api/company/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string) {
    return this.request<any>(`/api/company/employees/${id}`, { method: "DELETE" });
  }

  // ─── Milestones ──────────────────────────────────────────────────────────────

  async getMilestones(employeeId: string) {
    const data = await this.request<any>(`/api/company/employees/${employeeId}/milestones`);
    return data.milestones ?? data;
  }

  async addMilestone(employeeId: string, data: Record<string, any>) {
    return this.request<any>(`/api/company/employees/${employeeId}/milestones`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMilestone(employeeId: string, milestoneId: string, data: Record<string, any>) {
    return this.request<any>(
      `/api/company/employees/${employeeId}/milestones/${milestoneId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    );
  }

  async deleteMilestone(employeeId: string, milestoneId: string) {
    return this.request<any>(
      `/api/company/employees/${employeeId}/milestones/${milestoneId}`,
      { method: "DELETE" }
    );
  }

  // ─── Devices ─────────────────────────────────────────────────────────────────

  async getDevices() {
    const data = await this.request<any>("/api/company/devices");
    return data.devices ?? data;
  }

  async revokeDevice(id: string) {
    return this.request<any>(`/api/company/devices/${id}`, { method: "DELETE" });
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async getSessions() {
    const data = await this.request<any>("/api/sessions/my");
    return data.sessions ?? data;
  }
}

export const companyApi = new CompanyApiClient();

// Backward compatibility wrapper
export async function api<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const options: RequestInit = { ...init };
  if (init.json !== undefined) {
    options.body = JSON.stringify(init.json);
    options.headers = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> || {}),
    };
  }
  return (companyApi as any).request<T>(path, options);
}

// Domain types
export interface Employee {
  _id: string;
  id?: string;
  name: string;
  department?: string;
  jobTitle?: string;
  accessCode?: string;
  isActive?: boolean;
}

export interface Device {
  _id: string;
  label: string;
  metaUserId?: string;
  isActive?: boolean;
  activatedAt?: string;
}

export interface Milestone {
  _id: string;
  trainingId?: string;
  targetDate?: string;
  notes?: string;
  status?: string;
}

export interface EvaluationCriterion {
  criteriaName: string;
  passed: boolean;
  score: number;
}

export interface Session {
  _id: string;
  company?: { companyName?: string };
  training?: { title?: string; category?: string };
  employee?: { name?: string };
  score: number;
  passed: boolean;
  attemptNumber?: number;
  durationSeconds?: number;
  completedAt?: string;
  evaluationCriteria?: EvaluationCriterion[];
  notes?: string;
}
