import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
export class TurretBloom extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'zoning';
        this.angle = 0;
        this.fireTimer = 0;
        this.fireInterval = 1.2;
        this.bulletSpeed = 160;
        this.arms = 4;
    }
    onUpdate(dt, _playerX, _playerY) {
        // Rotate continuously
        this.angle += dt * 0.8;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fireTimer = this.fireInterval;
            for (let i = 0; i < this.arms; i++) {
                const a = this.angle + (i * Math.PI * 2) / this.arms;
                this.pendingShots.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(a) * this.bulletSpeed,
                    vy: Math.sin(a) * this.bulletSpeed,
                    damage: 1,
                });
            }
        }
    }
    reset(x, y) {
        const stats = getEnemyStats('turret_bloom');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.angle = Math.random() * Math.PI * 2;
        this.fireTimer = 0.5 + Math.random() * 0.5;
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        // Draw rotating arms showing fire direction
        ctx.strokeStyle = this.bodyColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < this.arms; i++) {
            const a = this.angle + (i * Math.PI * 2) / this.arms;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(a) * 16, ry + Math.sin(a) * 16);
            ctx.stroke();
        }
        // Center dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
    }
}
