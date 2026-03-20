import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * Blocks all projectiles from above — must be stomped to kill.
 * Patrols horizontally, always facing the player.
 */
export class ShieldBug extends EnemyBase {
  role = 'disruptor' as const;

  facing: -1 | 1 = 1;
  private moveSpeed = 60;

  onUpdate(dt: number, playerX: number, _playerY: number): void {
    // Face toward player
    this.facing = playerX > this.x ? 1 : -1;

    // Patrol in facing direction
    this.x += this.facing * this.moveSpeed * dt;

    // Clamp to playable area
    if (this.x < 20) { this.x = 20; this.facing = 1; }
    if (this.x > 340) { this.x = 340; this.facing = -1; }
  }

  /** Shield blocks ALL projectiles — player must stomp */
  isShielded(_projectileX: number): boolean {
    return true;
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('shield_bug');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.facing = Math.random() > 0.5 ? 1 : -1;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    // Shield plate on top (blocks shots from above)
    ctx.fillStyle = '#ffdd44';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(
      rx - this.hitbox.width / 2 - 1,
      ry - this.hitbox.height / 2 - 4,
      this.hitbox.width + 2,
      4,
    );
    ctx.globalAlpha = 1;

    // Facing indicator (small eye on facing side)
    ctx.fillStyle = '#ffffff';
    const eyeX = this.facing === 1 ? rx + 4 : rx - 6;
    ctx.fillRect(eyeX, ry - 2, 3, 3);
  }
}
