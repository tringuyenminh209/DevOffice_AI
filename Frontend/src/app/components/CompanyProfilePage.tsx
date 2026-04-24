import { useState } from 'react';
import { Button } from './ui/button';
import type { AppNav } from '../App';

// ── Data ──────────────────────────────────────────────────────────────────────

const COMPANIES_DATA: Record<string, {
  id: string; name: string; color: string; tagline: string;
  desc: string; tasks: string[]; agents: { name: string; role: string; state: 'idle' | 'thinking' | 'tool_call' }[];
  credits: number; avgMin: number; completedTasks: number;
}> = {
  MK: {
    id: 'MK', name: 'Marketing Crew', color: '#DA3950',
    tagline: 'コンテンツ・広告・ブランディングを30分で',
    desc: 'SEO記事、LP、SNSキャンペーン、広告コピーを専門AIチームが代行。Researcher がターゲット調査、Copywriter がドラフト作成、Designer がビジュアル提案、Approver が品質チェックする4段階フロー。',
    tasks: ['Landing page copywriting', 'SNS campaign planning', 'Ad creative brief', 'Email newsletter', 'Product description', 'Brand positioning'],
    agents: [
      { name: 'Alex', role: 'Researcher', state: 'thinking' },
      { name: 'Maya', role: 'Copywriter', state: 'idle' },
      { name: 'Ryan', role: 'Designer', state: 'idle' },
      { name: 'Sara', role: 'Approver', state: 'idle' },
    ],
    credits: 10, avgMin: 15, completedTasks: 143,
  },
  DV: {
    id: 'DV', name: 'Dev Team', color: '#5E55EA',
    tagline: 'コード生成・レビュー・バグ修正を高品質に',
    desc: 'React/TypeScript コンポーネント、API エンドポイント、バグ修正、コードレビューを専門チームが対応。Planner が設計、Coder が実装、Reviewer がコードレビュー、QA がテストシナリオ作成する品質重視フロー。',
    tasks: ['React component build', 'API endpoint design', 'Bug investigation', 'Code review', 'Unit test generation', 'Database query optimization'],
    agents: [
      { name: 'Kai', role: 'Planner', state: 'tool_call' },
      { name: 'Zoe', role: 'Coder', state: 'thinking' },
      { name: 'Max', role: 'Reviewer', state: 'idle' },
      { name: 'Amy', role: 'QA', state: 'idle' },
    ],
    credits: 15, avgMin: 25, completedTasks: 89,
  },
  LG: {
    id: 'LG', name: 'Legal Review', color: '#9333EA',
    tagline: '契約書・利用規約・法的文書を正確にチェック',
    desc: '利用規約、プライバシーポリシー、NDA、業務委託契約書のレビューと作成を専門AIチームが担当。日本法準拠・GDPR対応も対応可能。Analyst が条文解析、Researcher が判例調査、Reviewer が最終確認の3段階フロー。',
    tasks: ['NDA review', 'Terms of service draft', 'Privacy policy audit', 'Employment contract check', 'Partnership agreement', 'IP licensing review'],
    agents: [
      { name: 'Leo', role: 'Analyst', state: 'idle' },
      { name: 'Nina', role: 'Researcher', state: 'idle' },
      { name: 'Tom', role: 'Reviewer', state: 'idle' },
    ],
    credits: 12, avgMin: 20, completedTasks: 67,
  },
  RS: {
    id: 'RS', name: 'Research Lab', color: '#267ADE',
    tagline: '市場調査・競合分析を深くレポート化',
    desc: '業界トレンド、競合分析、ユーザー調査、技術調査を専門チームが実施。Researcher×2 が情報収集、Writer がレポート構造化、Reviewer が品質確認の4エージェントフロー。詳細な引用付きレポートを生成。',
    tasks: ['Competitor analysis', 'Market size research', 'User persona research', 'Technology landscape', 'Industry trend report', 'Investment opportunity scan'],
    agents: [
      { name: 'Eve', role: 'Researcher', state: 'thinking' },
      { name: 'Ben', role: 'Researcher', state: 'tool_call' },
      { name: 'Liz', role: 'Writer', state: 'idle' },
      { name: 'Joe', role: 'Reviewer', state: 'idle' },
    ],
    credits: 10, avgMin: 18, completedTasks: 112,
  },
  AN: {
    id: 'AN', name: 'Analytics', color: '#10B06B',
    tagline: 'データを分析し、意思決定に使えるレポートに',
    desc: 'CSV/JSONデータの分析、KPIダッシュボード設計、ファネル分析、コホート分析を専門チームが実施。Analyst がデータ解析、Visualizer がグラフ設計、Reporter がナラティブ作成の3段階フロー。',
    tasks: ['Sales data analysis', 'KPI dashboard design', 'Funnel optimization', 'Cohort analysis', 'A/B test evaluation', 'Revenue attribution'],
    agents: [
      { name: 'Dan', role: 'Analyst', state: 'thinking' },
      { name: 'Ivy', role: 'Visualizer', state: 'thinking' },
      { name: 'Pat', role: 'Reporter', state: 'idle' },
    ],
    credits: 8, avgMin: 12, completedTasks: 198,
  },
};

