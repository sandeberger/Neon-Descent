export class ScreenShake {
  offsetX = 0;
  offsetY = 0;
  private intensity = 0;
  private decay = 0.88;

  trigger(intensity: number): void {
    this.intensity = Math.max(this.intensity, intensity);
  }

  update(): void {
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

  reset(): void {
    this.intensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
