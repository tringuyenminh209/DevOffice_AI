import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { findPath, ZONE_POSITIONS } from '../utils/pathfinding';

interface AgentData {
  id: string;
  name: string;
  color: string;
  state: 'idle' | 'thinking' | 'tool_call' | 'waiting' | 'error';
  targetZone: string;
}

const AGENT_DATA: AgentData[] = [
  { id: 'RS', name: 'Researcher', color: '#267ADE', state: 'tool_call', targetZone: 'dataVault' },
  { id: 'AN', name: 'Analyst',   color: '#E5BA2E', state: 'waiting',   targetZone: 'approvalGate' },
  { id: 'WR', name: 'Writer',    color: '#228B22', state: 'idle',      targetZone: 'lounge' },
  { id: 'RV', name: 'Reviewer',  color: '#5E55EA', state: 'idle',      targetZone: 'meetingRoom' },
  { id: 'DV', name: 'Developer', color: '#36454F', state: 'error',     targetZone: 'workstations' },
];

const STATE_COLOR: Record<string, number> = {
  thinking:  0xEB9619,
  tool_call: 0x7D75F7,
  waiting:   0xEB9619,
  idle:      0x556177,
  error:     0xDA3950,
};

const STATE_LABEL: Record<string, string> = {
  thinking:  'THINKING',
  tool_call: 'TOOL CALL',
  waiting:   'AWAITING',
  idle:      'IDLE',
  error:     'ERROR',
};

function hexN(color: string): number {
  return parseInt(color.replace('#', '0x'));
}

function darken(color: number, f = 0.65): number {
  const r = Math.floor(((color >> 16) & 0xFF) * f);
  const g = Math.floor(((color >> 8)  & 0xFF) * f);
  const b = Math.floor((color & 0xFF) * f);
  return (r << 16) | (g << 8) | b;
}

