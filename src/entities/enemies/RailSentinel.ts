import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
import { CANVAS_W } from '@core/Constants';

/**
 * RailSentinel — Telegraphed Laser Turret
 *
 * Stationary zoning enemy. Cycles through:
 * IDLE (1.5s) → TELEGRAPH (1.0s, warning line) → FIRING (0.3s, beam) → COOLDOWN (0.5s)
 *
 * Beam is full-width horizontal at enemy's Y. Damage handled in World.
 */
export class RailSentinel extends EnemyBase {
  role = 'zoning' as const;

  beamActive = false;
  private readonly IDLE_TIME = 1.5;
  private readonly TELEGRAPH_TIME = 1.0;
  private readonly FIRING_TIME = 0.3;
  private readonly COOLDOWN_TIME = 0.5;

  // Visual state
  private telegraphPulse = 0;

  onUpdate(dt: number, _playerX: number, _playerY: number): void {
    this.stateTimer -= dt;
    this.telegraphPulse += dt * 12;

    switch (this.state) {
      case 'IDLE':
        this.beamActive = false;
        if (this.stateTimer <= 0) {
          this.state = 'TELEGRAPH';
          this.stateTimer = this.TELEGRAPH_TIME;
        }
        break;

      case 'TELEGRAPH':
        this.beamActive = false;
        if (this.stateTimer <= 0) {
          this.state = 'FIRING';
          this.stateTimer = this.FIRING_TIME;
          this.beamActive = true;
        }
        break;

      case 'FIRING':
        this.beamActive = true;
        if (this.stateTimer <= 0) {
          this.state = 'COOLDOWN';
          this.stateTimer = this.COOLDOWN_TIME;
          this.beamActive = false;
        }
        break;

      case 'COOLDOWN':
        this.beamActive = false;
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = this.IDLE_TIME;
        }
        break;
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('rail_sentinel');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.state = 'IDLE';
    this.stateTimer = this.IDLE_TIME;
    this.beamActive = false;
    this.telegraphPulse = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    const hw = this.hitbox.width / 2;

    // Barrel indicator pointing outward
    ctx.fillStyle = this.state === 'FIRING' ? '#ffffff' : '#ffaa66';
    ctx.fillRect(rx - hw - 6, ry - 2, 6, 4);
    ctx.fillRect(rx + hw, ry - 2, 6, 4);

    // Telegraph warning line
    if (this.state === 'TELEGRAPH') {
      const alpha = 0.2 + Math.sin(this.telegraphPulse) * 0.15;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff4422';
      ctx.fillRect(0, ry - 1, CANVAS_W, 2);
      ctx.globalAlpha = 1;
    }

    // Active beam
    if (this.state === 'FIRING') {
      // Bright core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(0, ry - 2, CANVAS_W, 4);
      // Glow
      ctx.fillStyle = '#ff6622';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(0, ry - 6, CANVAS_W, 12);
      ctx.globalAlpha = 1;
    }

    // Center core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - 3, ry - 3, 6, 6);
  }
}
