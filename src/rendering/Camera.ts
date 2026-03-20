import { CANVAS_W, CANVAS_H } from '@core/Constants';
import { clamp, lerp } from '@utils/math';

export class Camera {
  x = CANVAS_W / 2;
  y = 0;
  zoom = 1;

  shakeOffsetX = 0;
  shakeOffsetY = 0;

  private lookAhead = 120;
  private smoothSpeed = 8;

  get top(): number    { return this.y - (CANVAS_H / 2) / this.zoom; }
  get bottom(): number { return this.y + (CANVAS_H / 2) / this.zoom; }
  get left(): number   { return this.x - (CANVAS_W / 2) / this.zoom; }
  get right(): number  { return this.x + (CANVAS_W / 2) / this.zoom; }

  /** Threat density: 0–1, how many enemies/projectiles are near the player */
  threatDensity = 0;

  update(playerY: number, dt: number, intensity: number): void {
    const targetY = playerY + this.lookAhead;
    this.y = lerp(this.y, targetY, this.smoothSpeed * dt);

    // Dynamic zoom: zoom out based on combo intensity AND threat density
    const comboZoom = intensity * 0.08;
    const threatZoom = this.threatDensity * 0.07;
    const targetZoom = 1.0 - Math.max(comboZoom, threatZoom);
    this.zoom = lerp(this.zoom, targetZoom, 3 * dt);
    this.zoom = clamp(this.zoom, 0.85, 1.0);
  }

  applyTransform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(
      CANVAS_W / 2 + this.shakeOffsetX,
      CANVAS_H / 2 + this.shakeOffsetY,
    );
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    ctx.restore();
  }

  isVisible(x: number, y: number, w: number, h: number): boolean {
    return x + w > this.left && x < this.right &&
           y + h > this.top  && y < this.bottom;
  }
}