// ─────────────────────────────────────────────────────────
// Chibi Agent
// Character container centered at "hip" level (y=0).
// sprite  = position container, moved by pathfinding
// body    = visual container, idle-bobs independently
// ─────────────────────────────────────────────────────────
class Agent {
  public  sprite: Phaser.GameObjects.Container;
  private body:   Phaser.GameObjects.Container;
  public  id: string;
  private colorNum: number;
  public  state: string;
  public  path: { x: number; y: number }[] = [];
  public  pathIndex = 0;
  public  isMoving = false;
  private eyeL!: Phaser.GameObjects.Ellipse;
  private eyeR!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, data: AgentData, pos: { x: number; y: number }) {
    this.id       = data.id;
    this.colorNum = hexN(data.color);
    this.state    = data.state;

    this.sprite = scene.add.container(pos.x, pos.y);
    this.sprite.setDepth(50 + pos.y * 0.05);

    this.body = scene.add.container(0, 0);
    this.sprite.add(this.body);

    this.drawCharacter(scene, data);
    this.addStateBadge(scene, data);
    this.startAnimations(scene);
  }

  // shorthand: add to body
  private b<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.body.add(obj);
    return obj;
  }

  // ── Full chibi body ─────────────────────────────────────
  private drawCharacter(scene: Phaser.Scene, data: AgentData) {
    const c    = this.colorNum;
    const SKIN = 0xF5C490;
    const DARK = 0x1A1C28;

    // Active glow aura
    if (data.state !== 'idle') {
      const sc   = STATE_COLOR[data.state] ?? c;
      const aura = scene.add.ellipse(0, 0, 72, 72, sc, 0.09);
      this.body.add(aura);
      scene.tweens.add({ targets: aura, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 1400, repeat: -1, ease: 'Sine.out' });
    }

    // Shadow
    this.b(scene.add.ellipse(3, 36, 36, 11, 0x000000, 0.26));

    // Shoes
    this.b(scene.add.rectangle(-5, 31, 11, 5, DARK));
    this.b(scene.add.rectangle( 5, 31, 11, 5, DARK));

    // Pants / legs
    const pants = data.id === 'DV' ? 0x2A2F3E : darken(c, 0.6);
    this.b(scene.add.rectangle(-5, 20, 8, 17, pants));
    this.b(scene.add.rectangle( 5, 20, 8, 17, pants));
    // Belt
    this.b(scene.add.rectangle(0, 12, 22, 3, DARK));

    // Torso
    this.b(scene.add.rectangle(0, 3, 22, 18, c));
    // Shirt inner detail
    this.b(scene.add.rectangle(0, -1, 10, 9, 0xFFFFFF, 0.12));
    // Torso bottom shade
    this.b(scene.add.rectangle(0, 11.5, 22, 3, darken(c, 0.55)));

    // Arms
    this.b(scene.add.rectangle(-15, 5, 7, 17, c));
    this.b(scene.add.rectangle( 15, 5, 7, 17, c));
    // Elbow crease
    this.b(scene.add.rectangle(-15, 9, 7, 2, darken(c, 0.55)));
    this.b(scene.add.rectangle( 15, 9, 7, 2, darken(c, 0.55)));

    // Hands
    this.b(scene.add.ellipse(-15, 15, 10, 10, SKIN));
    this.b(scene.add.ellipse( 15, 15, 10, 10, SKIN));

    // Neck
    this.b(scene.add.rectangle(0, -9, 9, 7, SKIN));

    // Head
    this.b(scene.add.ellipse(0, -22, 26, 26, SKIN));

    // Hair
    this.drawHair(scene, data);

    // Eyebrows
    const bG = scene.add.graphics();
    bG.lineStyle(2, 0x3A2510, 0.8);
    bG.lineBetween(-9, -28, -4, -29);
    bG.lineBetween( 4, -29,  9, -28);
    this.body.add(bG);

    // Eyes
    this.eyeL = scene.add.ellipse(-7, -22, 6, 7, 0x1A1010);
    this.eyeR = scene.add.ellipse( 7, -22, 6, 7, 0x1A1010);
    this.body.add(this.eyeL);
    this.body.add(this.eyeR);
    // Iris (agent color tint)
    this.b(scene.add.ellipse(-7, -22, 4, 5, c, 0.55));
    this.b(scene.add.ellipse( 7, -22, 4, 5, c, 0.55));
    // Eye highlights
    this.b(scene.add.ellipse(-6, -24, 2.5, 2.5, 0xFFFFFF));
    this.b(scene.add.ellipse( 8, -24, 2.5, 2.5, 0xFFFFFF));

    // Cheek blush (chibi charm)
    this.b(scene.add.ellipse(-11, -17, 12, 6, 0xFF9999, 0.22));
    this.b(scene.add.ellipse( 11, -17, 12, 6, 0xFF9999, 0.22));

    // Mouth (small smile curve)
    const mG = scene.add.graphics();
    mG.lineStyle(1.5, 0xA06040, 0.9);
    mG.strokeEllipse(0, -15, 9, 5);
    this.body.add(mG);

    // Per-character accessories
    this.addAccessories(scene, data);
  }

  // ── Hair styles ─────────────────────────────────────────
  private drawHair(scene: Phaser.Scene, data: AgentData) {
    const g = scene.add.graphics();

    switch (data.id) {
      case 'RS': {
        // Dark blue-black, neat center-parted
        g.fillStyle(0x151A30, 1);
        g.fillEllipse(0, -32, 28, 16);
        g.fillRect(-14, -34, 28, 16);
        g.fillRect(-14, -34, 6,  20);
        g.fillRect( 8,  -34, 6,  18);
        g.lineStyle(1, 0x0C0F1E);
        g.lineBetween(0, -34, 0, -27);
        break;
      }
      case 'AN': {
        // Golden blonde, swept up spiky
        g.fillStyle(0xFFCC30, 1);
        g.fillEllipse(0, -32, 26, 14);
        g.fillRect(-13, -32, 26, 12);
        g.fillRect(-13, -32, 5,  16);
        g.fillRect( 8,  -32, 5,  14);
        g.fillTriangle(-6, -34,  0, -42,  5, -34);
        g.fillTriangle(-2, -36,  4, -44,  9, -36);
        g.lineStyle(1, 0xE5BA2E, 0.4);
        g.lineBetween(-2, -38, 2, -43);
        break;
      }
      case 'WR': {
        // Dark teal, wavy medium length
        g.fillStyle(0x0E2828, 1);
        g.fillEllipse(0, -32, 28, 15);
        g.fillRect(-14, -32, 28, 14);
        g.fillRect(-14, -32, 6,  22);
        g.fillRect( 8,  -32, 6,  20);
        g.fillEllipse(-15, -22, 9, 14);
        break;
      }
      case 'RV': {
        // Brown, neat professional side-part
        g.fillStyle(0x5C3010, 1);
        g.fillEllipse(0, -32, 26, 14);
        g.fillRect(-13, -32, 26, 13);
        g.fillRect(-13, -32, 5,  16);
        g.fillRect( 8,  -32, 5,  16);
        g.lineStyle(1, 0x3E2008);
        g.lineBetween(-4, -32, -4, -26);
        break;
      }
      case 'DV': {
        // Black under hoodie — mostly hidden
        g.fillStyle(0x08080E, 1);
        g.fillEllipse(0, -30, 20, 9);
        // Hoodie hood (large dark shape framing face)
        g.fillStyle(0x2C3840, 0.96);
        g.fillEllipse(0, -30, 44, 28);
        g.fillStyle(0x0C0F17, 1);
        g.fillEllipse(0, -32, 26, 24);
        g.lineStyle(2, 0x36454F, 0.9);
        g.strokeEllipse(0, -30, 44, 28);
        break;
      }
    }

    this.body.add(g);
  }

  // ── Per-character accessories ────────────────────────────
  private addAccessories(scene: Phaser.Scene, data: AgentData) {
    switch (data.id) {
      case 'RS': {
        // Blue-framed glasses
        const g = scene.add.graphics();
        g.lineStyle(1.5, 0x4090CC);
        g.strokeRect(-11, -26, 8, 6);
        g.strokeRect(  3, -26, 8, 6);
        g.lineBetween(-3, -23, 3, -23);
        g.lineBetween(-11, -23, -13, -21);
        g.lineBetween(11, -23,  13, -21);
        this.body.add(g);
        this.b(scene.add.rectangle(-7, -23, 6, 4, 0x267ADE, 0.28));
        this.b(scene.add.rectangle( 7, -23, 6, 4, 0x267ADE, 0.28));
        // Tablet in right hand
        const tab = scene.add.rectangle(20, 13, 12, 15, 0x1D202B);
        tab.setStrokeStyle(1.5, 0x267ADE);
        this.body.add(tab);
        this.b(scene.add.rectangle(20, 13, 8, 11, 0x0A2E5A));
        // Screen lines
        const tG = scene.add.graphics();
        tG.lineStyle(1, 0x267ADE, 0.5);
        tG.lineBetween(16, 9,  24, 9);
        tG.lineBetween(16, 12, 22, 12);
        tG.lineBetween(16, 15, 24, 15);
        this.body.add(tG);
        break;
      }

      case 'AN': {
        // Tech visor bar
        const visor = scene.add.rectangle(0, -23, 26, 5, 0xE5BA2E, 0.45);
        visor.setStrokeStyle(1, 0xFFD700);
        this.body.add(visor);
        // Hologram dots above
        for (let i = 0; i < 3; i++) {
          const dot = scene.add.ellipse(-8 + i * 8, -50, 5, 5, 0xE5BA2E, 0.9);
          this.body.add(dot);
          scene.tweens.add({ targets: dot, y: -56, alpha: 0.1, duration: 600 + i * 140, yoyo: true, repeat: -1 });
        }
        // Suit lapels
        this.b(scene.add.rectangle(-5, 3, 4, 14, darken(0xE5BA2E, 0.5), 0.5));
        this.b(scene.add.rectangle( 5, 3, 4, 14, darken(0xE5BA2E, 0.5), 0.5));
        break;
      }

      case 'WR': {
        // Headphone band arc
        const g = scene.add.graphics();
        g.lineStyle(3.5, 0x228B22, 0.95);
        g.strokeEllipse(0, -28, 32, 24);
        this.body.add(g);
        // Ear cups
        this.b(scene.add.rectangle(-16, -28, 9,  14, 0x1A5C1A));
        this.b(scene.add.rectangle( 16, -28, 9,  14, 0x1A5C1A));
        // Scarf
        this.b(scene.add.rectangle( 0, -8, 18, 6, 0x228B22, 0.6));
        this.b(scene.add.rectangle( 9, -6,  7, 9, 0x228B22, 0.5));
        break;
      }

      case 'RV': {
        // Vest panels
        this.b(scene.add.rectangle(-7, 3, 4, 16, 0x5E55EA, 0.45));
        this.b(scene.add.rectangle( 7, 3, 4, 16, 0x5E55EA, 0.45));
        // Wooden stamp
        const handle = scene.add.rectangle(21, 10, 6, 10, 0x5C3030);
        const head   = scene.add.rectangle(21, 18, 14,  8, 0x8B0000);
        head.setStrokeStyle(1, 0xCC2222, 0.7);
        this.body.add(handle);
        this.body.add(head);
        this.b(scene.add.ellipse(21, 18, 11, 6, 0xDA3950, 0.55));
        break;
      }

      case 'DV': {
        // Coffee cup
        const cup = scene.add.rectangle(19, 13, 11, 14, 0x3E2010);
        cup.setStrokeStyle(1, 0x6B4423);
        this.body.add(cup);
        this.b(scene.add.ellipse(19, 7, 11, 6, 0x5C3317));
        const hG = scene.add.graphics();
        hG.lineStyle(2.5, 0x6B4423);
        hG.strokeEllipse(26, 13, 10, 10);
        this.body.add(hG);
        // Code text on chest
        const code = scene.add.text(0, 3, '01\n10', {
          fontSize: '5px', fontFamily: '"Courier New", monospace', color: '#10B06B',
        });
        code.setOrigin(0.5, 0.5);
        code.setAlpha(0.35);
        this.body.add(code);
        break;
      }
    }
  }

  // ── State badge above character ──────────────────────────
  private addStateBadge(scene: Phaser.Scene, data: AgentData) {
    const sc  = STATE_COLOR[data.state] ?? 0x556177;
    const lbl = STATE_LABEL[data.state] ?? data.state.toUpperCase();

    const badgeText = scene.add.text(0, -54, lbl, {
      fontSize: '7px', fontFamily: '"Courier New", monospace',
      color: '#' + sc.toString(16).padStart(6, '0'), fontStyle: 'bold',
    });
    badgeText.setOrigin(0.5, 0.5);

    const badgeBg = scene.add.rectangle(0, -54, badgeText.width + 10, 13, 0x1D202B);
    badgeBg.setStrokeStyle(1, sc, 0.8);
    this.body.add(badgeBg);
    this.body.add(badgeText);

    // Waiting: blinking dots + spinning ring
    if (data.state === 'waiting') {
      for (let i = 0; i < 3; i++) {
        const dot = scene.add.ellipse(-8 + i * 8, -66, 5, 5, 0xEB9619);
        this.body.add(dot);
        scene.tweens.add({ targets: dot, alpha: 0.1, duration: 500, delay: i * 160, yoyo: true, repeat: -1 });
      }
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0xEB9619, 0.75);
      ring.strokeCircle(0, 0, 38);
      this.body.add(ring);
      scene.tweens.add({ targets: ring, angle: 360, duration: 3000, repeat: -1 });
    }

    // Error: blinking alert icon
    if (data.state === 'error') {
      const errBg = scene.add.rectangle(26, -32, 16, 16, 0xDA3950);
      const errT  = scene.add.text(26, -32, '!', {
        fontSize: '10px', fontFamily: '"Courier New", monospace', color: '#FFF', fontStyle: 'bold',
      });
      errT.setOrigin(0.5, 0.5);
      this.body.add(errBg);
      this.body.add(errT);
      scene.tweens.add({ targets: [errBg, errT], alpha: 0.1, duration: 380, yoyo: true, repeat: -1 });
    }
  }

  // ── Idle animations ──────────────────────────────────────
  private startAnimations(scene: Phaser.Scene) {
    // Bob on body (independent of sprite position)
    scene.tweens.add({
      targets: this.body,
      y: -5,
      duration: 1100 + Math.random() * 600,
      yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });

    // Periodic eye blink
    scene.time.addEvent({
      delay: 3000 + Math.random() * 2500,
      callback: () => {
        scene.tweens.add({
          targets: [this.eyeL, this.eyeR],
          scaleY: 0.08, duration: 70, yoyo: true,
        });
      },
      loop: true,
    });
  }

  // ── Pathfinding movement ─────────────────────────────────
  public moveTo(scene: Phaser.Scene, target: { x: number; y: number }) {
    this.path      = findPath({ x: this.sprite.x, y: this.sprite.y }, target);
    this.pathIndex = 0;
    this.isMoving  = true;
  }

  public update(_scene: Phaser.Scene, delta: number) {
    if (!this.isMoving || this.path.length === 0) return;

    const speed   = this.state === 'error' ? 360 : 180;
    const maxDist = (speed * delta) / 1000;

    if (this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.sprite.x;
      const dy = target.y - this.sprite.y;
      const d  = Math.sqrt(dx * dx + dy * dy);

      if (d <= maxDist) {
        this.sprite.x = target.x;
        this.sprite.y = target.y;
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) this.isMoving = false;
      } else {
        const r = maxDist / d;
        this.sprite.x += dx * r;
        this.sprite.y += dy * r;
        // Flip body (not sprite) when moving left — keeps badges readable
        if (dx < 0 && this.body.scaleX > 0) this.body.setScale(-1, 1);
        else if (dx > 0 && this.body.scaleX < 0) this.body.setScale(1, 1);
      }
      this.sprite.setDepth(50 + this.sprite.y * 0.05);
    }
  }
}

