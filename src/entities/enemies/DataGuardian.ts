import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * Data Guardian — Data Crypt Miniboss
 *
 * Digital/geometric themed. Teleports between fixed positions.
 *
 * Phase 1 (HP > 50%): Teleports every 2s, fires horizontal laser beam
 *   (4 shots in a line). Brief telegraph before teleport.
 * Phase 2 (HP <= 50%): Faster teleports (1.2s), cross pattern (4 directions),
 *   rotating sweep laser pattern.
 */
export class DataGuardian extends EnemyBase {
  role = 'elite' as const;

  private phase = 1;
  private teleportTimer = 0;
  private fireTimer = 0;
  private sweepAngle = 0;
  private telegraphing = false;
  private telegraphTimer = 0;
  private targetTeleportX = 0;
  private pulsePhase = 0;
  private staticPhase = 0;

  // Visual — teleport flash
  private flashAlpha = 0;

  onUpdate(dt: number, playerX: number, playerY: number): void {
    this.pulsePhase += dt * 6;
    this.staticPhase += dt * 20;
    this.sweepAngle += dt * 2;

    // Determine phase
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio > 0.5 ? 1 : 2;

    // Decay flash
    if (this.flashAlpha > 0) this.flashAlpha -= dt * 4;

    if (this.telegraphing) {
      this.telegraphTimer -= dt;
      if (this.telegraphTimer <= 0) {
        this.executeTeleport();
        this.telegraphing = false;
      }
      return;
    }

    // Teleport timer
    this.teleportTimer -= dt;
    if (this.teleportTimer <= 0) {
      this.startTeleport();
      this.teleportTimer = this.phase === 2 ? 1.2 : 2.0;
    }

    // Fire timer
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fire(playerX, playerY);
      this.fireTimer = this.phase === 2 ? 0.8 : 1.2;
    }
  }

  private startTeleport(): void {
    this.telegraphing = true;
    this.telegraphTimer = 0.3;
    // Pick random target X position
    this.targetTeleportX = 40 + Math.random() * 280;
  }

  private executeTeleport(): void {
    this.x = this.targetTeleportX;
    this.flashAlpha = 1.0;

    // Fire on arrival
    if (this.phase === 1) {
      // Horizontal laser beam — 4 shots in a line
      const spacing = 20;
      for (let i = -2; i <= 1; i++) {
        this.pendingShots.push({
          x: this.x + i * spacing,
          y: this.y,
          vx: i < 0 ? -160 : 160,
          vy: 30,
          damage: this.damage,
        });
      }
    } else {
      // Cross pattern — 4 cardinal directions
      const speed = 150;
      const dirs = [
        { vx: speed, vy: 0 },
        { vx: -speed, vy: 0 },
        { vx: 0, vy: speed },
        { vx: 0, vy: -speed },
      ];
      for (const d of dirs) {
        this.pendingShots.push({
          x: this.x,
          y: this.y,
          vx: d.vx,
          vy: d.vy,
          damage: this.damage,
        });
      }
    }
  }

  private fire(playerX: number, playerY: number): void {
    if (this.phase === 2) {
      // Rotating sweep laser pattern
      const arms = 4;
      const speed = 130;
      for (let i = 0; i < arms; i++) {
        const a = this.sweepAngle + (i * Math.PI * 2) / arms;
        this.pendingShots.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          damage: this.damage,
        });
      }
    } else {
      // Aimed shot at player
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 120;
      this.pendingShots.push({
        x: this.x,
        y: this.y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        damage: this.damage,
      });
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('data_guardian');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.phase = 1;
    this.teleportTimer = 2.0; // grace period
    this.fireTimer = 1.5;
    this.sweepAngle = 0;
    this.telegraphing = false;
    this.telegraphTimer = 0;
    this.targetTeleportX = x;
    this.pulsePhase = 0;
    this.staticPhase = 0;
    this.flashAlpha = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    const hw = this.hitbox.width / 2;
    const hh = this.hitbox.height / 2;

    // Digital static effect — random pixel noise
    ctx.fillStyle = '#44ddff';
    for (let i = 0; i < 6; i++) {
      const sx = rx - hw + Math.sin(this.staticPhase + i * 3.7) * hw;
      const sy = ry - hh + Math.cos(this.staticPhase + i * 2.3) * hh;
      ctx.globalAlpha = 0.2 + Math.sin(this.staticPhase + i) * 0.15;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Teleport telegraph flash
    if (this.telegraphing) {
      const alpha = 0.3 + Math.sin(this.pulsePhase * 4) * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.fillRect(rx - hw - 4, ry - hh - 4, this.hitbox.width + 8, this.hitbox.height + 8);
      ctx.globalAlpha = 1;

      // Destination indicator
      const destRx = this.targetTeleportX;
      ctx.strokeStyle = '#44ddff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(destRx, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Teleport arrival flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = this.flashAlpha * 0.6;
      ctx.fillRect(rx - hw - 6, ry - hh - 6, this.hitbox.width + 12, this.hitbox.height + 12);
      ctx.globalAlpha = 1;
    }

    // Geometric pattern — rotating diamond
    const diamondSize = hw - 2;
    const a = this.pulsePhase * 0.5;
    ctx.strokeStyle = this.phase === 2 ? '#ff44ff' : '#44ddff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = a + (i * Math.PI * 2) / 4;
      const px = rx + Math.cos(angle) * diamondSize;
      const py = ry + Math.sin(angle) * diamondSize;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Center core
    const coreColor = this.phase === 2 ? '#ff44ff' : '#44ddff';
    const pulse = 0.5 + Math.sin(this.pulsePhase) * 0.3;
    ctx.fillStyle = coreColor;
    ctx.globalAlpha = pulse;
    ctx.fillRect(rx - 4, ry - 4, 8, 8);
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 50;
    const barH = 4;
    const barX = rx - barW / 2;
    const barY = ry - hh - 14;

    ctx.fillStyle = '#000022';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = coreColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Phase marker at 50%
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(barX + barW * 0.5 - 0.5, barY, 1, barH);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#44ddff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Boss name
    ctx.fillStyle = coreColor;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.7;
    ctx.fillText('DATA GUARDIAN', rx, barY - 4);
    ctx.globalAlpha = 1;
  }
}
