import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import type { AppNav } from '../App';

// ── Company definitions ───────────────────────────────────────────────────────

const COMPANIES = [
  { id: 'MK', col: 0, row: 0, color: '#DA3950', name: 'Marketing Crew', tasks: 2, status: 'running' as const },
  { id: 'DV', col: 1, row: 0, color: '#5E55EA', name: 'Dev Team', tasks: 1, status: 'running' as const },
  { id: 'LG', col: 2, row: 0, color: '#9333EA', name: 'Legal Review', tasks: 0, status: 'idle' as const },
  { id: 'RS', col: 1, row: 1, color: '#267ADE', name: 'Research Lab', tasks: 1, status: 'awaiting_approval' as const },
  { id: 'AN', col: 2, row: 1, color: '#10B06B', name: 'Analytics', tasks: 3, status: 'running' as const },
];

const STATUS_COLORS = {
  idle: '#556177',
  running: '#10B06B',
  awaiting_approval: '#EB9619',
  error: '#DA3950',
};

type CompanyStatus = keyof typeof STATUS_COLORS;

// ── Canvas types ──────────────────────────────────────────────────────────────

interface CanvasState {
  agents: {
    companyIdx: number;
    angle: number;
    speed: number;
    color: string;
    orbitR: number;
    pulsePhase: number;
    size: number;
  }[];
  messages: {
    fromIdx: number;
    toIdx: number;
    progress: number;
    speed: number;
    color: string;
  }[];
  t: number;
  hoveredCompany: number | null;
}

interface BuildingLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function getLayouts(W: number, H: number): BuildingLayout[] {
  const PAD = 40;
  const COLS = 3;
  const ROWS = 2;
  const GAP_X = 32;
  const GAP_Y = 28;
  const BW = (W - PAD * 2 - GAP_X * (COLS - 1)) / COLS;
  const BH = (H - PAD * 2 - GAP_Y * (ROWS - 1)) / ROWS;

  return COMPANIES.map(({ col, row }) => {
    const x = PAD + col * (BW + GAP_X);
    const y = PAD + row * (BH + GAP_Y);
    return { x, y, w: BW, h: BH, cx: x + BW / 2, cy: y + BH / 2 };
  });
}

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

// ── WorldMapCanvas ────────────────────────────────────────────────────────────

