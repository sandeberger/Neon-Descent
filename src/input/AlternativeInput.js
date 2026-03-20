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
    constructor() {
        this.enabled = false;
        // Touch tracking
        this.activeTouchId = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.currentTouchX = 0;
        // Output state
        this.moveX = 0;
        this.pendingStomp = false;
        this.pendingDash = false;
        this.SWIPE_THRESHOLD = 35;
        this.SWIPE_MAX_TIME = 400;
        this.onTouchStart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            if (!touch)
                return;
            this.activeTouchId = touch.identifier;
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.currentTouchX = touch.clientX;
        };
        this.onTouchMove = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.activeTouchId) {
                    this.currentTouchX = touch.clientX;
                }
            }
        };
        this.onTouchEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.activeTouchId) {
                    const dt = Date.now() - this.touchStartTime;
                    const dy = touch.clientY - this.touchStartY;
                    const dx = touch.clientX - this.touchStartX;
                    if (dt < this.SWIPE_MAX_TIME) {
                        if (dy > this.SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
                            this.pendingStomp = true;
                        }
                        else if (dy < -this.SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
                            this.pendingDash = true;
                        }
                    }
                    this.activeTouchId = null;
                    this.moveX = 0;
                }
            }
        };
        this.load();
    }
    load() {
        try {
            this.enabled = localStorage.getItem(STORAGE_KEY) === 'true';
        }
        catch { }
    }
    toggle() {
        this.enabled = !this.enabled;
        try {
            localStorage.setItem(STORAGE_KEY, String(this.enabled));
        }
        catch { }
    }
    bind(canvas) {
        canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    }
    unbind(canvas) {
        canvas.removeEventListener('touchstart', this.onTouchStart);
        canvas.removeEventListener('touchmove', this.onTouchMove);
        canvas.removeEventListener('touchend', this.onTouchEnd);
    }
    /** Consume pending gestures (one-shot) */
    consumeStomp() {
        if (this.pendingStomp) {
            this.pendingStomp = false;
            return true;
        }
        return false;
    }
    consumeDash() {
        if (this.pendingDash) {
            this.pendingDash = false;
            return true;
        }
        return false;
    }
    /** Call each frame to get moveX based on which half of screen is touched */
    updateMoveX(_canvasScale, canvasRect) {
        if (this.activeTouchId === null) {
            this.moveX = 0;
            return;
        }
        const screenMid = canvasRect.left + canvasRect.width / 2;
        if (this.currentTouchX < screenMid) {
            this.moveX = -1;
        }
        else {
            this.moveX = 1;
        }
    }
}
