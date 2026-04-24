import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import type { AppNav } from '../App';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type AgentStatus = 'idle' | 'thinking' | 'working' | 'pending';
type AgentLevel = 'junior' | 'mid' | 'senior' | 'lead';

interface Agent {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  specialty: string;
  level: AgentLevel;
  years: number;
  roomId: string;
  slot: 0 | 1;
  status: AgentStatus;
  task?: string;
  thought?: string;
  accent: string;
}

interface Room {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  accent: string;
}

interface Company {
  id: string;
  name: string;
  color: string;
  tagline: string;
  desc: string;
  credits: number;
  avgMin: number;
  completedTasks: number;
  rooms: Room[];
  agents: Agent[];
  commonTasks: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// World constants
// ═══════════════════════════════════════════════════════════════════════════

const OFFICE_W = 880;
const OFFICE_H = 520;
const PAD = 32;
const GAP = 24;
const ROOM_W = (OFFICE_W - PAD * 2 - GAP) / 2;
const ROOM_H = (OFFICE_H - PAD * 2 - GAP) / 2;

const ROOM_POS: Record<string, { x: number; y: number; w: number; h: number }> = {
  r1: { x: PAD, y: PAD, w: ROOM_W, h: ROOM_H },
  r2: { x: PAD + ROOM_W + GAP, y: PAD, w: ROOM_W, h: ROOM_H },
  r3: { x: PAD, y: PAD + ROOM_H + GAP, w: ROOM_W, h: ROOM_H },
  r4: { x: PAD + ROOM_W + GAP, y: PAD + ROOM_H + GAP, w: ROOM_W, h: ROOM_H },
};

const DESK_SLOTS = [
  { x: 0.28, y: 0.62 },
  { x: 0.72, y: 0.62 },
];

function agentWorldPos(a: Agent): { x: number; y: number } {
  const room = ROOM_POS[a.roomId];
  const slot = DESK_SLOTS[a.slot];
  return { x: room.x + slot.x * room.w, y: room.y + slot.y * room.h };
}

// ═══════════════════════════════════════════════════════════════════════════
// Data — 5 companies × 4 rooms × 8 agents
// ═══════════════════════════════════════════════════════════════════════════

const BASE_ROOMS_MK: Room[] = [
  { id: 'r1', name: 'リサーチルーム', nameEn: 'Research Room', description: '市場調査・競合分析・ターゲット理解', accent: '#5E55EA' },
  { id: 'r2', name: 'クリエイティブスタジオ', nameEn: 'Creative Studio', description: 'ビジュアル・グラフィック・ブランド', accent: '#9333EA' },
  { id: 'r3', name: 'コピーラボ', nameEn: 'Copy Lab', description: 'キャッチコピー・本文・メッセージ設計', accent: '#DA3950' },
  { id: 'r4', name: 'キャンペーンルーム', nameEn: 'Campaign Room', description: '戦略立案・SNS運用・予算配分', accent: '#EB9619' },
];

const BASE_ROOMS_DV: Room[] = [
  { id: 'r1', name: 'コーディングエリア', nameEn: 'Coding Area', description: 'フロント/バックエンド実装', accent: '#5E55EA' },
  { id: 'r2', name: 'アーキテクチャ室', nameEn: 'Architecture Room', description: 'システム設計・技術選定', accent: '#267ADE' },
  { id: 'r3', name: 'レビュー室', nameEn: 'Review Room', description: 'コードレビュー・リファクタ提案', accent: '#9333EA' },
  { id: 'r4', name: 'QAラボ', nameEn: 'QA Lab', description: 'テスト設計・バグ検出', accent: '#10B06B' },
];

const BASE_ROOMS_LG: Room[] = [
  { id: 'r1', name: '契約書室', nameEn: 'Contract Room', description: '契約書作成・条項精査', accent: '#9333EA' },
  { id: 'r2', name: '法務リサーチ', nameEn: 'Legal Research', description: '判例・法令・規制調査', accent: '#267ADE' },
  { id: 'r3', name: 'レビューチャンバー', nameEn: 'Review Chamber', description: '最終審査・リスク評価', accent: '#DA3950' },
  { id: 'r4', name: 'ドラフト室', nameEn: 'Drafting Room', description: '文書起案・修正提案', accent: '#EB9619' },
];

const BASE_ROOMS_RS: Room[] = [
  { id: 'r1', name: 'データラボ', nameEn: 'Data Lab', description: '定量データ分析・統計処理', accent: '#267ADE' },
  { id: 'r2', name: '分析室', nameEn: 'Analysis Room', description: '定性分析・ユーザー調査', accent: '#5E55EA' },
  { id: 'r3', name: 'ライブラリー', nameEn: 'Library', description: '文献収集・知識管理', accent: '#9333EA' },
  { id: 'r4', name: 'レポート室', nameEn: 'Report Room', description: 'レポート構造化・可視化', accent: '#10B06B' },
];

const BASE_ROOMS_AN: Room[] = [
  { id: 'r1', name: 'ダッシュボード壁', nameEn: 'Dashboard Wall', description: 'KPI監視・リアルタイム指標', accent: '#10B06B' },
  { id: 'r2', name: 'データマイニング', nameEn: 'Data Mining', description: 'ETL・データ抽出・整形', accent: '#267ADE' },
  { id: 'r3', name: 'ビジュアライゼーション', nameEn: 'Visualization', description: 'グラフ設計・可視化', accent: '#EB9619' },
  { id: 'r4', name: 'KPIルーム', nameEn: 'KPI Room', description: '目標設計・達成分析', accent: '#DA3950' },
];

function mkAgent(
  id: string, name: string, nameEn: string, role: string, specialty: string,
  level: AgentLevel, years: number, roomId: string, slot: 0 | 1,
  status: AgentStatus, accent: string, task?: string, thought?: string
): Agent {
  return { id, name, nameEn, role, specialty, level, years, roomId, slot, status, task, thought, accent };
}

const COMPANIES: Record<string, Company> = {
  MK: {
    id: 'MK', name: 'Marketing Crew', color: '#DA3950',
    tagline: 'コンテンツ・広告・ブランディングを30分で',
    desc: 'SEO記事、LP、SNSキャンペーン、広告コピーを専門AIチームが代行。調査→制作→承認の自律フロー。',
    credits: 10, avgMin: 15, completedTasks: 143,
    rooms: BASE_ROOMS_MK,
    commonTasks: ['LP コピーライティング', 'SNSキャンペーン企画', '広告クリエイティブ', 'メルマガ作成', '商品説明文', 'ブランドポジショニング'],
    agents: [
      mkAgent('MK-1', '田中 健太', 'Tanaka K.', 'Lead Researcher', '市場調査と消費者インサイト', 'lead', 8, 'r1', 0, 'thinking', '#5E55EA', undefined, 'ターゲット層のペインポイントを整理中...'),
      mkAgent('MK-2', '伊藤 さくら', 'Ito S.', 'Market Analyst', '競合分析・トレンドリサーチ', 'mid', 4, 'r1', 1, 'working', '#7D75F7', 'Q2 市場調査レポート'),
      mkAgent('MK-3', '佐藤 美咲', 'Sato M.', 'Senior Designer', 'ビジュアルデザイン・UI', 'senior', 6, 'r2', 0, 'idle', '#B966EA'),
      mkAgent('MK-4', '渡辺 誠', 'Watanabe M.', 'Brand Manager', 'ブランド戦略・ビジュアルアイデンティティ', 'senior', 7, 'r2', 1, 'working', '#9333EA', 'ブランドガイドライン v2'),
      mkAgent('MK-5', '山田 花子', 'Yamada H.', 'Head Copywriter', 'コピー・文章全般', 'lead', 10, 'r3', 0, 'working', '#DA3950', 'LP コピー v3'),
      mkAgent('MK-6', '小林 翼', 'Kobayashi T.', 'Junior Copywriter', 'SNS投稿文・短文コピー', 'junior', 2, 'r3', 1, 'thinking', '#EF5D7A', undefined, 'ヘッドラインのA/B案を考え中'),
      mkAgent('MK-7', '鈴木 一郎', 'Suzuki I.', 'Campaign Strategist', 'キャンペーン全体設計', 'senior', 9, 'r4', 0, 'pending', '#EB9619', '春キャンペーン企画'),
      mkAgent('MK-8', '高橋 優', 'Takahashi Y.', 'SNS Specialist', 'Twitter/Instagram運用', 'mid', 3, 'r4', 1, 'idle', '#F5B041'),
    ],
  },
  DV: {
    id: 'DV', name: 'Dev Team', color: '#5E55EA',
    tagline: 'コード生成・レビュー・バグ修正を高品質に',
    desc: 'React/TypeScript、API、DB、CI/CDまで対応。設計→実装→レビュー→QAの品質重視フロー。',
    credits: 15, avgMin: 25, completedTasks: 89,
    rooms: BASE_ROOMS_DV,
    commonTasks: ['React コンポーネント開発', 'API エンドポイント設計', 'バグ調査', 'コードレビュー', 'ユニットテスト生成', 'DB クエリ最適化'],
    agents: [
      mkAgent('DV-1', '中村 太郎', 'Nakamura T.', 'Tech Lead', 'フルスタック・技術リード', 'lead', 12, 'r1', 0, 'working', '#5E55EA', 'Payment API v2 実装'),
      mkAgent('DV-2', '木村 拓也', 'Kimura T.', 'Senior Developer', 'バックエンド・Go/Node', 'senior', 7, 'r1', 1, 'thinking', '#7D75F7', undefined, 'データベーストランザクション設計'),
      mkAgent('DV-3', '森田 健二', 'Morita K.', 'Solutions Architect', 'システム設計・スケーラビリティ', 'senior', 10, 'r2', 0, 'idle', '#267ADE'),
      mkAgent('DV-4', '松本 隆', 'Matsumoto T.', 'System Designer', 'API契約・データモデル設計', 'mid', 5, 'r2', 1, 'working', '#4B9DE8', 'ER図 v3 作成中'),
      mkAgent('DV-5', '加藤 勇', 'Kato I.', 'Senior Reviewer', 'コードレビュー・設計品質', 'senior', 8, 'r3', 0, 'pending', '#9333EA', 'PR #247 レビュー'),
      mkAgent('DV-6', '井上 美穂', 'Inoue M.', 'Code Reviewer', 'フロント/TSレビュー', 'mid', 4, 'r3', 1, 'idle', '#B966EA'),
      mkAgent('DV-7', '橋本 蓮', 'Hashimoto R.', 'QA Lead', 'テスト戦略・自動化', 'lead', 9, 'r4', 0, 'working', '#10B06B', 'E2E テストスイート'),
      mkAgent('DV-8', '清水 結衣', 'Shimizu Y.', 'Test Engineer', 'ユニット・統合テスト', 'mid', 3, 'r4', 1, 'thinking', '#3AC88A', undefined, 'エッジケースを洗い出し中'),
    ],
  },
  LG: {
    id: 'LG', name: 'Legal Review', color: '#9333EA',
    tagline: '契約書・利用規約・法的文書を正確にチェック',
    desc: '日本法準拠・GDPR対応。解析→判例調査→最終確認の3段階フロー。',
    credits: 12, avgMin: 20, completedTasks: 67,
    rooms: BASE_ROOMS_LG,
    commonTasks: ['NDA レビュー', '利用規約ドラフト', 'プライバシーポリシー監査', '雇用契約チェック', '業務委託契約', 'IP ライセンスレビュー'],
    agents: [
      mkAgent('LG-1', '藤田 正義', 'Fujita M.', 'Lead Attorney', '契約書作成・法的助言', 'lead', 15, 'r1', 0, 'working', '#9333EA', '業務委託契約書 v2'),
      mkAgent('LG-2', '野村 明美', 'Nomura A.', 'Contract Specialist', 'NDA・取引契約', 'senior', 8, 'r1', 1, 'thinking', '#B966EA', undefined, '秘密保持条項を精査中'),
      mkAgent('LG-3', '石川 隆一', 'Ishikawa R.', 'Legal Researcher', '判例・法令調査', 'senior', 9, 'r2', 0, 'working', '#267ADE', '個人情報保護法 改正点'),
      mkAgent('LG-4', '村上 由美', 'Murakami Y.', 'Compliance Analyst', 'GDPR・国際規制', 'mid', 5, 'r2', 1, 'idle', '#4B9DE8'),
      mkAgent('LG-5', '長谷川 隆', 'Hasegawa T.', 'Senior Reviewer', 'リスク評価・最終審査', 'senior', 11, 'r3', 0, 'pending', '#DA3950', 'TOS v5 最終レビュー'),
      mkAgent('LG-6', '岡田 恵', 'Okada M.', 'Junior Reviewer', '形式チェック・条項確認', 'junior', 2, 'r3', 1, 'idle', '#EF5D7A'),
      mkAgent('LG-7', '三浦 敦', 'Miura A.', 'Legal Writer', '文書起案・修正', 'mid', 4, 'r4', 0, 'working', '#EB9619', 'プライバシーポリシー改訂'),
      mkAgent('LG-8', '内田 真由', 'Uchida M.', 'Paralegal', '書類整理・下書き', 'junior', 1, 'r4', 1, 'thinking', '#F5B041', undefined, '条文の整合性確認'),
    ],
  },
  RS: {
    id: 'RS', name: 'Research Lab', color: '#267ADE',
    tagline: '市場調査・競合分析を深くレポート化',
    desc: '業界トレンド、競合分析、技術調査。詳細な引用付きレポートを生成。',
    credits: 10, avgMin: 18, completedTasks: 112,
    rooms: BASE_ROOMS_RS,
    commonTasks: ['競合分析', '市場規模調査', 'ユーザーペルソナ', '技術ランドスケープ', '業界トレンドレポート', '投資機会スキャン'],
    agents: [
      mkAgent('RS-1', '近藤 博士', 'Kondo H.', 'Chief Scientist', 'データサイエンス統括', 'lead', 14, 'r1', 0, 'thinking', '#267ADE', undefined, '統計モデルを設計中'),
      mkAgent('RS-2', '菅原 理沙', 'Sugawara R.', 'Data Scientist', 'ML・統計分析', 'senior', 6, 'r1', 1, 'working', '#4B9DE8', '消費者行動データ分析'),
      mkAgent('RS-3', '原田 悟', 'Harada S.', 'Senior Analyst', '定性・定量分析', 'senior', 9, 'r2', 0, 'working', '#5E55EA', '競合5社ベンチマーク'),
      mkAgent('RS-4', '青木 真紀', 'Aoki M.', 'Market Researcher', 'ユーザー調査・インタビュー', 'mid', 4, 'r2', 1, 'pending', '#7D75F7', 'ターゲット層インタビュー'),
      mkAgent('RS-5', '柴田 学', 'Shibata M.', 'Knowledge Manager', '文献・知識ベース管理', 'senior', 8, 'r3', 0, 'idle', '#9333EA'),
      mkAgent('RS-6', '大久保 春', 'Okubo H.', 'Research Assistant', '情報収集・出典確認', 'junior', 2, 'r3', 1, 'thinking', '#B966EA', undefined, '論文をレビュー中'),
      mkAgent('RS-7', '工藤 裕太', 'Kudo Y.', 'Report Writer', 'レポート執筆・構造化', 'mid', 5, 'r4', 0, 'working', '#10B06B', '業界動向レポート Q1'),
      mkAgent('RS-8', '吉田 香奈', 'Yoshida K.', 'Insights Lead', '洞察抽出・提言', 'senior', 7, 'r4', 1, 'idle', '#3AC88A'),
    ],
  },
  AN: {
    id: 'AN', name: 'Analytics', color: '#10B06B',
    tagline: 'データを分析し、意思決定に使えるレポートに',
    desc: 'CSV/JSON分析、KPIダッシュボード、ファネル分析。分析→可視化→提言の3段階フロー。',
    credits: 8, avgMin: 12, completedTasks: 198,
    rooms: BASE_ROOMS_AN,
    commonTasks: ['売上データ分析', 'KPIダッシュボード', 'ファネル最適化', 'コホート分析', 'A/Bテスト評価', '収益帰属分析'],
    agents: [
      mkAgent('AN-1', '宮本 龍', 'Miyamoto R.', 'Data Lead', 'データ戦略・品質管理', 'lead', 10, 'r1', 0, 'working', '#10B06B', 'リアルタイムKPIモニタ'),
      mkAgent('AN-2', '西村 聡', 'Nishimura S.', 'BI Specialist', 'BI ダッシュボード設計', 'senior', 7, 'r1', 1, 'thinking', '#3AC88A', undefined, 'メトリクスの優先度付け'),
      mkAgent('AN-3', '池田 拓', 'Ikeda T.', 'Data Engineer', 'ETLパイプライン', 'senior', 8, 'r2', 0, 'working', '#267ADE', '売上データETL処理'),
      mkAgent('AN-4', '竹内 明', 'Takeuchi A.', 'ETL Developer', 'データ抽出・整形', 'mid', 4, 'r2', 1, 'idle', '#4B9DE8'),
      mkAgent('AN-5', '石田 結', 'Ishida Y.', 'Visualization Designer', 'グラフ・ダッシュデザイン', 'mid', 5, 'r3', 0, 'thinking', '#EB9619', undefined, 'グラフタイプを選定中'),
      mkAgent('AN-6', '坂本 翔', 'Sakamoto S.', 'UX Analyst', 'ユーザー行動分析', 'junior', 2, 'r3', 1, 'pending', '#F5B041', 'ファネル改善提案'),
      mkAgent('AN-7', '三宅 里奈', 'Miyake R.', 'KPI Lead', 'KPI設計・目標管理', 'senior', 6, 'r4', 0, 'working', '#DA3950', 'Q2 KPI レビュー'),
      mkAgent('AN-8', '片山 大輔', 'Katayama D.', 'Metrics Analyst', '指標分析・因果推定', 'mid', 4, 'r4', 1, 'idle', '#EF5D7A'),
    ],
  },
};

const STATUS_CFG: Record<AgentStatus, { label: string; color: string }> = {
  idle:     { label: '待機中',   color: '#556177' },
  thinking: { label: '思考中',   color: '#EB9619' },
  working:  { label: '作業中',   color: '#10B06B' },
  pending:  { label: '承認待ち', color: '#DA3950' },
};

const LEVEL_LABEL: Record<AgentLevel, string> = {
  junior: 'Junior', mid: 'Mid', senior: 'Senior', lead: 'Lead',
};

// ═══════════════════════════════════════════════════════════════════════════
// Canvas helpers
// ═══════════════════════════════════════════════════════════════════════════

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

function drawFurniture(ctx: CanvasRenderingContext2D, room: { x: number; y: number; w: number; h: number }) {
  // Whiteboard (top wall)
  ctx.fillStyle = '#1A1D27';
  roundRect(ctx, room.x + room.w * 0.25, room.y + 10, room.w * 0.5, 10, 2);
  ctx.fill();
  ctx.strokeStyle = '#2B303F'; ctx.lineWidth = 1;
  roundRect(ctx, room.x + room.w * 0.25, room.y + 10, room.w * 0.5, 10, 2);
  ctx.stroke();

  // 2 desks
  DESK_SLOTS.forEach((slot) => {
    const cx = room.x + slot.x * room.w;
    const cy = room.y + slot.y * room.h;
    const dw = 52, dh = 30;

    // Desk shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, cx - dw / 2 + 2, cy - dh / 2 + 3, dw, dh, 4);
    ctx.fill();

    // Desk surface
    ctx.fillStyle = '#2B303F';
    roundRect(ctx, cx - dw / 2, cy - dh / 2, dw, dh, 4);
    ctx.fill();

    // Desk top highlight
    ctx.strokeStyle = '#3F465A'; ctx.lineWidth = 1;
    roundRect(ctx, cx - dw / 2, cy - dh / 2, dw, dh, 4);
    ctx.stroke();

    // Monitor
    ctx.fillStyle = '#0F1118';
    roundRect(ctx, cx - 13, cy - dh / 2 + 4, 26, 14, 2);
    ctx.fill();
    ctx.strokeStyle = '#3F465A'; ctx.lineWidth = 0.8;
    roundRect(ctx, cx - 13, cy - dh / 2 + 4, 26, 14, 2);
    ctx.stroke();

    // Monitor glow
    ctx.fillStyle = 'rgba(94,85,234,0.35)';
    ctx.fillRect(cx - 11, cy - dh / 2 + 6, 22, 10);

    // Keyboard
    ctx.fillStyle = '#1A1D27';
    roundRect(ctx, cx - 10, cy + 2, 20, 5, 1);
    ctx.fill();
  });

  // Plant (top-right)
  const px = room.x + room.w - 20, py = room.y + 30;
  ctx.fillStyle = '#2B303F';
  roundRect(ctx, px - 5, py + 2, 10, 8, 1);
  ctx.fill();
  ctx.fillStyle = '#10B06B';
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0D8F58';
  ctx.beginPath();
  ctx.arc(px - 2, py - 1, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bookshelf (bottom-left)
  const sx = room.x + 12, sy = room.y + room.h - 18;
  ctx.fillStyle = '#1A1D27';
  roundRect(ctx, sx, sy, 30, 10, 2);
  ctx.fill();
  // Books
  ['#5E55EA', '#DA3950', '#EB9619', '#10B06B', '#267ADE'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(sx + 3 + i * 5, sy + 2, 3, 6);
  });
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  a: Agent,
  t: number,
  isHovered: boolean,
  isSelected: boolean
) {
  const { x, y } = agentWorldPos(a);
  const bob = Math.sin(t * 0.04 + (a.slot + a.roomId.charCodeAt(1)) * 1.3) * 1.2;
  const ay = y - 22 + bob; // center of character

  // Shadow under character
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Selection ring
  if (isSelected) {
    ctx.strokeStyle = a.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.lineDashOffset = -t * 0.3;
    ctx.beginPath();
    ctx.arc(x, ay + 4, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Body (rounded rect below head)
  const bw = 12, bh = 14;
  ctx.fillStyle = a.accent;
  roundRect(ctx, x - bw / 2, ay, bw, bh, 3);
  ctx.fill();
  // Body darker bottom
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x - bw / 2, ay + bh - 4, bw, 4);

  // Head (circle)
  ctx.fillStyle = '#E8D4B8';
  ctx.beginPath();
  ctx.arc(x, ay - 4, 7, 0, Math.PI * 2);
  ctx.fill();
  // Hair (top half)
  ctx.fillStyle = '#1A1D27';
  ctx.beginPath();
  ctx.arc(x, ay - 5, 7, Math.PI, Math.PI * 2);
  ctx.fill();
  // Small face accent (eye hint)
  ctx.fillStyle = '#1A1D27';
  ctx.fillRect(x - 2, ay - 3, 1, 1);
  ctx.fillRect(x + 1, ay - 3, 1, 1);

  // Hover highlight
  if (isHovered) {
    ctx.strokeStyle = '#EAEDEC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, ay + 4, 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Status indicator above head
  const statusColor = STATUS_CFG[a.status].color;
  if (a.status === 'working') {
    // 3 typing dots
    for (let i = 0; i < 3; i++) {
      const alpha = 0.3 + 0.7 * Math.max(0, Math.sin(t * 0.08 - i * 0.8));
      ctx.fillStyle = statusColor;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x - 4 + i * 4, ay - 15, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else if (a.status === 'thinking') {
    // Small "?" bubble
    ctx.fillStyle = '#15171F';
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 8, ay - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 7px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + 8, ay - 11);
  } else if (a.status === 'pending') {
    // Pulsing warning
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.1);
    ctx.fillStyle = statusColor;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(x + 8, ay - 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', x + 8, ay - 11);
  }
  // idle = no indicator

  // Name label (always visible)
  ctx.fillStyle = 'rgba(12,13,18,0.85)';
  const labelW = a.name.length * 7 + 6;
  roundRect(ctx, x - labelW / 2, y + 13, labelW, 11, 2);
  ctx.fill();
  ctx.fillStyle = '#C4CDD9';
  ctx.font = '8.5px "Inter", "Hiragino Sans", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(a.name, x, y + 19);
}

function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  pos: { x: number; y: number; w: number; h: number },
  companyColor: string,
  isHovered: boolean,
  isFocused: boolean
) {
  // Floor
  ctx.fillStyle = '#141721';
  roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 8);
  ctx.fill();

  // Floor tiles pattern
  ctx.strokeStyle = 'rgba(43,48,63,0.4)';
  ctx.lineWidth = 0.5;
  for (let gx = pos.x + 20; gx < pos.x + pos.w; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, pos.y); ctx.lineTo(gx, pos.y + pos.h);
    ctx.stroke();
  }
  for (let gy = pos.y + 20; gy < pos.y + pos.h; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(pos.x, gy); ctx.lineTo(pos.x + pos.w, gy);
    ctx.stroke();
  }

  // Walls (border)
  ctx.strokeStyle = isFocused ? room.accent : isHovered ? room.accent + 'AA' : '#2B303F';
  ctx.lineWidth = isFocused ? 2.5 : isHovered ? 2 : 1.5;
  roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 8);
  ctx.stroke();

