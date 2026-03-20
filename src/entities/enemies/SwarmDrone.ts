import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/**
 * SwarmDrone — Tiny Erratic Fodder
 *
 * Spawned by SwarmMother. Tiny, fast, erratic zigzag movement.
 * Flies toward player with random angle offset. No shots.
 * Dies in one hit.
 */
export class SwarmDrone extends EnemyBase {
  role = 'fodder' as const;

  private readonly MOVE_SPEED = 120;
  private readonly OFFSET_INTERVAL = 0.5;
  private angleOffset = 0;
  private offsetTimer = 0;

  onUpdate(dt: number, playerX: number, playerY: number): void {
    // Change random offset periodically
    this.offsetTimer -= dt;
    if (this.offsetTimer <= 0) {
      this.offsetTimer = this.OFFSET_INTERVAL;
      this.angleOffset = (Math.random() - 0.5) * 1.2; // random angle in radians
    }

    // Fly toward player with offset
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const baseAngle = Math.atan2(dy, dx);
    const angle = baseAngle + this.angleOffset;

    this.x += Math.cos(angle) * this.MOVE_SPEED * dt;
    this.y += Math.sin(angle) * this.MOVE_SPEED * dt;

    // Clamp horizontally
    if (this.x < 5) this.x = 5;
    if (this.x > 355) this.x = 355;
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('swarm_drone');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.state = 'IDLE';
    this.angleOffset = (Math.random() - 0.5) * 1.2;
    this.offsetTimer = this.OFFSET_INTERVAL;
    this.pendingShots.length = 0;
  }
}
