import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import type { AppNav } from '../App';
import { useWorldStore } from '../../stores/world';

// ═══════════════════════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════════════════════

type AgentStatus = 'idle' | 'thinking' | 'working' | 'pending';
type CompanyStatus = 'idle' | 'running' | 'awaiting_approval' | 'error';

const STATUS_COLORS: Record<CompanyStatus, string> = {
  idle: '#556177',
  running: '#10B06B',
  awaiting_approval: '#EB9619',
  error: '#DA3950',
};

const WIN_COLORS: Record<AgentStatus, string> = {
  idle: '#3A4150',
  thinking: '#EB9619',
  working: '#10B06B',
  pending: '#DA3950',
};

interface CompanyDef {
  id: string;
  name: string;
  nameJa: string;
  tagline: string;
  col: number;
  row: number;
  color: string;
  status: CompanyStatus;
  tasks: number;
  agentStatuses: AgentStatus[]; // 8 agents
  liveActivity: string;
}

const COMPANIES: CompanyDef[] = [
  {
    id: 'MK', col: 0, row: 0, color: '#DA3950',
    name: 'Marketing Crew', nameJa: 'マーケティング',
    tagline: 'LP・広告・ブランディング',
    status: 'running', tasks: 2,
    agentStatuses: ['thinking', 'working', 'idle', 'working', 'working', 'thinking', 'pending', 'idle'],
    liveActivity: 'LP コピーライティング進行中',
  },
  {
    id: 'DV', col: 1, row: 0, color: '#5E55EA',
    name: 'Dev Team', nameJa: '開発チーム',
    tagline: 'コード・API・レビュー',
    status: 'running', tasks: 1,
    agentStatuses: ['working', 'thinking', 'idle', 'working', 'pending', 'idle', 'working', 'thinking'],
    liveActivity: 'Payment API v2 実装中',
  },
  {
    id: 'LG', col: 2, row: 0, color: '#9333EA',
    name: 'Legal Review', nameJa: '法務レビュー',
    tagline: '契約書・規約・コンプライアンス',
    status: 'idle', tasks: 0,
    agentStatuses: ['working', 'thinking', 'working', 'idle', 'pending', 'idle', 'working', 'thinking'],
    liveActivity: '業務委託契約書をドラフト中',
  },
  {
    id: 'RS', col: 1, row: 1, color: '#267ADE',
    name: 'Research Lab', nameJa: 'リサーチ',
    tagline: '市場調査・競合分析',
    status: 'awaiting_approval', tasks: 1,
    agentStatuses: ['thinking', 'working', 'working', 'pending', 'idle', 'thinking', 'working', 'idle'],
    liveActivity: '競合5社ベンチマーク中',
  },
  {
    id: 'AN', col: 2, row: 1, color: '#10B06B',
    name: 'Analytics', nameJa: 'アナリティクス',
    tagline: 'データ分析・BI・KPI',
    status: 'running', tasks: 3,
    agentStatuses: ['working', 'thinking', 'working', 'idle', 'thinking', 'pending', 'working', 'idle'],
    liveActivity: 'Q2 KPI レビュー',
  },
];

