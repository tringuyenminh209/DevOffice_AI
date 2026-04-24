import { useState } from 'react';

const agents = [
  { id: 'all', name: 'All Agents', count: 47 },
  { id: 'RS', name: 'Researcher', color: '#267ADE', count: 12 },
  { id: 'AN', name: 'Analyst', color: '#E5BA2E', count: 8 },
  { id: 'WR', name: 'Writer', color: '#228B22', count: 11 },
  { id: 'RV', name: 'Reviewer', color: '#5E55EA', count: 9 },
  { id: 'DV', name: 'Developer', color: '#36454F', count: 7 }
];

const eventTypes = ['All', 'tool_call', 'state_change', 'message', 'error'];

const events = [
  {
    type: 'TOOL_CALL',
    agent: 'Analyst',
    agentId: 'AN',
    color: '#E5BA2E',
    payload: 'web_search(query="competitor pricing Q2 2026")',
    time: '14:32:07',
    cost: '+$0.0012',
    status: 'approval_required',
    sessionId: 'sess_9k2m4n',
    tool: 'web_search'
  },
  {
    type: 'STATE',
    agent: 'Researcher',
    agentId: 'RS',
    color: '#267ADE',
    payload: 'state_change: idle → thinking',
    time: '14:31:52',
    cost: '',
    status: 'completed'
  },
  {
    type: 'ERROR',
    agent: 'Developer',
    agentId: 'DV',
    color: '#36454F',
    payload: 'NetworkError: timeout after 5000ms',
    time: '14:31:20',
    cost: '',
    status: 'error'
  },
  {
    type: 'MESSAGE',
    agent: 'Writer',
    agentId: 'WR',
    color: '#228B22',
    payload: 'llm_generation(prompt="Draft Q2 marketing email")',
    time: '14:30:45',
    cost: '+$0.0089',
    status: 'completed'
  },
  {
    type: 'TOOL_CALL',
    agent: 'Analyst',
    agentId: 'AN',
    color: '#E5BA2E',
    payload: 'sql_query(table="customers", filter="created_at >= 2026-03-01")',
    time: '14:30:12',
    cost: '+$0.0004',
    status: 'completed'
  },
  {
    type: 'STATE',
    agent: 'Writer',
    agentId: 'WR',
    color: '#228B22',
    payload: 'state_change: thinking → idle',
    time: '14:29:33',
    cost: '',
    status: 'completed'
  },
  {
    type: 'MESSAGE',
    agent: 'Reviewer',
    agentId: 'RV',
    color: '#5E55EA',
    payload: 'llm_generation(prompt="Review marketing doc for accuracy")',
    time: '14:28:54',
    cost: '+$0.0067',
    status: 'completed'
  },
  {
    type: 'TOOL_CALL',
    agent: 'Developer',
    agentId: 'DV',
    color: '#36454F',
    payload: 'code_execution(file="payment_processor.py", function="optimize_query")',
    time: '14:28:21',
    cost: '+$0.0003',
    status: 'completed'
  },
  {
    type: 'STATE',
    agent: 'Analyst',
    agentId: 'AN',
    color: '#E5BA2E',
    payload: 'state_change: idle → thinking',
    time: '14:27:45',
    cost: '',
    status: 'completed'
  },
  {
    type: 'TOOL_CALL',
    agent: 'Researcher',
    agentId: 'RS',
    color: '#267ADE',
    payload: 'web_search(query="industry trends AI automation 2026")',
    time: '14:27:12',
    cost: '+$0.0011',
    status: 'completed'
  }
];

const selectedEventDetail = {
  agentId: 'AN',
  sessionId: 'sess_9k2m4n',
  eventType: 'tool_call',
  tool: 'web_search',
  status: 'approval_required',
  requested: '14:32:07',
  payload: {
    query: 'competitor pricing Q2 2026',
    max_results: 10,
    time_range: '30d'
  },
  tokens: {
    in: 245,
    out: 1823,
    total: 2068,
    cost: '$0.0012'
  },
  callStack: [
    'MarketingWorkflow.analyze_competitors()',
    'ResearchAgent.gather_pricing_data()',
    'ToolExecutor.web_search()'
  ]
};