// ─────────────────────────────────────────────────────────
// Main Phaser Scene
// ─────────────────────────────────────────────────────────
class VirtualOfficeScene extends Phaser.Scene {
  private agents: Map<string, Agent> = new Map();
  private leds: Phaser.GameObjects.Ellipse[] = [];
  private scrollBars: Phaser.GameObjects.Rectangle[] = [];

  constructor() { super({ key: 'VirtualOfficeScene' }); }

  create() {
    this.cameras.main.setBackgroundColor('#080C11');
    this.drawFloor();
    this.drawLounge();
    this.drawDataVault();
    this.drawWorkstations();
    this.drawMeetingRoom();
    this.drawCentralHallway();
    this.createAgents();
    this.startAnimations();
  }

  update(_t: number, delta: number) {
    this.agents.forEach(a => a.update(this, delta));
  }

  // ── 32px checkerboard floor ──────────────────────────────
  private drawFloor() {
    const T = 32;
    const g = this.add.graphics();
    g.setDepth(0);
    for (let x = 0; x < 1280; x += T) {
      for (let y = 0; y < 720; y += T) {
        const even = (Math.floor(x / T) + Math.floor(y / T)) % 2 === 0;
        g.fillStyle(even ? 0x0C0F17 : 0x0F1421, 1);
        g.fillRect(x, y, T, T);
      }
    }
    g.lineStyle(1, 0x181C28, 0.5);
    for (let x = 0; x <= 1280; x += T) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y <= 720; y += T) g.lineBetween(0, y, 1280, y);
  }

  // ── Zone helpers ─────────────────────────────────────────
  private zoneBox(x: number, y: number, w: number, h: number, col: number) {
    const g = this.add.graphics();
    g.setDepth(5);
    g.fillStyle(col, 0.07);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1, col, 0.5);
    g.strokeRoundedRect(x, y, w, h, 8);
  }

  private zoneLabel(text: string, x: number, y: number, col: number) {
    const t = this.add.text(x, y, text, {
      fontSize: '8px', fontFamily: '"Courier New", monospace',
      color: '#' + col.toString(16).padStart(6, '0'), fontStyle: 'bold',
    });
    t.setDepth(61);
    const bg = this.add.rectangle(x + t.width / 2 + 4, y + 7, t.width + 10, 14, 0x1A1D28);
    bg.setStrokeStyle(1, col, 0.65);
    bg.setDepth(60);
  }

  // ── Lounge ───────────────────────────────────────────────
  private drawLounge() {
    this.zoneBox(60, 58, 264, 216, 0x267ADE);
    this.zoneLabel('LOUNGE', 68, 66, 0x267ADE);
    const g = this.add.graphics(); g.setDepth(10);

    // Rug
    g.fillStyle(0x1A2A4A, 0.55);
    g.fillEllipse(182, 176, 200, 84);
    g.lineStyle(1, 0x267ADE, 0.15);
    g.strokeEllipse(182, 176, 200, 84);

    // Sofa back
    g.fillStyle(0x1A2350, 1);
    g.fillRoundedRect(100, 118, 152, 17, 4);
    // Sofa seat
    g.fillStyle(0x1E2960, 1);
    g.fillRoundedRect(100, 132, 152, 36, 4);
    // Front face 2.5D
    g.fillStyle(0x141830, 1);
    g.fillRect(100, 166, 152, 7);
    // Armrests
    g.fillStyle(0x19205A);
    g.fillRoundedRect(97, 128, 10, 44, 3);
    g.fillRoundedRect(245, 128, 10, 44, 3);
    // Cushions
    for (let i = 0; i < 3; i++) {
      g.fillStyle(0x243480, 1);
      g.fillRoundedRect(107 + i * 47, 135, 40, 28, 3);
      g.lineStyle(1, 0x2B4070);
      g.strokeRoundedRect(107 + i * 47, 135, 40, 28, 3);
    }

    // Coffee table
    g.fillStyle(0x1A1F30, 1);
    g.fillRoundedRect(142, 180, 76, 38, 4);
    g.lineStyle(1, 0x282E44);
    g.strokeRoundedRect(142, 180, 76, 38, 4);
    g.fillStyle(0x111520);
    g.fillRect(142, 217, 76, 6);

    // Plants
    for (const px of [90, 275]) {
      g.fillStyle(0x4A3020);
      g.fillRoundedRect(px - 10, 218, 20, 16, 3);
      g.lineStyle(2, 0x228B22);
      g.lineBetween(px, 218, px, 203);
      for (const [lx, ly] of [[-8,-7],[8,-7],[-6,-13],[6,-13],[0,-17]]) {
        g.fillStyle(0x228B22, 0.9);
        g.fillEllipse(px + lx, 203 + ly, 11, 9);
      }
    }

    // Coffee machine
    g.fillStyle(0x28303E, 1);
    g.fillRoundedRect(272, 105, 38, 50, 4);
    g.lineStyle(1, 0x363E50);
    g.strokeRoundedRect(272, 105, 38, 50, 4);
    g.fillStyle(0x1D202B, 1);
    g.fillRect(276, 111, 30, 22);
    g.fillStyle(0x5E55EA); g.fillCircle(284, 118, 3);
    g.fillStyle(0x10B06B); g.fillCircle(294, 118, 3);
    g.fillStyle(0x111520); g.fillEllipse(291, 148, 15, 8);
    g.fillStyle(0x3E2010); g.fillEllipse(291, 148, 10, 6);
  }

  // ── Data Vault ───────────────────────────────────────────
  private drawDataVault() {
    this.zoneBox(1020, 58, 254, 216, 0x267ADE);
    this.zoneLabel('DATA VAULT', 1028, 66, 0x267ADE);
    const g = this.add.graphics(); g.setDepth(10);

    g.lineStyle(2, 0x267ADE, 0.65);
    g.lineBetween(1058, 90, 1258, 90);
    g.lineStyle(1, 0x267ADE, 0.3);
    g.lineBetween(1058, 90, 1058, 150);
    g.lineBetween(1258, 90, 1258, 150);

    const rackXs = [1042, 1090, 1138, 1186];
    for (const rx of rackXs) {
      g.fillStyle(0x1E2028, 1); g.fillRect(rx, 106, 40, 134);
      g.fillStyle(0x262A36, 1); g.fillRect(rx, 110, 40, 130);
      g.lineStyle(1, 0x333844); g.strokeRect(rx, 110, 40, 130);
      g.lineStyle(1, 0x1A1E28, 0.9);
      for (let row = 0; row < 6; row++) g.lineBetween(rx + 2, 116 + row * 20, rx + 38, 116 + row * 20);
      g.fillStyle(0x30353F); g.fillRect(rx, 106, 40, 5);

      const ledColors = [0x10B06B, 0x267ADE, 0xEB9619];
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 3; col++) {
          const led = this.add.ellipse(rx + 8 + col * 12, 120 + row * 20, 6, 6, ledColors[(row + col) % 3], 0.9);
          led.setDepth(12);
          this.leds.push(led);
        }
      }
    }

    // Mainframe
    const [mfX, mfY] = [1230, 190];
    g.fillStyle(0x0C0D12, 1); g.fillRect(mfX - 26, mfY - 34, 52, 62);
    g.lineStyle(1.5, 0x267ADE, 0.9); g.strokeRect(mfX - 26, mfY - 34, 52, 62);
    g.fillStyle(0x267ADE, 0.1); g.fillEllipse(mfX, mfY, 72, 42);

    for (let i = 0; i < 7; i++) {
      const bw  = 8 + (i * 7) % 34;
      const bar = this.add.rectangle(mfX - 22 + bw / 2, mfY - 28 + i * 8, bw, 4, 0x0ED061, 0.8);
      bar.setDepth(12);
      this.scrollBars.push(bar);
    }
  }

  // ── Workstations ─────────────────────────────────────────
  private drawWorkstations() {
    this.zoneBox(348, 254, 506, 286, 0x7D8BA3);
    this.zoneLabel('WORKSTATIONS', 356, 262, 0x7D8BA3);

    const desks = [
      { id: 'RS', x: 400, y: 320, color: 0x267ADE, screens: 1 },
      { id: 'AN', x: 600, y: 320, color: 0xE5BA2E, screens: 1 },
      { id: 'WR', x: 800, y: 320, color: 0x228B22, screens: 1 },
      { id: 'RV', x: 400, y: 480, color: 0x5E55EA, screens: 1 },
      { id: 'DV', x: 600, y: 480, color: 0x36454F, screens: 3 },
    ];

    for (const desk of desks) {
      const g = this.add.graphics(); g.setDepth(10);

      // Chair
      g.fillStyle(0x28303A, 1); g.fillEllipse(desk.x, desk.y + 66, 44, 22);
      g.lineStyle(1, 0x353D48); g.strokeEllipse(desk.x, desk.y + 66, 44, 22);
      g.fillStyle(0x303844, 1); g.fillRoundedRect(desk.x - 15, desk.y + 53, 30, 10, 3);

      // Desk surface
      g.fillStyle(0x1D202B, 1); g.fillRoundedRect(desk.x - 66, desk.y - 50, 132, 92, 4);
      g.fillStyle(0x151720, 1); g.fillRect(desk.x - 66, desk.y + 40, 132, 8);
      g.lineStyle(1, desk.color, 0.5); g.strokeRoundedRect(desk.x - 66, desk.y - 50, 132, 92, 4);

      // Lamp indicator
      const lamp = this.add.ellipse(desk.x + 54, desk.y - 46, 10, 10, desk.color, 0.4);
      lamp.setDepth(11);
      this.tweens.add({ targets: lamp, alpha: 0.85, duration: 1400 + Math.random() * 900, yoyo: true, repeat: -1 });

      // Monitors
      const spacing = 58;
      const startX  = desk.x - ((desk.screens - 1) * spacing) / 2;
      for (let m = 0; m < desk.screens; m++) {
        const mx = startX + m * spacing;
        const g2 = this.add.graphics(); g2.setDepth(15);
        g2.fillStyle(0x1A1C24, 1); g2.fillRoundedRect(mx - 24, desk.y - 44, 48, 34, 3);
        g2.lineStyle(1, 0x2B303F); g2.strokeRoundedRect(mx - 24, desk.y - 44, 48, 34, 3);
        const sc = desk.id === 'DV' ? 0x0A2E1A : 0x0A1828;
        g2.fillStyle(sc, 1); g2.fillRect(mx - 20, desk.y - 40, 40, 26);
        g2.lineStyle(1, desk.color, 0.35);
        for (let ln = 0; ln < 3; ln++) g2.lineBetween(mx - 16, desk.y - 34 + ln * 8, mx - 16 + 28 - ln * 6, desk.y - 34 + ln * 8);
        g2.fillStyle(0x242830, 1); g2.fillRect(mx - 5, desk.y - 10, 10, 8);
      }
    }
  }

  // ── Meeting Room ─────────────────────────────────────────
  private drawMeetingRoom() {
    this.zoneBox(958, 378, 316, 336, 0x5E55EA);
    this.zoneLabel('MEETING ROOM', 966, 386, 0x5E55EA);
    const g = this.add.graphics(); g.setDepth(10);

    const [cx, cy] = [1116, 546];

    // Table
    g.fillStyle(0x000000, 0.2); g.fillEllipse(cx + 4, cy + 6, 194, 162);
    g.fillStyle(0x5C2A08, 1);   g.fillEllipse(cx, cy, 192, 158);
    g.fillStyle(0x7A3A0A, 1);   g.fillEllipse(cx, cy, 166, 136);
    g.fillStyle(0x8B4410, 0.32); g.fillEllipse(cx - 22, cy - 22, 80, 52);

    // Logo
    g.fillStyle(0x5E55EA, 0.2); g.fillEllipse(cx, cy, 44, 36);
    const logoText = this.add.text(cx, cy, 'D', { fontSize: '16px', fontFamily: '"Courier New", monospace', color: '#5E55EA', fontStyle: 'bold' });
    logoText.setOrigin(0.5, 0.5); logoText.setDepth(12);

    // Hologram
    g.fillStyle(0x5E55EA, 0.05); g.fillTriangle(cx - 28, cy - 8, cx + 28, cy - 8, cx, cy - 74);
    g.lineStyle(1, 0x5E55EA, 0.12); g.strokeTriangle(cx - 28, cy - 8, cx + 28, cy - 8, cx, cy - 74);
    for (let i = 0; i < 4; i++) {
      const ry = cy - 22 - i * 14;
      const rw = 48 - i * 10;
      g.lineStyle(1, 0x5E55EA, 0.1 + i * 0.04);
      g.strokeEllipse(cx, ry, rw, rw * 0.42);
    }
    g.fillStyle(0x3A3A54, 1); g.fillEllipse(cx, cy, 24, 16);
    g.lineStyle(1, 0x5E55EA, 0.6); g.strokeEllipse(cx, cy, 24, 16);

    // Chairs
    for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const rad = Phaser.Math.DegToRad(angle);
      const cX  = cx + Math.cos(rad) * 106;
      const cY  = cy + Math.sin(rad) * 86;
      g.fillStyle(0x2F1804, 1); g.fillEllipse(cX, cY, 24, 24);
      g.lineStyle(1, 0x5C2A08); g.strokeEllipse(cX, cY, 24, 24);
    }

    // Whiteboard
    g.fillStyle(0xDDE2E8, 1); g.fillRoundedRect(1240, 430, 30, 80, 3);
    g.lineStyle(1, 0xB0B8C4); g.strokeRoundedRect(1240, 430, 30, 80, 3);
    g.fillStyle(0x8A8A90); g.fillRect(1240, 430, 30, 4);
    g.lineStyle(1, 0x267ADE, 0.8); g.lineBetween(1244, 442, 1266, 442);
    g.lineStyle(1, 0x5E55EA, 0.8); g.lineBetween(1244, 452, 1264, 452);
    g.lineStyle(1, 0x228B22, 0.7); g.lineBetween(1244, 462, 1260, 462);
  }

  // ── Central Hallway / Approval Gate ─────────────────────
  private drawCentralHallway() {
    const g = this.add.graphics(); g.setDepth(10);

    g.fillStyle(0xDA3950, 0.17); g.fillRect(616, 174, 48, 382);
    g.lineStyle(1, 0xDA3950, 0.22); g.strokeRect(616, 174, 48, 382);
    g.lineStyle(1, 0xDA3950, 0.12); g.lineBetween(640, 174, 640, 556);

    this.zoneLabel('APPROVAL GATE', 584, 163, 0xEB9619);

    // Gate columns
    g.fillStyle(0x2A2010, 1); g.fillRect(614, 198, 10, 70); g.fillRect(656, 198, 10, 70);
    g.lineStyle(3, 0xEB9619, 0.85);
    g.strokeEllipse(640, 200, 52, 28);
    g.lineBetween(614, 200, 614, 268);
    g.lineBetween(666, 200, 666, 268);
    g.fillStyle(0xEB9619, 0.9); g.fillCircle(614, 200, 5); g.fillCircle(666, 200, 5);
    g.fillStyle(0xEB9619, 0.06); g.fillEllipse(640, 232, 110, 96);

    // Podium
    g.fillStyle(0x1D202B, 1); g.fillRoundedRect(623, 278, 34, 38, 4);
    g.lineStyle(1.5, 0xEB9619, 0.8); g.strokeRoundedRect(623, 278, 34, 38, 4);
    g.fillStyle(0x151820, 1); g.fillRect(623, 314, 34, 6);
    g.fillStyle(0xEB9619, 0.9); g.fillCircle(640, 296, 8);
    g.fillStyle(0x0C0D12); g.fillCircle(640, 296, 4);
    g.fillStyle(0xEB9619, 0.4); g.fillCircle(638, 294, 2);
  }

  // ── Create agents ────────────────────────────────────────
  private createAgents() {
    const ws = ZONE_POSITIONS.workstations as Record<string, { x: number; y: number }>;
    for (const data of AGENT_DATA) {
      let pos: { x: number; y: number };
      switch (data.targetZone) {
        case 'lounge':       pos = ZONE_POSITIONS.lounge;       break;
        case 'dataVault':    pos = ZONE_POSITIONS.dataVault;    break;
        case 'meetingRoom':  pos = ZONE_POSITIONS.meetingRoom;  break;
        case 'approvalGate': pos = ZONE_POSITIONS.approvalGate; break;
        case 'workstations': pos = ws[data.id] ?? { x: 640, y: 360 }; break;
        default:             pos = { x: 640, y: 360 };
      }
      this.agents.set(data.id, new Agent(this, data, pos));
    }
  }

  // ── Ambient animations ───────────────────────────────────
  private startAnimations() {
    // LED random blink
    this.time.addEvent({
      delay: 110,
      callback: () => {
        const led = this.leds[Math.floor(Math.random() * this.leds.length)];
        if (led) this.tweens.add({ targets: led, alpha: 0.08, duration: 90, yoyo: true });
      },
      loop: true,
    });

    // Coffee steam
    this.time.addEvent({
      delay: 550,
      callback: () => {
        const x     = 285 + Math.random() * 10 - 5;
        const steam = this.add.ellipse(x, 106, 5, 5, 0xBBCCDD, 0.3);
        steam.setDepth(20);
        this.tweens.add({
          targets: steam,
          y: 80, x: x + Math.random() * 10 - 5, alpha: 0,
          scaleX: 2.2, scaleY: 2.2, duration: 1300, ease: 'Sine.out',
          onComplete: () => steam.destroy(),
        });
      },
      loop: true,
    });

    // Mainframe scroll bars
    this.time.addEvent({
      delay: 280,
      callback: () => {
        for (const bar of this.scrollBars) bar.setSize(6 + Math.floor(Math.random() * 36), 4);
      },
      loop: true,
    });

    // Approval gate pulse
    this.time.addEvent({
      delay: 1300,
      callback: () => {
        const glow = this.add.ellipse(640, 296, 30, 30, 0xEB9619, 0.4);
        glow.setDepth(11);
        this.tweens.add({
          targets: glow, scaleX: 2.6, scaleY: 2.6, alpha: 0, duration: 1000, ease: 'Sine.out',
          onComplete: () => glow.destroy(),
        });
      },
      loop: true,
    });
  }
}

// ─────────────────────────────────────────────────────────
// React wrapper
// ─────────────────────────────────────────────────────────
export default function VirtualOfficeCanvas() {
  const gameRef      = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: containerRef.current,
      scene: VirtualOfficeScene,
      backgroundColor: '#080C11',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
    };

    gameRef.current = new Phaser.Game(config);
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#080C11] rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
