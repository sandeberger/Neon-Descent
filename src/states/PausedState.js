import { CANVAS_W, CANVAS_H } from '@core/Constants';
export class PausedState {
    constructor(game) {
        this.game = game;
        this.name = 'PAUSED';
        this.selectedIndex = 0;
        this.options = ['RESUME', 'SETTINGS', 'QUIT TO MENU'];
        this.inputCooldown = 0;
        this.view = 'main';
        // Accessibility settings page
        this.settingsOptions = [
            { key: 'vibration', label: 'VIBRATION' },
            { key: 'reducedScreenShake', label: 'REDUCED SHAKE' },
            { key: 'reducedFlash', label: 'REDUCED FLASH' },
            { key: 'largerUI', label: 'LARGER UI' },
        ];
        // Store last rendered frame from PlayingState
        this.frameSnapshot = null;
    }
    /** Call before transitioning to capture the current frame */
    captureFrame() {
        this.frameSnapshot = this.game.ctx.getImageData(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    onEnter() {
        this.selectedIndex = 0;
        this.view = 'main';
        this.inputCooldown = 0.2;
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
            if (this.view === 'main') {
                const optionY = CANVAS_H / 2 + 10;
                for (let i = 0; i < this.options.length; i++) {
                    const oy = optionY + i * 45;
                    if (Math.abs(y - oy) < 20) {
                        this.selectOption(i);
                        return;
                    }
                }
            }
            else if (this.view === 'accessibility') {
                const baseY = 200;
                // Back button
                if (y > CANVAS_H - 60 && y < CANVAS_H - 20) {
                    this.view = 'main';
                    this.selectedIndex = 1;
                    return;
                }
                // Toggle settings
                for (let i = 0; i < this.settingsOptions.length; i++) {
                    const sy = baseY + i * 42;
                    if (Math.abs(y - sy) < 18) {
                        this.game.accessibility.toggle(this.settingsOptions[i].key);
                        return;
                    }
                }
            }
        };
        const handleKey = (e) => {
            if (this.inputCooldown > 0)
                return;
            if (this.view === 'accessibility') {
                if (e.code === 'Escape' || e.code === 'Backspace') {
                    this.view = 'main';
                    this.selectedIndex = 1;
                    return;
                }
                if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                }
                if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    this.selectedIndex = Math.min(this.settingsOptions.length - 1, this.selectedIndex + 1);
                }
                if (e.code === 'Enter' || e.code === 'Space') {
                    this.game.accessibility.toggle(this.settingsOptions[this.selectedIndex].key);
                }
                return;
            }
            if (e.code === 'Escape') {
                this.selectOption(0);
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
            this.game.states.transition('PLAYING');
        }
        else if (index === 1) {
            this.view = 'accessibility';
            this.selectedIndex = 0;
        }
        else {
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
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        // Dark overlay
        ctx.fillStyle = 'rgba(5, 5, 15, 0.80)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        if (this.view === 'accessibility') {
            this.renderSettingsPage(ctx);
            return;
        }
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
    renderSettingsPage(ctx) {
        // Title
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ACCESSIBILITY', CANVAS_W / 2, 140);
        // Settings toggles
        const baseY = 200;
        const config = this.game.accessibility.config;
        for (let i = 0; i < this.settingsOptions.length; i++) {
            const opt = this.settingsOptions[i];
            const y = baseY + i * 42;
            const selected = i === this.selectedIndex;
            const value = config[opt.key];
            const isOn = typeof value === 'boolean' ? value : false;
            // Selection highlight
            if (selected) {
                ctx.fillStyle = '#44ddff';
                ctx.globalAlpha = 0.12;
                ctx.fillRect(20, y - 14, CANVAS_W - 40, 28);
                ctx.globalAlpha = 1;
            }
            // Label
            ctx.fillStyle = selected ? '#ffffff' : '#889999';
            ctx.font = selected ? 'bold 13px monospace' : '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(opt.label, 40, y + 4);
            // Toggle indicator
            ctx.textAlign = 'right';
            ctx.fillStyle = isOn ? '#44ff88' : '#ff4466';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(isOn ? 'ON' : 'OFF', CANVAS_W - 40, y + 4);
        }
        // Back button
        ctx.textAlign = 'center';
        ctx.fillStyle = '#667788';
        ctx.font = '12px monospace';
        ctx.fillText('TAP HERE OR ESC TO GO BACK', CANVAS_W / 2, CANVAS_H - 40);
    }
}