function WorldMapCanvas({
  onCompanyClick,
  onCompanyHover,
  width,
  height,
}: {
  onCompanyClick: (id: string) => void;
  onCompanyHover: (id: string | null) => void;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CanvasState>({
    agents: [],
    messages: [],
    t: 0,
    hoveredCompany: null,
  });

  // Init simulation
  useEffect(() => {
    const agentColors = ['#EB9619', '#7D75F7', '#10B06B', '#DA3950', '#267ADE'];
    stateRef.current.agents = COMPANIES.flatMap((_, ci) =>
      Array.from({ length: 4 }, (_, i) => ({
        companyIdx: ci,
        angle: (Math.PI * 2 / 4) * i + ci * 0.8,
        speed: 0.007 + Math.random() * 0.006,
        color: agentColors[(ci + i) % agentColors.length],
        orbitR: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        size: 2.5 + Math.random() * 1,
      }))
    );
    stateRef.current.messages = [
      [0, 1], [1, 4], [0, 3], [3, 4], [2, 3],
    ].map(([f, t]) => ({
      fromIdx: f, toIdx: t,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.003,
      color: ['#EB9619', '#5E55EA', '#10B06B'][Math.floor(Math.random() * 3)],
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layouts = getLayouts(width, height);

    const draw = () => {
      const s = stateRef.current;
      s.t++;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#080C11';
      ctx.fillRect(0, 0, width, height);

      // Grid dots
      ctx.fillStyle = '#1D202B';
      const GRID = 28;
      for (let gx = GRID; gx < width; gx += GRID) {
        for (let gy = GRID; gy < height; gy += GRID) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Central plaza (grid 0,1 — bottom left area)
      const plazaX = 40;
      const plazaY = (height / 2) + 4;
      const plazaR = Math.min(width, height) * 0.08;
      ctx.fillStyle = '#111420';
      ctx.beginPath();
      ctx.arc(plazaX + plazaR, plazaY, plazaR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2B303F';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Roads between buildings
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#111420';
      for (let i = 0; i < COMPANIES.length; i++) {
        for (let j = i + 1; j < COMPANIES.length; j++) {
          const ci = COMPANIES[i];
          const cj = COMPANIES[j];
          if (Math.abs(ci.col - cj.col) <= 1 && Math.abs(ci.row - cj.row) <= 1) {
            ctx.beginPath();
            ctx.moveTo(layouts[i].cx, layouts[i].cy);
            ctx.lineTo(layouts[j].cx, layouts[j].cy);
            ctx.stroke();
          }
        }
      }

      // Message lines
      s.messages.forEach((msg) => {
        msg.progress += msg.speed;
        if (msg.progress > 1) msg.progress = 0;
        const fl = layouts[msg.fromIdx];
        const tl = layouts[msg.toIdx];
        if (!fl || !tl) return;

        ctx.save();
        ctx.setLineDash([4, 7]);
        ctx.lineDashOffset = -(s.t * 0.6);
        ctx.strokeStyle = msg.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(fl.cx, fl.cy);
        ctx.lineTo(tl.cx, tl.cy);
        ctx.stroke();
        ctx.restore();

        // Traveling dot
        const px = fl.cx + (tl.cx - fl.cx) * msg.progress;
        const py = fl.cy + (tl.cy - fl.cy) * msg.progress;
        ctx.fillStyle = msg.color;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Buildings
      COMPANIES.forEach((company, ci) => {
        const l = layouts[ci];
        if (!l) return;
        const isHovered = s.hoveredCompany === ci;
        const statusColor = STATUS_COLORS[company.status as CompanyStatus] ?? '#556177';

        // Hover/active glow
        if (isHovered || company.status === 'running') {
          ctx.save();
          ctx.shadowColor = company.color;
          ctx.shadowBlur = isHovered ? 28 : 14;
          ctx.globalAlpha = isHovered ? 0.6 : 0.3;
          roundRect(ctx, l.x - 2, l.y - 2, l.w + 4, l.h + 4, 8);
          ctx.fillStyle = company.color;
          ctx.fill();
          ctx.restore();
        }

        // Building body
        ctx.fillStyle = isHovered ? '#1A1D28' : '#111420';
        roundRect(ctx, l.x, l.y, l.w, l.h, 7);
        ctx.fill();

        // Border
        ctx.strokeStyle = isHovered ? company.color : company.color + '60';
        ctx.lineWidth = isHovered ? 1.5 : 1;
        roundRect(ctx, l.x, l.y, l.w, l.h, 7);
        ctx.stroke();

        // Color stripe
        ctx.fillStyle = company.color;
        ctx.globalAlpha = 0.9;
        roundRect(ctx, l.x, l.y, l.w, 5, 7);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Company ID
        ctx.fillStyle = '#EAEDEC';
        ctx.font = `bold ${Math.round(l.h * 0.2)}px "Inter","Segoe UI",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(company.id, l.cx, l.cy - l.h * 0.08);

        // Company name (smaller)
        ctx.fillStyle = '#7D8BA3';
        ctx.font = `${Math.round(l.h * 0.12)}px "Inter","Segoe UI",sans-serif`;
        ctx.fillText(company.name, l.cx, l.cy + l.h * 0.12);

        // Status dot
        const dotPulse = company.status === 'running' ? 0.6 + 0.4 * Math.sin(s.t * 0.05 + ci) : 1;
        ctx.fillStyle = statusColor;
        ctx.globalAlpha = dotPulse;
        ctx.beginPath();
        ctx.arc(l.x + l.w - 12, l.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Task count badge
        if (company.tasks > 0) {
          const bx = l.x + 10;
          const by = l.y + 10;
          ctx.fillStyle = company.color;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff';
          ctx.font = `bold 9px "Inter","Segoe UI",sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(company.tasks), bx, by);
        }

        // Approval badge
        if (company.status === 'awaiting_approval') {
          ctx.fillStyle = '#EB9619';
          ctx.globalAlpha = 0.85 + 0.15 * Math.sin(s.t * 0.08);
          roundRect(ctx, l.cx - 28, l.y + l.h - 18, 56, 12, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#000';
          ctx.font = `bold 8px "Inter","Segoe UI",sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('承認待ち', l.cx, l.y + l.h - 12);
        }
      });

      // Agents
      s.agents.forEach((agent) => {
        agent.angle += agent.speed;
        const l = layouts[agent.companyIdx];
        if (!l) return;
        const orbitR = Math.min(l.w, l.h) * 0.22;
        const x = l.cx + Math.cos(agent.angle) * orbitR;
        const y = l.cy + Math.sin(agent.angle) * orbitR;
        const pulse = 0.6 + 0.4 * Math.sin(s.t * 0.04 + agent.pulsePhase);
        ctx.fillStyle = agent.color;
        ctx.globalAlpha = 0.8 * pulse;
        ctx.beginPath();
        ctx.arc(x, y, agent.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);

    // Mouse interaction
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);
      const layouts2 = getLayouts(width, height);
      COMPANIES.forEach((company, ci) => {
        const l = layouts2[ci];
        if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) {
          onCompanyClick(company.id);
        }
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);
      const layouts2 = getLayouts(width, height);
      let found: number | null = null;
      COMPANIES.forEach((company, ci) => {
        const l = layouts2[ci];
        if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) {
          found = ci;
          canvas.style.cursor = 'pointer';
          onCompanyHover(company.id);
        }
      });
      if (found === null) {
        canvas.style.cursor = 'default';
        onCompanyHover(null);
      }
      stateRef.current.hoveredCompany = found;
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [width, height, onCompanyClick, onCompanyHover]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ── WorldMapPage ──────────────────────────────────────────────────────────────

export default function WorldMapPage({
  nav,
  onApprovalTrigger,
}: {
  nav: AppNav;
  onApprovalTrigger: () => void;
}) {
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 560 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setCanvasSize({ w: clientWidth, h: clientHeight });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleCompanyClick = useCallback((id: string) => {
    nav.goto('company', { companyId: id });
  }, [nav]);

  const hoveredInfo = hoveredCompany ? COMPANIES.find(c => c.id === hoveredCompany) : null;
  const activeCount = COMPANIES.filter(c => c.status === 'running').length;
  const approvalCount = COMPANIES.filter(c => c.status === 'awaiting_approval').length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center px-5 gap-4 shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-white font-bold text-[11px]">D</span>
          </div>
          <span className="text-[13px] font-bold">DevOffice AI</span>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* HUD */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <span className="text-[12px] text-muted-foreground">{activeCount} 稼働中</span>
          </div>
          {approvalCount > 0 && (
            <button
              onClick={onApprovalTrigger}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber/10 border border-amber/30 text-amber text-[11px] font-medium hover:bg-amber/20 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              承認待ち {approvalCount}件
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => nav.goto('tasks')}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            My Tasks
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EB9619" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="text-[12px] font-semibold text-foreground">{nav.credits}</span>
            <span className="text-[11px] text-muted-foreground">cr</span>
          </div>
          <button
            onClick={() => nav.goto('landing')}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Home
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 relative bg-[#080C11]">
          <WorldMapCanvas
            width={canvasSize.w}
            height={canvasSize.h}
            onCompanyClick={handleCompanyClick}
            onCompanyHover={setHoveredCompany}
          />

          {/* Hover tooltip */}
          {hoveredInfo && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-lg bg-card/90 border border-border backdrop-blur-sm pointer-events-none"
              style={{ borderColor: hoveredInfo.color + '60' }}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: hoveredInfo.color }}
              >
                {hoveredInfo.id}
              </div>
              <div>
                <div className="text-[12px] font-semibold">{hoveredInfo.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  クリックしてタスクを依頼
                </div>
              </div>
              <div
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: STATUS_COLORS[hoveredInfo.status as CompanyStatus] + '20',
                  color: STATUS_COLORS[hoveredInfo.status as CompanyStatus],
                }}
              >
                {hoveredInfo.status === 'running' ? '稼働中' :
                 hoveredInfo.status === 'awaiting_approval' ? '承認待ち' : 'アイドル'}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: company list */}
        <aside className="w-56 border-l border-border bg-surface flex flex-col gap-1 p-2 overflow-y-auto shrink-0">
          <div className="px-2 py-1.5 mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              AI Companies
            </span>
          </div>
          {COMPANIES.map((company) => {
            const statusColor = STATUS_COLORS[company.status as CompanyStatus];
            return (
              <button
                key={company.id}
                onClick={() => handleCompanyClick(company.id)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-card transition-colors text-left group"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: company.color }}
                >
                  {company.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-foreground truncate">{company.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                    <span className="text-[10px] truncate" style={{ color: statusColor }}>
                      {company.status === 'running' ? `${company.tasks} tasks` :
                       company.status === 'awaiting_approval' ? '承認待ち' : 'Idle'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          <div className="mt-auto px-2 pt-2 border-t border-border">
            <Button
              size="sm"
              className="w-full text-[12px] h-8 bg-primary hover:bg-primary/90"
              onClick={() => nav.goto('credits')}
            >
              クレジット購入
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
