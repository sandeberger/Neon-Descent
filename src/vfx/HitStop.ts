export class HitStop {
  active = false;
  private remaining = 0;

  trigger(frames: number): void {
    this.active = true;
    this.remaining = frames;
  }

  update(): void {
    if (!this.active) return;
    this.remaining--;
    if (this.remaining <= 0) {
      this.active = false;
    }
  }

  reset(): void {
    this.active = false;
    this.remaining = 0;
  }
}
