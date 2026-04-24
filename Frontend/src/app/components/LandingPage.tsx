import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import type { AppNav } from '../App';

// ── Data ──────────────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    id: 'MK', name: 'Marketing Crew', color: '#DA3950', gridX: 0, gridY: 0,
    desc: 'LP制作・SNS運用・広告コピー',
    tasks: ['Landing page copy', 'SNS campaign', 'Ad creative'],
    agents: ['Researcher', 'Copywriter', 'Designer', 'Approver'],
    avgMin: 15, credits: 10,
  },
  {
    id: 'DV', name: 'Dev Team', color: '#5E55EA', gridX: 1, gridY: 0,
    desc: 'コード生成・レビュー・バグ修正',
    tasks: ['React component', 'API endpoint', 'Code review'],
    agents: ['Planner', 'Coder', 'Reviewer', 'QA'],
    avgMin: 25, credits: 15,
  },
  {
    id: 'LG', name: 'Legal Review', color: '#9333EA', gridX: 2, gridY: 0,
    desc: '契約書・利用規約・コンプライアンス',
    tasks: ['NDA review', 'Terms of service', 'Privacy policy'],
    agents: ['Analyst', 'Researcher', 'Reviewer'],
    avgMin: 20, credits: 12,
  },
  {
    id: 'RS', name: 'Research Lab', color: '#267ADE', gridX: 1, gridY: 1,
    desc: '市場調査・競合分析・レポート作成',
    tasks: ['Market analysis', 'Competitor research', 'Trend report'],
    agents: ['Researcher', 'Researcher', 'Writer', 'Reviewer'],
    avgMin: 18, credits: 10,
  },
  {
    id: 'AN', name: 'Analytics', color: '#10B06B', gridX: 2, gridY: 1,
    desc: 'データ分析・BI・可視化レポート',
    tasks: ['Sales analysis', 'KPI dashboard', 'Funnel report'],
    agents: ['Analyst', 'Visualizer', 'Reporter'],
    avgMin: 12, credits: 8,
  },
];

const STEPS = [
  {
    num: '01',
    title: 'タスクを入力',
    body: '依頼内容を日本語で書くだけ。AI企業が要件を自動整理し、担当エージェントをアサインする。',
    color: '#5E55EA',
  },
  {
    num: '02',
    title: 'AIが並列作業',
    body: 'World Map でリアルタイムに進捗を確認。建物をクリックするとエージェントの思考ログが見える。',
    color: '#267ADE',
  },
  {
    num: '03',
    title: '成果物を受け取る',
    body: '承認ゲートで重要アクションを確認した後、平均30分で完成。PDFやコードをダウンロード。',
    color: '#10B06B',
  },
];

