import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * CoreCarrier — Heavy Shielded Blocker
 *
 * Slow drifting elite that blocks all projectiles (must be stomped).
 * Spawns 2 ParasiteCloud minions every 4 seconds via pendingSpawns.
 * Visual: shield dome, HP bar, pulsing core.
 */

export interface PendingSpawn {
  id: string;
  x: number;
  y: number;
}

export class CoreCarrier extends EnemyBase {
  role = 'elite' as const;

  pendingSpawns: PendingSpawn[] = [];

  private spawnTimer = 0;
  private readonly SPAWN_INTERVAL = 4;
  private readonly DRIFT_SPEED = 25;
  private readonly TRACK_SPEED = 15;
  private pulsePhase = 0;

  /** CoreCarrier is always shielded — blocks all projectiles */
  isShielded(_projectileX: number): boolean {
    return true;
  }

  onUpdate(dt: number, playerX: number, _playerY: number): void {
    this.pulsePhase += dt * 4;

    // Slow downward drift
    this.y += this.DRIFT_SPEED * dt;

    // Horizontal tracking toward player
    const dx = playerX - this.x;
    if (Math.abs(dx) > 5) {
      this.x += Math.sign(dx) * this.TRACK_SPEED * dt;
    }

    // Clamp horizontally
    if (this.x < 30) this.x = 30;
    if (this.x > 330) this.x = 330;

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.SPAWN_INTERVAL;
      // Queue 2 parasite cloud spawns
      this.pendingSpawns.push(
        { id: 'parasite_cloud', x: this.x - 20, y: this.y + 20 },
        { id: 'parasite_cloud', x: this.x + 20, y: this.y + 20 },
      );
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('core_carrier');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.spawnTimer = this.SPAWN_INTERVAL;
    this.pulsePhase = 0;
    this.pendingSpawns.length = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    const hw = this.hitbox.width / 2;
    const hh = this.hitbox.height / 2;

    // Shield dome (below body)
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4 + Math.sin(this.pulsePhase) * 0.15;
    ctx.beginPath();
    ctx.arc(rx, ry, hw + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Pulsing core
    const coreSize = 4 + Math.sin(this.pulsePhase * 2) * 2;
    ctx.fillStyle = '#ff88aa';
    ctx.fillRect(rx - coreSize / 2, ry - coreSize / 2, coreSize, coreSize);

    // HP bar above
    const barW = 40;
    const barH = 4;
    const barX = rx - barW / 2;
    const barY = ry - hh - 10;

    ctx.fillStyle = '#220022';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = '#ff4488';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.strokeStyle = '#ff6688';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }
}
