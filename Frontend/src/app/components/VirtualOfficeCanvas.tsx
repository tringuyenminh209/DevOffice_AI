import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  state: string;
  x: number;
  y: number;
}

const agents: Agent[] = [
  { id: 'RS', name: 'Researcher', role: 'researcher', color: '#267ADE', state: 'thinking', x: 1120, y: 160 },
  { id: 'AN', name: 'Analyst', role: 'analyst', color: '#E5BA2E', state: 'waiting', x: 640, y: 400 },
  { id: 'WR', name: 'Writer', role: 'writer', color: '#228B22', state: 'idle', x: 200, y: 180 },
  { id: 'RV', name: 'Reviewer', role: 'reviewer', color: '#5E55EA', state: 'idle', x: 1120, y: 540 },
  { id: 'DV', name: 'Developer', role: 'developer', color: '#36454F', state: 'error', x: 640, y: 350 }
];

class VirtualOfficeScene extends Phaser.Scene {
  private agentSprites: Map<string, any> = new Map();

  constructor() {
    super({ key: 'VirtualOfficeScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#080C11');

    this.drawGrid();
    this.drawZones();
    this.createAgents();
  }

  private drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2B303F, 0.12);

    for (let x = 0; x <= 1280; x += 60) {
      graphics.lineBetween(x, 0, x, 720);
    }

