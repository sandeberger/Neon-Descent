import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/**
 * ParasiteCloud — swarm enemy that drifts toward player.
 * Easy to kill individually (1 HP) but spawns in groups.
 * Punishes ignoring them: they slowly close in and deal contact damage.
 * Good combo fodder — killing a cluster builds combo fast.
 */
export class ParasiteCloud extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'fodder';
        this.driftSpeed = 45;
        this.wobblePhase = 0;
        this.wobbleSpeed = 3;
        this.wobbleAmplitude = 30;
    }
    onUpdate(dt, playerX, playerY) {
        // Gentle drift toward player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            this.vx = (dx / dist) * this.driftSpeed;
            this.vy = (dy / dist) * this.driftSpeed;
        }
        // Wobble perpendicular to movement for organic feel
        this.wobblePhase += this.wobbleSpeed * dt;
        const perpX = -this.vy;
        const perpY = this.vx;
        const perpLen = Math.hypot(perpX, perpY);
        if (perpLen > 0) {
            const wobble = Math.sin(this.wobblePhase) * this.wobbleAmplitude * dt;
            this.x += this.vx * dt + (perpX / perpLen) * wobble;
            this.y += this.vy * dt + (perpY / perpLen) * wobble;
        }
        else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        // Clamp
        if (this.x < 10)
            this.x = 10;
        if (this.x > 350)
            this.x = 350;
    }
    reset(x, y) {
        const stats = getEnemyStats('parasite_cloud');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.state = 'IDLE';
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        // Spore particles around the cloud
        const phase = this.wobblePhase;
        ctx.fillStyle = '#dd66ff';
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) {
            const angle = phase + (i * Math.PI * 2) / 3;
            const ox = Math.cos(angle) * 8;
            const oy = Math.sin(angle) * 6;
            ctx.fillRect(rx + ox - 2, ry + oy - 2, 3, 3);
        }
        ctx.globalAlpha = 1;
    }
}
