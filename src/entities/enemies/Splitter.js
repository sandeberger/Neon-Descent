import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/**
 * Risk/reward enemy: dies in 1 shot but splits into 2 fragments.
 * Stomp kills it cleanly (no split) since stomp does 2 damage.
 */
export class Splitter extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'punish';
        this.driftSpeed = 30;
        this.fallSpeed = 60;
    }
    onUpdate(dt, playerX, _playerY) {
        const dx = playerX - this.x;
        this.vx = Math.sign(dx) * this.driftSpeed;
        this.vy = this.fallSpeed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
    reset(x, y) {
        const stats = getEnemyStats('splitter');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        // Split line down the middle
        ctx.strokeStyle = '#88ffbb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx, ry - this.hitbox.height / 2);
        ctx.lineTo(rx, ry + this.hitbox.height / 2);
        ctx.stroke();
    }
}