const FEATURES = [
  {
    title: 'Building View — 完全透明',
    body: '建物をクリックするとズームイン。エージェントが何を考え、どのツールを呼んでいるかリアルタイムで見える。ブラックボックスはなし。',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: '承認ゲート — Human-in-the-Loop',
    body: 'AIが高リスクなアクションを実行する前に必ずユーザー確認を求める。30秒タイムアウトで自動却下。誤操作ゼロ。',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: '平均 30分以内に完成',
    body: 'Fiverr・クラウドワークスでは数日〜数週間。DevOffice AIは5つのAI企業が並列処理。依頼から成果物まで平均30分。',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

const PRICING = [
  { name: 'Starter', price: '¥1,500', credits: 50, tasks: '5', badge: '' },
  { name: 'Standard', price: '¥4,000', credits: 150, tasks: '15', badge: '人気' },
  { name: 'Pro', price: '¥10,000', credits: 500, tasks: '50', badge: '' },
];

// ── Canvas ────────────────────────────────────────────────────────────────────

const BUILDING_CONFIG = [
  { idx: 0, col: 0, row: 0, color: '#DA3950', label: 'MK' },
  { idx: 1, col: 1, row: 0, color: '#5E55EA', label: 'DV' },
  { idx: 2, col: 2, row: 0, color: '#9333EA', label: 'LG' },
  { idx: 3, col: 0, row: 1, color: '#1D202B', label: '●' },
  { idx: 4, col: 1, row: 1, color: '#267ADE', label: 'RS' },
  { idx: 5, col: 2, row: 1, color: '#10B06B', label: 'AN' },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function WorldMapCanvas({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PAD = 28, COLS = 3, ROWS = 2, GAP_X = 24, GAP_Y = 20;
    const BW = (width - PAD * 2 - GAP_X * (COLS - 1)) / COLS;
    const BH = (height - PAD * 2 - GAP_Y * (ROWS - 1)) / ROWS;

    const center = (col: number, row: number) => ({
      x: PAD + col * (BW + GAP_X) + BW / 2,
      y: PAD + row * (BH + GAP_Y) + BH / 2,
    });
    const rect = (col: number, row: number) => ({
      x: PAD + col * (BW + GAP_X), y: PAD + row * (BH + GAP_Y), w: BW, h: BH,
    });

    const agentColors = ['#EB9619', '#7D75F7', '#10B06B', '#DA3950', '#267ADE'];
    const agents = BUILDING_CONFIG.filter(b => b.label !== '●').flatMap((b) =>
      Array.from({ length: 3 }, (_, i) => ({
        buildingIdx: b.idx,
        angle: (Math.PI * 2 / 3) * i + b.idx * 0.5,
        speed: 0.008 + Math.random() * 0.006,
        color: agentColors[b.idx % agentColors.length],
        radius: Math.min(BW, BH) * 0.18 + Math.random() * 7,
        opacity: 0.7 + Math.random() * 0.3,
        pulse: Math.random() * Math.PI * 2,
      }))
    );

    const msgPairs = [[0, 4], [1, 5], [2, 4], [0, 1], [4, 5]];
    const messages = msgPairs.map(([f, t]) => ({
      fromIdx: f, toIdx: t,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.003,
      color: ['#EB9619', '#5E55EA', '#10B06B'][Math.floor(Math.random() * 3)],
    }));

    let t = 0, animId: number;

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, width, height);

      // Dot grid
      ctx.fillStyle = '#1A1E2A';
      for (let gx = 0; gx < width; gx += 22) {
        for (let gy = 0; gy < height; gy += 22) {
          ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Roads
      ctx.strokeStyle = '#151822'; ctx.lineWidth = 9;
      for (let row = 0; row < ROWS; row++) {
        for (let c = 0; c < COLS - 1; c++) {
          const a = center(c, row), b = center(c + 1, row);
          ctx.beginPath(); ctx.moveTo(a.x + BW / 2 - 2, a.y); ctx.lineTo(b.x - BW / 2 + 2, b.y); ctx.stroke();
        }
      }
      for (let col = 0; col < COLS; col++) {
        const c0 = center(col, 0), c1 = center(col, 1);
        ctx.beginPath(); ctx.moveTo(c0.x, c0.y + BH / 2 - 2); ctx.lineTo(c1.x, c1.y - BH / 2 + 2); ctx.stroke();
      }

      // Buildings
      BUILDING_CONFIG.forEach((b) => {
        const r = rect(b.col, b.row);
        const c = center(b.col, b.row);
        const isPlaza = b.label === '●';
        if (isPlaza) {
          ctx.fillStyle = '#0F1219';
          ctx.beginPath(); ctx.arc(c.x, c.y, Math.min(BW, BH) * 0.42, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#1D202B'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(c.x, c.y, Math.min(BW, BH) * 0.42, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#2B303F'; ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
          return;
        }

        // Glow shadow
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 18 + 6 * Math.sin(t * 0.02 + b.idx);
        ctx.fillStyle = '#0F1219';
        roundRect(ctx, r.x, r.y, r.w, r.h, 6);
        ctx.fill();
        ctx.restore();

        // Border
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 0.025 + b.idx);
        roundRect(ctx, r.x, r.y, r.w, r.h, 6); ctx.stroke();
        ctx.globalAlpha = 1;

        // Top stripe
        ctx.fillStyle = b.color; ctx.globalAlpha = 0.9;
        roundRect(ctx, r.x, r.y, r.w, 4, 6); ctx.fill();
        ctx.globalAlpha = 1;

        // Status dot
        const dotPulse = 0.6 + 0.4 * Math.sin(t * 0.05 + b.idx * 1.2);
        ctx.fillStyle = '#10B06B'; ctx.globalAlpha = dotPulse;
        ctx.beginPath(); ctx.arc(r.x + r.w - 10, r.y + 11, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = '#EAEDEC';
        ctx.font = `bold ${Math.round(BH * 0.19)}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.label, c.x, c.y);

        // Glow fill
        const glowAlpha = 0.12 + 0.04 * Math.sin(t * 0.03 + b.idx);
        const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, BW * 0.65);
        grd.addColorStop(0, b.color + Math.round(glowAlpha * 255).toString(16).padStart(2, '0'));
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fillRect(r.x, r.y, r.w, r.h);
      });

      // Messages
      messages.forEach((msg) => {
        msg.progress += msg.speed;
        if (msg.progress > 1) msg.progress = 0;
        const fb = BUILDING_CONFIG[msg.fromIdx], tb = BUILDING_CONFIG[msg.toIdx];
        if (!fb || !tb) return;
        const fc = center(fb.col, fb.row), tc = center(tb.col, tb.row);
        ctx.save();
        ctx.setLineDash([4, 6]); ctx.lineDashOffset = -(t * 0.6);
        ctx.strokeStyle = msg.color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(fc.x, fc.y); ctx.lineTo(tc.x, tc.y); ctx.stroke();
        ctx.restore();
        const px = fc.x + (tc.x - fc.x) * msg.progress;
        const py = fc.y + (tc.y - fc.y) * msg.progress;
        ctx.fillStyle = msg.color; ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Agents
      agents.forEach((agent) => {
        agent.angle += agent.speed;
        const b = BUILDING_CONFIG[agent.buildingIdx];
        if (!b || b.label === '●') return;
        const c = center(b.col, b.row);
        const x = c.x + Math.cos(agent.angle) * agent.radius;
        const y = c.y + Math.sin(agent.angle) * agent.radius;
        ctx.fillStyle = agent.color;
        ctx.globalAlpha = agent.opacity * (0.7 + 0.3 * Math.sin(t * 0.04 + agent.pulse));
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
  );
}

// ── Browser Mockup ────────────────────────────────────────────────────────────

function BrowserMockup({ width, canvasHeight }: { width: number; canvasHeight: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden w-full"
      style={{
        background: '#080A10',
        border: '1px solid #252834',
        boxShadow: '0 0 0 1px rgba(94,85,234,0.08), 0 0 60px rgba(94,85,234,0.14), 0 30px 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* Tab bar */}
      <div className="flex items-end px-3 pt-1 gap-0" style={{ background: '#060810', borderBottom: '1px solid #151822', height: '34px' }}>
        <div
          className="flex items-center gap-2 px-3 h-[26px] rounded-t-md -mb-px"
          style={{ background: '#080A10', border: '1px solid #252834', borderBottom: '1px solid #080A10' }}
        >
          <div className="w-3 h-3 rounded-sm bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold" style={{ fontSize: '6px' }}>D</span>
          </div>
          <span className="text-[10px] whitespace-nowrap" style={{ color: '#C4CDD9' }}>World Map — DevOffice AI</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#444E60" strokeWidth="2" className="ml-1">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <button className="px-2 pb-1 text-[#444E60] hover:text-[#7D8BA3] text-base leading-none">+</button>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ background: '#060810', borderBottom: '1px solid #151822', height: '38px' }}
      >
        {/* Nav buttons */}
        {[
          <svg key="b" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>,
          <svg key="f" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>,
          <svg key="r" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>,
        ].map((icon, i) => (
          <button key={i} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1A1D27] transition-colors" style={{ color: '#556177' }}>
            {icon}
          </button>
        ))}

        {/* URL bar */}
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3"
          style={{ background: '#0C0D14', border: '1px solid #1F2230', height: '26px' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#556177" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[10px] flex-1 font-mono" style={{ color: '#7D8BA3' }}>app.devoffice.ai/world-map</span>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B06B' }} />
        </div>

        {/* Menu button */}
        <button className="w-7 h-7 flex items-center justify-center" style={{ color: '#556177' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {/* Viewport: canvas */}
      <div className="relative overflow-hidden" style={{ background: '#07090E' }}>
        <WorldMapCanvas width={width} height={canvasHeight} />
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)' }}
        />
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ background: '#060810', borderTop: '1px solid #151822', height: '22px' }}
      >
        <span className="flex items-center gap-1.5 text-[9px]" style={{ color: '#556177' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#10B06B' }} />
          5 agents active
        </span>
        <span style={{ color: '#2B303F', fontSize: '9px' }}>·</span>
        <span className="text-[9px]" style={{ color: '#556177' }}>3 tasks running</span>
        <span style={{ color: '#2B303F', fontSize: '9px' }}>·</span>
        <span className="text-[9px]" style={{ color: '#EB9619' }}>1 approval pending</span>
        <div className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: '#3A4150' }}>Tokyo, JP · v3.0</span>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function NavBar({ onLogin, onGetStarted }: { onLogin: () => void; onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 transition-all"
      style={{
        background: scrolled ? 'rgba(12,13,18,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(43,48,63,0.6)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center px-6 gap-8">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-[15px] tracking-tight">DevOffice AI</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 flex-1">
          {[
            { href: '#how', label: '使い方' },
            { href: '#companies', label: 'AI企業' },
            { href: '#pricing', label: '料金' },
          ].map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] transition-colors" style={{ color: '#7D8BA3' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EAEDEC')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7D8BA3')}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" className="text-[13px]" onClick={onLogin}>
            ログイン
          </Button>
          <Button size="sm" className="text-[13px] bg-primary hover:bg-primary/90 font-semibold" onClick={onGetStarted}>
            無料で始める
          </Button>
        </div>
      </div>
    </header>
  );
}

function CompanyCard({ company, onClick }: { company: typeof COMPANIES[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col gap-3 p-4 rounded-xl bg-card border transition-all duration-200 text-left w-full"
      style={{
        borderColor: hovered ? company.color + '80' : '#2B303F',
        boxShadow: hovered ? `0 0 24px ${company.color}18` : 'none',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: company.color }}>
          {company.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{company.name}</div>
          <div className="text-[11px]" style={{ color: '#7D8BA3' }}>{company.credits} cr / task</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B06B' }} />
          <span className="text-[10px]" style={{ color: '#10B06B' }}>稼働中</span>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: '#7D8BA3' }}>{company.desc}</p>
      <div className="flex flex-wrap gap-1">
        {company.tasks.slice(0, 2).map((task) => (
          <span key={task} className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{ borderColor: company.color + '40', color: company.color }}>
            {task}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-[11px]" style={{ color: '#7D8BA3' }}>avg. {company.avgMin} min</span>
        <span className="text-[11px] font-medium transition-colors" style={{ color: hovered ? company.color : '#556177' }}>
          依頼する →
        </span>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ nav, onLogin }: { nav: AppNav; onLogin: () => void }) {
  const [canvasW, setCanvasW] = useState(640);
  const browserWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (browserWrapRef.current) {
        setCanvasW(browserWrapRef.current.clientWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const canvasH = Math.round(canvasW * 0.52);

  const handleCompanyClick = (id: string) => {
    if (!nav.isLoggedIn) { onLogin(); return; }
    nav.goto('company', { companyId: id });
  };

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: '#0C0D12' }}>
      {/* Global ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(94,85,234,0.18) 0%, transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(43,48,63,0.7) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar onLogin={onLogin} onGetStarted={onLogin} />

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-14 pt-6">

            {/* Left: text */}
            <div className="flex-1 flex flex-col gap-6 pt-4 lg:pt-8 min-w-0">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(94,85,234,0.1)', border: '1px solid rgba(94,85,234,0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B06B' }} />
                <span className="text-[12px] font-medium" style={{ color: '#5E55EA' }}>5つのAI企業、常時稼働中</span>
              </div>

              {/* Headline */}
              <h1 className="text-[38px] sm:text-[50px] lg:text-[52px] font-bold leading-[1.08] tracking-[-0.025em]">
                <span style={{ color: '#EAEDEC' }}>AIの</span>
                <span style={{
                  background: 'linear-gradient(135deg, #7B71F0 0%, #5E55EA 40%, #267ADE 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}> ビジネス街</span>
                <br />
                <span style={{ color: '#EAEDEC' }}>が開業した。</span>
              </h1>

              {/* Subtext */}
              <p className="text-[15px] sm:text-[16px] leading-[1.75] max-w-[480px]" style={{ color: '#7D8BA3' }}>
                タスクを入力するだけで、AI企業が代行する。World Map でリアルタイムに作業を確認し、重要事項だけ承認。
                <strong style={{ color: '#C4CDD9', fontWeight: 600 }}> 平均30分で成果物が届く。</strong>
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button className="h-11 px-6 text-[14px] font-semibold bg-primary hover:bg-primary/90" onClick={onLogin}>
                  無料で始める
                </Button>
                <Button
                  variant="outline"
                  className="h-11 px-5 text-[14px]"
                  onClick={() => nav.goto('world')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  World Map を見る
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-1">
                {[
                  { val: '5社', label: 'AI企業' },
                  { val: '30分', label: '平均完了' },
                  { val: '¥1,500〜', label: 'スタート' },
                ].map((s, i) => (
                  <div key={s.label} className="flex flex-col" style={{ borderLeft: i > 0 ? '1px solid #2B303F' : 'none', paddingLeft: i > 0 ? '24px' : '0' }}>
                    <span className="text-[20px] font-bold" style={{ color: '#EAEDEC' }}>{s.val}</span>
                    <span className="text-[11px]" style={{ color: '#556177' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: browser mockup */}
            <div className="w-full lg:flex-1 relative">
              {/* Floating card: task running */}
              <div
                className="absolute -top-3 -left-4 z-10 rounded-xl px-3 py-2.5 hidden lg:flex items-center gap-2.5 animate-in fade-in duration-700"
                style={{ background: '#15171F', border: '1px solid #2B303F', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '180px' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(218,57,80,0.15)', border: '1px solid rgba(218,57,80,0.3)', color: '#DA3950' }}>MK</div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: '#EAEDEC' }}>実行中 · 8分経過</div>
                  <div className="text-[10px]" style={{ color: '#7D8BA3' }}>LP コピーライティング</div>
                </div>
              </div>

              {/* Floating card: completed */}
              <div
                className="absolute -bottom-4 -left-4 z-10 rounded-xl px-3 py-2.5 hidden lg:flex items-center gap-2.5 animate-in fade-in duration-1000 delay-300"
                style={{ background: '#15171F', border: '1px solid rgba(16,176,107,0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '192px' }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(16,176,107,0.15)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B06B" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: '#10B06B' }}>タスク完了 · 28分</div>
                  <div className="text-[10px]" style={{ color: '#7D8BA3' }}>Analytics · Q1 レポート</div>
                </div>
              </div>

              {/* Floating card: approval */}
              <div
                className="absolute -right-4 top-1/3 z-10 rounded-xl px-3 py-2.5 hidden xl:flex items-center gap-2.5 animate-in fade-in duration-1000 delay-500"
                style={{ background: '#15171F', border: '1px solid rgba(235,150,25,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '168px' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(235,150,25,0.12)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EB9619" strokeWidth="2">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: '#EB9619' }}>承認が必要</div>
                  <div className="text-[10px]" style={{ color: '#7D8BA3' }}>Dev Team · git push</div>
                </div>
              </div>

              {/* Browser window */}
              <div ref={browserWrapRef} className="w-full">
                <BrowserMockup width={canvasW} canvasHeight={canvasH} />
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section id="how" className="py-20 px-6" style={{ borderTop: '1px solid rgba(43,48,63,0.5)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: '#5E55EA' }}>HOW IT WORKS</p>
              <h2 className="text-[26px] sm:text-[32px] font-bold leading-tight" style={{ color: '#EAEDEC' }}>
                3ステップで完了
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-[52px] left-[calc(33%+12px)] right-[calc(33%+12px)] h-px"
                style={{ background: 'linear-gradient(90deg, rgba(94,85,234,0.3), rgba(38,122,222,0.3))' }} />

              {STEPS.map((step) => (
                <div key={step.num} className="relative flex flex-col gap-4 p-6 rounded-2xl"
                  style={{ background: '#0F1118', border: '1px solid #1D202B' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0"
                      style={{ background: step.color + '18', border: `1.5px solid ${step.color}40`, color: step.color }}>
                      {step.num}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold mb-2" style={{ color: '#EAEDEC' }}>{step.title}</h3>
                    <p className="text-[13px] leading-[1.7]" style={{ color: '#7D8BA3' }}>{step.body}</p>
                  </div>
                  <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${step.color}60, transparent)` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Companies ─────────────────────────────────────────────────── */}
        <section id="companies" className="py-20 px-6" style={{ borderTop: '1px solid rgba(43,48,63,0.5)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: '#5E55EA' }}>THE DISTRICT</p>
              <h2 className="text-[26px] sm:text-[32px] font-bold mb-3" style={{ color: '#EAEDEC' }}>5つのAI企業</h2>
              <p className="text-[14px]" style={{ color: '#7D8BA3' }}>
                それぞれ専門分野に特化したAIエージェントチームが常時待機中。
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {COMPANIES.map((c) => (
                <CompanyCard key={c.id} company={c} onClick={() => handleCompanyClick(c.id)} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(43,48,63,0.5)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: '#5E55EA' }}>WHY DEVOFFICE AI</p>
              <h2 className="text-[26px] sm:text-[32px] font-bold" style={{ color: '#EAEDEC' }}>
                ChatGPT・Fiverr にはない<br />3つの差別化
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex flex-col gap-4 p-6 rounded-2xl"
                  style={{ background: '#0F1118', border: '1px solid #1D202B' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(94,85,234,0.1)', border: '1px solid rgba(94,85,234,0.2)', color: '#5E55EA' }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold mb-2" style={{ color: '#EAEDEC' }}>{f.title}</h3>
                    <p className="text-[13px] leading-[1.7]" style={{ color: '#7D8BA3' }}>{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 px-6" style={{ borderTop: '1px solid rgba(43,48,63,0.5)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: '#5E55EA' }}>PRICING</p>
              <h2 className="text-[26px] sm:text-[32px] font-bold mb-3" style={{ color: '#EAEDEC' }}>クレジット料金</h2>
              <p className="text-[14px]" style={{ color: '#7D8BA3' }}>1タスク = 10〜15クレジット。使い切ったら追加購入。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING.map((p) => {
                const isPopular = p.badge === '人気';
                return (
                  <div key={p.name} className="flex flex-col gap-4 p-5 rounded-2xl"
                    style={{
                      background: isPopular ? '#13152080' : '#0F1118',
                      border: isPopular ? '1px solid rgba(94,85,234,0.5)' : '1px solid #1D202B',
                      boxShadow: isPopular ? '0 0 40px rgba(94,85,234,0.12)' : 'none',
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-bold" style={{ color: '#EAEDEC' }}>{p.name}</span>
                      {isPopular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">人気</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[30px] font-bold tracking-tight" style={{ color: '#EAEDEC' }}>{p.price}</span>
                      <span className="text-[12px] ml-1" style={{ color: '#7D8BA3' }}>/ 一回</span>
                    </div>
                    <div className="flex flex-col gap-1.5 py-3" style={{ borderTop: '1px solid #1D202B', borderBottom: '1px solid #1D202B' }}>
                      {[
                        { label: 'クレジット', val: `${p.credits} cr` },
                        { label: 'タスク目安', val: `${p.tasks} タスク` },
                        { label: '単価目安', val: '10〜15 cr' },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-[12px]">
                          <span style={{ color: '#7D8BA3' }}>{row.label}</span>
                          <span className="font-semibold" style={{ color: '#C4CDD9' }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full text-[13px] font-semibold h-10"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={onLogin}
                    >
                      {isPopular ? 'このプランで始める' : 'プランを選択'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────────────── */}
        <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(43,48,63,0.5)' }}>
          <div className="max-w-2xl mx-auto text-center flex flex-col gap-6">
            <div
              className="inline-flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,176,107,0.1)', border: '1px solid rgba(16,176,107,0.2)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B06B' }} />
              <span className="text-[12px]" style={{ color: '#10B06B' }}>登録無料 · クレジットカード不要</span>
            </div>
            <h2 className="text-[28px] sm:text-[38px] font-bold leading-tight" style={{ color: '#EAEDEC' }}>
              今すぐAI企業に<br />仕事を依頼しよう
            </h2>
            <p className="text-[14px]" style={{ color: '#7D8BA3' }}>
              アカウント登録から最初のタスク完了まで、30分以内。
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-[15px] font-semibold" onClick={onLogin}>
                無料で始める
              </Button>
              <Button variant="outline" className="h-12 px-6 text-[15px]" onClick={() => nav.goto('world')}>
                World Map を見る
              </Button>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="px-6 py-8" style={{ borderTop: '1px solid rgba(43,48,63,0.5)' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">D</span>
              </div>
              <span className="text-[12px] font-semibold">DevOffice AI</span>
            </div>
            <p className="text-[11px]" style={{ color: '#3A4150' }}>
              © 2026 DevOffice AI — チーム「イキイキとした毎日」
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
