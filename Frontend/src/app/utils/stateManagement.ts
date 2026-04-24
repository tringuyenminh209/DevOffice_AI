// Simple State Management for Agent Positions and Events

export interface AgentState {
  id: string;
  name: string;
  position: { x: number; y: number };
  targetZone: string;
  state: 'idle' | 'thinking' | 'tool_call' | 'waiting' | 'error';
  isMoving: boolean;
  color: string;
}

export interface SessionState {
  id: string;
  name: string;
  startTime: Date;
  duration: number;
  cost: number;
  events: any[];
  agents: Map<string, AgentState>;
}

class StateManager {
  private currentSession: SessionState | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  // Initialize session
  public initSession(sessionName: string) {
    this.currentSession = {
      id: `sess_${Date.now()}`,
      name: sessionName,
      startTime: new Date(),
      duration: 0,
      cost: 0,
      events: [],
      agents: new Map()
    };

    this.emit('session:init', this.currentSession);
  }

  // Update agent position
  public updateAgentPosition(agentId: string, position: { x: number; y: number }) {
    if (!this.currentSession) return;

    const agent = this.currentSession.agents.get(agentId);
    if (agent) {
      agent.position = position;
      this.emit('agent:move', { agentId, position });
    }
  }

  // Update agent state
  public updateAgentState(agentId: string, state: AgentState['state']) {
    if (!this.currentSession) return;

    const agent = this.currentSession.agents.get(agentId);
    if (agent) {
      agent.state = state;
      this.emit('agent:state', { agentId, state });
    }
  }

  // Add event to session
  public addEvent(event: any) {
    if (!this.currentSession) return;

    this.currentSession.events.push({
      ...event,
      timestamp: new Date().toISOString()
    });

    if (event.cost) {
      this.currentSession.cost += event.cost;
    }

    this.emit('event:add', event);
  }

  // Get current session
  public getSession(): SessionState | null {
    return this.currentSession;
  }

  // Get agent state
  public getAgent(agentId: string): AgentState | null {
    if (!this.currentSession) return null;
    return this.currentSession.agents.get(agentId) || null;
  }

  // Subscribe to events
  public on(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  // Unsubscribe from events
  public off(eventType: string, callback: Function) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Emit events
  private emit(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Register agent
  public registerAgent(agent: AgentState) {
    if (!this.currentSession) return;
    this.currentSession.agents.set(agent.id, agent);
    this.emit('agent:register', agent);
  }

  // Get all agents
  public getAllAgents(): AgentState[] {
    if (!this.currentSession) return [];
    return Array.from(this.currentSession.agents.values());
  }

  // Update session duration
  public updateDuration() {
    if (!this.currentSession) return;

    const now = new Date();
    this.currentSession.duration = Math.floor(
      (now.getTime() - this.currentSession.startTime.getTime()) / 1000
    );

    this.emit('session:tick', {
      duration: this.currentSession.duration,
      cost: this.currentSession.cost
    });
  }

  // Export session data
  public exportSession() {
    if (!this.currentSession) return null;

    return {
      ...this.currentSession,
      agents: Array.from(this.currentSession.agents.values())
    };
  }
}

export const stateManager = new StateManager();

// Auto-update duration every second
if (typeof window !== 'undefined') {
  setInterval(() => {
    stateManager.updateDuration();
  }, 1000);
}
