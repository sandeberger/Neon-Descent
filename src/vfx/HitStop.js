export class HitStop {
    constructor() {
        this.active = false;
        this.remaining = 0;
    }
    trigger(frames) {
        this.active = true;
        this.remaining = frames;
    }
    update() {
        if (!this.active)
            return;
        this.remaining--;
        if (this.remaining <= 0) {
            this.active = false;
        }
    }
    reset() {
        this.active = false;
        this.remaining = 0;
    }
}
