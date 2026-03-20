import { EnemyBase } from './EnemyBase';
import { getEnemyStats } from '@data/enemyStats';
/**
 * Drill Mother — Second Boss
 *
 * Large mechanical boss with 3 phases based on HP.
 *
 * Phase 1 (HP > 66%): Side-to-side drift, downward drill projectiles,
 *   horizontal drill charge every 5s at 300px/s.
 * Phase 2 (HP > 33%): Faster charges (400px/s), debris columns,
 *   aimed triple-shots at player.
 * Phase 3 (HP <= 33%): Frantic mode. Rapid fire, charges every 3s at 500px/s,
 *   10-way spread on charge end, diagonal wall-drilling projectiles.
 */
export class DrillMother extends EnemyBase {
    constructor() {
        super(...arguments);
        this.role = 'boss';
        this.pendingSpawns = [];
        this.phase = 1;
        this.prevPhase = 1;
        this.driftDir = 1;
        this.fireTimer = 0;
        this.chargeTimer = 0;
        this.chargeCooldown = 0;
        this.chargeVx = 0;
        this.charging = false;
        this.drillAngle = 0;
        // Visual state
        this.pulsePhase = 0;
        this.vulnerableTimer = 0;
    }
    onUpdate(dt, playerX, _playerY) {
        this.pulsePhase += dt * 5;
        this.drillAngle += dt * 8;
        // Determine phase from HP ratio
        const hpRatio = this.hp / this.maxHp;
        if (hpRatio > 0.66)
            this.phase = 1;
        else if (hpRatio > 0.33)
            this.phase = 2;
        else
            this.phase = 3;
        // Phase transition
        if (this.phase !== this.prevPhase) {
            this.prevPhase = this.phase;
            this.vulnerableTimer = 0.5;
        }
        if (this.vulnerableTimer > 0) {
            this.vulnerableTimer -= dt;
            return;
        }
        if (this.charging) {
            this.updateCharge(dt);
            return;
        }
        // Drift side to side
        const driftSpeed = this.phase === 3 ? 80 : this.phase === 2 ? 60 : 40;
        this.x += this.driftDir * driftSpeed * dt;
        if (this.x < 50) {
            this.x = 50;
            this.driftDir = 1;
        }
        if (this.x > 310) {
            this.x = 310;
            this.driftDir = -1;
        }
        // Fire logic
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fire(playerX);
            this.fireTimer = this.getFireInterval();
        }
        // Charge logic
        this.chargeCooldown -= dt;
        if (this.chargeCooldown <= 0) {
            this.startCharge(playerX);
            this.chargeCooldown = this.getChargeCooldown();
        }
    }
    getFireInterval() {
        switch (this.phase) {
            case 1: return 1.5;
            case 2: return 1.0;
            case 3: return 0.5;
            default: return 1.5;
        }
    }
    getChargeCooldown() {
        switch (this.phase) {
            case 1: return 5.0;
            case 2: return 4.0;
            case 3: return 3.0;
            default: return 5.0;
        }
    }
    fire(playerX) {
        switch (this.phase) {
            case 1: {
                // Drill projectiles downward (fast, wide spread)
                for (let i = -2; i <= 2; i++) {
                    this.pendingShots.push({
                        x: this.x + i * 15,
                        y: this.y + this.hitbox.height / 2,
                        vx: i * 20,
                        vy: 200,
                        damage: this.damage,
                    });
                }
                break;
            }
            case 2: {
                // Debris columns — straight down in pattern
                for (let i = -1; i <= 1; i++) {
                    this.pendingShots.push({
                        x: this.x + i * 25,
                        y: this.y + this.hitbox.height / 2,
                        vx: 0,
                        vy: 180,
                        damage: this.damage,
                    });
                }
                // Aimed triple-shot at player
                const dx = playerX - this.x;
                const baseAngle = Math.atan2(100, dx);
                for (let i = -1; i <= 1; i++) {
                    const a = baseAngle + i * 0.2;
                    this.pendingShots.push({
                        x: this.x,
                        y: this.y + 15,
                        vx: Math.cos(a) * 160 * Math.sign(dx || 1),
                        vy: Math.sin(a) * 160,
                        damage: this.damage,
                    });
                }
                break;
            }
            case 3: {
                // Rapid fire from multiple angles
                const arms = 6;
                const offset = this.drillAngle * 0.3;
                for (let i = 0; i < arms; i++) {
                    const a = offset + (i * Math.PI * 2) / arms;
                    this.pendingShots.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(a) * 140,
                        vy: Math.sin(a) * 140,
                        damage: this.damage,
                    });
                }
                // Wall-drilling diagonal projectiles
                this.pendingShots.push({ x: this.x, y: this.y, vx: -120, vy: 120, damage: this.damage }, { x: this.x, y: this.y, vx: 120, vy: 120, damage: this.damage });
                break;
            }
        }
    }
    startCharge(playerX) {
        this.charging = true;
        const dir = playerX > this.x ? 1 : -1;
        // First move to opposite side, then charge across
        const speed = this.phase === 3 ? 500 : this.phase === 2 ? 400 : 300;
        this.chargeVx = dir * speed;
        this.chargeTimer = 0.6;
    }
    updateCharge(dt) {
        this.x += this.chargeVx * dt;
        this.chargeTimer -= dt;
        // Bounce off walls
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
            // Charge end: spread shot
            if (this.phase === 3) {
                // 10-way spread
                for (let i = 0; i < 10; i++) {
                    const a = (i * Math.PI * 2) / 10;
                    this.pendingShots.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(a) * 130,
                        vy: Math.sin(a) * 130,
                        damage: this.damage,
                    });
                }
            }
            else if (this.phase === 2) {
                // 6-way spread
                for (let i = 0; i < 6; i++) {
                    const a = (i * Math.PI * 2) / 6;
                    this.pendingShots.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(a) * 110,
                        vy: Math.sin(a) * 110,
                        damage: this.damage,
                    });
                }
            }
        }
    }
    reset(x, y) {
        const stats = getEnemyStats('drill_mother');
        this.resetBase(x, y, stats.hp);
        this.applyStats(stats);
        this.phase = 1;
        this.prevPhase = 1;
        this.driftDir = 1;
        this.fireTimer = 2.0; // grace period
        this.chargeCooldown = 5.0;
        this.chargeTimer = 0;
        this.chargeVx = 0;
        this.charging = false;
        this.drillAngle = 0;
        this.pulsePhase = 0;
        this.vulnerableTimer = 0;
        this.pendingSpawns.length = 0;
        this.pendingShots.length = 0;
    }
    renderExtra(ctx, rx, ry) {
        const hw = this.hitbox.width / 2;
        const hh = this.hitbox.height / 2;
        // Drill bits on front (bottom) — rotating
        const drillCount = 3;
        const drillSpacing = (this.hitbox.width - 8) / (drillCount - 1);
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 2;
        for (let i = 0; i < drillCount; i++) {
            const dx = rx - hw + 4 + i * drillSpacing;
            const drillLen = 10;
            const angle = this.drillAngle + i * 0.8;
            const wobble = Math.sin(angle) * 3;
            ctx.beginPath();
            ctx.moveTo(dx, ry + hh);
            ctx.lineTo(dx + wobble, ry + hh + drillLen);
            ctx.stroke();
        }
        // Phase core glow
        const pulse = 0.5 + Math.sin(this.pulsePhase) * 0.3;
        const coreColor = this.phase === 3 ? '#ff2200' :
            this.phase === 2 ? '#ff6600' : '#ffaa44';
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = pulse;
        ctx.fillRect(rx - 8, ry - 8, 16, 16);
        ctx.globalAlpha = 1;
        // Debris trail during charge
        if (this.charging) {
            ctx.fillStyle = '#ffaa44';
            ctx.globalAlpha = 0.4;
            const trailW = Math.abs(this.chargeVx) * 0.04;
            const trailDir = this.chargeVx > 0 ? -1 : 1;
            ctx.fillRect(trailDir > 0 ? rx + hw : rx - hw - trailW, ry - 4, trailW, 8);
            ctx.globalAlpha = 1;
            // Debris particles
            for (let i = 0; i < 3; i++) {
                const px = rx + trailDir * (hw + 5 + i * 8);
                const py = ry + Math.sin(this.pulsePhase + i * 2) * 6;
                ctx.fillStyle = '#ffaa44';
                ctx.globalAlpha = 0.3 - i * 0.08;
                ctx.fillRect(px - 2, py - 2, 4, 4);
            }
            ctx.globalAlpha = 1;
        }
        // Vulnerability flash
        if (this.vulnerableTimer > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.3 + Math.sin(this.vulnerableTimer * 20) * 0.3;
            ctx.fillRect(rx - hw - 4, ry - hh - 4, this.hitbox.width + 8, this.hitbox.height + 8);
            ctx.globalAlpha = 1;
        }
        // HP bar (70px wide with phase markers)
        const barW = 70;
        const barH = 5;
        const barX = rx - barW / 2;
        const barY = ry - hh - 16;
        // Background
        ctx.fillStyle = '#110800';
        ctx.fillRect(barX, barY, barW, barH);
        // HP fill
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = coreColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        // Phase markers at 66% and 33%
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        for (const mark of [0.66, 0.33]) {
            ctx.fillRect(barX + barW * mark - 0.5, barY, 1, barH);
        }
        ctx.globalAlpha = 1;
        // Border
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        // Boss name
        ctx.fillStyle = coreColor;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.7;
        ctx.fillText('DRILL MOTHER', rx, barY - 4);
        ctx.globalAlpha = 1;
    }
}
