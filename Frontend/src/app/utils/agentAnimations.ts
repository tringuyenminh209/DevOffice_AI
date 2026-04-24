import * as Phaser from 'phaser';

export interface AnimationConfig {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  agentId: string;
  color: string;
}

export class AgentAnimations {
  static playApprovalAnimation(config: AnimationConfig) {
    const { scene, container, agentId, color } = config;

    switch (agentId) {
      case 'RS': // Researcher - Đẩy kính, giơ clipboard
        return this.researcherApproval(scene, container);

      case 'WR': // Writer - Tháo tai nghe, chống cằm
        return this.writerApproval(scene, container);

      case 'RV': // Reviewer - Khoanh tay, giơ con dấu
        return this.reviewerApproval(scene, container);

      case 'AN': // Analyst - Tung hứng hologram charts
        return this.analystApproval(scene, container, color);

      case 'DV': // Developer - Gõ phím matrix, nhấp cà phê
        return this.developerApproval(scene, container);
    }
  }

  static playRejectAnimation(config: AnimationConfig) {
    const { scene, container, agentId, color } = config;

    switch (agentId) {
      case 'RS': // Researcher - Cúi đầu, mây xám
        return this.researcherReject(scene, container);

      case 'WR': // Writer - Thở dài, vò giấy
        return this.writerReject(scene, container);

      case 'RV': // Reviewer - Nhún vai, cất con dấu
        return this.reviewerReject(scene, container);

      case 'AN': // Analyst - Hologram vỡ vụn
        return this.analystReject(scene, container, color);

      case 'DV': // Developer - Cốc đổ, trùm hoodie
        return this.developerReject(scene, container);
    }
  }

  // Researcher Animations
  private static researcherApproval(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    const magnifier = scene.add.graphics();
    magnifier.lineStyle(2, 0x267ADE);
    magnifier.strokeCircle(0, -30, 8);
    magnifier.lineBetween(6, -24, 12, -18);
    container.add(magnifier);

    scene.tweens.add({
      targets: magnifier,
      alpha: { from: 0, to: 1 },
      y: -40,
      duration: 500,
      yoyo: true,
      onComplete: () => magnifier.destroy()
    });

    const clipboard = scene.add.rectangle(0, 5, 12, 16, 0xFFFFFF, 0.8);
    clipboard.setStrokeStyle(1, 0x267ADE);
    container.add(clipboard);

    scene.tweens.add({
      targets: clipboard,
      y: -5,
      duration: 300,
      ease: 'Bounce.easeOut',
      delay: 200
    });

    setTimeout(() => clipboard.destroy(), 2000);
  }

  private static researcherReject(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    scene.tweens.add({
      targets: container,
      y: container.y + 10,
      duration: 400,
      yoyo: true
    });

    const cloud = scene.add.ellipse(0, -35, 30, 20, 0x888888, 0.5);
    container.add(cloud);

    scene.tweens.add({
      targets: cloud,
      alpha: 0,
      y: -45,
      duration: 1500,
      onComplete: () => cloud.destroy()
    });
  }

  // Writer Animations
  private static writerApproval(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    const paper = scene.add.graphics();
    paper.fillStyle(0xFFFFFF, 0.9);
    paper.fillRoundedRect(-8, -25, 16, 20, 2);
    paper.fillStyle(0xFFD700);
    paper.fillCircle(0, -20, 4);
    container.add(paper);

    scene.tweens.add({
      targets: paper,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 400
    });

    setTimeout(() => {
      scene.tweens.add({
        targets: paper,
        rotation: Math.PI * 2,
        alpha: 0,
        duration: 600,
        onComplete: () => paper.destroy()
      });
    }, 1000);
  }

  private static writerReject(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    const smoke = scene.add.graphics();
    smoke.fillStyle(0x888888, 0.6);
    smoke.fillEllipse(10, -20, 6, 8);
    container.add(smoke);

    scene.tweens.add({
      targets: smoke,
      x: 15,
      y: -30,
      alpha: 0,
      duration: 1000,
      onComplete: () => smoke.destroy()
    });

    const paper = scene.add.rectangle(12, 10, 8, 10, 0xFFFFFF);
    container.add(paper);

    scene.tweens.add({
      targets: paper,
      scaleX: 0.3,
      scaleY: 0.3,
      y: 20,
      alpha: 0.3,
      duration: 500,
      onComplete: () => paper.destroy()
    });
  }

