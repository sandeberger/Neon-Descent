import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * Risk/reward enemy: dies in 1 shot but splits into 2 fragments.
 * Stomp kills it cleanly (no split) since stomp does 2 damage.
 */
export class Splitter extends EnemyBase {
  role = 'punish' as const;

  private driftSpeed = 30;
  private fallSpeed = 60;

  onUpdate(dt: number, playerX: number, _playerY: number): void {
    const dx = playerX - this.x;
    this.vx = Math.sign(dx) * this.driftSpeed;
    this.vy = this.fallSpeed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('splitter');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    // Split line down the middle
    ctx.strokeStyle = '#88ffbb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry - this.hitbox.height / 2);
    ctx.lineTo(rx, ry + this.hitbox.height / 2);
    ctx.stroke();
  }
}
