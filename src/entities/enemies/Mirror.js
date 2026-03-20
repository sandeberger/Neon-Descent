import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/**
 * Mirror — Reflective Disruptor
 *
 * Drifts horizontally with a shield that always faces the player.
 * Deflects projectiles coming from the shielded side.
 * Fires slow aimed shots every 2s.
 *
 * States: DRIFT, REFLECT_COOLDOWN
 */
export class Mirror extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'disruptor';
        this.driftDir = 1;
        this.DRIFT_SPEED = 30;
        this.dirChangeTimer = 0;
        this.fireTimer = 0;
        this.FIRE_INTERVAL = 2.0;
        this.BULLET_SPEED = 100;
        this.shieldSide = 1;
        this.pulsePhase = 0;
    }
    /** Shield faces the player — blocks projectiles from that side */
    isShielded(projectileX) {
        // Shield side is the side facing the player
        // Block if projectile is on the same side as the shield
        if (this.shieldSide === 1) {
            // Shield faces right (player is to the right)
            return projectileX > this.x;
        }
        else {
            // Shield faces left (player is to the left)
            return projectileX < this.x;
        }
    }
    onUpdate(dt, playerX, playerY) {
        this.pulsePhase += dt * 6;
        // Update shield side to face player
        this.shieldSide = playerX > this.x ? 1 : -1;
        switch (this.state) {
            case 'DRIFT':
            case 'IDLE': {
                // Horizontal drift
                this.x += this.driftDir * this.DRIFT_SPEED * dt;
                // Occasionally change direction
                this.dirChangeTimer -= dt;
                if (this.dirChangeTimer <= 0) {
                    this.driftDir = -this.driftDir;
                    this.dirChangeTimer = 1.5 + Math.random() * 2.0;
                }
                // Clamp
                if (this.x < 25) {
                    this.x = 25;
                    this.driftDir = 1;
                }
                if (this.x > 335) {
                    this.x = 335;
                    this.driftDir = -1;
                }
                // Fire timer
                this.fireTimer -= dt;
                if (this.fireTimer <= 0) {
                    this.fireTimer = this.FIRE_INTERVAL;
                    this.fireAtPlayer(playerX, playerY);
                    this.state = 'REFLECT_COOLDOWN';
                    this.stateTimer = 0.3;
                }
                break;
            }
            case 'REFLECT_COOLDOWN': {
                // Brief pause after firing
                this.stateTimer -= dt;
                this.x += this.driftDir * this.DRIFT_SPEED * 0.5 * dt;
                if (this.stateTimer <= 0) {
                    this.state = 'DRIFT';
                }
                break;
            }
        }
    }
    fireAtPlayer(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.pendingShots.push({
            x: this.x,
            y: this.y,
            vx: (dx / dist) * this.BULLET_SPEED,
            vy: (dy / dist) * this.BULLET_SPEED,
            damage: 1,
        });
    }
    reset(x, y) {
        const stats = getEnemyStats('mirror');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.state = 'DRIFT';
        this.driftDir = Math.random() > 0.5 ? 1 : -1;
        this.dirChangeTimer = 1.5 + Math.random() * 1.0;
        this.fireTimer = this.FIRE_INTERVAL;
        this.shieldSide = 1;
        this.pulsePhase = 0;
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        // Shield bar on the side facing player
        const shieldX = this.shieldSide === 1 ? rx + hw + 1 : rx - hw - 4;
        const shieldAlpha = 0.5 + Math.sin(this.pulsePhase) * 0.2;
        ctx.fillStyle = '#44ddff';
        ctx.globalAlpha = shieldAlpha;
        ctx.fillRect(shieldX, ry - hh - 2, 3, this.hitbox.height + 4);
        ctx.globalAlpha = 1;
        // Shield glow
        ctx.fillStyle = '#44ddff';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(shieldX - 2, ry - hh - 4, 7, this.hitbox.height + 8);
        ctx.globalAlpha = 1;
        // Center mirror dot
        ctx.fillStyle = '#88eeff';
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
        // Reflect cooldown indicator
        if (this.state === 'REFLECT_COOLDOWN') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(rx, ry, hw + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}
