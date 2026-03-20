import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * Leech — aggressive pursuer that chases the player relentlessly.
 * Forces tempo: you can't sit still or it catches you.
 * Speeds up the longer it lives, encouraging quick kills.
 */
export class Leech extends EnemyBase {
  role = 'pressure' as const;

  private baseSpeed = 90;
  private chaseSpeed = 90;
  private maxSpeed = 200;
  private accelRate = 15; // speed increases per second alive
  private lungeTimer = 0;
  private lungeCooldown = 2.5;
  private lungeSpeed = 350;
  private lungeDuration = 0;

  onUpdate(dt: number, playerX: number, playerY: number): void {
    switch (this.state) {
      case 'IDLE': {
        // Accelerate over time — forces urgency
        this.chaseSpeed = Math.min(this.maxSpeed, this.chaseSpeed + this.accelRate * dt);

        // Chase player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          this.vx = (dx / dist) * this.chaseSpeed;
          this.vy = (dy / dist) * this.chaseSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Lunge when close
        this.lungeTimer -= dt;
        if (dist < 80 && this.lungeTimer <= 0) {
          this.state = 'LUNGING';
          this.lungeDuration = 0.2;
          this.lungeTimer = this.lungeCooldown;
          this.vx = (dx / dist) * this.lungeSpeed;
          this.vy = (dy / dist) * this.lungeSpeed;
        }

        // Clamp to play area
        if (this.x < 15) this.x = 15;
        if (this.x > 345) this.x = 345;
        break;
      }

      case 'LUNGING':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lungeDuration -= dt;
        if (this.lungeDuration <= 0) {
          this.state = 'IDLE';
          this.vx = 0;
          this.vy = 0;
        }
        break;
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('leech');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.chaseSpeed = this.baseSpeed;
    this.lungeTimer = 1.0 + Math.random() * 0.5;
    this.lungeDuration = 0;
    this.state = 'IDLE';
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    // Pulsing inner core that gets brighter as speed increases
    const speedRatio = (this.chaseSpeed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
    ctx.fillStyle = '#ccff66';
    ctx.globalAlpha = 0.3 + speedRatio * 0.5;
    ctx.fillRect(rx - 4, ry - 4, 8, 8);
    ctx.globalAlpha = 1;

    // Lunge telegraph — flash before lunge
    if (this.state === 'LUNGING') {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(rx - 10, ry - 10, 20, 20);
      ctx.globalAlpha = 1;
    }

    // Small tail trail
    ctx.fillStyle = '#44cc22';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(rx - this.vx * 0.02 - 3, ry - this.vy * 0.02 - 3, 6, 6);
    ctx.globalAlpha = 1;
  }
}
