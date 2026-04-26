// Match Go API envelope shape

export type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export interface Company {
  id: string;
  workflowType: 'MK' | 'DV' | 'LG' | 'RS' | 'AN';
  name: string;
  gridX: number;
  gridY: number;
  activeTasks: number;
  status: 'idle' | 'running' | 'awaiting_approval';
  buildingColor: string;
  creditsPerTask: number;
  avgMinutes: number;
  description?: string;
}

export interface CompanyDetail extends Company {
  defaultAgents: Array<{ id: string; role: string; color?: string }>;
}

export type TaskStatus = 'queued' | 'running' | 'awaiting_approval' | 'completed' | 'failed';

export interface Task {
  id: string;
  userId: string;
  companyId: string;
  brief: string;
  status: TaskStatus;
  creditsCharged: number;
  resultUrl?: string;
  resultType?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  agentId?: string;
  eventType: string; // task.started | agent.state | agent.tool_call | approval.required | task.completed | task.failed
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Approval {
  id: string;
  taskId: string;
  actionName: string;
  actionPayload: Record<string, unknown>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  rejectionNote?: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface CreditsBalance {
  userId: string;
  creditsBalance: number;
  recentTx: Array<{
    id: string;
    amount: number;
    txType: 'purchase' | 'debit' | 'refund';
    description?: string;
    createdAt: string;
  }>;
}

export interface ResultURL {
  taskId: string;
  resultUrl: string;
  resultType?: string;
  expiresIn: number;
}
