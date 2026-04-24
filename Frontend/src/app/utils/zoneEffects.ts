import * as Phaser from 'phaser';

export class ZoneEffects {
  // LED Blinking Animation for Data Vault
  static createLEDBlinking(scene: Phaser.Scene, leds: Phaser.GameObjects.Ellipse[]) {
    leds.forEach((led, index) => {
      const initialAlpha = led.getData('initialAlpha') || 0.8;
      const delay = (index % 9) * 100;

      scene.time.addEvent({
        delay: 1000 + delay,
        callback: () => {
          scene.tweens.add({
            targets: led,
            alpha: initialAlpha * 0.3,
            duration: 200,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        },
        loop: true
      });
    });
  }

  // Matrix Code Scrolling for Mainframe
  static createMatrixScrolling(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    const lines: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 6; i++) {
      const barWidth = 10 + Math.random() * 30;
      const bar = scene.add.rectangle(x, y + i * 8, barWidth, 4, 0x0ED061, 0.8);
      bar.setOrigin(0, 0.5);
      lines.push(bar);
    }

    scene.time.addEvent({
      delay: 100,
      callback: () => {
        lines.forEach((line, index) => {
          const newWidth = 10 + Math.random() * 30;
          scene.tweens.add({
            targets: line,
            displayWidth: newWidth,
            alpha: 0.6 + Math.random() * 0.4,
            duration: 100
          });
        });
      },
      loop: true
    });

    return lines;
  }

  // Data Sparks Effect
  static createDataSparks(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number, color: number = 0x10B06B) {
    const sparks: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 3; i++) {
      const spark = scene.add.rectangle(fromX, fromY, 2, 8, color);
      sparks.push(spark);

      const delay = i * 150;
      const targetX = toX + (Math.random() - 0.5) * 20;
      const targetY = toY + (Math.random() - 0.5) * 20;

      scene.time.delayedCall(delay, () => {
        scene.tweens.add({
          targets: spark,
          x: targetX,
          y: targetY,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => spark.destroy()
        });
      });
    }

    return sparks;
  }

  // Steam Animation for Coffee Machine
  static createSteamEffect(scene: Phaser.Scene, x: number, y: number) {
    scene.time.addEvent({
      delay: 500,
      callback: () => {
        const steam = scene.add.graphics();
        steam.lineStyle(2, 0xFFFFFF, 0.4);
        const offsetX = (Math.random() - 0.5) * 8;
        steam.lineBetween(x + offsetX, y, x + offsetX, y - 10);

        scene.tweens.add({
          targets: steam,
          y: y - 30,
          alpha: 0,
          duration: 2000,
          ease: 'Sine.easeOut',
          onComplete: () => steam.destroy()
        });
      },
      loop: true
    });
  }

  // Hologram Projection Animation for Meeting Room
  static createHologramProjection(scene: Phaser.Scene, x: number, y: number, color: number = 0x5E55EA) {
    const bars: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 4; i++) {
      const barY = y - i * 8;
      const barWidth = 40 + i * 20;
      const bar = scene.add.rectangle(x, barY, barWidth, 3, color, 0.1 + i * 0.03);
      bars.push(bar);
    }

    scene.tweens.add({
      targets: bars,
      alpha: '+=0.1',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    bars.forEach((bar, index) => {
      scene.tweens.add({
        targets: bar,
        scaleX: 1.1,
        duration: 2000 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    return bars;
  }

  // Environmental Dust Particles
  static createDustParticles(scene: Phaser.Scene, count: number = 20) {
    const particles: Phaser.GameObjects.Ellipse[] = [];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * 1280;
      const y = Math.random() * 720;
      const size = 1 + Math.random() * 2;

      const particle = scene.add.ellipse(x, y, size, size, 0xFFFFFF, 0.1 + Math.random() * 0.2);
      particles.push(particle);

      const duration = 5000 + Math.random() * 10000;
      const targetY = y + 100 + Math.random() * 200;
      const targetX = x + (Math.random() - 0.5) * 100;

      scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: duration,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          particle.setPosition(Math.random() * 1280, 0);
          particle.setAlpha(0.1 + Math.random() * 0.2);
        },
        repeat: -1
      });
    }

    return particles;
  }

  // Shadows for Depth
  static createShadow(scene: Phaser.Scene, x: number, y: number, width: number, height: number, angle: number = 45) {
    const shadow = scene.add.ellipse(
      x + Math.cos(Phaser.Math.DegToRad(angle)) * 5,
      y + Math.sin(Phaser.Math.DegToRad(angle)) * 5,
      width * 0.8,
      height * 0.3,
      0x000000,
      0.2
    );

    shadow.setDepth(-20);
    return shadow;
  }

  // Day/Night Lighting Effect
  static applyDayNightCycle(scene: Phaser.Scene, hour: number = new Date().getHours()) {
    let tintColor = 0xFFFFFF;
    let alpha = 1;

    if (hour >= 6 && hour < 12) {
      // Morning - Warm
      tintColor = 0xFFF8E7;
      alpha = 0.95;
    } else if (hour >= 12 && hour < 18) {
      // Afternoon - Neutral
      tintColor = 0xFFFFFF;
      alpha = 1;
    } else if (hour >= 18 && hour < 22) {
      // Evening - Cool
      tintColor = 0xFFE4B5;
      alpha = 0.9;
    } else {
      // Night - Dark Blue
      tintColor = 0xE6F0FF;
      alpha = 0.85;
    }

    const overlay = scene.add.rectangle(640, 360, 1280, 720, tintColor, 1 - alpha);
    overlay.setDepth(100);
    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    return overlay;
  }

  // Glassmorphism Effect for Speech Bubble
  static createGlassBubble(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    borderColor: string,
    width: number = 150
  ) {
    const container = scene.add.container(x, y);

    const padding = 8;
    const tempText = scene.add.text(0, 0, text, {
      fontSize: '10px',
      fontFamily: 'Inter',
      color: '#EAEDEC',
      wordWrap: { width: width - padding * 2 }
    });

    const bounds = tempText.getBounds();
    const bubbleWidth = Math.min(bounds.width + padding * 2, width);
    const bubbleHeight = bounds.height + padding * 2;

    // Glass background with blur effect (simulated with semi-transparent layers)
    const bgBack = scene.add.rectangle(0, 0, bubbleWidth, bubbleHeight, 0x15171F, 0.3);
    bgBack.setStrokeStyle(1, parseInt(borderColor.replace('#', '0x')), 0.5);
    container.add(bgBack);

    const bgMiddle = scene.add.rectangle(0, 0, bubbleWidth - 4, bubbleHeight - 4, 0x1D202B, 0.4);
    container.add(bgMiddle);

    const bgFront = scene.add.rectangle(0, 0, bubbleWidth, bubbleHeight, 0xFFFFFF, 0.05);
    bgFront.setStrokeStyle(1, parseInt(borderColor.replace('#', '0x')), 0.8);
    container.add(bgFront);

    tempText.setPosition(0, 0);
    tempText.setOrigin(0.5);
    container.add(tempText);

    // Add subtle pulse animation
    scene.tweens.add({
      targets: bgFront,
      alpha: 0.08,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return container;
  }

  // Approval Gate Glow Effect
  static createApprovalGlow(scene: Phaser.Scene, x: number, y: number, color: number = 0xEB9619) {
    const glow = scene.add.ellipse(x, y, 96, 80, color, 0.08);

    scene.tweens.add({
      targets: glow,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.15,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return glow;
  }
}
