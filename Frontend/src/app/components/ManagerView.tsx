import { useState, useEffect } from 'react';
import VirtualOfficeCanvas from './VirtualOfficeCanvasV2';
import { Button } from './ui/button';
import BubbleMiniCard from './BubbleMiniCard';
import { stateManager } from '../utils/stateManagement';
import { wsManager } from '../utils/websocketMock';
import { useLang, LangSwitcher } from '../i18n/LangContext';

const AGENT_DEFS = [
  { id: 'RS', name: 'Researcher', roleKey: 'role_researcher', color: '#267ADE', state: 'thinking', stateKey: 'state_thinking', tokens: '2.4K' },
  { id: 'AN', name: 'Analyst',    roleKey: 'role_analyst',    color: '#E5BA2E', state: 'waiting', stateKey: 'state_waiting', tokens: '1.8K' },
  { id: 'WR', name: 'Writer',     roleKey: 'role_writer',     color: '#228B22', state: 'idle',    stateKey: 'state_idle',    tokens: '956'  },
  { id: 'RV', name: 'Reviewer',   roleKey: 'role_reviewer',   color: '#5E55EA', state: 'idle',    stateKey: 'state_idle',    tokens: '1.2K' },
  { id: 'DV', name: 'Developer',  roleKey: 'role_developer',  color: '#36454F', state: 'error',   stateKey: 'state_error',   tokens: '3.1K' },
];

const EVENT_DEFS = [
  { typeKey: 'evt_waiting', agent: 'Analyst',    color: '#DA3950', messageEn: 'Q2 charts ready, awaiting manager approval',    messageJa: 'Q2グラフ完成、管理者承認待ち',      time: '14:32:07' },
  { typeKey: 'evt_running', agent: 'Researcher', color: '#7D75F7', messageEn: 'Researching competitor pricing on the market',   messageJa: '市場での競合他社の価格調査中',       time: '14:31:52' },
  { typeKey: 'evt_error',   agent: 'Developer',  color: '#DA3950', messageEn: 'Network slow, retrying connection',             messageJa: 'ネットワーク遅延、再接続を試行中',   time: '14:31:20' },
  { typeKey: 'evt_done',    agent: 'Writer',     color: '#10B06B', messageEn: 'Report ready! Please review when available',    messageJa: 'レポート完成！ご確認ください',        time: '14:30:45' },
  { typeKey: 'evt_running', agent: 'Analyst',    color: '#7D75F7', messageEn: 'Analyzing March customer data',                 messageJa: '3月の顧客データを分析中',             time: '14:30:12' },
  { typeKey: 'evt_idle',    agent: 'Writer',     color: '#7D8BA3', messageEn: 'Task complete, standing by for next command',   messageJa: 'タスク完了、次の指示を待機中',        time: '14:29:33' },
  { typeKey: 'evt_done',    agent: 'Reviewer',   color: '#10B06B', messageEn: 'Marketing document review complete',            messageJa: 'マーケティング資料のレビュー完了',    time: '14:28:54' },
  { typeKey: 'evt_running', agent: 'Developer',  color: '#7D75F7', messageEn: 'Optimizing payment module code',               messageJa: '決済モジュールのコード最適化中',      time: '14:28:21' },
];

