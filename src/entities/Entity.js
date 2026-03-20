let nextId = 1;
export class Entity {
    constructor() {
        this.active = true;
        // Current position
        this.x = 0;
        this.y = 0;
        // Previous position (for interpolation)
        this.prevX = 0;
        this.prevY = 0;
        // Velocity
        this.vx = 0;
        this.vy = 0;
        this.hitbox = { width: 16, height: 16, offsetX: 0, offsetY: 0 };
        this.id = nextId++;
    }
    savePrevious() {
        this.prevX = this.x;
        this.prevY = this.y;
    }
    renderX(alpha) {
        return this.prevX + (this.x - this.prevX) * alpha;
    }
    renderY(alpha) {
        return this.prevY + (this.y - this.prevY) * alpha;
    }
    getBounds() {
        return {
            x: this.x + this.hitbox.offsetX - this.hitbox.width / 2,
            y: this.y + this.hitbox.offsetY - this.hitbox.height / 2,
            w: this.hitbox.width,
            h: this.hitbox.height,
        };
    }
}
export function resetEntityIds() {
    nextId = 1;
}
