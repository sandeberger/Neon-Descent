import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * Acid Wyrm — Neon Gut Miniboss
 *
 * Serpentine movement in sine wave pattern while drifting down.
 * Spits acid globs and leaves acid trails.
 *
 * Phase 1 (HP > 50%): Sine wave drift, aimed acid globs every 1.5s,
 *   slow downward acid trail.
 * Phase 2 (HP <= 50%): Faster sine wave, 3-way acid spread every 1s.
 */
export class AcidWyrm extends EnemyBase {
  role = 'elite' as const;

  private phase = 1;
  private sineTimer = 0;
  private fireTimer = 0;
  private trailTimer = 0;
  private baseX = 0;
  private pulsePhase = 0;

  // Position history for trailing body segments
  private posHistory: Array<{ x: number; y: number }> = [];
  private historyTimer = 0;
  private readonly HISTORY_INTERVAL = 0.05;
  private readonly MAX_SEGMENTS = 4;

  // Sine wave params
  private readonly SINE_AMPLITUDE = 60;
  private readonly DRIFT_SPEED = 30;

  onUpdate(dt: number, playerX: number, playerY: number): void {
    this.pulsePhase += dt * 4;
    this.sineTimer += dt;

    // Determine phase
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio > 0.5 ? 1 : 2;

    const sineSpeed = this.phase === 2 ? 3.0 : 2.0;
    const amplitude = this.SINE_AMPLITUDE;

    // Serpentine horizontal movement
    this.x = this.baseX + Math.sin(this.sineTimer * sineSpeed) * amplitude;

    // Slow downward drift
    this.y += this.DRIFT_SPEED * dt;

    // Track base X toward player slowly
    const dx = playerX - this.baseX;
    if (Math.abs(dx) > 10) {
      this.baseX += Math.sign(dx) * 15 * dt;
    }

    // Clamp
    if (this.baseX < amplitude + 10) this.baseX = amplitude + 10;
    if (this.baseX > 360 - amplitude - 10) this.baseX = 360 - amplitude - 10;

    // Record position history for body segments
    this.historyTimer -= dt;
    if (this.historyTimer <= 0) {
      this.historyTimer = this.HISTORY_INTERVAL;
      this.posHistory.unshift({ x: this.x, y: this.y });
      if (this.posHistory.length > this.MAX_SEGMENTS * 4) {
        this.posHistory.length = this.MAX_SEGMENTS * 4;
      }
    }

    // Fire acid globs
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireAcid(playerX, playerY);
      this.fireTimer = this.phase === 2 ? 1.0 : 1.5;
    }

    // Acid trail — slow downward drips
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = this.phase === 2 ? 0.4 : 0.6;
      this.pendingShots.push({
        x: this.x,
        y: this.y + this.hitbox.height / 2,
        vx: 0,
        vy: 60,
        damage: 1,
      });
    }
  }

  private fireAcid(playerX: number, playerY: number): void {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 120;

    if (this.phase === 2) {
      // 3-way acid spread
      const baseAngle = Math.atan2(dy, dx);
      for (let i = -1; i <= 1; i++) {
        const a = baseAngle + i * 0.3;
        this.pendingShots.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          damage: this.damage,
        });
      }
    } else {
      // Single aimed glob
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
    const stats = getEnemyStats('acid_wyrm');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.phase = 1;
    this.sineTimer = 0;
    this.baseX = x;
    this.fireTimer = 1.5; // grace period
    this.trailTimer = 0.6;
    this.pulsePhase = 0;
    this.posHistory.length = 0;
    this.historyTimer = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    const hw = this.hitbox.width / 2;
    const hh = this.hitbox.height / 2;

    // Body segments — trailing positions
    const segmentSpacing = 4; // use every Nth history entry
    for (let i = 0; i < this.MAX_SEGMENTS; i++) {
      const idx = (i + 1) * segmentSpacing;
      if (idx >= this.posHistory.length) break;

      const seg = this.posHistory[idx];
      // Segments are offset from current render position by the delta
      const sx = rx + (seg.x - this.x);
      const sy = ry + (seg.y - this.y);
      const size = hw * (1 - i * 0.15);
      const alpha = 0.6 - i * 0.12;

      ctx.fillStyle = this.bodyColor;
      ctx.globalAlpha = alpha;
      ctx.fillRect(sx - size, sy - size * 0.6, size * 2, size * 1.2);
    }
    ctx.globalAlpha = 1;

    // Acid drip effect from body
    const dripAlpha = 0.3 + Math.sin(this.pulsePhase * 2) * 0.2;
    ctx.fillStyle = '#44ff44';
    ctx.globalAlpha = dripAlpha;
    for (let i = 0; i < 3; i++) {
      const dripX = rx - 4 + i * 4;
      const dripY = ry + hh + Math.sin(this.pulsePhase + i) * 3;
      ctx.fillRect(dripX, dripY, 2, 4);
    }
    ctx.globalAlpha = 1;

    // Head detail — eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - 4, ry - 2, 3, 3);
    ctx.fillRect(rx + 2, ry - 2, 3, 3);

    // Phase indicator core
    const coreColor = this.phase === 2 ? '#22ff22' : '#44ff66';
    const pulse = 0.5 + Math.sin(this.pulsePhase) * 0.3;
    ctx.fillStyle = coreColor;
    ctx.globalAlpha = pulse;
    ctx.fillRect(rx - 3, ry - 3, 6, 6);
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 50;
    const barH = 4;
    const barX = rx - barW / 2;
    const barY = ry - hh - 14;

    ctx.fillStyle = '#001100';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = coreColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Phase marker at 50%
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(barX + barW * 0.5 - 0.5, barY, 1, barH);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#44ff66';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Boss name
    ctx.fillStyle = coreColor;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.7;
    ctx.fillText('ACID WYRM', rx, barY - 4);
    ctx.globalAlpha = 1;
  }
}