export default function DevView({ onViewChange }: { onViewChange: (view: 'manager' | 'replay') => void }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('All');

  return (
    <div className="h-screen bg-background dark flex flex-col">
      <div className="h-14 bg-surface border-b border-border-subtle flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-[14px]">
              D
            </div>
            <span className="font-bold text-[15px]">DevOffice AI</span>
          </div>
          <span className="text-[10px] text-text-secondary">Phiên Marketing Q2</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald/12 border border-emerald rounded px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald" />
            <span className="text-[11px] font-semibold text-emerald">LIVE</span>
          </div>

          <div className="flex items-center h-8 bg-card rounded-lg border border-border p-0.5">
            <button
              className="px-4 h-full text-[13px] font-semibold text-text-secondary hover:text-foreground"
              onClick={() => onViewChange('manager')}
            >
              Manager
            </button>
            <button className="px-4 h-full text-[13px] font-semibold bg-primary text-primary-foreground rounded-md">
              Dev
            </button>
          </div>

          <div className="text-right">
            <div className="text-[14px] font-bold text-amber">$0.0342</div>
            <div className="text-[9px] text-text-secondary">Session cost</div>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-bold">
            CEO
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[220px] bg-surface border-r border-border-subtle p-4 overflow-y-auto">
          <div className="text-[9px] font-semibold text-text-secondary mb-3 tracking-wide">
            FILTER BY AGENT
          </div>

          <div className="space-y-1">
            {agents.map(agent => {
              const isActive = selectedFilter === agent.id;

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedFilter(agent.id)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-card border-border hover:border-border-subtle'
                  }`}
                >
                  {agent.id !== 'all' && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: `${agent.color}15`,
                        color: agent.color
                      }}
                    >
                      {agent.id}
                    </div>
                  )}

                  <div className="flex-1 text-left">
                    <div className="text-[12px] font-medium">{agent.name}</div>
                  </div>

                  <div className="text-[10px] text-text-muted">{agent.count}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="h-[52px] bg-card border border-border rounded-lg px-4 flex items-center gap-3 mb-4">
            <span className="text-[12px] text-text-secondary">Filter:</span>
            <div className="flex gap-2">
              {eventTypes.map(type => {
                const isActive = selectedEventType === type;

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedEventType(type)}
                    className={`px-3 py-1.5 rounded text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border text-text-secondary hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-semibold text-text-secondary tracking-wide">
              EVENT TRACE
            </div>
            <div className="text-[9px] text-text-muted">
              {events.length} events
            </div>
          </div>

          <div className="space-y-2">
            {events.map((event, i) => {
              const isSelected = i === 0;
              const typeColors: Record<string, string> = {
                TOOL_CALL: '#7D75F7',
                STATE: '#7D8BA3',
                MESSAGE: '#10B06B',
                ERROR: '#DA3950'
              };

              return (
                <div
                  key={i}
                  className={`relative p-4 bg-card rounded-lg border transition-all ${
                    isSelected ? 'border-crimson border-[1.5px]' : 'border-border hover:border-border-subtle'
                  }`}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
                    style={{ backgroundColor: typeColors[event.type] }}
                  />

                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="px-2 py-1 rounded text-[9px] font-semibold border"
                      style={{
                        backgroundColor: `${typeColors[event.type]}12`,
                        borderColor: `${typeColors[event.type]}40`,
                        color: typeColors[event.type]
                      }}
                    >
                      {event.type}
                    </div>

                    <div
                      className="text-[12px] font-semibold"
                      style={{ color: event.color }}
                    >
                      {event.agent}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      {event.cost && (
                        <div className="text-[9px] font-medium text-amber">{event.cost}</div>
                      )}
                      {event.status === 'approval_required' && (
                        <div className="px-2 py-0.5 rounded text-[9px] font-semibold bg-crimson text-white">
                          Needs Approval
                        </div>
                      )}
                      <div className="text-[9px] text-text-muted">{event.time}</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-text-secondary font-mono bg-background/50 rounded px-2 py-1.5">
                    {event.payload}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[440px] bg-surface border-l border-border-subtle p-4 overflow-y-auto">
          <div className="text-[9px] font-semibold text-text-secondary mb-4 tracking-wide">
            EVENT DETAIL
          </div>

          <div className="mb-4 p-3 bg-card border-crimson border-[1.5px] rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: '#E5BA2E15',
                  color: '#E5BA2E'
                }}
              >
                AN
              </div>
              <div className="text-[12px] font-semibold">Analyst · tool_call</div>
              <div className="ml-auto text-[9px] text-text-muted">14:32:07</div>
            </div>
          </div>

          <div className="space-y-0 mb-6">
            {[
              { label: 'Agent ID', value: selectedEventDetail.agentId },
              { label: 'Session ID', value: selectedEventDetail.sessionId },
              { label: 'Event Type', value: selectedEventDetail.eventType },
              { label: 'Tool', value: selectedEventDetail.tool },
              { label: 'Status', value: selectedEventDetail.status },
              { label: 'Requested', value: selectedEventDetail.requested }
            ].map((field, i, arr) => (
              <div
                key={i}
                className={`flex items-center justify-between py-2.5 px-3 ${
                  i !== arr.length - 1 ? 'border-b border-border-inner' : ''
                }`}
              >
                <div className="text-[10px] text-text-secondary">{field.label}</div>
                <div className="text-[11px] font-medium">{field.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="text-[9px] font-semibold text-text-secondary mb-2 tracking-wide">
              PAYLOAD
            </div>
            <div className="p-3 bg-[#070B0D] border border-border rounded-lg">
              <pre className="text-[11px] font-mono text-[#10D062] leading-relaxed overflow-x-auto">
                {JSON.stringify(selectedEventDetail.payload, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[9px] font-semibold text-text-secondary mb-2 tracking-wide">
              TOKENS
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'In', value: selectedEventDetail.tokens.in, color: '#267ADE' },
                { label: 'Out', value: selectedEventDetail.tokens.out, color: '#10B06B' },
                { label: 'Total', value: selectedEventDetail.tokens.total, color: '#EAEDEC' },
                { label: 'Cost', value: selectedEventDetail.tokens.cost, color: '#EB9619' }
              ].map((stat, i) => (
                <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
                  <div className="text-[9px] text-text-secondary mb-1">{stat.label}</div>
                  <div className="text-[13px] font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] font-semibold text-text-secondary mb-2 tracking-wide">
              CALL STACK
            </div>
            <div className="p-3 bg-[#070B0D] border border-border rounded-lg">
              <pre className="text-[10px] font-mono text-text-secondary leading-relaxed">
                {selectedEventDetail.callStack.join('\n')}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
