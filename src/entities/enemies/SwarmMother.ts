import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
import type { PendingSpawn } from './CoreCarrier';

/**
 * SwarmMother — Drone Factory Disruptor
 *
 * Large enemy that periodically spawns SwarmDrone minions.
 * Drifts slowly toward the player. Every 3s, spawns 2 drones.
 * Tracks active drone count (max 6).
 *
 * States: IDLE (drift + spawn timer) → SPAWNING (0.3s pause) → IDLE
 */
export class SwarmMother extends EnemyBase {
  role = 'disruptor' as const;

  pendingSpawns: PendingSpawn[] = [];
  spawnCount = 0;

  private readonly DRIFT_SPEED = 25;
  private readonly TRACK_SPEED = 15;
  private readonly SPAWN_INTERVAL = 3.0;
  private readonly MAX_DRONES = 6;
  private spawnTimer = 0;
  private pulsePhase = 0;

  onUpdate(dt: number, playerX: number, _playerY: number): void {
    this.pulsePhase += dt * 4;

    switch (this.state) {
      case 'IDLE': {
        // Slow downward drift
        this.y += this.DRIFT_SPEED * dt;

        // Horizontal tracking toward player
        const dx = playerX - this.x;
        if (Math.abs(dx) > 5) {
          this.x += Math.sign(dx) * this.TRACK_SPEED * dt;
        }

        // Clamp horizontally
        if (this.x < 40) this.x = 40;
        if (this.x > 320) this.x = 320;

        // Spawn timer
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.spawnCount < this.MAX_DRONES) {
          this.state = 'SPAWNING';
          this.stateTimer = 0.3;
        }
        break;
      }

      case 'SPAWNING': {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // Queue 2 swarm drone spawns
          this.pendingSpawns.push(
            { id: 'swarm_drone', x: this.x - 15, y: this.y + 15 },
            { id: 'swarm_drone', x: this.x + 15, y: this.y + 15 },
          );
          this.spawnCount += 2;
          this.spawnTimer = this.SPAWN_INTERVAL;
          this.state = 'IDLE';
        }
        break;
      }
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('swarm_mother');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.state = 'IDLE';
    this.spawnTimer = this.SPAWN_INTERVAL;
    this.spawnCount = 0;
    this.pulsePhase = 0;
    this.pendingSpawns.length = 0;
    this.pendingShots.length = 0;
  }

  renderExtra(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, rx: number, ry: number): void {
    const hw = this.hitbox.width / 2;
    const hh = this.hitbox.height / 2;

    // Spawning indicator — pulsing glow when about to spawn
    if (this.state === 'SPAWNING') {
      const alpha = 0.4 + Math.sin(this.pulsePhase * 3) * 0.3;
      ctx.fillStyle = '#44ff88';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(rx, ry + hh, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Drone count indicator — small dots showing capacity
    const dotY = ry - hh - 8;
    const dotSpacing = 6;
    const totalDots = this.MAX_DRONES;
    const startX = rx - ((totalDots - 1) * dotSpacing) / 2;

    for (let i = 0; i < totalDots; i++) {
      const dx = startX + i * dotSpacing;
      if (i < this.spawnCount) {
        ctx.fillStyle = '#44ff88';
        ctx.globalAlpha = 0.6;
      } else {
        ctx.fillStyle = '#224433';
        ctx.globalAlpha = 0.4;
      }
      ctx.fillRect(dx - 1, dotY - 1, 3, 3);
    }
    ctx.globalAlpha = 1;

    // Pulsing core
    const coreSize = 5 + Math.sin(this.pulsePhase) * 2;
    ctx.fillStyle = '#44ff88';
    ctx.fillRect(rx - coreSize / 2, ry - coreSize / 2, coreSize, coreSize);

    // Hive pattern — hexagonal outline
    ctx.strokeStyle = '#44ff88';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const px = rx + Math.cos(a) * (hw - 2);
      const py = ry + Math.sin(a) * (hh - 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
