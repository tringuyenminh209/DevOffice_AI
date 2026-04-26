import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { toast } from './ui/sonner';
import type { AppNav } from '../App';
import { useTaskStore } from '../../stores/task';
import { useWorldStore } from '../../stores/world';
import { api } from '../../lib/api';
import type { TaskEvent as RealTaskEvent } from '../../lib/types';

// Browser Notification permission helper
function ensureNotifyPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

function notify(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification(title, { body, silent: false }); } catch { /* noop */ }
  }
}

type TaskStatus = 'running' | 'awaiting_approval' | 'completed' | 'failed';
type EventType = 'start' | 'tool' | 'thinking' | 'complete' | 'approval' | 'error';

interface TaskEvent {
  time: string;
  type: EventType;
  message: string;
}

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
  brief: string;
  events: TaskEvent[];
  resultFile?: string;
}

const MOCK_TASKS: Record<string, Task> = {
  t1: {
    id: 't1', companyId: 'MK', companyName: 'Marketing Crew', companyColor: '#DA3950',
    title: 'ランディングページのコピーライティング', status: 'completed',
    submittedAt: '2026-04-24T10:00:00Z', completedAt: '2026-04-24T10:28:00Z', creditsUsed: 10,
    brief: 'SNS広告向けのランディングページ用コピーを作成してください。ターゲットは30代のビジネスパーソン。A/Bテスト用のバリエーションも3パターン用意してください。',
    resultFile: 'lp_copy_v1.pdf',
    events: [
      { time: '10:00:12', type: 'start',    message: 'タスク受付完了 — Marketing Crew に割り当て済み' },
      { time: '10:02:34', type: 'tool',     message: 'search_web("ランディングページ コピーライティング 30代 ビジネス 事例 2026")' },
      { time: '10:08:15', type: 'thinking', message: 'ターゲット分析: 30代ビジネスパーソンの意思決定パターンと訴求ポイントを整理中' },
      { time: '10:15:42', type: 'tool',     message: 'generate_copy({ tone: "professional", audience: "30s_business", cta: true, variants: 3 })' },
      { time: '10:22:08', type: 'thinking', message: 'バリエーションA/B/Cのヘッドライン評価スコアを算出中 (Flesch-Kincaid + 感情スコア)' },
      { time: '10:27:55', type: 'complete', message: '成果物 lp_copy_v1.pdf をS3にアップロード完了' },
    ],
  },
  t2: {
    id: 't2', companyId: 'DV', companyName: 'Dev Team', companyColor: '#5E55EA',
    title: 'APIエンドポイントの設計レビュー', status: 'running',
    submittedAt: '2026-04-25T09:00:00Z', completedAt: null, creditsUsed: 0,
    brief: 'RESTful APIの設計ドキュメント (api_design_v2.pdf) をレビューし、改善点を提案してください。セキュリティとスケーラビリティの観点を特に重視してください。',
    events: [
      { time: '09:00:05', type: 'start',    message: 'タスク受付完了 — Dev Team に割り当て済み' },
      { time: '09:03:22', type: 'tool',     message: 'read_document("api_design_v2.pdf")' },
      { time: '09:10:44', type: 'thinking', message: 'RESTful設計原則 (RFC 7231) との整合性を確認中 — 24エンドポイント解析' },
      { time: '09:18:30', type: 'tool',     message: 'run_security_scan({ endpoints: 24, checks: ["auth", "rate_limit", "input_validation"] })' },
      { time: '09:25:00', type: 'thinking', message: 'セキュリティ脆弱性の優先度付けとリファクタリング提案を作成中...' },
    ],
  },
  t3: {
    id: 't3', companyId: 'AN', companyName: 'Analytics', companyColor: '#10B06B',
    title: 'Q1売上データの分析レポート', status: 'awaiting_approval',
    submittedAt: '2026-04-25T08:30:00Z', completedAt: null, creditsUsed: 0,
    brief: '第1四半期の売上データを分析し、トレンドと改善策をレポートにまとめてください。役員向けプレゼン用のエグゼクティブサマリーも含めてください。',
    events: [
      { time: '08:30:10', type: 'start',    message: 'タスク受付完了 — Analytics に割り当て済み' },
      { time: '08:33:45', type: 'tool',     message: 'read_csv("q1_sales_data.csv") — 15,420行を読み込み' },
      { time: '08:40:22', type: 'thinking', message: '前年同期比 +23.4% を確認。地域別・製品カテゴリ別のブレークダウンを計算中' },
      { time: '08:52:18', type: 'tool',     message: 'generate_chart({ type: "bar+line", metrics: ["revenue", "yoy_growth", "margin"] })' },
      { time: '08:58:44', type: 'approval', message: '承認ゲートで停止: send_email を使用して board@company.jp に分析レポートを送信しようとしています' },
    ],
  },
  t4: {
    id: 't4', companyId: 'LG', companyName: 'Legal Review', companyColor: '#9333EA',
    title: '利用規約の法的チェック', status: 'completed',
    submittedAt: '2026-04-23T14:00:00Z', completedAt: '2026-04-23T14:42:00Z', creditsUsed: 12,
    brief: '新サービスの利用規約について、日本の消費者契約法・特定商取引法に基づいてレビューしてください。問題箇所と修正案を具体的に指摘してください。',
    resultFile: 'legal_review_tos_v1.pdf',
    events: [
      { time: '14:00:08', type: 'start',    message: 'タスク受付完了 — Legal Review に割り当て済み' },
      { time: '14:04:15', type: 'tool',     message: 'read_document("terms_of_service_draft.pdf")' },
      { time: '14:11:30', type: 'thinking', message: '消費者契約法 (2024年改正版) と特定商取引法の要件を照合中 — 38条項を解析' },
      { time: '14:24:44', type: 'tool',     message: 'legal_check({ jurisdiction: "JP", laws: ["consumer_contract", "tokusho_ho", "personal_info"] })' },
      { time: '14:35:20', type: 'thinking', message: '問題箇所 7件を特定。修正提案とリスクレベルを付与中' },
      { time: '14:41:55', type: 'complete', message: '成果物 legal_review_tos_v1.pdf をS3にアップロード完了' },
    ],
  },
  t5: {
    id: 't5', companyId: 'RS', companyName: 'Research Lab', companyColor: '#267ADE',
    title: '競合他社の市場調査', status: 'failed',
    submittedAt: '2026-04-22T11:00:00Z', completedAt: null, creditsUsed: 0,
    brief: '主要競合5社の製品ラインナップと価格戦略を調査してください。比較表とSWOT分析を含むレポートを作成してください。',
    events: [
      { time: '11:00:05', type: 'start', message: 'タスク受付完了 — Research Lab に割り当て済み' },
      { time: '11:02:18', type: 'tool',  message: 'search_web("競合 SaaS 価格戦略 市場調査 2026")' },
      { time: '11:08:40', type: 'tool',  message: 'scrape_website("competitor-a.co.jp/pricing")' },
      { time: '11:09:12', type: 'error', message: 'エラー: レート制限に達しました。ウェブスクレイピングがブロックされました (403 Forbidden)' },
    ],
  },
  t6: {
    id: 't6', companyId: 'MK', companyName: 'Marketing Crew', companyColor: '#DA3950',
    title: 'SNSキャンペーン企画', status: 'completed',
    submittedAt: '2026-04-21T09:00:00Z', completedAt: '2026-04-21T09:35:00Z', creditsUsed: 10,
    brief: 'Twitterキャンペーン用のコンテンツカレンダーを1ヶ月分作成してください。ハッシュタグ戦略とベストポスト時間帯の分析も含めてください。',
    resultFile: 'sns_calendar_april.xlsx',
    events: [
      { time: '09:00:09', type: 'start',    message: 'タスク受付完了 — Marketing Crew に割り当て済み' },
      { time: '09:04:32', type: 'tool',     message: 'analyze_twitter_trends({ industry: "B2B_SaaS", region: "JP", period: "30d" })' },
      { time: '09:14:20', type: 'thinking', message: 'エンゲージメント率の高い投稿パターンを分析: 火曜・木曜 午前11時台が最適' },
      { time: '09:22:45', type: 'tool',     message: 'generate_content_calendar({ days: 30, posts_per_day: 2, hashtags: true })' },
      { time: '09:34:50', type: 'complete', message: '成果物 sns_calendar_april.xlsx をS3にアップロード完了' },
    ],
  },
};

