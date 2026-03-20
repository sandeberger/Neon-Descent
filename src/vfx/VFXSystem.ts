import { ParticlePool, VFX_PRESETS } from './ParticlePool';
import { ScreenShake } from './ScreenShake';
import { HitStop } from './HitStop';

export class VFXSystem {
  readonly particles: ParticlePool;
  readonly shake: ScreenShake;
  readonly hitStop: HitStop;

  // Screen flash
  flashAlpha = 0;
  flashColor = '#ffffff';
  private flashDecay = 0;

  constructor() {
    this.particles = new ParticlePool();
    this.shake = new ScreenShake();
    this.hitStop = new HitStop();
  }

  emit(presetName: string, x: number, y: number): void {
    const preset = VFX_PRESETS[presetName];
    if (preset) {
      this.particles.emit(preset, x, y);
    }
  }

  flash(color: string, alpha: number, duration: number): void {
    this.flashColor = color;
    this.flashAlpha = alpha;
    this.flashDecay = alpha / duration;
  }

  update(dt: number): void {
    this.particles.update(dt);
    this.shake.update();
    this.hitStop.update();

    if (this.flashAlpha > 0) {
      this.flashAlpha -= this.flashDecay * dt;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
  }

  reset(): void {
    this.shake.reset();
    this.hitStop.reset();
    this.flashAlpha = 0;
  }
}
