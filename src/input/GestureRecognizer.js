import { SWIPE_THRESHOLD, SWIPE_TIME_MAX, DOUBLE_TAP_WINDOW, HOLD_MIN_TIME, MOVE_DEFLECTION, } from '@core/Constants';
import { GestureType } from './InputTypes';
export class GestureRecognizer {
    constructor() {
        this.activeTouches = new Map();
        this.pendingGestures = [];
        this.lastRightTapTime = 0;
        // Use arrow functions bound to `this`
        this.onTouchStart = (e) => {
            e.preventDefault();
            const now = performance.now();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
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
        this.onTouchMove = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const active = this.activeTouches.get(t.identifier);
                if (active) {
                    active.currentX = t.clientX;
                    active.currentY = t.clientY;
                }
            }
        };
        this.onTouchEnd = (e) => {
            e.preventDefault();
            const now = performance.now();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const active = this.activeTouches.get(t.identifier);
                if (!active)
                    continue;
                this.activeTouches.delete(t.identifier);
                if (active.zone === 'right') {
                    this.classifyRightGesture(active, now);
                }
            }
        };
    }
    /** Attach to the canvas element */
    bind(el) {
        el.addEventListener('touchstart', this.onTouchStart, { passive: false });
        el.addEventListener('touchmove', this.onTouchMove, { passive: false });
        el.addEventListener('touchend', this.onTouchEnd, { passive: false });
        el.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
    }
    unbind(el) {
        el.removeEventListener('touchstart', this.onTouchStart);
        el.removeEventListener('touchmove', this.onTouchMove);
        el.removeEventListener('touchend', this.onTouchEnd);
        el.removeEventListener('touchcancel', this.onTouchEnd);
    }
    /** Normalized horizontal movement from left-zone drag: -1 to 1 */
    getMoveX(canvasScale) {
        for (const t of this.activeTouches.values()) {
            if (t.zone === 'left') {
                const dx = (t.currentX - t.startX) / canvasScale;
                return Math.max(-1, Math.min(1, dx / MOVE_DEFLECTION));
            }
        }
        return 0;
    }
    /** Whether right-zone is being held (fire) */
    isHolding() {
        const now = performance.now();
        for (const t of this.activeTouches.values()) {
            if (t.zone === 'right' && now - t.startTime > HOLD_MIN_TIME) {
                return true;
            }
        }
        return false;
    }
    /** Drain pending gesture queue */
    consumeGestures() {
        if (this.pendingGestures.length === 0)
            return [];
        const g = this.pendingGestures.slice();
        this.pendingGestures.length = 0;
        return g;
    }
    hasActiveTouch() {
        return this.activeTouches.size > 0;
    }
    classifyZone(clientX) {
        return clientX < window.innerWidth / 2 ? 'left' : 'right';
    }
    classifyRightGesture(touch, now) {
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
            }
            else {
                this.pendingGestures.push(GestureType.SWIPE_UP);
                return;
            }
        }
        // Double-tap detection (short tap)
        if (duration < HOLD_MIN_TIME && absDx < 20 && absDy < 20) {
            if (now - this.lastRightTapTime < DOUBLE_TAP_WINDOW) {
                this.pendingGestures.push(GestureType.DOUBLE_TAP);
                this.lastRightTapTime = 0;
            }
            else {
                this.lastRightTapTime = now;
            }
        }
    }
}