const STATUS_CFG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  running:           { label: '実行中',   color: '#10B06B', bg: 'rgba(16,176,107,0.12)' },
  awaiting_approval: { label: '承認待ち', color: '#EB9619', bg: 'rgba(235,150,25,0.12)' },
  completed:         { label: '完了',     color: '#267ADE', bg: 'rgba(38,122,222,0.12)'  },
  failed:            { label: '失敗',     color: '#DA3950', bg: 'rgba(218,57,80,0.12)'   },
};

const EVENT_CFG: Record<EventType, { color: string; label: string }> = {
  start:    { color: '#7D8BA3', label: '受付'         },
  tool:     { color: '#5E55EA', label: 'ツール'        },
  thinking: { color: '#EB9619', label: '思考'         },
  complete: { color: '#267ADE', label: '完了'         },
  approval: { color: '#EB9619', label: '承認要求'      },
  error:    { color: '#DA3950', label: 'エラー'        },
};

function formatDateFull(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function elapsed(start: string, end: string | null) {
  if (!end) return null;
  const min = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${min}分`;
}

function mapEvent(ev: RealTaskEvent): TaskEvent {
  const time = new Date(ev.createdAt).toLocaleTimeString('ja-JP', { hour12: false });
  const p = ev.payload || {};
  switch (ev.eventType) {
    case 'task.started':
      return { time, type: 'start', message: 'タスク受付完了 — Worker に割り当て済み' };
    case 'agent.state': {
      const state = (p.state as string) || 'idle';
      const lbl = state === 'thinking' ? '思考中' : state === 'idle' ? 'アイドル' : state;
      return { time, type: state === 'thinking' ? 'thinking' : 'tool', message: `${ev.agentId ?? '—'}: ${lbl}` };
    }
    case 'agent.tool_call': {
      const tool = (p.tool as string) || 'tool';
      return { time, type: 'tool', message: `${ev.agentId ?? '—'}: ${tool}(${JSON.stringify(p.args ?? {})})` };
    }
    case 'approval.required':
      return { time, type: 'approval', message: `承認ゲート: ${(p.actionName as string) ?? 'unknown'} (risk=${(p.riskLevel as string) ?? '?'})` };
    case 'task.completed':
      return { time, type: 'complete', message: '成果物を Storage にアップロード完了' };
    case 'task.failed':
      return { time, type: 'error', message: `失敗: ${(p.errorMessage as string) ?? (p.reason as string) ?? '不明'}` };
    default:
      return { time, type: 'thinking', message: `${ev.eventType}` };
  }
}

const STATUS_MAP: Record<string, TaskStatus> = {
  queued: 'running',
  running: 'running',
  awaiting_approval: 'awaiting_approval',
  completed: 'completed',
  failed: 'failed',
};

export default function TaskDetailPage({ nav, taskId }: { nav: AppNav; taskId: string }) {
  const [downloading, setDownloading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const realTask = useTaskStore((s) => s.current);
  const realEvents = useTaskStore((s) => s.events);
  const loadTask = useTaskStore((s) => s.loadTask);
  const subscribeEvents = useTaskStore((s) => s.subscribeEvents);
  const resetTask = useTaskStore((s) => s.reset);
  const realCompanies = useWorldStore((s) => s.companies);
  const loadWorld = useWorldStore((s) => s.load);

  useEffect(() => {
    void loadWorld();
    ensureNotifyPermission();
  }, [loadWorld]);

  useEffect(() => {
    void loadTask(taskId);
    const unsub = subscribeEvents(taskId);
    return () => { unsub(); resetTask(); };
  }, [taskId, loadTask, subscribeEvents, resetTask]);

  // Notify on terminal status changes (avoid double-fire)
  const lastStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const cur = realTask?.status;
    if (!cur || cur === lastStatusRef.current) return;
    if (cur === 'completed' && lastStatusRef.current && lastStatusRef.current !== 'completed') {
      toast.success('タスクが完了しました');
      notify('DevOffice AI', 'タスクが完了しました — 成果物を確認してください');
    } else if (cur === 'failed' && lastStatusRef.current && lastStatusRef.current !== 'failed') {
      toast.error(`タスクが失敗しました: ${realTask?.errorMessage ?? '不明'}`);
      notify('DevOffice AI', 'タスクが失敗しました');
    } else if (cur === 'awaiting_approval' && lastStatusRef.current !== 'awaiting_approval') {
      toast.warning('承認ゲートが発動しました');
      notify('DevOffice AI', '承認が必要です — タスクが一時停止しています');
    }
    lastStatusRef.current = cur;
  }, [realTask?.status, realTask?.errorMessage]);

  // Khi task completed → fetch signed result URL
  useEffect(() => {
    if (realTask?.status === 'completed' && realTask.resultUrl && !resultUrl) {
      api.getTaskResult(taskId).then((r) => setResultUrl(r.resultUrl)).catch(() => {});
    }
  }, [realTask?.status, realTask?.resultUrl, taskId, resultUrl]);

  const task: Task = useMemo(() => {
    if (!realTask) {
      return MOCK_TASKS[taskId] ?? MOCK_TASKS['t1'];
    }
    const company = realCompanies.find((c) => c.id === realTask.companyId);
    return {
      id: realTask.id,
      companyId: company?.workflowType ?? '?',
      companyName: company?.name ?? 'Unknown',
      companyColor: company?.buildingColor ?? '#5E55EA',
      title: realTask.brief.slice(0, 60),
      status: STATUS_MAP[realTask.status] ?? 'running',
      submittedAt: realTask.createdAt,
      completedAt: realTask.completedAt ?? null,
      creditsUsed: realTask.creditsCharged,
      brief: realTask.brief,
      events: realEvents.map(mapEvent),
      resultFile: resultUrl ? `result_${realTask.id.slice(0, 8)}.html` : undefined,
    };
  }, [realTask, realEvents, realCompanies, resultUrl, taskId]);

  const cfg = STATUS_CFG[task.status];
  const dur = elapsed(task.submittedAt, task.completedAt);

  const handleDownload = async () => {
    if (!resultUrl) return;
    setDownloading(true);
    window.open(resultUrl, '_blank', 'noopener');
    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 bg-surface border-b border-border flex items-center gap-3 px-6 shrink-0">
        <button
          onClick={() => nav.goto('tasks')}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          マイタスク
        </button>
        <span className="text-muted-foreground text-[13px]">/</span>
        <span className="text-[13px] font-semibold truncate max-w-[300px]">{task.title}</span>
        <div className="flex-1" />
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </header>

      <div className="flex-1 max-w-[860px] w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Task overview */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{ backgroundColor: task.companyColor + '20', border: `1.5px solid ${task.companyColor}50`, color: task.companyColor }}
            >
              {task.companyId}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-bold mb-2">{task.title}</h1>
              <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground flex-wrap mb-3">
                <span>{task.companyName}</span>
                <span>·</span>
                <span>依頼: {formatDateFull(task.submittedAt)}</span>
                {task.completedAt && (
                  <>
                    <span>·</span>
                    <span>完了: {formatDateFull(task.completedAt)}</span>
                  </>
                )}
                {dur && (
                  <>
                    <span>·</span>
                    <span>所要時間: {dur}</span>
                  </>
                )}
                {task.creditsUsed > 0 && (
                  <>
                    <span>·</span>
                    <span><strong className="text-foreground">{task.creditsUsed}</strong> cr 使用</span>
                  </>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed bg-background rounded-lg p-3 border border-border">
                {task.brief}
              </p>
            </div>
          </div>
        </div>

        {/* Awaiting approval notice */}
        {task.status === 'awaiting_approval' && (
          <div className="bg-amber/5 border-2 border-amber/40 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EB9619" strokeWidth="2.5">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-amber mb-1">承認が必要です</p>
              <p className="text-[12px] text-muted-foreground">
                AIエージェントが外部アクション (メール送信) の実行前に承認を要求しています。World Map で承認ゲートを確認してください。
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 text-[12px] font-semibold"
              style={{ backgroundColor: '#EB9619', color: '#0C0D12' }}
              onClick={() => nav.goto('world')}
            >
              確認する
            </Button>
          </div>
        )}

        {/* Failed notice */}
        {task.status === 'failed' && (
          <div className="bg-crimson/5 border border-crimson/30 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-crimson/15 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DA3950" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-crimson mb-1">タスクが失敗しました</p>
              <p className="text-[12px] text-muted-foreground">
                エラーによりタスクが完了できませんでした。再依頼してもクレジットは消費されません。
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-crimson/40 text-crimson hover:bg-crimson/10 text-[12px] font-semibold"
              onClick={() => nav.goto('company', { companyId: task.companyId })}
            >
              再依頼
            </Button>
          </div>
        )}

        {/* Result download */}
        {task.status === 'completed' && task.resultFile && (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">成果物</p>
            <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5E55EA" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">{task.resultFile}</p>
                <p className="text-[11px] text-muted-foreground">S3 ストレージ</p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-primary hover:bg-primary/90 text-[12px] font-semibold"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    取得中...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    ダウンロード
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Agent log timeline */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-5">エージェントログ</p>
          <div className="flex flex-col">
            {task.events.map((event, i) => {
              const eCfg = EVENT_CFG[event.type];
              const isLast = i === task.events.length - 1 && task.status !== 'running';
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: eCfg.color + '20', color: eCfg.color, border: `1.5px solid ${eCfg.color}50` }}
                    >
                      {i + 1}
                    </div>
                    {!isLast && (
                      <div className="w-px bg-border mt-1 mb-1" style={{ minHeight: '20px', flex: '1 0 auto' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: eCfg.color }}>{eCfg.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{event.time}</span>
                    </div>
                    <p
                      className="text-[12px] leading-relaxed font-mono break-all"
                      style={{
                        color: event.type === 'tool' ? '#9B8FFA'
                          : event.type === 'error' ? '#DA3950'
                          : event.type === 'approval' ? '#EB9619'
                          : '#C4CDD9',
                        backgroundColor: event.type === 'tool' ? 'rgba(94,85,234,0.06)' : 'transparent',
                        padding: event.type === 'tool' ? '4px 8px' : '0',
                        borderRadius: event.type === 'tool' ? '4px' : '0',
                      }}
                    >
                      {event.message}
                    </p>
                  </div>
                </div>
              );
            })}

            {task.status === 'running' && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 animate-pulse"
                    style={{ backgroundColor: 'rgba(16,176,107,0.2)', border: '1.5px solid rgba(16,176,107,0.5)' }}>
                    <div className="w-2 h-2 rounded-full bg-emerald" />
                  </div>
                </div>
                <div className="flex-1 pb-4 flex items-center">
                  <span className="text-[12px] font-semibold text-emerald flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block animate-ping" />
                    処理中...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
