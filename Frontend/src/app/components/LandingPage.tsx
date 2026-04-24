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

const FEATURES = [
  {
    title: 'Building View — 透明性',
    body: '建物をクリックするとズームイン。エージェントが何を考え、どのツールを呼んでいるかリアルタイムで見える。ブラックボックスはなし。',
  },
  {
    title: '承認ゲート — Human-in-the-Loop',
    body: 'AIが高リスクなアクションを実行する前に必ずユーザー確認を求める。30秒タイムアウトで自動却下。誤操作ゼロ。',
  },
  {
    title: '平均 30分以内に完成',
    body: 'Fiverr・クラウドワークスでは数日〜数週間。DevOffice AIは5つのAI企業が並列処理。依頼から成果物まで平均30分。',
  },
];

const PRICING = [
  { name: 'Starter', price: '¥1,500', credits: 50, tasks: '5', badge: '' },
  { name: 'Standard', price: '¥4,000', credits: 150, tasks: '15', badge: '人気' },
  { name: 'Pro', price: '¥10,000', credits: 500, tasks: '50', badge: '' },
];

// ── Mini World Map Canvas ─────────────────────────────────────────────────────

interface CanvasAgent {
  buildingIdx: number;
  angle: number;
  speed: number;
  color: string;
  radius: number;
  opacity: number;
  pulsePhase: number;
}

interface CanvasMessage {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
  color: string;
}

const BUILDING_CONFIG = [
  { idx: 0, col: 0, row: 0, color: '#DA3950', label: 'MK' }, // Marketing
  { idx: 1, col: 1, row: 0, color: '#5E55EA', label: 'DV' }, // Dev
  { idx: 2, col: 2, row: 0, color: '#9333EA', label: 'LG' }, // Legal
  { idx: 3, col: 0, row: 1, color: '#1D202B', label: '●' },  // Plaza
  { idx: 4, col: 1, row: 1, color: '#267ADE', label: 'RS' }, // Research
  { idx: 5, col: 2, row: 1, color: '#10B06B', label: 'AN' }, // Analytics
];

