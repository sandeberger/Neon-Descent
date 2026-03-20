import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

export class Hopper extends EnemyBase {
  role = 'pressure' as const;

  private bounceTimer = 0;
  private bounceInterval = 0.8;
  private bounceHeight = -300;
  private driftSpeed = 40;
  private gravity = 600;

  onUpdate(dt: number, playerX: number, _playerY: number): void {
    switch (this.state) {
      case 'IDLE':
        this.bounceTimer -= dt;
        if (this.bounceTimer <= 0) {
          this.state = 'BOUNCING';
          this.vy = this.bounceHeight;
          // Drift toward player
          const dx = playerX - this.x;
          this.vx = Math.sign(dx) * this.driftSpeed;
        }
        break;

      case 'BOUNCING':
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // Simple ground check (relative to spawn height)
        if (this.vy > 0 && this.y >= this.prevY + 10) {
          this.state = 'IDLE';
          this.bounceTimer = this.bounceInterval;
          this.vx = 0;
          this.vy = 0;
        }
        break;
    }
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('hopper');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
    this.bounceTimer = Math.random() * 0.5;
    this.state = 'IDLE';
  }
}
