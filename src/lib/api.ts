const API_BASE = (() => {
  try {
    const env = import.meta.env?.VITE_API_URL;
    if (env) return env;
  } catch {}
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
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken() {
    if (typeof window !== "undefined") return localStorage.getItem(TOKEN_KEY);
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const data = await this.request("/api/company/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    try { await this.request("/api/company/auth/logout", { method: "POST" }); }
    finally { this.setToken(null); }
  }

  async getMe() {
    return this.request("/api/company/auth/me");
  }

  // ─── Trainings ────────────────────────────────────────────────────────────

  async getMyTrainings() {
    const data = await this.request("/api/company/trainings");
    return data.trainings ?? data;
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────

  async getQuiz(trainingId: string) {
    return this.request(`/api/company/trainings/${trainingId}/quiz/edit`);
  }

  async createQuiz(trainingId: string, data: any) {
    return this.request(`/api/company/trainings/${trainingId}/quiz`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateQuiz(trainingId: string, data: any) {
    return this.request(`/api/company/trainings/${trainingId}/quiz`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(trainingId: string) {
    return this.request(`/api/company/trainings/${trainingId}/quiz`, {
      method: "DELETE",
    });
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  async getEmployees() {
    const data = await this.request("/api/company/employees");
    return data.employees ?? data;
  }

  async getEmployee(id: string) {
    return this.request(`/api/company/employees/${id}`);
  }

  async createEmployee(data: any) {
    return this.request("/api/company/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: any) {
    return this.request(`/api/company/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string) {
    return this.request(`/api/company/employees/${id}`, { method: "DELETE" });
  }

  // ─── Milestones ───────────────────────────────────────────────────────────

  async getMilestones(employeeId: string) {
    const data = await this.request(`/api/company/employees/${employeeId}/milestones`);
    return data.milestones ?? data;
  }

  async addMilestone(employeeId: string, data: any) {
    return this.request(`/api/company/employees/${employeeId}/milestones`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMilestone(employeeId: string, milestoneId: string, data: any) {
    return this.request(`/api/company/employees/${employeeId}/milestones/${milestoneId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteMilestone(employeeId: string, milestoneId: string) {
    return this.request(`/api/company/employees/${employeeId}/milestones/${milestoneId}`, {
      method: "DELETE",
    });
  }

  // ─── Devices ──────────────────────────────────────────────────────────────

  async getDevices() {
    const data = await this.request("/api/company/devices");
    return data.devices ?? data;
  }

  async revokeDevice(id: string) {
    return this.request(`/api/company/devices/${id}`, { method: "DELETE" });
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async getSessions() {
    const data = await this.request("/api/sessions/my");
    return data.sessions ?? data;
  }
}

export const companyApi = new CompanyApiClient();

export async function api(path: string, init: any = {}): Promise<any> {
  const options: any = { ...init };
  if (init.json !== undefined) {
    options.body = JSON.stringify(init.json);
    options.headers = {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    };
  }
  return (companyApi as any).request(path, options);
}
