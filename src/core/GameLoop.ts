import { FIXED_DT, MAX_FRAME_DT } from './Constants';

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;

  /** Exposed for debug overlay */
  fps = 0;
  frameTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  constructor(
    private readonly fixedUpdate: (dt: number) => void,
    private readonly render: (alpha: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (nowMs: number): void => {
    if (!this.running) return;

    const now = nowMs / 1000;
    let frameDt = now - this.lastTime;
    this.lastTime = now;

    // Cap to prevent spiral of death after tab-away
    if (frameDt > MAX_FRAME_DT) frameDt = MAX_FRAME_DT;

    this.frameTime = frameDt;

    // FPS counter
    this.frameCount++;
    this.fpsTimer += frameDt;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer -= 1;
    }

    this.accumulator += frameDt;

    while (this.accumulator >= FIXED_DT) {
      this.fixedUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    const alpha = this.accumulator / FIXED_DT;
    this.render(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
