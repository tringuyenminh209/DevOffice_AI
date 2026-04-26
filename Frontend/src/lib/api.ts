import { supabase } from './supabase';
import type {
  Envelope, Company, CompanyDetail, Task, TaskEvent, Approval, CreditsBalance, ResultURL,
} from './types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class APIError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let env: Envelope<T>;
  try {
    env = await res.json();
  } catch {
    throw new APIError(res.status, 'parse_error', `non-JSON response (${res.status})`);
  }
  if (!env.success) {
    throw new APIError(res.status, env.error.code, env.error.message);
  }
  return env.data;
}

export const api = {
  // Companies
  listCompanies: () =>
    request<{ companies: Company[] }>('GET', '/api/v1/companies').then(r => r.companies),
  getCompany: (id: string) =>
    request<CompanyDetail>('GET', `/api/v1/companies/${id}`),

  // World snapshot
  getWorld: () =>
    request<{ companies: Company[]; messages: unknown[] }>('GET', '/api/v1/world'),

  // Tasks
  createTask: (companyId: string, brief: string) =>
    request<Task>('POST', '/api/v1/tasks', { companyId, brief }),
  listTasks: (limit = 20) =>
    request<{ items: Task[] }>('GET', `/api/v1/tasks?limit=${limit}`).then(r => r.items),
  getTask: (id: string) =>
    request<Task>('GET', `/api/v1/tasks/${id}`),
  getTaskEvents: (id: string, limit = 100) =>
    request<{ items: TaskEvent[] }>('GET', `/api/v1/tasks/${id}/events?limit=${limit}`).then(r => r.items),
  getTaskResult: (id: string) =>
    request<ResultURL>('GET', `/api/v1/tasks/${id}/result`),

  // Approvals
  listApprovals: () =>
    request<{ items: Approval[] }>('GET', '/api/v1/approvals').then(r => r.items),
  getApproval: (id: string) =>
    request<Approval>('GET', `/api/v1/approvals/${id}`),
  resolveApproval: (id: string, decision: 'approved' | 'rejected', rejectionNote?: string) =>
    request<Approval>('PATCH', `/api/v1/approvals/${id}`, { decision, rejectionNote }),

  // Credits
  getCreditsBalance: () =>
    request<CreditsBalance>('GET', '/api/v1/credits/balance'),
  devGrantCredits: (amount = 100) =>
    request<CreditsBalance>('POST', '/api/v1/credits/dev-grant', { amount }),
};

export { APIError };
