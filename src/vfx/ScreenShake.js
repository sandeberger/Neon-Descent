export class ScreenShake {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.intensity = 0;
        this.decay = 0.88;
    }
    trigger(intensity) {
        this.intensity = Math.max(this.intensity, intensity);
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
