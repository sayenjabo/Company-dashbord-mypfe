export const API_BASE = "http://localhost:3000";
export const TOKEN_KEY = "company_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, body });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) || `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

// Domain types
export interface Company {
  _id?: string;
  companyName?: string;
  email?: string;
  [k: string]: unknown;
}
export interface Employee {
  _id: string;
  name: string;
  department?: string;
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
}
