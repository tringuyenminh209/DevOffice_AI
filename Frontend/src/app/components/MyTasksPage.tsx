import { useState } from 'react';
import type { AppNav } from '../App';

type TaskStatus = 'running' | 'awaiting_approval' | 'completed' | 'failed';
type FilterTab = 'all' | TaskStatus;

interface Task {
  id: string;
  companyId: string;
  companyName: string;
  companyColor: string;
  title: string;
  status: TaskStatus;
  submittedAt: string;
  completedAt: string | null;
  creditsUsed: number;
}

const MOCK_TASKS: Task[] = [
  {
    id: 't1', companyId: 'MK', companyName: 'Marketing Crew', companyColor: '#DA3950',
    title: 'ランディングページのコピーライティング', status: 'completed',
    submittedAt: '2026-04-24T10:00:00Z', completedAt: '2026-04-24T10:28:00Z', creditsUsed: 10,
  },
  {
    id: 't2', companyId: 'DV', companyName: 'Dev Team', companyColor: '#5E55EA',
    title: 'APIエンドポイントの設計レビュー', status: 'running',
    submittedAt: '2026-04-25T09:00:00Z', completedAt: null, creditsUsed: 0,
  },
  {
    id: 't3', companyId: 'AN', companyName: 'Analytics', companyColor: '#10B06B',
    title: 'Q1売上データの分析レポート', status: 'awaiting_approval',
    submittedAt: '2026-04-25T08:30:00Z', completedAt: null, creditsUsed: 0,
  },
  {
    id: 't4', companyId: 'LG', companyName: 'Legal Review', companyColor: '#9333EA',
    title: '利用規約の法的チェック', status: 'completed',
    submittedAt: '2026-04-23T14:00:00Z', completedAt: '2026-04-23T14:42:00Z', creditsUsed: 12,
  },
  {
    id: 't5', companyId: 'RS', companyName: 'Research Lab', companyColor: '#267ADE',
    title: '競合他社の市場調査', status: 'failed',
    submittedAt: '2026-04-22T11:00:00Z', completedAt: null, creditsUsed: 0,
  },
  {
    id: 't6', companyId: 'MK', companyName: 'Marketing Crew', companyColor: '#DA3950',
    title: 'SNSキャンペーン企画', status: 'completed',
    submittedAt: '2026-04-21T09:00:00Z', completedAt: '2026-04-21T09:35:00Z', creditsUsed: 10,
  },
];

const STATUS_CFG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  running:           { label: '実行中',   color: '#10B06B', bg: 'rgba(16,176,107,0.12)' },
  awaiting_approval: { label: '承認待ち', color: '#EB9619', bg: 'rgba(235,150,25,0.12)' },
  completed:         { label: '完了',     color: '#267ADE', bg: 'rgba(38,122,222,0.12)'  },
  failed:            { label: '失敗',     color: '#DA3950', bg: 'rgba(218,57,80,0.12)'   },
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',               label: 'すべて'   },
  { key: 'running',           label: '実行中'   },
  { key: 'awaiting_approval', label: '承認待ち' },
  { key: 'completed',         label: '完了'     },
  { key: 'failed',            label: '失敗'     },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function elapsed(start: string, end: string | null) {
  if (!end) return null;
  const min = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${min}分`;
}

export default function MyTasksPage({ nav }: { nav: AppNav }) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const counts: Record<FilterTab, number> = {
    all:               MOCK_TASKS.length,
    running:           MOCK_TASKS.filter(t => t.status === 'running').length,
    awaiting_approval: MOCK_TASKS.filter(t => t.status === 'awaiting_approval').length,
    completed:         MOCK_TASKS.filter(t => t.status === 'completed').length,
    failed:            MOCK_TASKS.filter(t => t.status === 'failed').length,
  };

  const filtered = filter === 'all' ? MOCK_TASKS : MOCK_TASKS.filter(t => t.status === filter);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 bg-surface border-b border-border flex items-center gap-3 px-6 shrink-0">
        <button
          onClick={() => nav.goto('world')}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          World Map
        </button>
        <span className="text-muted-foreground text-[13px]">/</span>
        <span className="text-[13px] font-semibold">マイタスク</span>
        <div className="flex-1" />
        <button
          onClick={() => nav.goto('credits')}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="font-semibold text-primary">{nav.credits}</span>
          <span>cr</span>
        </button>
      </header>

      <div className="flex-1 max-w-[860px] w-full mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold mb-1">マイタスク</h1>
          <p className="text-[13px] text-muted-foreground">依頼したタスクの進捗と結果を確認できます</p>
        </div>

        <div className="flex gap-1 mb-6 bg-card border border-border rounded-lg p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: filter === tab.key ? '#1D202B' : 'transparent',
                color: filter === tab.key ? '#EAEDEC' : '#7D8BA3',
              }}
            >
              {tab.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: filter === tab.key ? 'rgba(94,85,234,0.2)' : 'rgba(125,139,163,0.15)',
                  color: filter === tab.key ? '#5E55EA' : '#7D8BA3',
                }}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="py-20 text-center text-[13px] text-muted-foreground">
              タスクがありません
            </div>
          )}
          {filtered.map(task => {
            const cfg = STATUS_CFG[task.status];
            const dur = elapsed(task.submittedAt, task.completedAt);
            return (
              <button
                key={task.id}
                onClick={() => nav.goto('task-detail', { taskId: task.id })}
                className="w-full text-left bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-primary/5 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: task.companyColor + '20', border: `1.5px solid ${task.companyColor}40`, color: task.companyColor }}
                  >
                    {task.companyId}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                      {task.status === 'awaiting_approval' && (
                        <span
                          className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full animate-pulse"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          要確認
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
                      <span>{task.companyName}</span>
                      <span>·</span>
                      <span>依頼: {formatDate(task.submittedAt)}</span>
                      {dur && (
                        <>
                          <span>·</span>
                          <span>所要: {dur}</span>
                        </>
                      )}
                      {task.status === 'running' && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block animate-pulse" />
                            処理中
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {task.creditsUsed > 0 && (
                      <span className="text-[12px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{task.creditsUsed}</span> cr
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-md"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-muted-foreground group-hover:text-foreground transition-colors">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
