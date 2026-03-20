import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * Ambusher — Stealth Predator
 *
 * Spawns invisible, waits for player to come within 80px vertically,
 * then telegraphs briefly and lunges at high speed.
 *
 * States: HIDDEN → TELEGRAPH (0.3s) → LUNGE → STUNNED (0.5s) → HIDDEN
 */
export class Ambusher extends EnemyBase {
  role = 'ambush' as const;

  private targetX = 0;
  private targetY = 0;
  private lungeSpeed = 400;
  private pulsePhase = 0;

  onUpdate(dt: number, playerX: number, playerY: number): void {
    this.pulsePhase += dt * 12;

    switch (this.state) {
      case 'HIDDEN': {
        // Stay dormant — check if player is within 80px vertically
        const dy = Math.abs(playerY - this.y);
        if (dy < 80) {
          this.state = 'TELEGRAPH';
          this.stateTimer = 0.3;
          // Lock onto player position for lunge
          this.targetX = playerX;
          this.targetY = playerY;
        }
        break;
      }

      case 'TELEGRAPH': {
        // Brief flash before lunge
        this.stateTimer -= dt;
        // Update target to track player during telegraph
        this.targetX = playerX;
        this.targetY = playerY;
        if (this.stateTimer <= 0) {
          this.state = 'LUNGE';
          // Calculate lunge direction
          const dx = this.targetX - this.x;
          const dy = this.targetY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          this.vx = (dx / dist) * this.lungeSpeed;
          this.vy = (dy / dist) * this.lungeSpeed;
        }
        break;
      }

      case 'LUNGE': {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check if reached target area (within 10px) or traveled far enough
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10 || this.x < 10 || this.x > 350) {
          this.state = 'STUNNED';
          this.stateTimer = 0.5;
        }
        break;
      }

      case 'STUNNED': {
        // Decelerate
        this.vx *= 1 - 5 * dt;
        this.vy *= 1 - 5 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'HIDDEN';
          this.vx = 0;
          this.vy = 0;
        }
        break;
      }
    }

    // Clamp horizontally
    if (this.x < 10) this.x = 10;
    if (this.x > 350) this.x = 350;
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('ambusher');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.state = 'HIDDEN';
    this.stateTimer = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.pulsePhase = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    if (this.state === 'HIDDEN') {
      // Dim body — barely visible
      ctx.fillStyle = this.bodyColor;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(
        rx - this.hitbox.width / 2,
        ry - this.hitbox.height / 2,
        this.hitbox.width,
        this.hitbox.height,
      );
      ctx.globalAlpha = 1;
    }

    if (this.state === 'TELEGRAPH') {
      // Pulsing warning circle
      const radius = 12 + Math.sin(this.pulsePhase) * 4;
      const alpha = 0.4 + Math.sin(this.pulsePhase) * 0.3;
      ctx.strokeStyle = '#ff2222';
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Flash body bright
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5 + Math.sin(this.pulsePhase * 2) * 0.3;
      ctx.fillRect(rx - 4, ry - 4, 8, 8);
      ctx.globalAlpha = 1;
    }

    if (this.state === 'LUNGE') {
      // Motion trail
      ctx.fillStyle = this.glowColor;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(rx - this.vx * 0.02 - 3, ry - this.vy * 0.02 - 3, 6, 6);
      ctx.globalAlpha = 1;
    }

    if (this.state === 'STUNNED') {
      // Dizzy indicator
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      const r = 8;
      ctx.beginPath();
      ctx.arc(rx, ry - this.hitbox.height / 2 - 6, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
