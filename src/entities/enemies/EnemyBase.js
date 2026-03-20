import { Entity } from '../Entity';
export class EnemyBase extends Entity {
    constructor() {
        super(...arguments);
        this.hp = 2;
        this.maxHp = 2;
        this.damage = 1;
        this.scoreValue = 100;
        this.comboValue = 1;
        this.role = 'fodder';
        this.state = 'IDLE';
        this.stateTimer = 0;
        this.flashTimer = 0;
        this.bodyColor = '#ff4466';
        this.glowColor = '#ff2244';
        this.pendingShots = [];
    }
    update(dt, playerX, playerY) {
        if (this.flashTimer > 0)
            this.flashTimer -= dt;
        this.onUpdate(dt, playerX, playerY);
    }
    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 0.1;
        if (this.hp <= 0) {
            this.active = false;
            return true; // died
        }
        return false;
    }
    /** Override to block projectile damage from certain directions */
    isShielded(_projectileX) {
        return false;
    }
    applyStats(stats) {
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.damage = stats.damage;
        this.scoreValue = stats.scoreValue;
        this.comboValue = stats.comboValue;
        this.bodyColor = stats.bodyColor;
        this.glowColor = stats.glowColor;
        this.hitbox = { width: stats.hitboxWidth, height: stats.hitboxHeight, offsetX: 0, offsetY: 0 };
    }
    resetBase(x, y, hp) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = hp;
        this.maxHp = hp;
        this.state = 'IDLE';
        this.stateTimer = 0;
        this.flashTimer = 0;
    }
}
