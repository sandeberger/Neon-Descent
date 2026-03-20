import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/** Small fragment spawned when a Splitter is killed by a projectile. */
export class SplitterFragment extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'fodder';
        this.gravity = 400;
    }
    onUpdate(dt, _playerX, _playerY) {
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
    reset(x, y) {
        const stats = getEnemyStats('splitter_fragment');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
    }
}