  // Reviewer Animations
  private static reviewerApproval(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    const stamp = scene.add.ellipse(0, -25, 20, 20, 0x800080, 0.3);
    stamp.setStrokeStyle(2, 0xFF4500);
    container.add(stamp);

    const glow = scene.add.ellipse(0, -25, 40, 40, 0xFF4500, 0.1);
    container.add(glow);

    scene.tweens.add({
      targets: [stamp, glow],
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      alpha: { from: 1, to: 0.5 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    setTimeout(() => {
      stamp.destroy();
      glow.destroy();
    }, 2000);
  }

  private static reviewerReject(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    scene.tweens.add({
      targets: container,
      scaleX: { from: 1, to: 0.95 },
      scaleY: { from: 1, to: 0.95 },
      duration: 200,
      yoyo: true,
      repeat: 1
    });
  }

  // Analyst Animations
  private static analystApproval(scene: Phaser.Scene, container: Phaser.GameObjects.Container, color: string) {
    const charts = [];

    for (let i = 0; i < 3; i++) {
      const chart = scene.add.graphics();
      const colorNum = parseInt(color.replace('#', '0x'));
      chart.fillStyle(colorNum, 0.6);

      if (i === 0) {
        chart.fillCircle(0, -30, 10);
        chart.fillStyle(colorNum, 0.3);
        chart.slice(0, -30, 10, 0, Math.PI, false);
      } else if (i === 1) {
        for (let j = 0; j < 4; j++) {
          chart.fillRect(-12 + j * 8, -20 - j * 3, 6, 3 + j * 3);
        }
      } else {
        chart.lineStyle(2, colorNum);
        chart.strokeCircle(0, -30, 8);
      }

      container.add(chart);
      charts.push(chart);

      const angle = (i - 1) * 60;
      scene.tweens.add({
        targets: chart,
        x: Math.cos(Phaser.Math.DegToRad(angle)) * 20,
        y: -30 + Math.sin(Phaser.Math.DegToRad(angle)) * 20,
        alpha: { from: 0, to: 0.8 },
        duration: 500,
        delay: i * 150
      });

      scene.tweens.add({
        targets: chart,
        rotation: Math.PI * 2,
        duration: 2000,
        repeat: -1
      });
    }

    setTimeout(() => {
      charts.forEach(chart => chart.destroy());
    }, 3000);
  }

  private static analystReject(scene: Phaser.Scene, container: Phaser.GameObjects.Container, color: string) {
    for (let i = 0; i < 8; i++) {
      const shard = scene.add.graphics();
      const colorNum = parseInt(color.replace('#', '0x'));
      shard.fillStyle(colorNum, 0.6);
      shard.fillRect(0, 0, 4, 4);
      container.add(shard);

      const angle = (i / 8) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;

      scene.tweens.add({
        targets: shard,
        x: Math.cos(angle) * distance,
        y: -20 + Math.sin(angle) * distance,
        alpha: 0,
        rotation: Math.random() * Math.PI * 2,
        duration: 800,
        onComplete: () => shard.destroy()
      });
    }
  }

  // Developer Animations
  private static developerApproval(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    const codeLines = [];

    for (let i = 0; i < 5; i++) {
      const line = scene.add.text(
        -15,
        -30 + i * 8,
        '█'.repeat(Math.floor(3 + Math.random() * 5)),
        { fontSize: '8px', color: '#00FF41', fontFamily: 'monospace' }
      );
      container.add(line);
      codeLines.push(line);

      scene.tweens.add({
        targets: line,
        alpha: { from: 0, to: 0.8 },
        x: -20,
        duration: 200,
        delay: i * 100
      });
    }

    setTimeout(() => {
      codeLines.forEach(line => {
        scene.tweens.add({
          targets: line,
          alpha: 0,
          y: line.y + 10,
          duration: 400,
          onComplete: () => line.destroy()
        });
      });
    }, 1500);
  }

  private static developerReject(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    const coffee = scene.add.ellipse(18, 14, 6, 10, 0x5C3317);
    container.add(coffee);

    const spill = scene.add.ellipse(18, 20, 12, 6, 0x4A2511, 0.6);
    container.add(spill);

    scene.tweens.add({
      targets: coffee,
      y: 20,
      rotation: Math.PI / 4,
      duration: 300,
      ease: 'Cubic.easeIn'
    });

    scene.tweens.add({
      targets: spill,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      alpha: { from: 0.6, to: 0 },
      duration: 800,
      delay: 300,
      onComplete: () => {
        coffee.destroy();
        spill.destroy();
      }
    });

    const errorText = scene.add.text(-15, -35, 'ERROR!', {
      fontSize: '10px',
      color: '#DA3950',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    });
    container.add(errorText);

    scene.tweens.add({
      targets: errorText,
      alpha: { from: 1, to: 0 },
      y: -45,
      duration: 1000,
      delay: 400,
      onComplete: () => errorText.destroy()
    });
  }
}
