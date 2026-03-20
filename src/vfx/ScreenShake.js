export class ScreenShake {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.intensity = 0;
        this.decay = 0.88;
        /** Multiplier for intensity (set by accessibility settings, default 1.0) */
        this.intensityMultiplier = 1.0;
    }
    trigger(intensity) {
        this.intensity = Math.max(this.intensity, intensity * this.intensityMultiplier);
    }
    update() {
        if (this.intensity < 0.5) {
            this.intensity = 0;
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }
        this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
        this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
        this.intensity *= this.decay;
    }
    reset() {
        this.intensity = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}
