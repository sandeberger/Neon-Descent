import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';

/** Small fragment spawned when a Splitter is killed by a projectile. */
export class SplitterFragment extends EnemyBase {
  role = 'fodder' as const;

  private gravity = 400;

  onUpdate(dt: number, _playerX: number, _playerY: number): void {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  reset(x: number, y: number): void {
    const stats = getEnemyStats('splitter_fragment');
    this.resetBase(x, y, stats.hp);
    this.applyStats(stats);
  }
}