  // Accent stripe top
  ctx.fillStyle = room.accent;
  ctx.globalAlpha = isFocused ? 1 : 0.7;
  roundRect(ctx, pos.x, pos.y, pos.w, 3, 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Room name (top-left corner inside room)
  ctx.fillStyle = 'rgba(12,13,18,0.85)';
  const nameW = room.name.length * 9 + 14;
  roundRect(ctx, pos.x + 6, pos.y + 6, nameW, 16, 3);
  ctx.fill();
  ctx.fillStyle = room.accent;
  ctx.font = 'bold 10px "Inter", "Hiragino Sans", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(room.name, pos.x + 13, pos.y + 14);

  // Hover glow
  if (isHovered || isFocused) {
    const alpha = isFocused ? 0.12 : 0.06;
    const grd = ctx.createRadialGradient(
      pos.x + pos.w / 2, pos.y + pos.h / 2, 0,
      pos.x + pos.w / 2, pos.y + pos.h / 2, pos.w * 0.7
    );
    grd.addColorStop(0, room.accent + Math.round(alpha * 255).toString(16).padStart(2, '0'));
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    roundRect(ctx, pos.x, pos.y, pos.w, pos.h, 8);
    ctx.fill();
  }

  // Furniture
  drawFurniture(ctx, pos);
}

// ═══════════════════════════════════════════════════════════════════════════
// OfficeCanvas
// ═══════════════════════════════════════════════════════════════════════════

function OfficeCanvas({
  company,
  focusedRoomId,
  selectedAgentId,
  onAgentClick,
  onRoomClick,
  onBackground,
  canvasWidth,
  canvasHeight,
}: {
  company: Company;
  focusedRoomId: string | null;
  selectedAgentId: string | null;
  onAgentClick: (id: string, zoomToRoom: boolean) => void;
  onRoomClick: (id: string) => void;
  onBackground: () => void;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<{ agentId: string | null; roomId: string | null }>({ agentId: null, roomId: null });
  const camRef = useRef({
    cx: OFFICE_W / 2, cy: OFFICE_H / 2, zoom: 1,
    tcx: OFFICE_W / 2, tcy: OFFICE_H / 2, tzoom: 1,
  });

  // Update camera target when focused room changes
  useEffect(() => {
    if (focusedRoomId) {
      const rp = ROOM_POS[focusedRoomId];
      camRef.current.tcx = rp.x + rp.w / 2;
      camRef.current.tcy = rp.y + rp.h / 2;
      camRef.current.tzoom = 2;
    } else {
      camRef.current.tcx = OFFICE_W / 2;
      camRef.current.tcy = OFFICE_H / 2;
      camRef.current.tzoom = 1;
    }
  }, [focusedRoomId]);

  const screenToWorld = (sx: number, sy: number) => {
    const cam = camRef.current;
    return {
      wx: (sx - canvasWidth / 2) / cam.zoom + cam.cx,
      wy: (sy - canvasHeight / 2) / cam.zoom + cam.cy,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let animId: number;

    const draw = () => {
      t++;

      // Lerp camera toward target
      const cam = camRef.current;
      const lerp = 0.12;
      cam.cx += (cam.tcx - cam.cx) * lerp;
      cam.cy += (cam.tcy - cam.cy) * lerp;
      cam.zoom += (cam.tzoom - cam.zoom) * lerp;

      // Clear
      ctx.fillStyle = '#0A0B10';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Background dot grid (in screen space)
      ctx.fillStyle = '#1A1D27';
      for (let gx = 0; gx < canvasWidth; gx += 24) {
        for (let gy = 0; gy < canvasHeight; gy += 24) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Apply camera transform
      ctx.save();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.cx, -cam.cy);

      // Office outer frame
      ctx.strokeStyle = 'rgba(94,85,234,0.15)';
      ctx.lineWidth = 2 / cam.zoom;
      ctx.strokeRect(0, 0, OFFICE_W, OFFICE_H);

      // Corridor (between rooms)
      ctx.fillStyle = '#0E1018';
      const corridorH = PAD - 8;
      ctx.fillRect(
        PAD + ROOM_W + 4, PAD,
        GAP - 8, OFFICE_H - PAD * 2
      );
      ctx.fillRect(
        PAD, PAD + ROOM_H + 4,
        OFFICE_W - PAD * 2, GAP - 8
      );

      // Rooms
      Object.entries(ROOM_POS).forEach(([id, pos]) => {
        const room = company.rooms.find(r => r.id === id);
        if (!room) return;
        const isHover = hoverRef.current.roomId === id && !focusedRoomId;
        const isFocus = focusedRoomId === id;
        drawRoom(ctx, room, pos, company.color, isHover, isFocus);
      });

      // Agents
      company.agents.forEach(a => {
        drawAgent(ctx, a, t, hoverRef.current.agentId === a.id, selectedAgentId === a.id);
      });

      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [company, focusedRoomId, selectedAgentId, canvasWidth, canvasHeight]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { wx, wy } = screenToWorld(sx, sy);

    // Check agents first
    for (const a of company.agents) {
      const p = agentWorldPos(a);
      const dx = wx - p.x, dy = wy - (p.y - 10);
      if (dx * dx + dy * dy < 18 * 18) {
        onAgentClick(a.id, focusedRoomId !== a.roomId);
        return;
      }
    }

    // Check rooms
    for (const [id, pos] of Object.entries(ROOM_POS)) {
      if (wx >= pos.x && wx <= pos.x + pos.w && wy >= pos.y && wy <= pos.y + pos.h) {
        onRoomClick(id);
        return;
      }
    }

    // Click background
    onBackground();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { wx, wy } = screenToWorld(sx, sy);

    let hoveredAgent: string | null = null;
    for (const a of company.agents) {
      const p = agentWorldPos(a);
      const dx = wx - p.x, dy = wy - (p.y - 10);
      if (dx * dx + dy * dy < 18 * 18) { hoveredAgent = a.id; break; }
    }

    let hoveredRoom: string | null = null;
    if (!hoveredAgent) {
      for (const [id, pos] of Object.entries(ROOM_POS)) {
        if (wx >= pos.x && wx <= pos.x + pos.w && wy >= pos.y && wy <= pos.y + pos.h) {
          hoveredRoom = id; break;
        }
      }
    }

    hoverRef.current = { agentId: hoveredAgent, roomId: hoveredRoom };
    canvasRef.current!.style.cursor = hoveredAgent || hoveredRoom ? 'pointer' : 'default';
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { hoverRef.current = { agentId: null, roomId: null }; }}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════

type Tab = 'request' | 'agent' | 'info';

export default function CompanyProfilePage({ nav, companyId }: { nav: AppNav; companyId: string }) {
  const company = COMPANIES[companyId] ?? COMPANIES['MK'];

  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('info');

  // Task form state
  const [brief, setBrief] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = brief.trim().length >= 10 || selectedTask.length > 0;
  const canAfford = nav.credits >= company.credits;
  const selectedAgent = company.agents.find(a => a.id === selectedAgentId) ?? null;
  const focusedRoom = company.rooms.find(r => r.id === focusedRoomId) ?? null;

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [canvasDims, setCanvasDims] = useState({ w: 900, h: 540 });
  useEffect(() => {
    const update = () => {
      if (!canvasWrapRef.current) return;
      const w = canvasWrapRef.current.clientWidth;
      const h = canvasWrapRef.current.clientHeight;
      setCanvasDims({ w: Math.max(400, w), h: Math.max(300, h) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleAgentClick = (id: string, shouldZoom: boolean) => {
    setSelectedAgentId(id);
    setTab('agent');
    if (shouldZoom) {
      const ag = company.agents.find(a => a.id === id);
      if (ag) setFocusedRoomId(ag.roomId);
    }
  };

  const handleRoomClick = (id: string) => {
    if (focusedRoomId === id) {
      setFocusedRoomId(null);
    } else {
      setFocusedRoomId(id);
    }
    setSelectedAgentId(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !canAfford) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
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
              {company.name} がタスクを受理。<br />World Map に戻ります...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center px-5 gap-3 shrink-0 bg-surface z-10">
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
          <div className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[9px]"
            style={{ backgroundColor: company.color }}>{company.id}</div>
          <span className="text-[13px] font-medium">{company.name}</span>
          {focusedRoom && (
            <>
              <span className="text-muted-foreground text-[11px] mx-1">/</span>
              <span className="text-[12px]" style={{ color: focusedRoom.accent }}>{focusedRoom.name}</span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EB9619" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="text-[12px] font-semibold">{nav.credits} cr</span>
          </div>
        </div>
      </header>

      {/* Main: canvas + side panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 relative" style={{ background: '#0A0B10' }}>
          <div ref={canvasWrapRef} className="absolute inset-0">
            <OfficeCanvas
              company={company}
              focusedRoomId={focusedRoomId}
              selectedAgentId={selectedAgentId}
              onAgentClick={handleAgentClick}
              onRoomClick={handleRoomClick}
              onBackground={() => { setFocusedRoomId(null); setSelectedAgentId(null); }}
              canvasWidth={canvasDims.w}
              canvasHeight={canvasDims.h}
            />
          </div>

          {/* Top-left: zoom-out button (only when focused) */}
          {focusedRoomId && (
            <button
              onClick={() => { setFocusedRoomId(null); setSelectedAgentId(null); }}
              className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:scale-105"
              style={{ background: 'rgba(21,23,31,0.9)', border: '1px solid #2B303F', backdropFilter: 'blur(8px)', color: '#C4CDD9' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              全体を見る
            </button>
          )}

          {/* Top-right: zoom controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 rounded-lg p-1"
            style={{ background: 'rgba(21,23,31,0.9)', border: '1px solid #2B303F', backdropFilter: 'blur(8px)' }}>
            <button
              onClick={() => {
                if (focusedRoomId) return;
                setFocusedRoomId('r1');
              }}
              disabled={!!focusedRoomId}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40"
              title="ズームイン"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4CDD9" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              onClick={() => { setFocusedRoomId(null); setSelectedAgentId(null); }}
              disabled={!focusedRoomId}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40"
              title="ズームアウト"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4CDD9" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>

          {/* Bottom-center: help text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1.5 rounded-full pointer-events-none"
            style={{ background: 'rgba(21,23,31,0.85)', border: '1px solid #2B303F', backdropFilter: 'blur(6px)' }}>
            <span className="text-[10px] flex items-center gap-2" style={{ color: '#7D8BA3' }}>
              {focusedRoomId ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  キャラクターをクリックで詳細を見る
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
                  </svg>
                  部屋をクリックでズームイン
                  <span style={{ color: '#2B303F' }}>·</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  キャラで詳細
                </>
              )}
            </span>
          </div>

          {/* Bottom-right: zoom level */}
          <div className="absolute bottom-4 right-4 text-[10px] font-mono px-2 py-1 rounded"
            style={{ background: 'rgba(21,23,31,0.85)', border: '1px solid #2B303F', backdropFilter: 'blur(6px)', color: '#7D8BA3' }}>
            {focusedRoomId ? '200%' : '100%'}
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-[380px] border-l border-border flex flex-col shrink-0" style={{ background: '#0F1118' }}>
          {/* Tabs */}
          <div className="flex border-b border-border px-1 pt-1 gap-0.5 shrink-0">
            {([
              { k: 'info' as Tab, label: '情報' },
              { k: 'agent' as Tab, label: 'エージェント', disabled: !selectedAgent },
              { k: 'request' as Tab, label: '依頼する' },
            ]).map(t => (
              <button
                key={t.k}
                onClick={() => !t.disabled && setTab(t.k)}
                disabled={t.disabled}
                className="flex-1 py-2.5 text-[12px] font-medium rounded-t-md transition-colors disabled:opacity-40"
                style={{
                  background: tab === t.k ? '#15171F' : 'transparent',
                  color: tab === t.k ? '#EAEDEC' : '#7D8BA3',
                  borderBottom: tab === t.k ? `2px solid ${company.color}` : '2px solid transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'info' && (
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[14px]"
                      style={{ backgroundColor: company.color }}>{company.id}</div>
                    <div>
                      <h1 className="text-[15px] font-bold">{company.name}</h1>
                      <p className="text-[11px]" style={{ color: '#7D8BA3' }}>{company.tagline}</p>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: '#9AA7BB' }}>{company.desc}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: `${company.credits} cr`, label: 'コスト' },
                    { val: `~${company.avgMin}分`, label: '平均時間' },
                    { val: `${company.completedTasks}`, label: '完了' },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center py-2.5 rounded-lg"
                      style={{ background: '#15171F', border: '1px solid #2B303F' }}>
                      <span className="text-[13px] font-bold">{s.val}</span>
                      <span className="text-[10px]" style={{ color: '#7D8BA3' }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Rooms list */}
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#556177' }}>FLOOR MAP</p>
                  <div className="flex flex-col gap-1.5">
                    {company.rooms.map(room => {
                      const agentsInRoom = company.agents.filter(a => a.roomId === room.id);
                      const isFocused = focusedRoomId === room.id;
                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomClick(room.id)}
                          className="text-left p-2.5 rounded-lg transition-all"
                          style={{
                            background: isFocused ? room.accent + '12' : '#15171F',
                            border: `1px solid ${isFocused ? room.accent + '60' : '#2B303F'}`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[12px] font-semibold" style={{ color: isFocused ? room.accent : '#C4CDD9' }}>
                              {room.name}
                            </span>
                            <span className="text-[10px]" style={{ color: '#7D8BA3' }}>{agentsInRoom.length}名</span>
                          </div>
                          <p className="text-[10px] leading-tight" style={{ color: '#7D8BA3' }}>{room.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Agents list */}
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#556177' }}>TEAM ({company.agents.length}名)</p>
                  <div className="flex flex-col gap-1.5">
                    {company.agents.map(a => {
                      const cfg = STATUS_CFG[a.status];
                      return (
                        <button
                          key={a.id}
                          onClick={() => handleAgentClick(a.id, true)}
                          className="flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left"
                          style={{
                            background: selectedAgentId === a.id ? '#1D202B' : '#15171F',
                            border: `1px solid ${selectedAgentId === a.id ? a.accent + '60' : '#2B303F'}`,
                          }}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                            style={{ background: a.accent + '25', border: `1px solid ${a.accent}40`, color: a.accent }}>
                            {a.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold truncate" style={{ color: '#EAEDEC' }}>{a.name}</div>
                            <div className="text-[10px] truncate" style={{ color: '#7D8BA3' }}>{a.role}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full"
                              style={{ background: cfg.color, animation: a.status !== 'idle' ? 'pulse 1.5s infinite' : undefined }} />
                            <span className="text-[9px]" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === 'agent' && selectedAgent && (
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[18px] font-bold"
                    style={{ background: selectedAgent.accent + '25', border: `1.5px solid ${selectedAgent.accent}60`, color: selectedAgent.accent }}>
                    {selectedAgent.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-bold leading-tight">{selectedAgent.name}</h2>
                    <p className="text-[11px] mb-1" style={{ color: '#7D8BA3' }}>{selectedAgent.nameEn}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: selectedAgent.accent + '20', color: selectedAgent.accent }}>
                        {LEVEL_LABEL[selectedAgent.level]}
                      </span>
                      <span className="text-[10px]" style={{ color: '#7D8BA3' }}>{selectedAgent.years}年目</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-3" style={{ background: '#15171F', border: '1px solid #2B303F' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#556177' }}>ROLE</p>
                  <p className="text-[13px] font-semibold mb-2" style={{ color: '#EAEDEC' }}>{selectedAgent.role}</p>
                  <p className="text-[11px]" style={{ color: '#9AA7BB' }}>{selectedAgent.specialty}</p>
                </div>

                <div className="rounded-xl p-3" style={{ background: '#15171F', border: '1px solid #2B303F' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#556177' }}>STATUS</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full"
                      style={{ background: STATUS_CFG[selectedAgent.status].color, animation: selectedAgent.status !== 'idle' ? 'pulse 1.5s infinite' : undefined }} />
                    <span className="text-[13px] font-semibold" style={{ color: STATUS_CFG[selectedAgent.status].color }}>
                      {STATUS_CFG[selectedAgent.status].label}
                    </span>
                  </div>
                  {selectedAgent.task && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-[10px] mb-0.5" style={{ color: '#7D8BA3' }}>現在のタスク</p>
                      <p className="text-[12px]" style={{ color: '#C4CDD9' }}>{selectedAgent.task}</p>
                    </div>
                  )}
                  {selectedAgent.thought && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-[10px] mb-0.5" style={{ color: '#7D8BA3' }}>思考ログ</p>
                      <p className="text-[12px] italic" style={{ color: '#C4CDD9' }}>&ldquo;{selectedAgent.thought}&rdquo;</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-3" style={{ background: '#15171F', border: '1px solid #2B303F' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#556177' }}>所属</p>
                  <button
                    onClick={() => handleRoomClick(selectedAgent.roomId)}
                    className="text-[13px] font-semibold hover:underline"
                    style={{ color: company.rooms.find(r => r.id === selectedAgent.roomId)?.accent ?? '#C4CDD9' }}
                  >
                    {company.rooms.find(r => r.id === selectedAgent.roomId)?.name}
                  </button>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-[12px]"
                  onClick={() => { setSelectedAgentId(null); setTab('info'); }}
                >
                  選択解除
                </Button>
              </div>
            )}

            {tab === 'request' && (
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <h2 className="text-[15px] font-bold mb-1">タスクを依頼</h2>
                  <p className="text-[11px]" style={{ color: '#7D8BA3' }}>
                    {company.name} にどんな作業を依頼しますか？
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium" style={{ color: '#C4CDD9' }}>タスクの詳細 <span style={{ color: '#DA3950' }}>*</span></label>
                  <textarea
                    value={brief}
                    onChange={e => setBrief(e.target.value)}
                    placeholder={`例: ${company.commonTasks[0]}を作成してください。ターゲットは...`}
                    rows={5}
                    className="w-full rounded-lg px-3 py-2.5 text-[12px] resize-none focus:outline-none transition-all"
                    style={{ background: '#15171F', border: '1px solid #2B303F', color: '#EAEDEC' }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: '#7D8BA3' }}>
                      {brief.length < 10 ? `最低10文字 (あと${10 - brief.length})` : `${brief.length}文字`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#C4CDD9' }}>よく依頼されるタスク</label>
                  <div className="flex flex-wrap gap-1">
                    {company.commonTasks.map(task => (
                      <button
                        key={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setBrief(prev => prev || `${task}を作成してください。`);
                        }}
                        className="text-[10px] px-2 py-1 rounded border transition-colors"
                        style={{
                          borderColor: selectedTask === task ? company.color : '#2B303F',
                          color: selectedTask === task ? company.color : '#7D8BA3',
                          background: selectedTask === task ? company.color + '10' : 'transparent',
                        }}
                      >
                        {task}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: '#15171F', border: '1px solid #2B303F' }}>
                  <div>
                    <span className="text-[10px]" style={{ color: '#7D8BA3' }}>消費</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[17px] font-bold">{company.credits}</span>
                      <span className="text-[11px]" style={{ color: '#7D8BA3' }}>cr</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px]" style={{ color: '#7D8BA3' }}>残高後</span>
                    <div className="text-[13px] font-bold"
                      style={{ color: canAfford ? '#10B06B' : '#DA3950' }}>
                      {nav.credits - company.credits} cr
                    </div>
                  </div>
                </div>

                {!canAfford && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg"
                    style={{ background: 'rgba(218,57,80,0.1)', border: '1px solid rgba(218,57,80,0.3)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DA3950" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-[11px]" style={{ color: '#DA3950' }}>
                      クレジット不足
                      <button className="underline ml-1" onClick={() => nav.goto('credits')}>購入</button>
                    </span>
                  </div>
                )}

                <Button
                  className="h-10 text-[13px] font-semibold"
                  style={{ backgroundColor: canSubmit && canAfford ? company.color : undefined }}
                  disabled={!canSubmit || !canAfford || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      送信中...
                    </span>
                  ) : (
                    `依頼する — ${company.credits} cr`
                  )}
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