export default function ManagerView({ onViewChange }: { onViewChange: (view: 'dev' | 'replay') => void }) {
  const { t, lang } = useLang();
  const [selectedAgent, setSelectedAgent] = useState('RS');
  const [showBubbleCard, setShowBubbleCard] = useState(false);
  const [sessionCost, setSessionCost] = useState(0.0342);
  const [sessionDuration, setSessionDuration] = useState('14:36');

  const agents = AGENT_DEFS.map(a => ({ ...a, role: t(a.roleKey), stateLabel: t(a.stateKey) }));
  const events = EVENT_DEFS.map(e => ({ ...e, type: t(e.typeKey), message: lang === 'ja' ? e.messageJa : e.messageEn }));

  useEffect(() => {
    // Update session stats in real-time
    const updateStats = () => {
      const session = stateManager.getSession();
      if (session) {
        setSessionCost(session.cost);
        const minutes = Math.floor(session.duration / 60);
        const seconds = session.duration % 60;
        setSessionDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    stateManager.on('session:tick', updateStats);

    return () => {
      stateManager.off('session:tick', updateStats);
    };
  }, []);

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
          <span className="text-[10px] text-text-secondary">{t('sessionName')}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald/12 border border-emerald rounded px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald" />
            <span className="text-[11px] font-semibold text-emerald">{t('live')}</span>
          </div>

          <div className="flex items-center h-8 bg-card rounded-lg border border-border p-0.5">
            <button className="px-4 h-full text-[13px] font-semibold bg-primary text-primary-foreground rounded-md">
              {t('viewManager')}
            </button>
            <button
              className="px-4 h-full text-[13px] font-semibold text-text-secondary hover:text-foreground"
              onClick={() => onViewChange('dev')}
            >
              {t('viewDev')}
            </button>
          </div>

          <LangSwitcher />

          <div className="text-right">
            <div className="text-[14px] font-bold text-amber">${sessionCost.toFixed(4)}</div>
            <div className="text-[9px] text-text-secondary">{t('sessionCost')}</div>
          </div>

          <div className="flex items-center gap-2 h-8 px-3 bg-card rounded-lg border border-border">
            <div className="flex gap-0.5">
              {[3, 7, 11, 7, 3].map((h, i) => (
                <div key={i} className="w-1" style={{ height: `${h}px`, backgroundColor: '#5E55EA' }} />
              ))}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-bold">
            CEO
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[220px] bg-surface border-r border-border-subtle p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="text-[9px] font-semibold text-text-secondary mb-3 tracking-wide">
              {t('agents')}
            </div>

            <div className="space-y-2">
              {agents.map(agent => {
                const isActive = selectedAgent === agent.id;
                const stateColors: Record<string, string> = {
                  thinking: '#EB9619',
                  waiting: '#EB9619',
                  idle: '#7D8BA3',
                  error: '#DA3950'
                };

                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`w-full p-3 rounded-lg bg-card border transition-all ${
                      isActive
                        ? 'border-[1.5px]'
                        : 'border'
                    }`}
                    style={{
                      borderColor: isActive ? agent.color : 'var(--color-border)'
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{
                          backgroundColor: `${agent.color}15`,
                          color: agent.color
                        }}
                      >
                        {agent.id}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-[12px] font-medium truncate">{agent.name}</div>
                          <div className="text-[9px] text-text-muted">{agent.tokens}</div>
                        </div>
                        <div className="text-[10px] text-text-secondary truncate mb-1.5">
                          {agent.role}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-semibold"
                            style={{ color: stateColors[agent.state] }}
                          >
                            {agent.stateLabel}
                          </span>
                          <div
                            className="h-0.5 flex-1 rounded-full"
                            style={{ backgroundColor: stateColors[agent.state] }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="text-[9px] font-semibold text-text-secondary mb-3 tracking-wide">
              {t('session')}
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('duration')}</span>
                <span className="font-medium">{sessionDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('events')}</span>
                <span className="font-medium">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('toolCalls')}</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{t('approvals')}</span>
                <span className="font-medium text-amber">2</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-[14px]">{t('virtualOffice')}</h2>
                <div className="w-px h-4 bg-border-subtle" />
                <span className="text-[12px] text-text-secondary">{t('managerViewLabel')}</span>
              </div>

              <div className="flex gap-2">
                <button className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center text-[16px] hover:bg-card/80">
                  +
                </button>
                <button className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center text-[16px] hover:bg-card/80">
                  −
                </button>
              </div>
            </div>

            <div className="flex-1">
              <VirtualOfficeCanvas />
            </div>
          </div>
        </div>

        <div className="w-[382px] bg-surface border-l border-border-subtle p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-semibold text-text-secondary tracking-wide">
              {t('smartActivity')}
            </div>
            <div className="text-[10px] font-semibold text-primary">
              {t('ceoLanguage')}
            </div>
          </div>

          <div className="mb-6 p-4 bg-card border border-border rounded-xl">
            <div className="flex items-start gap-4">
              <div>
                <div className="text-[10px] text-text-secondary mb-1">{t('cost')}</div>
                <div className="text-[22px] font-bold text-amber">$0.0342</div>
                <div className="text-[10px] text-text-secondary">{t('currentSession')}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] text-text-secondary mb-1">{t('tokens')}</div>
                <div className="text-[16px] font-bold">9.5K</div>
                <div className="text-[10px] text-text-secondary">{t('totalUsed')}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-amber rounded-full" style={{ width: '25%' }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[9px] text-text-muted">
                <span>$0.03 / $0.50 {t('budget')}</span>
                <span>25%</span>
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold text-text-secondary tracking-wide">
              {t('eventsLabel')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-primary"
              onClick={() => onViewChange('replay')}
            >
              {t('viewReplay')}
            </Button>
          </div>

          <div className="space-y-2">
            {events.map((event, i) => (
              <div
                key={i}
                className="relative p-3 bg-card border border-border rounded-lg hover:border-border-subtle transition-colors"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
                  style={{ backgroundColor: event.color }}
                />

                <div className="flex items-start gap-2 mb-1.5">
                  <div
                    className="px-2 py-0.5 rounded text-[9px] font-semibold border"
                    style={{
                      backgroundColor: `${event.color}12`,
                      borderColor: `${event.color}40`,
                      color: event.color
                    }}
                  >
                    {event.type}
                  </div>
                  <div className="text-[9px] text-text-muted ml-auto">{event.time}</div>
                </div>

                <div
                  className="text-[11px] font-semibold mb-1"
                  style={{ color: event.color }}
                >
                  {event.agent}
                </div>

                <div className="text-[10px] text-text-secondary leading-relaxed">
                  {event.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
