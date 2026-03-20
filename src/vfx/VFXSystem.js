import { ParticlePool, VFX_PRESETS } from './ParticlePool';
import { ScreenShake } from './ScreenShake';
import { HitStop } from './HitStop';
export class VFXSystem {
    constructor() {
        // Screen flash
        this.flashAlpha = 0;
        this.flashColor = '#ffffff';
        this.flashDecay = 0;
        /** Multiplier for flash intensity (set by accessibility settings, default 1.0) */
        this.flashMultiplier = 1.0;
        this.particles = new ParticlePool();
        this.shake = new ScreenShake();
        this.hitStop = new HitStop();
    }
    emit(presetName, x, y) {
        const preset = VFX_PRESETS[presetName];
        if (preset) {
            this.particles.emit(preset, x, y);
        }
    }
    flash(color, alpha, duration) {
        this.flashColor = color;
        this.flashAlpha = alpha * this.flashMultiplier;
        this.flashDecay = (alpha * this.flashMultiplier) / duration;
    }
    update(dt) {
        this.particles.update(dt);
        this.shake.update();
        this.hitStop.update();
        if (this.flashAlpha > 0) {
            this.flashAlpha -= this.flashDecay * dt;
            if (this.flashAlpha < 0)
                this.flashAlpha = 0;
        }
    }
    reset() {
        this.shake.reset();
        this.hitStop.reset();
        this.flashAlpha = 0;
    }
}