    for (let y = 0; y <= 720; y += 60) {
      graphics.lineBetween(0, y, 1280, y);
    }
  }

  private drawZones() {
    this.drawLounge();
    this.drawDataVault();
    this.drawWorkstations();
    this.drawMeetingRoom();
    this.drawCentralHallway();
  }

  private drawLounge() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x267ADE, 0.6);
    graphics.strokeRoundedRect(64, 64, 256, 210, 8);

    this.addZoneLabel('LOUNGE', 72, 72, '#267ADE');

    for (let i = 0; i < 3; i++) {
      const cushion = this.add.rectangle(120 + i * 42, 140, 38, 38, 0x1A2350);
      cushion.setStrokeStyle(1, 0x2B4070, 0.8);
    }

    const backBar = this.add.rectangle(178, 122, 134, 12, 0x1A2350);
    backBar.setStrokeStyle(1, 0x2B4070, 0.8);

    const coffeeMachine = this.add.rectangle(280, 120, 32, 44, 0x36454F);
    coffeeMachine.setStrokeStyle(1, 0x556177, 0.8);
    const cup = this.add.ellipse(280, 138, 12, 8, 0xEB9619, 0.7);

    const steamGraphics = this.add.graphics();
    steamGraphics.lineStyle(2, 0xFFFFFF, 0.4);
    for (let i = 0; i < 3; i++) {
      steamGraphics.lineBetween(274 + i * 4, 98, 274 + i * 4, 88 + Math.random() * 4);
    }

    for (let i = 0; i < 2; i++) {
      const plantX = 100 + i * 180;
      const stem = this.add.rectangle(plantX, 240, 4, 30, 0x228B22);
      for (let j = 0; j < 4; j++) {
        const angle = (j * 90) + 45;
        const rad = Phaser.Math.DegToRad(angle);
        const leafX = plantX + Math.cos(rad) * 12;
        const leafY = 240 + Math.sin(rad) * 12;
        const leaf = this.add.ellipse(leafX, leafY, 8, 16, 0x228B22);
        leaf.setRotation(rad);
      }
    }
  }

  private drawDataVault() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x267ADE, 0.6);
    graphics.strokeRoundedRect(1024, 64, 260, 210, 8);

    this.addZoneLabel('DATA VAULT', 1032, 72, '#267ADE');

    graphics.lineStyle(1, 0x267ADE, 0.6);
    graphics.lineBetween(1060, 90, 1248, 90);
    graphics.fillStyle(0x267ADE, 0.6);
    graphics.fillRect(1060, 90, 6, 50);
    graphics.fillRect(1242, 90, 6, 50);

    for (let i = 0; i < 4; i++) {
      const rackX = 1050 + i * 52;
      const rack = this.add.rectangle(rackX, 180, 44, 130, 0x36454F);
      rack.setStrokeStyle(1, 0x556177);

      const panel = this.add.rectangle(rackX, 118, 44, 12, 0x1F232F);

      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 3; col++) {
          const ledColors = [0x10B06B, 0xDA3950, 0xEB9619];
          const ledColor = ledColors[(row + col) % 3];
          const led = this.add.ellipse(rackX - 12 + col * 12, 128 + row * 12, 6, 6, ledColor, 0.8);
        }
      }
    }

    const mainframe = this.add.rectangle(1154, 200, 52, 56, 0x0C0D12);
    mainframe.setStrokeStyle(1, 0x267ADE);

    for (let i = 0; i < 6; i++) {
      const barWidth = 10 + Math.random() * 30;
      const bar = this.add.rectangle(1134, 180 + i * 8, barWidth, 4, 0x0ED061, 0.8);
      bar.setOrigin(0, 0.5);
    }
  }

  private drawWorkstations() {
    const desks = [
      { agent: 'RS', x: 400, y: 320, color: 0x267ADE, name: 'Researcher', items: 'Kính hiển vi, Sách' },
      { agent: 'AN', x: 600, y: 320, color: 0xE5BA2E, name: 'Analyst', items: 'Biểu đồ, Máy tính' },
      { agent: 'WR', x: 800, y: 320, color: 0x228B22, name: 'Writer', items: 'Tai nghe, Bút' },
      { agent: 'RV', x: 400, y: 480, color: 0x5E55EA, name: 'Reviewer', items: 'Con dấu, Hồ sơ' },
      { agent: 'DV', x: 600, y: 480, color: 0x36454F, name: 'Developer', items: '3 màn hình' }
    ];

    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x7D8BA3, 0.6);
    graphics.strokeRoundedRect(350, 260, 500, 280, 8);
    this.addZoneLabel('WORKSTATIONS', 358, 268, '#7D8BA3');

    desks.forEach(desk => {
      const deskRect = this.add.rectangle(desk.x, desk.y, 130, 92, 0x15171F);
      deskRect.setStrokeStyle(1, desk.color, 0.6);

      const monitor = this.add.rectangle(desk.x, desk.y - 10, 50, 32, 0x0C0D12);
      monitor.setStrokeStyle(1, 0x2B303F);
      const screen = this.add.rectangle(desk.x, desk.y - 10, 42, 24, 0x1D202B, 0.8);

      const isActive = desk.agent === 'RS' || desk.agent === 'AN';
      const lamp = this.add.ellipse(desk.x + 40, desk.y - 20, 14, 14, desk.color, isActive ? 1 : 0.2);

      const chair = this.add.ellipse(desk.x, desk.y + 56, 38, 20, 0x36454F);
      chair.setStrokeStyle(1, 0x556177);

      const nameText = this.add.text(desk.x, desk.y + 76, desk.name, {
        fontSize: '10px',
        fontFamily: 'Inter',
        color: '#EAEDEC',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0.5);

      const itemsText = this.add.text(desk.x, desk.y + 88, desk.items, {
        fontSize: '8px',
        fontFamily: 'Inter',
        color: '#7D8BA3'
      });
      itemsText.setOrigin(0.5);
    });
  }

  private drawMeetingRoom() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x5E55EA, 0.6);
    graphics.strokeRoundedRect(960, 384, 348, 306, 8);

    this.addZoneLabel('MEETING ROOM', 968, 392, '#5E55EA');

    const table = this.add.ellipse(1134, 537, 180, 148, 0x411305);
    const tableInner = this.add.ellipse(1134, 537, 148, 120, 0x5C2308);

    const logo = this.add.ellipse(1134, 537, 36, 30, 0x5E55EA, 0.25);
    const logoText = this.add.text(1134, 537, 'D', {
      fontSize: '16px',
      fontFamily: 'Inter',
      color: '#5E55EA',
      fontStyle: 'bold'
    });
    logoText.setOrigin(0.5);

    const chairPositions = [
      { x: 1134, y: 463 }, { x: 1186, y: 484 }, { x: 1206, y: 537 },
      { x: 1186, y: 590 }, { x: 1134, y: 611 }, { x: 1082, y: 590 },
      { x: 1062, y: 537 }, { x: 1082, y: 484 }
    ];

    chairPositions.forEach(pos => {
      const chair = this.add.ellipse(pos.x, pos.y, 20, 20, 0x2F1804);
      chair.setStrokeStyle(1, 0x411305);
    });

    const projector = this.add.ellipse(1134, 537, 26, 16, 0x47546D);

    for (let i = 0; i < 4; i++) {
      const barY = 520 - i * 8;
      const barWidth = 40 + i * 20;
      const bar = this.add.rectangle(1134, barY, barWidth, 3, 0x5E55EA, 0.1 + i * 0.03);
    }

    const whiteboard = this.add.rectangle(1240, 480, 70, 108, 0xE1E5EB);
    whiteboard.setStrokeStyle(1, 0x2B303F);

    const flowText = this.add.text(1240, 460, 'R → A → W → Rev', {
      fontSize: '7px',
      fontFamily: 'Inter',
      color: '#0C0D12'
    });
    flowText.setOrigin(0.5);

    const barColors = [0x267ADE, 0xE5BA2E, 0x228B22];
    barColors.forEach((color, i) => {
      const bar = this.add.rectangle(1210, 485 + i * 12, 50, 4, color, 0.7);
    });
  }

  private drawCentralHallway() {
    const carpet = this.add.rectangle(640, 360, 46, 350, 0xDA3950, 0.25);
    carpet.setStrokeStyle(1, 0xDA3950, 0.3);

    this.addZoneLabel('APPROVAL GATE', 600, 180, '#EB9619');

    const graphics = this.add.graphics();
    graphics.fillStyle(0xEB9619, 0.85);
    graphics.fillRect(618, 200, 10, 56);
    graphics.fillRect(652, 200, 10, 56);
    graphics.fillRect(618, 200, 44, 10);

    const glow = this.add.ellipse(640, 228, 96, 80, 0xEB9619, 0.08);

    const podium = this.add.rectangle(640, 280, 32, 36, 0x1D202B);
    podium.setStrokeStyle(1, 0xEB9619);

    const button = this.add.ellipse(640, 280, 12, 12, 0xEB9619);
    const buttonCenter = this.add.ellipse(640, 280, 4, 4, 0x0C0D12);
  }

  private createAgents() {
    agents.forEach(agent => {
      const sprite = this.add.container(agent.x, agent.y);

      const glowRing = this.add.ellipse(0, 0, 52, 52, parseInt(agent.color.replace('#', '0x')), 0.18);
      sprite.add(glowRing);

      const agentCircle = this.add.ellipse(0, 0, 40, 40, parseInt(agent.color.replace('#', '0x')));

      if (agent.state === 'thinking' || agent.state === 'waiting') {
        const activeRing = this.add.graphics();
        activeRing.lineStyle(2, 0xFFFFFF);
        activeRing.strokeCircle(0, 0, 20);
        sprite.add(activeRing);
      }

      sprite.add(agentCircle);

      const initials = this.add.text(0, 0, agent.id, {
        fontSize: '14px',
        fontFamily: 'Inter',
        color: '#0C0D12',
        fontStyle: 'bold'
      });
      initials.setOrigin(0.5);
      sprite.add(initials);

      if (agent.id === 'RS') {
        const bubble = this.createSpeechBubble(0, -50, 'Đang tìm hiểu giá đối thủ...', agent.color);
        sprite.add(bubble);

        for (let i = 0; i < 3; i++) {
          const spark = this.add.rectangle(60 + i * 15, -10 + i * 5, 2, 8, 0x10B06B);
          this.tweens.add({
            targets: spark,
            alpha: 0,
            x: spark.x + 40,
            duration: 800,
            delay: i * 200,
            repeat: -1
          });
          sprite.add(spark);
        }
      }

      if (agent.id === 'AN') {
        const bubble = this.createSpeechBubble(0, -60, 'Đã xong, chờ sếp kiểm duyệt', '#EB9619');
        sprite.add(bubble);

        const dashedRing = this.add.graphics();
        dashedRing.lineStyle(1.5, parseInt(agent.color.replace('#', '0x')), 1);
        for (let i = 0; i < 360; i += 20) {
          const rad1 = Phaser.Math.DegToRad(i);
          const rad2 = Phaser.Math.DegToRad(i + 10);
          dashedRing.beginPath();
          dashedRing.arc(0, 0, 28, rad1, rad2);
          dashedRing.strokePath();
        }
        sprite.add(dashedRing);
      }

      if (agent.id === 'WR') {
        const bubble = this.createSpeechBubble(0, -40, 'Đang nghỉ ngơi', '#7D8BA3');
        sprite.add(bubble);
        agentCircle.setAlpha(0.5);
      }

      if (agent.id === 'RV') {
        agentCircle.setAlpha(0.7);
      }

      if (agent.id === 'DV') {
        const bubble = this.createSpeechBubble(0, -70, 'Lỗi mạng\nĐang thử lại...', '#DA3950', true);
        sprite.add(bubble);

        agentCircle.setFillStyle(0xDA3950);

        const glowRing1 = this.add.ellipse(0, 0, 60, 60, 0xEB9619, 0.08);
        const glowRing2 = this.add.ellipse(0, 0, 70, 70, 0xEB9619, 0.12);
        sprite.addAt(glowRing1, 0);
        sprite.addAt(glowRing2, 0);
      }

      this.agentSprites.set(agent.id, sprite);
    });
  }

  private createSpeechBubble(x: number, y: number, text: string, borderColor: string, isError: boolean = false): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const padding = 8;
    const maxWidth = 150;
    const tempText = this.add.text(0, 0, text, {
      fontSize: '10px',
      fontFamily: 'Inter',
      color: isError ? '#DA3950' : '#EAEDEC',
      fontStyle: isError ? 'bold' : 'normal',
      wordWrap: { width: maxWidth - padding * 2 }
    });

    const bounds = tempText.getBounds();
    const bubbleWidth = Math.min(bounds.width + padding * 2, maxWidth);
    const bubbleHeight = bounds.height + padding * 2;

    const bg = this.add.rectangle(0, 0, bubbleWidth, bubbleHeight, 0x15171F, 0.95);
    bg.setStrokeStyle(1, parseInt(borderColor.replace('#', '0x')));
    container.add(bg);

    if (isError) {
      const accentBar = this.add.rectangle(-bubbleWidth / 2, 0, 3, bubbleHeight, 0xDA3950);
      container.add(accentBar);
    }

    tempText.setPosition(0, 0);
    tempText.setOrigin(0.5);
    container.add(tempText);

    return container;
  }

  private addZoneLabel(text: string, x: number, y: number, color: string) {
    const label = this.add.text(x, y, text, {
      fontSize: '8px',
      fontFamily: 'Inter',
      color: color,
      fontStyle: 'bold'
    });

    const bg = this.add.rectangle(x + label.width / 2, y + label.height / 2, label.width + 8, label.height + 4, 0x1D202B);
    bg.setStrokeStyle(1, parseInt(color.replace('#', '0x')));
    bg.setDepth(-1);

    label.setDepth(0);
  }
}

export default function VirtualOfficeCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
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
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-canvas-bg rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
