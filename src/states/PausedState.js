import { CANVAS_W, CANVAS_H } from '@core/Constants';
export class PausedState {
    constructor(game) {
        this.game = game;
        this.name = 'PAUSED';
        this.selectedIndex = 0;
        this.options = ['RESUME', 'QUIT TO MENU'];
        this.inputCooldown = 0;
        // Store last rendered frame from PlayingState
        this.frameSnapshot = null;
    }
    /** Call before transitioning to capture the current frame */
    captureFrame() {
        this.frameSnapshot = this.game.ctx.getImageData(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    onEnter() {
        this.selectedIndex = 0;
        this.inputCooldown = 0.2; // brief cooldown to prevent instant resume
        const handleTouch = (e) => {
            e.preventDefault();
            if (this.inputCooldown > 0)
                return;
            const touch = e instanceof TouchEvent ? e.touches[0] || e.changedTouches[0] : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const y = (touch.clientY - rect.top) / scale;
            // Check which option was tapped
            const optionY = CANVAS_H / 2 + 10;
            for (let i = 0; i < this.options.length; i++) {
                const oy = optionY + i * 45;
                if (Math.abs(y - oy) < 20) {
                    this.selectOption(i);
                    return;
                }
            }
        };
        const handleKey = (e) => {
            if (this.inputCooldown > 0)
                return;
            if (e.code === 'Escape') {
                this.selectOption(0); // resume
                return;
            }
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
            }
            if (e.code === 'Enter' || e.code === 'Space') {
                this.selectOption(this.selectedIndex);
            }
        };
        this.game.canvas.addEventListener('touchstart', handleTouch, { passive: false });
        this.game.canvas.addEventListener('mousedown', handleTouch);
        window.addEventListener('keydown', handleKey);
        // Store cleanup refs
        this._cleanupTouch = handleTouch;
        this._cleanupKey = handleKey;
    }
    onExit() {
        const touch = this._cleanupTouch;
        const key = this._cleanupKey;
        if (touch) {
            this.game.canvas.removeEventListener('touchstart', touch);
            this.game.canvas.removeEventListener('mousedown', touch);
        }
        if (key) {
            window.removeEventListener('keydown', key);
        }
        this.frameSnapshot = null;
    }
    selectOption(index) {
        if (index === 0) {
            // Resume
            this.game.states.transition('PLAYING');
        }
        else {
            // Quit to menu
            this.game.states.transition('MENU');
        }
    }
    fixedUpdate(dt) {
        if (this.inputCooldown > 0) {
            this.inputCooldown -= dt;
        }
    }
    render(_alpha) {
        const ctx = this.game.ctx;
        // Draw frozen game frame underneath
        if (this.frameSnapshot) {
            ctx.putImageData(this.frameSnapshot, 0, 0);
            // Reset transform after putImageData (it ignores transforms)
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        // Dark overlay
        ctx.fillStyle = 'rgba(5, 5, 15, 0.80)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Title
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#44ddff';
        ctx.shadowBlur = 12;
        ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 50);
        ctx.shadowBlur = 0;
        // Options
        const optionY = CANVAS_H / 2 + 10;
        for (let i = 0; i < this.options.length; i++) {
            const selected = i === this.selectedIndex;
            const y = optionY + i * 45;
            if (selected) {
                // Selection highlight
                ctx.fillStyle = '#44ddff';
                ctx.globalAlpha = 0.15;
                ctx.fillRect(CANVAS_W / 2 - 80, y - 14, 160, 28);
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#44ddff';
                ctx.font = 'bold 16px monospace';
            }
            else {
                ctx.fillStyle = '#667788';
                ctx.font = '14px monospace';
            }
            ctx.fillText(this.options[i], CANVAS_W / 2, y + 5);
        }
        // Controls hint
        ctx.fillStyle = '#334455';
        ctx.font = '9px monospace';
        ctx.fillText('ESC TO RESUME', CANVAS_W / 2, CANVAS_H - 30);
    }
}
