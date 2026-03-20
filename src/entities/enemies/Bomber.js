import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/**
 * Bomber — Kamikaze Punisher
 *
 * Floats toward player slowly. When within 50px, starts self-destruct
 * countdown (1s). Explodes on timer or on death.
 *
 * States: APPROACH → SELF_DESTRUCT (1s) → EXPLODED
 */
export class Bomber extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'punish';
        this.pendingExplosion = null;
        this.APPROACH_SPEED = 60;
        this.DETONATION_TIME = 1.0;
        this.PROXIMITY = 50;
        this.pulsePhase = 0;
    }
    onUpdate(dt, playerX, playerY) {
        this.pulsePhase += dt * 8;
        switch (this.state) {
            case 'APPROACH': {
                // Drift toward player
                const dx = playerX - this.x;
                const dy = playerY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                this.x += (dx / dist) * this.APPROACH_SPEED * dt;
                this.y += (dy / dist) * this.APPROACH_SPEED * dt;
                // Check proximity
                if (dist < this.PROXIMITY) {
                    this.state = 'SELF_DESTRUCT';
                    this.stateTimer = this.DETONATION_TIME;
                }
                break;
            }
            case 'SELF_DESTRUCT': {
                // Stop moving, count down
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.state = 'EXPLODED';
                    this.triggerExplosion();
                    this.active = false;
                }
                break;
            }
        }
        // Clamp horizontally
        if (this.x < 15)
            this.x = 15;
        if (this.x > 345)
            this.x = 345;
    }
    /** Override takeDamage to trigger explosion on death */
    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 0.1;
        if (this.hp <= 0) {
            this.triggerExplosion();
            this.active = false;
            return true;
        }
        return false;
    }
    triggerExplosion() {
        this.pendingExplosion = { x: this.x, y: this.y };
        // Also spawn radial explosion shots
        const arms = 8;
        const speed = 100;
        for (let i = 0; i < arms; i++) {
            const a = (i * Math.PI * 2) / arms;
            this.pendingShots.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                damage: 1,
            });
        }
    }
    reset(x, y) {
        const stats = getEnemyStats('bomber');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.state = 'APPROACH';
        this.stateTimer = 0;
        this.pulsePhase = 0;
        this.pendingExplosion = null;
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        if (this.state === 'SELF_DESTRUCT') {
            // Pulsing glow that grows as timer counts down
            const progress = 1 - this.stateTimer / this.DETONATION_TIME;
            const radius = 10 + progress * 16;
            const alpha = 0.3 + Math.sin(this.pulsePhase) * 0.2 + progress * 0.3;
            // Outer glow
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(rx, ry, radius, 0, Math.PI * 2);
            ctx.stroke();
            // Inner flash
            ctx.fillStyle = '#ffaa00';
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.arc(rx, ry, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            // Countdown visual — shrinking core
            const coreSize = 6 - progress * 4;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(rx - coreSize / 2, ry - coreSize / 2, coreSize, coreSize);
        }
        // Fuse indicator
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(rx - 1, ry - this.hitbox.height / 2 - 4, 2, 4);
        // Spark at top of fuse
        if (this.state === 'APPROACH') {
            const sparkAlpha = 0.4 + Math.sin(this.pulsePhase) * 0.3;
            ctx.fillStyle = '#ffff00';
            ctx.globalAlpha = sparkAlpha;
            ctx.fillRect(rx - 2, ry - this.hitbox.height / 2 - 6, 4, 3);
            ctx.globalAlpha = 1;
        }
    }
}
