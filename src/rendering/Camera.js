import { CANVAS_W, CANVAS_H } from '@core/Constants';
import { clamp, lerp } from '@utils/math';
export class Camera {
    constructor() {
        this.x = CANVAS_W / 2;
        this.y = 0;
        this.zoom = 1;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.lookAhead = 120;
        this.smoothSpeed = 8;
        /** Threat density: 0–1, how many enemies/projectiles are near the player */
        this.threatDensity = 0;
    }
    get top() { return this.y - (CANVAS_H / 2) / this.zoom; }
    get bottom() { return this.y + (CANVAS_H / 2) / this.zoom; }
    get left() { return this.x - (CANVAS_W / 2) / this.zoom; }
    get right() { return this.x + (CANVAS_W / 2) / this.zoom; }
    update(playerY, dt, intensity) {
        const targetY = playerY + this.lookAhead;
        this.y = lerp(this.y, targetY, this.smoothSpeed * dt);
        // Dynamic zoom: zoom out based on combo intensity AND threat density
        const comboZoom = intensity * 0.08;
        const threatZoom = this.threatDensity * 0.07;
        const targetZoom = 1.0 - Math.max(comboZoom, threatZoom);
        this.zoom = lerp(this.zoom, targetZoom, 3 * dt);
        this.zoom = clamp(this.zoom, 0.85, 1.0);
    }
    applyTransform(ctx) {
        ctx.save();
        ctx.translate(CANVAS_W / 2 + this.shakeOffsetX, CANVAS_H / 2 + this.shakeOffsetY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }
    restore(ctx) {
        ctx.restore();
    }
    isVisible(x, y, w, h) {
        return x + w > this.left && x < this.right &&
            y + h > this.top && y < this.bottom;
    }
}