const AGENT_STATE_COLORS = {
  idle: '#556177',
  thinking: '#EB9619',
  tool_call: '#7D75F7',
};

const AGENT_STATE_LABELS = {
  idle: 'Idle',
  thinking: 'Thinking...',
  tool_call: 'Tool Call',
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

function AgentCard({ agent, color }: { agent: { name: string; role: string; state: 'idle' | 'thinking' | 'tool_call' }; color: string }) {
  const stateColor = AGENT_STATE_COLORS[agent.state];
  const stateLabel = AGENT_STATE_LABELS[agent.state];
  const isActive = agent.state !== 'idle';

  return (
    <div
      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background border border-border"
      style={{ borderColor: isActive ? color + '40' : '#2B303F' }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0"
        style={{ backgroundColor: color + '30', border: `1px solid ${color}40` }}
      >
        <span style={{ color }}>{agent.name.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-foreground">{agent.name}</div>
        <div className="text-[10px] text-muted-foreground">{agent.role}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: stateColor,
            animation: isActive ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span className="text-[10px]" style={{ color: stateColor }}>{stateLabel}</span>
      </div>
    </div>
  );
}

// ── CompanyProfilePage ────────────────────────────────────────────────────────

export default function CompanyProfilePage({
  nav,
  companyId,
}: {
  nav: AppNav;
  companyId: string;
}) {
  const company = COMPANIES_DATA[companyId] ?? COMPANIES_DATA['MK'];
  const [brief, setBrief] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = brief.trim().length >= 10 || selectedTask.length > 0;
  const creditBalance = nav.credits;
  const canAfford = creditBalance >= company.credits;

  const handleSubmit = async () => {
    if (!canSubmit || !canAfford) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => nav.goto('world'), 1800);
  };

  if (submitted) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: company.color + '20', border: `2px solid ${company.color}` }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={company.color} strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-[18px] font-bold mb-1">タスクを送信しました</h2>
            <p className="text-[13px] text-muted-foreground">
              {company.name} がタスクを受理しました。<br />World Map に戻ります...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center px-5 gap-3 shrink-0 bg-surface">
        <button
          onClick={() => nav.goto('world')}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          World Map
        </button>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[9px]"
            style={{ backgroundColor: company.color }}
          >
            {company.id}
          </div>
          <span className="text-[13px] font-medium">{company.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EB9619" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-[12px] font-semibold">{nav.credits} cr</span>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: company info */}
        <aside className="w-72 border-r border-border flex flex-col overflow-y-auto shrink-0 bg-surface">
          {/* Company header */}
          <div
            className="p-5 border-b border-border"
            style={{ borderTop: `3px solid ${company.color}` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[13px]"
                style={{ backgroundColor: company.color }}
              >
                {company.id}
              </div>
              <div>
                <h1 className="text-[15px] font-bold">{company.name}</h1>
                <p className="text-[11px] text-muted-foreground">{company.tagline}</p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{company.desc}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 border-b border-border divide-x divide-border">
            {[
              { val: `${company.credits} cr`, label: 'Per task' },
              { val: `~${company.avgMin}min`, label: 'Avg time' },
              { val: String(company.completedTasks), label: 'Completed' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-3">
                <span className="text-[14px] font-bold">{s.val}</span>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Agents */}
          <div className="p-4 border-b border-border">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Agents
            </h2>
            <div className="flex flex-col gap-2">
              {company.agents.map((agent) => (
                <AgentCard key={agent.name} agent={agent} color={company.color} />
              ))}
            </div>
          </div>

          {/* Task examples */}
          <div className="p-4">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              よく依頼されるタスク
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {company.tasks.map((task) => (
                <button
                  key={task}
                  onClick={() => {
                    setSelectedTask(task);
                    setBrief((prev) => prev || `${task}を作成してください。`);
                  }}
                  className="text-[11px] px-2 py-1 rounded-lg border transition-colors"
                  style={{
                    borderColor: selectedTask === task ? company.color : '#2B303F',
                    color: selectedTask === task ? company.color : '#7D8BA3',
                    backgroundColor: selectedTask === task ? company.color + '10' : 'transparent',
                  }}
                >
                  {task}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: task form */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto flex flex-col gap-5">
            <div>
              <h2 className="text-[18px] font-bold mb-1">タスクを依頼する</h2>
              <p className="text-[13px] text-muted-foreground">
                {company.name} にどんな作業を依頼しますか？詳しく書くほど精度が上がります。
              </p>
            </div>

            {/* Brief textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium">
                タスクの詳細 <span className="text-crimson">*</span>
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={`例: ${company.tasks[0]}を作成してください。ターゲットは...`}
                rows={6}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': company.color } as React.CSSProperties}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {brief.length < 10 ? `最低10文字 (あと${10 - brief.length}文字)` : `${brief.length}文字`}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  詳しいほど精度UP
                </span>
              </div>
            </div>

            {/* File attach (UI only) */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-muted-foreground">
                ファイル添付（任意）
              </label>
              <div className="border border-dashed border-border rounded-xl px-4 py-5 text-center cursor-pointer hover:border-primary/50 transition-colors group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-[12px] text-muted-foreground">
                  PDF, TXT, CSV, DOCX, XLSX, PNG, JPG (最大 20MB)
                </p>
              </div>
            </div>

            {/* Credit summary */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-muted-foreground">消費クレジット</span>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-bold">{company.credits} cr</span>
                  <span className="text-[11px] text-muted-foreground">/ このタスク</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[12px] text-muted-foreground">残高</span>
                <span
                  className="text-[14px] font-bold"
                  style={{ color: canAfford ? '#10B06B' : '#DA3950' }}
                >
                  {creditBalance} cr → {creditBalance - company.credits} cr
                </span>
              </div>
            </div>

            {/* Not enough credits */}
            {!canAfford && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-crimson/10 border border-crimson/30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DA3950" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-[12px] text-crimson">
                  クレジットが不足しています。
                  <button className="underline ml-1" onClick={() => nav.goto('credits')}>購入する</button>
                </span>
              </div>
            )}

            {/* Submit */}
            <Button
              className="h-11 text-[14px] font-semibold"
              style={{ backgroundColor: canSubmit && canAfford ? company.color : undefined }}
              disabled={!canSubmit || !canAfford || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  送信中...
                </span>
              ) : (
                `${company.name} にタスクを送る — ${company.credits} cr`
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              送信後、World Map でリアルタイムに進捗を確認できます
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
