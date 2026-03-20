/**
 * Alternative input mode: simpler touch layout for accessibility.
 * - Left half of screen = move left
 * - Right half of screen = move right
 * - Swipe down anywhere = stomp
 * - Swipe up anywhere = dash
 * - Auto-fire when enemies are nearby (no hold required)
 */

// Alternative input uses screen halves rather than canvas coordinates

const STORAGE_KEY = 'neon_descent_alt_input';

export class AlternativeInputMode {
  enabled = false;

  // Touch tracking
  private activeTouchId: number | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private currentTouchX = 0;

  // Output state
  moveX = 0;
  pendingStomp = false;
  pendingDash = false;

  private readonly SWIPE_THRESHOLD = 35;
  private readonly SWIPE_MAX_TIME = 400;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      this.enabled = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {}
  }

  toggle(): void {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.enabled));
    } catch {}
  }

  bind(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  unbind(canvas: HTMLCanvasElement): void {
    canvas.removeEventListener('touchstart', this.onTouchStart);
    canvas.removeEventListener('touchmove', this.onTouchMove);
    canvas.removeEventListener('touchend', this.onTouchEnd);
  }

  /** Consume pending gestures (one-shot) */
  consumeStomp(): boolean {
    if (this.pendingStomp) { this.pendingStomp = false; return true; }
    return false;
  }

  consumeDash(): boolean {
    if (this.pendingDash) { this.pendingDash = false; return true; }
    return false;
  }

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch) return;
    this.activeTouchId = touch.identifier;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.currentTouchX = touch.clientX;
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]!;
      if (touch.identifier === this.activeTouchId) {
        this.currentTouchX = touch.clientX;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]!;
      if (touch.identifier === this.activeTouchId) {
        const dt = Date.now() - this.touchStartTime;
        const dy = touch.clientY - this.touchStartY;
        const dx = touch.clientX - this.touchStartX;

        if (dt < this.SWIPE_MAX_TIME) {
          if (dy > this.SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
            this.pendingStomp = true;
          } else if (dy < -this.SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
            this.pendingDash = true;
          }
        }
        this.activeTouchId = null;
        this.moveX = 0;
      }
    }
  };

  /** Call each frame to get moveX based on which half of screen is touched */
  updateMoveX(_canvasScale: number, canvasRect: DOMRect): void {
    if (this.activeTouchId === null) {
      this.moveX = 0;
      return;
    }
    const screenMid = canvasRect.left + canvasRect.width / 2;
    if (this.currentTouchX < screenMid) {
      this.moveX = -1;
    } else {
      this.moveX = 1;
    }
  }
}
