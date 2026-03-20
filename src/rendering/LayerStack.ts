import { CANVAS_W, CANVAS_H } from '@core/Constants';

/**
 * LayerStack — manages OffscreenCanvas layers for separated rendering.
 *
 * Layer 0: Background
 * Layer 1: Tiles
 * Layer 2: Entities
 * Layer 3: Particles/VFX
 */
export class LayerStack {
  readonly canvases: OffscreenCanvas[] = [];
  readonly contexts: OffscreenCanvasRenderingContext2D[] = [];

  constructor() {
    for (let i = 0; i < 4; i++) {
      const canvas = new OffscreenCanvas(CANVAS_W, CANVAS_H);
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      this.canvases.push(canvas);
      this.contexts.push(ctx);
    }
  }

  /** Clear a specific layer */
  clearLayer(layer: number): void {
    this.contexts[layer]!.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /** Composite all layers onto the main canvas */
  composite(mainCtx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 4; i++) {
      mainCtx.drawImage(this.canvases[i]!, 0, 0);
    }
  }
}