function WorldMapCanvas({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Layout constants
    const PAD = 30;
    const COLS = 3;
    const ROWS = 2;
    const GAP_X = 28;
    const GAP_Y = 24;
    const BW = (width - PAD * 2 - GAP_X * (COLS - 1)) / COLS;
    const BH = (height - PAD * 2 - GAP_Y * (ROWS - 1)) / ROWS;

    const getBuildingCenter = (col: number, row: number) => ({
      x: PAD + col * (BW + GAP_X) + BW / 2,
      y: PAD + row * (BH + GAP_Y) + BH / 2,
    });

    const getBuildingRect = (col: number, row: number) => ({
      x: PAD + col * (BW + GAP_X),
      y: PAD + row * (BH + GAP_Y),
      w: BW,
      h: BH,
    });

    // Init agents (orbiting their buildings)
    const agentColors = ['#EB9619', '#7D75F7', '#10B06B', '#DA3950', '#267ADE'];
    const agents: CanvasAgent[] = BUILDING_CONFIG.filter(b => b.label !== '●').flatMap((b) =>
      Array.from({ length: 3 }, (_, i) => ({
        buildingIdx: b.idx,
        angle: (Math.PI * 2 / 3) * i + b.idx * 0.5,
        speed: 0.008 + Math.random() * 0.006,
        color: agentColors[b.idx % agentColors.length],
        radius: Math.min(BW, BH) * 0.18 + Math.random() * 8,
        opacity: 0.7 + Math.random() * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      }))
    );

    // Init messages
    const messagePairs = [[0, 4], [1, 5], [2, 4], [0, 1], [4, 5]];
    const messages: CanvasMessage[] = messagePairs.map(([f, t]) => ({
      fromIdx: f,
      toIdx: t,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.003,
      color: ['#EB9619', '#5E55EA', '#10B06B'][Math.floor(Math.random() * 3)],
    }));

    let t = 0;
    let animId: number;

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#080C11';
      ctx.fillRect(0, 0, width, height);

      // Draw roads
      ctx.strokeStyle = '#1D202B';
      ctx.lineWidth = 8;
      // Horizontal roads
      for (let row = 0; row < ROWS; row++) {
        const centers = Array.from({ length: COLS }, (_, c) => getBuildingCenter(c, row));
        for (let c = 0; c < COLS - 1; c++) {
          ctx.beginPath();
          ctx.moveTo(centers[c].x + BW / 2 - 2, centers[c].y);
          ctx.lineTo(centers[c + 1].x - BW / 2 + 2, centers[c + 1].y);
          ctx.stroke();
        }
      }
      // Vertical roads
      for (let col = 0; col < COLS; col++) {
        const c0 = getBuildingCenter(col, 0);
        const c1 = getBuildingCenter(col, 1);
        ctx.beginPath();
        ctx.moveTo(c0.x, c0.y + BH / 2 - 2);
        ctx.lineTo(c1.x, c1.y - BH / 2 + 2);
        ctx.stroke();
      }

      // Draw buildings
      BUILDING_CONFIG.forEach((b) => {
        const rect = getBuildingRect(b.col, b.row);
        const center = getBuildingCenter(b.col, b.row);
        const isPlaza = b.label === '●';

        if (isPlaza) {
          // Plaza: subtle circle
          ctx.fillStyle = '#111420';
          ctx.beginPath();
          ctx.arc(center.x, center.y, Math.min(BW, BH) * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#2B303F';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Center dot
          ctx.fillStyle = '#2B303F';
          ctx.beginPath();
          ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        // Building body
        const glowAlpha = 0.15 + 0.05 * Math.sin(t * 0.03 + b.idx);
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#111420';
        roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 5);
        ctx.fill();
        ctx.restore();

        // Building border
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 0.03 + b.idx);
        roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 5);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Company color stripe on top
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.85;
        roundRect(ctx, rect.x, rect.y, rect.w, 4, 5);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Status dot (top-right)
        const dotX = rect.x + rect.w - 10;
        const dotY = rect.y + 10;
        const dotPulse = 0.6 + 0.4 * Math.sin(t * 0.05 + b.idx * 1.2);
        ctx.fillStyle = '#10B06B';
        ctx.globalAlpha = dotPulse;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = '#EAEDEC';
        ctx.font = `bold ${Math.round(BH * 0.18)}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, center.x, center.y);

        // Glow overlay
        const grd = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, BW * 0.6);
        grd.addColorStop(0, b.color + Math.round(glowAlpha * 255).toString(16).padStart(2, '0'));
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      });

      // Draw message lines
      messages.forEach((msg) => {
        msg.progress += msg.speed;
        if (msg.progress > 1) msg.progress = 0;

        const from = BUILDING_CONFIG[msg.fromIdx];
        const to = BUILDING_CONFIG[msg.toIdx];
        if (!from || !to) return;
        const fc = getBuildingCenter(from.col, from.row);
        const tc = getBuildingCenter(to.col, to.row);

        // Dashed line
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -(t * 0.5);
        ctx.strokeStyle = msg.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(fc.x, fc.y);
        ctx.lineTo(tc.x, tc.y);
        ctx.stroke();
        ctx.restore();

        // Traveling dot
        const px = fc.x + (tc.x - fc.x) * msg.progress;
        const py = fc.y + (tc.y - fc.y) * msg.progress;
        ctx.fillStyle = msg.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw agents
      agents.forEach((agent) => {
        agent.angle += agent.speed;
        const b = BUILDING_CONFIG[agent.buildingIdx];
        if (!b || b.label === '●') return;
        const center = getBuildingCenter(b.col, b.row);
        const x = center.x + Math.cos(agent.angle) * agent.radius;
        const y = center.y + Math.sin(agent.angle) * agent.radius;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.04 + agent.pulsePhase);

        ctx.fillStyle = agent.color;
        ctx.globalAlpha = agent.opacity * (0.7 + 0.3 * pulse);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl"
      style={{ display: 'block' }}
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
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

// ── Subcomponents ─────────────────────────────────────────────────────────────

function NavBar({ onLogin, onGetStarted }: { onLogin: () => void; onGetStarted: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full flex items-center px-6 gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-[15px] tracking-tight">DevOffice AI</span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {['Product', 'Pricing', 'Docs', 'Changelog'].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {l}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" className="text-[13px]" onClick={onLogin}>
            Log in
          </Button>
          <Button size="sm" className="text-[13px] bg-primary hover:bg-primary/90" onClick={onGetStarted}>
            Get started
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
      className="group flex flex-col gap-3 p-4 rounded-xl bg-card border transition-all duration-200 text-left w-full"
      style={{
        borderColor: hovered ? company.color + '80' : '#2B303F',
        boxShadow: hovered ? `0 0 20px ${company.color}20` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: company.color }}
        >
          {company.id}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-foreground">{company.name}</div>
          <div className="text-[11px] text-muted-foreground">{company.credits} cr / task</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[10px] text-emerald">稼働中</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[12px] text-muted-foreground leading-relaxed">{company.desc}</p>

      {/* Task examples */}
      <div className="flex flex-wrap gap-1">
        {company.tasks.slice(0, 2).map((task) => (
          <span
            key={task}
            className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{ borderColor: company.color + '40', color: company.color }}
          >
            {task}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-[11px] text-muted-foreground">avg. {company.avgMin} min</span>
        <span
          className="text-[11px] font-medium transition-colors"
          style={{ color: hovered ? company.color : '#7D8BA3' }}
        >
          依頼する →
        </span>
      </div>
    </button>
  );
}

function FeatureCard({ feature, idx }: { feature: typeof FEATURES[0]; idx: number }) {
  const icons = [
    // Eye / transparency
    <svg key="eye" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>,
    // Shield / approval
    <svg key="shield" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>,
    // Bolt / speed
    <svg key="bolt" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>,
  ];

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-card border border-border">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icons[idx]}
      </div>
      <div>
        <h3 className="text-[14px] font-semibold text-foreground mb-2">{feature.title}</h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.body}</p>
      </div>
    </div>
  );
}

function PricingCard({ plan, onSelect }: { plan: typeof PRICING[0]; onSelect: () => void }) {
  const isPopular = plan.badge === '人気';

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-xl border"
      style={{
        backgroundColor: isPopular ? '#15171F' : '#1D202B',
        borderColor: isPopular ? '#5E55EA80' : '#2B303F',
        boxShadow: isPopular ? '0 0 30px #5E55EA20' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold">{plan.name}</span>
        {isPopular && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
            {plan.badge}
          </span>
        )}
      </div>

      {/* Price */}
      <div>
        <span className="text-[28px] font-bold tracking-tight">{plan.price}</span>
        <span className="text-[12px] text-muted-foreground ml-1">/ 一回限り</span>
      </div>

      {/* Credits */}
      <div className="flex flex-col gap-1.5 py-3 border-y border-border">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">クレジット</span>
          <span className="font-semibold">{plan.credits} cr</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">タスク目安</span>
          <span className="font-semibold">{plan.tasks} タスク</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">1タスク単価</span>
          <span className="font-semibold">10〜15 cr</span>
        </div>
      </div>

      <Button
        className="w-full text-[13px]"
        variant={isPopular ? 'default' : 'outline'}
        onClick={onSelect}
      >
        {isPopular ? 'これを選ぶ' : 'プランを選択'}
      </Button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LandingPage({
  nav,
  onLogin,
}: {
  nav: AppNav;
  onLogin: () => void;
}) {
  const [canvasSize, setCanvasSize] = useState({ w: 560, h: 340 });
  const heroCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (heroCanvasRef.current) {
        const w = Math.min(heroCanvasRef.current.clientWidth, 620);
        setCanvasSize({ w, h: Math.round(w * 0.6) });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleCompanyClick = (companyId: string) => {
    if (!nav.isLoggedIn) {
      onLogin();
      return;
    }
    nav.goto('company', { companyId });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar onLogin={onLogin} onGetStarted={onLogin} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              <span className="text-[12px] text-primary font-medium">5つのAI企業、常時稼働中</span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[48px] lg:text-[54px] font-bold leading-[1.1] tracking-[-0.02em]">
              <span className="text-foreground">Your AI</span>
              <br />
              <span className="text-primary">business district</span>
              <br />
              <span className="text-foreground">— always open.</span>
            </h1>

            {/* Subtext */}
            <p className="text-[15px] sm:text-[16px] text-muted-foreground leading-[1.7] max-w-[500px]">
              タスクを依頼するだけで、AI企業が代行する。World Map でリアルタイムに作業を確認し、
              重要事項だけ承認。<strong className="text-foreground">平均30分で成果物を受け取れる。</strong>
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                className="h-11 px-6 bg-primary hover:bg-primary/90 text-[14px] font-semibold"
                onClick={onLogin}
              >
                無料で始める
              </Button>
              <Button
                variant="outline"
                className="h-11 px-6 text-[14px]"
                onClick={() => nav.goto('world')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                World Map を見る
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              {[
                { val: '5社', label: 'AI企業' },
                { val: '< 30分', label: '平均完了時間' },
                { val: '¥1,500〜', label: 'クレジット' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-[18px] font-bold text-foreground">{s.val}</span>
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: animated World Map */}
          <div
            ref={heroCanvasRef}
            className="flex-1 w-full lg:max-w-[600px] rounded-xl overflow-hidden border border-border"
            style={{ backgroundColor: '#080C11' }}
          >
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              {['#DA3950', '#EB9619', '#10B06B'].map((c) => (
                <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              ))}
              <span className="text-[11px] text-muted-foreground ml-2">DevOffice AI — World Map</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span className="text-[10px] text-emerald">Live</span>
              </div>
            </div>
            <WorldMapCanvas width={canvasSize.w} height={canvasSize.h} />
          </div>
        </div>
      </section>

      {/* ── Companies ─────────────────────────────────────────────────────── */}
      <section id="product" className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-[24px] sm:text-[28px] font-bold mb-2">5つのAI企業</h2>
            <p className="text-[14px] text-muted-foreground">
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

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-[24px] sm:text-[28px] font-bold mb-2">なぜ DevOffice AI か</h2>
            <p className="text-[14px] text-muted-foreground">
              ChatGPT・Fiverr・クラウドワークスにはない、3つの差別化ポイント。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} idx={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-[24px] sm:text-[28px] font-bold mb-2">クレジット料金</h2>
            <p className="text-[14px] text-muted-foreground">
              1タスク = 10〜15クレジット消費。使い切ったら追加購入。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {PRICING.map((p) => (
              <PricingCard key={p.name} plan={p} onSelect={onLogin} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-5">
          <h2 className="text-[24px] sm:text-[32px] font-bold">
            今すぐAI企業に仕事を依頼しよう
          </h2>
          <p className="text-[14px] text-muted-foreground">
            登録無料。クレジット購入から最初のタスク完了まで30分。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              className="h-11 px-8 bg-primary hover:bg-primary/90 text-[14px] font-semibold"
              onClick={onLogin}
            >
              無料で始める
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">D</span>
            </div>
            <span className="text-[12px] font-semibold">DevOffice AI</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © 2026 DevOffice AI — チーム「イキイキとした毎日」
          </p>
        </div>
      </footer>
    </div>
  );
}
