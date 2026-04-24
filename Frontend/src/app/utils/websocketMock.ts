// WebSocket Mock for Real-time Event Simulation

export interface AgentEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'state_change' | 'tool_call' | 'message' | 'error' | 'approval_required';
  state?: string;
  tool?: string;
  message?: string;
  payload?: any;
  cost?: number;
  status: 'pending' | 'completed' | 'error' | 'approval_required';
}

export class WebSocketMock {
  private listeners: Map<string, Function[]> = new Map();
  private intervalId: number | null = null;
  private eventQueue: AgentEvent[] = [];

  constructor() {
    this.initializeEvents();
  }

  private initializeEvents() {
    // Pre-populate with realistic event sequence
    this.eventQueue = [
      {
        id: 'evt_001',
        timestamp: new Date().toISOString(),
        agentId: 'RS',
        agentName: 'Researcher',
        type: 'state_change',
        state: 'thinking',
        status: 'completed'
      },
      {
        id: 'evt_002',
        timestamp: new Date(Date.now() + 2000).toISOString(),
        agentId: 'RS',
        agentName: 'Researcher',
        type: 'tool_call',
        tool: 'web_search',
        payload: { query: 'competitor pricing Q2 2026' },
        cost: 0.0012,
        status: 'completed'
      },
      {
        id: 'evt_003',
        timestamp: new Date(Date.now() + 5000).toISOString(),
        agentId: 'AN',
        agentName: 'Analyst',
        type: 'state_change',
        state: 'thinking',
        status: 'completed'
      },
      {
        id: 'evt_004',
        timestamp: new Date(Date.now() + 8000).toISOString(),
        agentId: 'AN',
        agentName: 'Analyst',
        type: 'tool_call',
        tool: 'send_email',
        payload: { to: 'vip_customers@list', subject: 'Q2 Analysis' },
        cost: 0.0008,
        status: 'approval_required'
      },
      {
        id: 'evt_005',
        timestamp: new Date(Date.now() + 12000).toISOString(),
        agentId: 'WR',
        agentName: 'Writer',
        type: 'message',
        message: 'Draft Q2 marketing email',
        cost: 0.0089,
        status: 'completed'
      },
      {
        id: 'evt_006',
        timestamp: new Date(Date.now() + 15000).toISOString(),
        agentId: 'DV',
        agentName: 'Developer',
        type: 'error',
        message: 'NetworkError: timeout after 5000ms',
        status: 'error'
      },
      {
        id: 'evt_007',
        timestamp: new Date(Date.now() + 18000).toISOString(),
        agentId: 'WR',
        agentName: 'Writer',
        type: 'state_change',
        state: 'idle',
        status: 'completed'
      }
    ];
  }

  public connect() {
    console.log('[WebSocket Mock] Connected');

    this.intervalId = window.setInterval(() => {
      if (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        this.emit('event', event);

        // Add random new events
        if (Math.random() > 0.7) {
          this.generateRandomEvent();
        }
      } else {
        // Regenerate events when queue is empty
        this.generateRandomEvent();
      }
    }, 3000);
  }

  public disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[WebSocket Mock] Disconnected');
  }

  public on(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  public off(eventType: string, callback: Function) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(eventType: string, data: any) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(callback => callback(data));
    }
  }

  private generateRandomEvent() {
    const agents = ['RS', 'AN', 'WR', 'RV', 'DV'];
    const agentNames = ['Researcher', 'Analyst', 'Writer', 'Reviewer', 'Developer'];
    const types: AgentEvent['type'][] = ['state_change', 'tool_call', 'message'];

    const randomAgentIndex = Math.floor(Math.random() * agents.length);
    const randomType = types[Math.floor(Math.random() * types.length)];

    const event: AgentEvent = {
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      agentId: agents[randomAgentIndex],
      agentName: agentNames[randomAgentIndex],
      type: randomType,
      status: 'completed'
    };

    if (randomType === 'state_change') {
      event.state = ['idle', 'thinking'][Math.floor(Math.random() * 2)];
    } else if (randomType === 'tool_call') {
      const tools = ['web_search', 'sql_query', 'code_execution'];
      event.tool = tools[Math.floor(Math.random() * tools.length)];
      event.cost = 0.0001 + Math.random() * 0.01;
    } else if (randomType === 'message') {
      const messages = [
        'Analyzing data...',
        'Generating report...',
        'Reviewing document...',
        'Optimizing code...'
      ];
      event.message = messages[Math.floor(Math.random() * messages.length)];
      event.cost = 0.005 + Math.random() * 0.005;
    }

    this.eventQueue.push(event);
  }

  // Simulate user approval
  public approveEvent(eventId: string) {
    this.emit('approval', { eventId, status: 'approved' });
  }

  // Simulate user rejection
  public rejectEvent(eventId: string) {
    this.emit('rejection', { eventId, status: 'rejected' });
  }
}

export const wsManager = new WebSocketMock();
