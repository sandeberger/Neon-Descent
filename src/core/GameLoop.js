import { FIXED_DT, MAX_FRAME_DT } from './Constants';
export class GameLoop {
    constructor(fixedUpdate, render) {
        this.fixedUpdate = fixedUpdate;
        this.render = render;
        this.accumulator = 0;
        this.lastTime = 0;
        this.running = false;
        this.rafId = 0;
        /** Exposed for debug overlay */
        this.fps = 0;
        this.frameTime = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.tick = (nowMs) => {
            if (!this.running)
                return;
            const now = nowMs / 1000;
            let frameDt = now - this.lastTime;
            this.lastTime = now;
            // Cap to prevent spiral of death after tab-away
            if (frameDt > MAX_FRAME_DT)
                frameDt = MAX_FRAME_DT;
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
    start() {
        if (this.running)
            return;
        this.running = true;
        this.lastTime = performance.now() / 1000;
        this.accumulator = 0;
        this.rafId = requestAnimationFrame(this.tick);
    }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.rafId);
    }
}