const LIVE_EVENTS = [
  { time: '16:42', company: 'MK', icon: 'done',     text: 'LP コピーライティング完了' },
  { time: '16:38', company: 'DV', icon: 'start',    text: 'Payment API 実装開始' },
  { time: '16:35', company: 'AN', icon: 'approval', text: 'Q1 レポート承認待ち' },
  { time: '16:30', company: 'RS', icon: 'done',     text: '市場調査 → 成果物アップロード' },
  { time: '16:28', company: 'LG', icon: 'start',    text: 'NDA レビュー開始' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Canvas types
// ═══════════════════════════════════════════════════════════════════════════

interface BuildingLayout {
  x: number; y: number; w: number; h: number; cx: number; cy: number;
}

interface TaskCourier {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
  color: string;
  label: string;
  bouncePhase: number;
}

interface StreetLamp { x: number; y: number; phase: number }

interface CanvasState {
  couriers: TaskCourier[];
  lamps: StreetLamp[];
  t: number;
  hoveredCompany: number | null;
}

function getLayouts(W: number, H: number): BuildingLayout[] {
  const PAD = 44;
  const COLS = 3;
  const ROWS = 2;
  const GAP_X = 36;
  const GAP_Y = 32;
  const BW = (W - PAD * 2 - GAP_X * (COLS - 1)) / COLS;
  const BH = (H - PAD * 2 - GAP_Y * (ROWS - 1)) / ROWS;

  return COMPANIES.map(({ col, row }) => {
    const x = PAD + col * (BW + GAP_X);
    const y = PAD + row * (BH + GAP_Y);
    return { x, y, w: BW, h: BH, cx: x + BW / 2, cy: y + BH / 2 };
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════════════════
// Drawing helpers
// ═══════════════════════════════════════════════════════════════════════════

function drawWindowGrid(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, bw: number, bh: number,
  agentStatuses: AgentStatus[],
  t: number
) {
  // 2 rows × 4 cols = 8 windows
  const areaW = bw * 0.62;
  const areaH = bh * 0.38;
  const areaX = bx + (bw - areaW) / 2;
  const areaY = by + bh * 0.32;
  const gap = 4;
  const wW = (areaW - gap * 3) / 4;
  const wH = (areaH - gap) / 2;

  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const wx = areaX + col * (wW + gap);
    const wy = areaY + row * (wH + gap);
    const status = agentStatuses[i] ?? 'idle';
    const color = WIN_COLORS[status];
    const isActive = status !== 'idle';
    const pulse = isActive ? 0.65 + 0.35 * Math.sin(t * 0.05 + i * 0.7) : 0.3;

    // Window frame
    ctx.fillStyle = '#0A0B10';
    roundRect(ctx, wx, wy, wW, wH, 2);
    ctx.fill();

    // Light glow (inside)
    if (isActive) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.globalAlpha = pulse;
      roundRect(ctx, wx + 1, wy + 1, wW - 2, wH - 2, 1.5);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      roundRect(ctx, wx + 1, wy + 1, wW - 2, wH - 2, 1.5);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Window frame border
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.5;
    roundRect(ctx, wx, wy, wW, wH, 2);
    ctx.stroke();

    // Vertical bar (window divider)
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(wx + wW / 2, wy);
    ctx.lineTo(wx + wW / 2, wy + wH);
    ctx.stroke();
  }
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  l: BuildingLayout,
  company: CompanyDef,
  t: number,
  isHovered: boolean
) {
  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(l.cx, l.y + l.h + 6, l.w * 0.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hover/active outer glow
  const hasActivity = company.status === 'running' || company.status === 'awaiting_approval';
  if (isHovered || hasActivity) {
    ctx.save();
    ctx.shadowColor = company.color;
    ctx.shadowBlur = isHovered ? 30 : 16;
    ctx.globalAlpha = isHovered ? 0.55 : 0.28;
    ctx.fillStyle = company.color;
    roundRect(ctx, l.x - 2, l.y - 2, l.w + 4, l.h + 4, 8);
    ctx.fill();
    ctx.restore();
  }

  // Main building body
  ctx.fillStyle = isHovered ? '#1A1D28' : '#0F1219';
  roundRect(ctx, l.x, l.y, l.w, l.h, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = isHovered ? company.color : company.color + '80';
  ctx.lineWidth = isHovered ? 1.8 : 1.2;
  roundRect(ctx, l.x, l.y, l.w, l.h, 8);
  ctx.stroke();

  // Roof stripe (company color)
  ctx.fillStyle = company.color;
  ctx.globalAlpha = 0.95;
  roundRect(ctx, l.x, l.y, l.w, 6, 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Floor dividers (3 horizontal lines to suggest floors)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let f = 1; f < 3; f++) {
    const fy = l.y + (l.h / 3) * f;
    ctx.beginPath();
    ctx.moveTo(l.x + 8, fy);
    ctx.lineTo(l.x + l.w - 8, fy);
    ctx.stroke();
  }

  // Top-left: Company ID (big)
  ctx.fillStyle = '#EAEDEC';
  ctx.font = `bold ${Math.round(l.h * 0.17)}px "Inter","Segoe UI",sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(company.id, l.x + 12, l.y + 14);

  // Top-left below: Japanese name (smaller)
  ctx.fillStyle = company.color;
  ctx.font = `500 ${Math.round(l.h * 0.08)}px "Inter","Hiragino Sans","Segoe UI",sans-serif`;
  ctx.fillText(company.nameJa, l.x + 12, l.y + 14 + l.h * 0.18);

  // Top-right: Status dot
  const statusColor = STATUS_COLORS[company.status];
  const dotPulse = hasActivity ? 0.6 + 0.4 * Math.sin(t * 0.06 + company.id.charCodeAt(0)) : 1;
  ctx.fillStyle = statusColor;
  ctx.globalAlpha = dotPulse;
  ctx.beginPath();
  ctx.arc(l.x + l.w - 14, l.y + 16, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Status ring (pulse)
  if (hasActivity) {
    const ringR = 4.5 + (Math.sin(t * 0.08) + 1) * 4;
    ctx.strokeStyle = statusColor;
    ctx.globalAlpha = 0.5 - (ringR - 4.5) / 10;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(l.x + l.w - 14, l.y + 16, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Windows
  drawWindowGrid(ctx, l.x, l.y, l.w, l.h, company.agentStatuses, t);

  // Bottom: Company name full
  ctx.fillStyle = '#7D8BA3';
  ctx.font = `${Math.round(l.h * 0.085)}px "Inter","Segoe UI",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(company.name, l.cx, l.y + l.h - 10);

  // Task count badge (bottom-left)
  if (company.tasks > 0) {
    const bx = l.x + 14;
    const by = l.y + l.h - 16;
    ctx.fillStyle = company.color;
    ctx.globalAlpha = 0.95;
    roundRect(ctx, bx - 8, by - 6, 30, 12, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = `bold 8px "Inter",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${company.tasks} task${company.tasks > 1 ? 's' : ''}`, bx + 7, by);
  }

  // Approval badge (bottom-right)
  if (company.status === 'awaiting_approval') {
    const bx = l.x + l.w - 14;
    const by = l.y + l.h - 16;
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.08);
    ctx.fillStyle = '#EB9619';
    ctx.globalAlpha = pulse;
    roundRect(ctx, bx - 42, by - 6, 42, 12, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.font = `bold 8px "Inter","Hiragino Sans",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('承認待ち', bx - 21, by);
  }
}

function drawPlaza(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  // Outer circle (stone ground)
  ctx.fillStyle = '#0F1219';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2B303F';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Concentric circles
  for (let i = 1; i < 3; i++) {
    ctx.strokeStyle = 'rgba(94,85,234,0.1)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.35 + i * 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center fountain
  ctx.fillStyle = '#267ADE';
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.03);
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5E55EA';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Water droplets (animated outward)
  for (let i = 0; i < 4; i++) {
    const angle = (t * 0.05 + i * Math.PI / 2) % (Math.PI * 2);
    const dist = 6 + ((t * 0.3 + i * 30) % 20);
    const dx = cx + Math.cos(angle) * dist;
    const dy = cy + Math.sin(angle) * dist;
    const alpha = Math.max(0, 1 - (dist - 6) / 20);
    ctx.fillStyle = '#7D75F7';
    ctx.globalAlpha = alpha * 0.7;
    ctx.beginPath();
    ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Benches (4 around center)
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    const bx = cx + Math.cos(angle) * r * 0.65;
    const by = cy + Math.sin(angle) * r * 0.65;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = '#2B303F';
    roundRect(ctx, -6, -2, 12, 4, 1);
    ctx.fill();
    ctx.restore();
  }

  // Plaza label
  ctx.fillStyle = '#556177';
  ctx.font = 'bold 9px "Inter","Hiragino Sans",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('中央広場', cx, cy + r + 12);
}

function drawTaskCourier(
  ctx: CanvasRenderingContext2D,
  c: TaskCourier,
  layouts: BuildingLayout[],
  t: number
) {
  c.progress += c.speed;
  if (c.progress > 1) c.progress = 0;

  const fl = layouts[c.fromIdx];
  const tl = layouts[c.toIdx];
  if (!fl || !tl) return;

  const progEase = c.progress;
  const x = fl.cx + (tl.cx - fl.cx) * progEase;
  const y = fl.cy + (tl.cy - fl.cy) * progEase;
  const bounce = Math.sin(t * 0.15 + c.bouncePhase) * 2;
  const yb = y + bounce;

  // Trail
  const segments = 6;
  for (let i = 1; i <= segments; i++) {
    const trailProg = Math.max(0, c.progress - i * 0.015);
    const tx = fl.cx + (tl.cx - fl.cx) * trailProg;
    const ty = fl.cy + (tl.cy - fl.cy) * trailProg;
    ctx.fillStyle = c.color;
    ctx.globalAlpha = ((segments - i) / segments) * 0.25;
    ctx.beginPath();
    ctx.arc(tx, ty, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Packet
  ctx.save();
  ctx.shadowColor = c.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = c.color;
  roundRect(ctx, x - 7, yb - 5, 14, 10, 2);
  ctx.fill();
  ctx.restore();

  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  roundRect(ctx, x - 7, yb - 5, 14, 10, 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px "Inter",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.label, x, yb);
}

function drawStreetLamp(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number, t: number) {
  const glow = 0.7 + 0.3 * Math.sin(t * 0.08 + phase);

  // Lamp glow radial
  const grd = ctx.createRadialGradient(x, y, 0, x, y, 30);
  grd.addColorStop(0, `rgba(255,200,100,${0.15 * glow})`);
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();

  // Post
  ctx.fillStyle = '#2B303F';
  ctx.fillRect(x - 0.8, y - 2, 1.6, 10);

  // Light bulb
  ctx.fillStyle = `rgba(255,200,100,${glow})`;
  ctx.beginPath();
  ctx.arc(x, y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ═══════════════════════════════════════════════════════════════════════════
// Canvas component
// ═══════════════════════════════════════════════════════════════════════════

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
    couriers: [],
    lamps: [],
    t: 0,
    hoveredCompany: null,
  });

  useEffect(() => {
    const packetColors = ['#EB9619', '#5E55EA', '#10B06B', '#DA3950', '#267ADE'];
    const labels = ['LP', 'API', 'LGL', 'RSH', 'KPI', 'DOC', 'UI', 'QA'];
    const pairs = [[0, 1], [1, 4], [0, 3], [3, 4], [2, 3], [1, 3], [0, 4]];
    stateRef.current.couriers = pairs.map(([f, t], i) => ({
      fromIdx: f, toIdx: t,
      progress: Math.random(),
      speed: 0.002 + Math.random() * 0.0025,
      color: packetColors[i % packetColors.length],
      label: labels[i % labels.length],
      bouncePhase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layouts = getLayouts(width, height);

    // Street lamps at intersections
    const PAD = 44, GAP_X = 36, GAP_Y = 32;
    const COLS = 3, ROWS = 2;
    const BW = (width - PAD * 2 - GAP_X * (COLS - 1)) / COLS;
    const BH = (height - PAD * 2 - GAP_Y * (ROWS - 1)) / ROWS;
    stateRef.current.lamps = [];
    for (let r = 0; r < ROWS + 1; r++) {
      for (let c = 0; c < COLS + 1; c++) {
        const x = PAD + c * (BW + GAP_X) - GAP_X / 2;
        const y = PAD + r * (BH + GAP_Y) - GAP_Y / 2;
        if (x > 0 && y > 0 && x < width && y < height) {
          stateRef.current.lamps.push({ x, y, phase: Math.random() * Math.PI * 2 });
        }
      }
    }

    // Plaza position: where MK/DV/LG row ends + where RS row begins empty col
    // Grid cell (0,1) is empty → use that
    const plazaCx = PAD + BW / 2;
    const plazaCy = PAD + BH + GAP_Y + BH / 2;
    const plazaR = Math.min(BW, BH) * 0.35;

    const draw = () => {
      const s = stateRef.current;
      s.t++;
      const t = s.t;

      ctx.clearRect(0, 0, width, height);

      // Background gradient (night sky)
      const bgGrd = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
      bgGrd.addColorStop(0, '#0C1020');
      bgGrd.addColorStop(1, '#050710');
      ctx.fillStyle = bgGrd;
      ctx.fillRect(0, 0, width, height);

      // Grid dots
      ctx.fillStyle = '#1A1D28';
      const GRID = 26;
      for (let gx = GRID; gx < width; gx += GRID) {
        for (let gy = GRID; gy < height; gy += GRID) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Roads (draw first - underneath everything)
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0A0D15';
      ctx.lineCap = 'round';
      for (let i = 0; i < COMPANIES.length; i++) {
        for (let j = i + 1; j < COMPANIES.length; j++) {
          const ci = COMPANIES[i], cj = COMPANIES[j];
          if (Math.abs(ci.col - cj.col) <= 1 && Math.abs(ci.row - cj.row) <= 1) {
            ctx.beginPath();
            ctx.moveTo(layouts[i].cx, layouts[i].cy);
            ctx.lineTo(layouts[j].cx, layouts[j].cy);
            ctx.stroke();
          }
        }
      }
      // Road surface lighter inside
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#101420';
      for (let i = 0; i < COMPANIES.length; i++) {
        for (let j = i + 1; j < COMPANIES.length; j++) {
          const ci = COMPANIES[i], cj = COMPANIES[j];
          if (Math.abs(ci.col - cj.col) <= 1 && Math.abs(ci.row - cj.row) <= 1) {
            ctx.beginPath();
            ctx.moveTo(layouts[i].cx, layouts[i].cy);
            ctx.lineTo(layouts[j].cx, layouts[j].cy);
            ctx.stroke();
          }
        }
      }
      // Road center dashed line
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#5E55EA40';
      ctx.setLineDash([5, 8]);
      for (let i = 0; i < COMPANIES.length; i++) {
        for (let j = i + 1; j < COMPANIES.length; j++) {
          const ci = COMPANIES[i], cj = COMPANIES[j];
          if (Math.abs(ci.col - cj.col) <= 1 && Math.abs(ci.row - cj.row) <= 1) {
            ctx.beginPath();
            ctx.moveTo(layouts[i].cx, layouts[i].cy);
            ctx.lineTo(layouts[j].cx, layouts[j].cy);
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);

      // Street lamps (light before buildings)
      s.lamps.forEach(lamp => drawStreetLamp(ctx, lamp.x, lamp.y, lamp.phase, t));

      // Plaza
      drawPlaza(ctx, plazaCx, plazaCy, plazaR, t);

      // Task couriers (above roads, below buildings)
      s.couriers.forEach(c => drawTaskCourier(ctx, c, layouts, t));

      // Buildings — read live status/tasks từ ref (cập nhật bởi useWorldStore + postgres_changes)
      const liveArr = liveCompaniesRef.current.length ? liveCompaniesRef.current : COMPANIES;
      liveArr.forEach((company, ci) => {
        const l = layouts[ci];
        if (!l) return;
        const isHovered = s.hoveredCompany === ci;
        drawBuilding(ctx, l, company, t, isHovered);
      });

      // Vignette
      const vGrd = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
      vGrd.addColorStop(0, 'transparent');
      vGrd.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vGrd;
      ctx.fillRect(0, 0, width, height);

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);
      for (let ci = 0; ci < COMPANIES.length; ci++) {
        const l = layouts[ci];
        if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) {
          onCompanyClick(COMPANIES[ci].id);
          return;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);
      let found: number | null = null;
      for (let ci = 0; ci < COMPANIES.length; ci++) {
        const l = layouts[ci];
        if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) {
          found = ci;
          break;
        }
      }
      canvas.style.cursor = found !== null ? 'pointer' : 'default';
      stateRef.current.hoveredCompany = found;
      onCompanyHover(found !== null ? COMPANIES[found].id : null);
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

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════

function formatClock(date: Date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function WorldMapPage({
  nav,
  onApprovalTrigger,
}: {
  nav: AppNav;
  onApprovalTrigger: () => void;
}) {
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 560 });
  const [clock, setClock] = useState(() => formatClock(new Date()));
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

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 30000);
    return () => clearInterval(id);
  }, []);

  // === Real data from Backend ===
  const realCompanies = useWorldStore((s) => s.companies);
  const loadWorld = useWorldStore((s) => s.load);
  const subscribeWorld = useWorldStore((s) => s.subscribe);

  useEffect(() => {
    void loadWorld();
    const unsub = subscribeWorld();
    return unsub;
  }, [loadWorld, subscribeWorld]);

  // Override mock COMPANIES `status` + `tasks` with real values; keep visual styling
  const liveCompanies = useMemo(() => {
    if (!realCompanies.length) return COMPANIES;
    const byWf = new Map(realCompanies.map((c) => [c.workflowType, c]));
    return COMPANIES.map((c) => {
      const r = byWf.get(c.id as 'MK' | 'DV' | 'LG' | 'RS' | 'AN');
      if (!r) return c;
      return {
        ...c,
        status: r.status as CompanyStatus,
        tasks: r.activeTasks,
      };
    });
  }, [realCompanies]);

  // Canvas đọc live data qua ref để không phải remount khi store update.
  // Render loop chạy ~60fps nên luôn lấy giá trị mới nhất.
  const liveCompaniesRef = useRef(liveCompanies);
  useEffect(() => { liveCompaniesRef.current = liveCompanies; }, [liveCompanies]);

  const handleCompanyClick = useCallback((wfId: string) => {
    // Map workflowType → real UUID for backend
    const real = realCompanies.find((c) => c.workflowType === wfId);
    nav.goto('company', { companyId: real?.id ?? wfId });
  }, [nav, realCompanies]);

  const hoveredInfo = hoveredCompany ? liveCompanies.find(c => c.id === hoveredCompany) : null;
  const activeCount = liveCompanies.filter(c => c.status === 'running').length;
  const approvalCount = COMPANIES.filter(c => c.status === 'awaiting_approval').length;
  const totalTasks = COMPANIES.reduce((acc, c) => acc + c.tasks, 0);
  const totalAgentsWorking = COMPANIES.reduce((acc, c) => acc + c.agentStatuses.filter(s => s === 'working').length, 0);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center px-5 gap-4 shrink-0 bg-surface z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-white font-bold text-[11px]">D</span>
          </div>
          <span className="text-[13px] font-bold">DevOffice AI</span>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* HUD stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <span className="text-[12px]" style={{ color: '#7D8BA3' }}>
              <span className="font-semibold text-emerald">{activeCount}</span>/{COMPANIES.length} 稼働中
            </span>
          </div>
          <div className="text-[12px]" style={{ color: '#7D8BA3' }}>
            <span className="font-semibold" style={{ color: '#C4CDD9' }}>{totalAgentsWorking}</span> エージェント作業中
          </div>
          <div className="text-[12px]" style={{ color: '#7D8BA3' }}>
            <span className="font-semibold" style={{ color: '#C4CDD9' }}>{totalTasks}</span> タスク実行中
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
          <div className="text-[11px] font-mono" style={{ color: '#7D8BA3' }}>
            <span style={{ color: '#556177' }}>JST</span> {clock}
          </div>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => nav.goto('tasks')}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            マイタスク
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
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Home
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 relative" style={{ background: '#050710' }}>
          <WorldMapCanvas
            width={canvasSize.w}
            height={canvasSize.h}
            onCompanyClick={handleCompanyClick}
            onCompanyHover={setHoveredCompany}
          />

          {/* Enhanced hover tooltip */}
          {hoveredInfo && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-3 rounded-xl pointer-events-none"
              style={{
                background: 'rgba(15,17,25,0.95)',
                border: `1px solid ${hoveredInfo.color}60`,
                backdropFilter: 'blur(8px)',
                boxShadow: `0 0 40px ${hoveredInfo.color}20`,
                minWidth: '360px',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                style={{ backgroundColor: hoveredInfo.color }}
              >
                {hoveredInfo.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-bold">{hoveredInfo.name}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: STATUS_COLORS[hoveredInfo.status] + '20',
                      color: STATUS_COLORS[hoveredInfo.status],
                    }}
                  >
                    {hoveredInfo.status === 'running' ? '稼働中' :
                     hoveredInfo.status === 'awaiting_approval' ? '承認待ち' : 'アイドル'}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: '#9AA7BB' }}>{hoveredInfo.tagline}</p>
                {(hoveredInfo.status === 'running' || hoveredInfo.status === 'awaiting_approval') && (
                  <p className="text-[10px] italic mt-0.5" style={{ color: hoveredInfo.color }}>
                    「{hoveredInfo.liveActivity}」
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-0.5 items-end shrink-0 pl-3 border-l border-border">
                <span className="text-[9px]" style={{ color: '#556177' }}>AGENTS</span>
                <div className="flex gap-0.5">
                  {hoveredInfo.agentStatuses.map((s, i) => (
                    <div
                      key={i}
                      className="w-2 h-3 rounded-sm"
                      style={{ backgroundColor: WIN_COLORS[s], opacity: s === 'idle' ? 0.35 : 1 }}
                    />
                  ))}
                </div>
                <span className="text-[9px] mt-0.5" style={{ color: '#7D8BA3' }}>クリックで入館</span>
              </div>
            </div>
          )}

          {/* Legend (bottom-left) */}
          <div
            className="absolute bottom-4 left-4 flex flex-col gap-1.5 p-2.5 rounded-lg"
            style={{ background: 'rgba(15,17,25,0.9)', border: '1px solid #2B303F', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-[9px] font-bold tracking-widest uppercase mb-0.5" style={{ color: '#556177' }}>LEGEND</span>
            {[
              { label: '作業中',   color: '#10B06B' },
              { label: '思考中',   color: '#EB9619' },
              { label: '承認待ち', color: '#DA3950' },
              { label: '待機',     color: '#3A4150' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[10px]" style={{ color: '#7D8BA3' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-64 border-l border-border flex flex-col shrink-0" style={{ background: '#0F1118' }}>
          {/* Company list */}
          <div className="p-2 flex flex-col gap-1 overflow-y-auto flex-1">
            <div className="px-2 py-1.5 mb-1">
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#556177' }}>AI COMPANIES</span>
            </div>
            {liveCompanies.map(company => {
              const statusColor = STATUS_COLORS[company.status];
              const workingCount = company.agentStatuses.filter(s => s === 'working').length;
              return (
                <button
                  key={company.id}
                  onClick={() => handleCompanyClick(company.id)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left"
                  style={{ background: hoveredCompany === company.id ? '#15171F' : 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#15171F'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: company.color }}
                  >
                    {company.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate" style={{ color: '#EAEDEC' }}>{company.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                      <span className="text-[10px] truncate" style={{ color: statusColor }}>
                        {company.status === 'running' ? `${workingCount} 作業中` :
                         company.status === 'awaiting_approval' ? '承認待ち' : 'アイドル'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live event ticker */}
          <div className="border-t border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#556177' }}>
                LIVE EVENTS
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span className="text-[9px]" style={{ color: '#10B06B' }}>LIVE</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {LIVE_EVENTS.map((ev, i) => {
                const co = COMPANIES.find(c => c.id === ev.company);
                const iconColor =
                  ev.icon === 'done' ? '#10B06B' :
                  ev.icon === 'approval' ? '#EB9619' : '#5E55EA';
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-1.5 rounded transition-colors hover:bg-card"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: iconColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] font-mono" style={{ color: '#556177' }}>{ev.time}</span>
                        {co && (
                          <span
                            className="text-[9px] font-bold"
                            style={{ color: co.color }}
                          >
                            {ev.company}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] leading-tight" style={{ color: '#C4CDD9' }}>
                        {ev.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-border">
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
