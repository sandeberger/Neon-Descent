import {
  SWIPE_THRESHOLD,
  SWIPE_TIME_MAX,
  DOUBLE_TAP_WINDOW,
  HOLD_MIN_TIME,
  MOVE_DEFLECTION,
} from '@core/Constants';
import { GestureType, type ActiveTouch } from './InputTypes';

export class GestureRecognizer {
  private activeTouches = new Map<number, ActiveTouch>();
  private pendingGestures: GestureType[] = [];
  private lastRightTapTime = 0;

  /** Attach to the canvas element */
  bind(el: HTMLElement): void {
    el.addEventListener('touchstart',  this.onTouchStart, { passive: false });
    el.addEventListener('touchmove',   this.onTouchMove,  { passive: false });
    el.addEventListener('touchend',    this.onTouchEnd,   { passive: false });
    el.addEventListener('touchcancel', this.onTouchEnd,   { passive: false });
  }

  unbind(el: HTMLElement): void {
    el.removeEventListener('touchstart',  this.onTouchStart);
    el.removeEventListener('touchmove',   this.onTouchMove);
    el.removeEventListener('touchend',    this.onTouchEnd);
    el.removeEventListener('touchcancel', this.onTouchEnd);
  }

  /** Normalized horizontal movement from left-zone drag: -1 to 1 */
  getMoveX(canvasScale: number): number {
    for (const t of this.activeTouches.values()) {
      if (t.zone === 'left') {
        const dx = (t.currentX - t.startX) / canvasScale;
        return Math.max(-1, Math.min(1, dx / MOVE_DEFLECTION));
      }
    }
    return 0;
  }

  /** Whether right-zone is being held (fire) */
  isHolding(): boolean {
    const now = performance.now();
    for (const t of this.activeTouches.values()) {
      if (t.zone === 'right' && now - t.startTime > HOLD_MIN_TIME) {
        return true;
      }
    }
    return false;
  }

  /** Drain pending gesture queue */
  consumeGestures(): GestureType[] {
    if (this.pendingGestures.length === 0) return [];
    const g = this.pendingGestures.slice();
    this.pendingGestures.length = 0;
    return g;
  }

  hasActiveTouch(): boolean {
    return this.activeTouches.size > 0;
  }

  private classifyZone(clientX: number): 'left' | 'right' {
    return clientX < window.innerWidth / 2 ? 'left' : 'right';
  }

  // Use arrow functions bound to `this`
  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const now = performance.now();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]!;
      const zone = this.classifyZone(t.clientX);
      this.activeTouches.set(t.identifier, {
        id: t.identifier,
        startX: t.clientX,
        startY: t.clientY,
        currentX: t.clientX,
        currentY: t.clientY,
        startTime: now,
        zone,
      });
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]!;
      const active = this.activeTouches.get(t.identifier);
      if (active) {
        active.currentX = t.clientX;
        active.currentY = t.clientY;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    const now = performance.now();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]!;
      const active = this.activeTouches.get(t.identifier);
      if (!active) continue;

      this.activeTouches.delete(t.identifier);

      if (active.zone === 'right') {
        this.classifyRightGesture(active, now);
      }
    }
  };

  private classifyRightGesture(touch: ActiveTouch, now: number): void {
    const dx = touch.currentX - touch.startX;
    const dy = touch.currentY - touch.startY;
    const duration = now - touch.startTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Swipe detection: fast enough and far enough
    if (duration < SWIPE_TIME_MAX && absDy > SWIPE_THRESHOLD && absDy > absDx) {
      if (dy > 0) {
        this.pendingGestures.push(GestureType.SWIPE_DOWN);
        return;
      } else {
        this.pendingGestures.push(GestureType.SWIPE_UP);
        return;
      }
    }

    // Double-tap detection (short tap)
    if (duration < HOLD_MIN_TIME && absDx < 20 && absDy < 20) {
      if (now - this.lastRightTapTime < DOUBLE_TAP_WINDOW) {
        this.pendingGestures.push(GestureType.DOUBLE_TAP);
        this.lastRightTapTime = 0;
      } else {
        this.lastRightTapTime = now;
      }
    }
  }
}
