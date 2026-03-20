import { Entity } from './Entity';
export class Projectile extends Entity {
    constructor() {
        super(...arguments);
        this.damage = 1;
        this.owner = 'player';
        this.color = '#ffff44';
        this.glowColor = '#ffaa22';
        this.piercing = false;
        this.life = 2; // seconds before auto-deactivate
        this.bouncesRemaining = 0;
        this.projectileLength = 0;
    }
    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.vx = 0;
        this.vy = 0;
        this.damage = 1;
        this.owner = 'player';
        this.color = '#ffff44';
        this.glowColor = '#ffaa22';
        this.piercing = false;
        this.life = 2;
        this.bouncesRemaining = 0;
        this.projectileLength = 0;
    }
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }
}
