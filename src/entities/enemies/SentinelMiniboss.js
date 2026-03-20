import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/**
 * SENTINEL — first miniboss.
 * Large floating guardian with 3 phases based on remaining HP.
 *
 * Phase 1 (HP > 66%): Slow drift, 6-way spread shots
 * Phase 2 (HP > 33%): Faster drift, aimed triple-shot bursts + horizontal charge
 * Phase 3 (HP ≤ 33%): 8-way spray, rapid charges, shockwave rings
 */
export class SentinelMiniboss extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'elite';
        this.phase = 1;
        this.angle = 0;
        this.fireTimer = 0;
        this.moveTimer = 0;
        this.chargeVx = 0;
        this.charging = false;
        this.chargeTimer = 0;
        this.driftDir = 1;
        this.driftSpeed = 30;
        // Visual pulse for threat
        this.pulsePhase = 0;
    }
    onUpdate(dt, playerX, _playerY) {
        this.pulsePhase += dt * 5;
        this.angle += dt * 0.5;
        // Determine phase from HP ratio
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio > 0.66)
            this.phase = 1;
        else if (hpRatio > 0.33)
            this.phase = 2;
        else
            this.phase = 3;
        if (this.charging) {
            this.updateCharge(dt);
            return;
        }
        // Drift toward player horizontally
        const targetDrift = playerX > this.x ? 1 : -1;
        this.driftDir = targetDrift;
        const speed = this.driftSpeed * (this.phase === 3 ? 2.0 : this.phase === 2 ? 1.5 : 1.0);
        this.x += this.driftDir * speed * dt;
        // Clamp
        if (this.x < 40)
            this.x = 40;
        if (this.x > 320)
            this.x = 320;
        // Fire logic
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fire(playerX);
            this.fireTimer = this.phase === 3 ? 0.6 : this.phase === 2 ? 0.9 : 1.4;
        }
        // Charge logic (phase 2+)
        if (this.phase >= 2) {
            this.moveTimer -= dt;
            if (this.moveTimer <= 0) {
                this.startCharge(playerX);
                this.moveTimer = this.phase === 3 ? 2.5 : 4.0;
            }
        }
    }
    fire(playerX) {
        const arms = this.phase === 3 ? 8 : this.phase === 2 ? 6 : 6;
        const bulletSpeed = this.phase === 3 ? 140 : 120;
        if (this.phase === 2) {
            // Aimed triple-burst toward player
            const dx = playerX - this.x;
            const baseAngle = Math.atan2(50, dx); // aim slightly downward
            for (let i = -1; i <= 1; i++) {
                const a = baseAngle + i * 0.3;
                this.pendingShots.push({
                    x: this.x, y: this.y + 20,
                    vx: Math.cos(a) * bulletSpeed * Math.sign(dx),
                    vy: Math.sin(a) * bulletSpeed,
                    damage: 1,
                });
            }
        }
        else {
            // Radial spread
            for (let i = 0; i < arms; i++) {
                const a = this.angle + (i * Math.PI * 2) / arms;
                this.pendingShots.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(a) * bulletSpeed,
                    vy: Math.sin(a) * bulletSpeed,
                    damage: 1,
                });
            }
        }
    }
    startCharge(playerX) {
        this.charging = true;
        this.chargeTimer = 0.4; // charge duration
        const dir = playerX > this.x ? 1 : -1;
        this.chargeVx = dir * (this.phase === 3 ? 400 : 280);
    }
    updateCharge(dt) {
        this.x += this.chargeVx * dt;
        this.chargeTimer -= dt;
        // Clamp and bounce off walls
        if (this.x < 30) {
            this.x = 30;
            this.chargeVx = -this.chargeVx * 0.5;
        }
        if (this.x > 330) {
            this.x = 330;
            this.chargeVx = -this.chargeVx * 0.5;
        }
        if (this.chargeTimer <= 0) {
            this.charging = false;
            this.chargeVx = 0;
            // Phase 3: shockwave ring on charge end
            if (this.phase === 3) {
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI * 2) / 8;
                    this.pendingShots.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(a) * 100,
                        vy: Math.sin(a) * 100,
                        damage: 1,
                    });
                }
            }
        }
    }
    reset(x, y) {
        const stats = getEnemyStats('sentinel_miniboss');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.phase = 1;
        this.angle = 0;
        this.fireTimer = 1.5; // grace period
        this.moveTimer = 3.0;
        this.charging = false;
        this.chargeTimer = 0;
        this.chargeVx = 0;
        this.driftDir = 1;
        this.pulsePhase = 0;
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        // Phase indicator — pulsing core
        const pulse = 0.6 + Math.sin(this.pulsePhase) * 0.3;
        const coreColor = this.phase === 3 ? '#ff0033' :
            this.phase === 2 ? '#ff4400' : '#ff2266';
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = pulse;
        ctx.fillRect(rx - 6, ry - 6, 12, 12);
        ctx.globalAlpha = 1;
        // Rotating threat arms
        const arms = this.phase === 3 ? 8 : 6;
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < arms; i++) {
            const a = this.angle + (i * Math.PI * 2) / arms;
            const len = hw + 4;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(a) * len, ry + Math.sin(a) * len);
            ctx.stroke();
        }
        // Charge indicator
        if (this.charging) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            const trailW = Math.abs(this.chargeVx) * 0.05;
            ctx.fillRect(rx - hw - trailW, ry - 3, trailW, 6);
            ctx.fillRect(rx + hw, ry - 3, trailW, 6);
            ctx.globalAlpha = 1;
        }
        // HP bar above boss
        const barW = 50;
        const barH = 4;
        const barX = rx - barW / 2;
        const barY = ry - hh - 12;
        // Background
        ctx.fillStyle = '#220011';
        ctx.fillRect(barX, barY, barW, barH);
        // HP fill
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const hpColor = this.phase === 3 ? '#ff0033' :
            this.phase === 2 ? '#ff6600' : '#ff2266';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        // Border
        ctx.strokeStyle = '#ff4466';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
    }
}
