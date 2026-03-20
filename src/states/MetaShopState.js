import { META_UPGRADES } from '@meta/MetaProgression';
import { CANVAS_W, CANVAS_H } from '@core/Constants';
export class MetaShopState {
    constructor(game, meta) {
        this.game = game;
        this.meta = meta;
        this.name = 'META_SHOP';
        this.selectedIndex = 0;
        this.feedbackText = '';
        this.feedbackTimer = 0;
        this.pulsePhase = 0;
    }
    onEnter() {
        this.selectedIndex = 0;
        this.feedbackText = '';
        this.feedbackTimer = 0;
        this.pulsePhase = 0;
        const handleTouch = (e) => {
            e.preventDefault();
            const touch = e instanceof TouchEvent ? e.touches[0] || e.changedTouches[0] : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const x = (touch.clientX - rect.left) / scale;
            const y = (touch.clientY - rect.top) / scale;
            // Check upgrade items
            const startY = 110;
            for (let i = 0; i < META_UPGRADES.length; i++) {
                const iy = startY + i * 70;
                if (y >= iy - 10 && y <= iy + 50) {
                    this.selectedIndex = i;
                    // Check if tap was on buy button area (right side)
                    if (x > CANVAS_W / 2 + 40) {
                        this.tryPurchase(META_UPGRADES[i]);
                    }
                    return;
                }
            }
            // Check "START RUN" button
            const btnY = CANVAS_H - 70;
            if (y >= btnY - 15 && y <= btnY + 15) {
                this.game.states.transition('PLAYING');
            }
        };
        const handleKey = (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.selectedIndex = Math.min(META_UPGRADES.length - 1, this.selectedIndex + 1);
            }
            if (e.code === 'Enter' || e.code === 'Space') {
                this.tryPurchase(META_UPGRADES[this.selectedIndex]);
            }
            if (e.code === 'Escape') {
                this.game.states.transition('PLAYING');
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
        if (key)
            window.removeEventListener('keydown', key);
    }
    tryPurchase(upgrade) {
        if (this.meta.isMaxed(upgrade)) {
            this.showFeedback('MAX LEVEL');
            return;
        }
        if (!this.meta.canAfford(upgrade)) {
            this.showFeedback('NOT ENOUGH SHARDS');
            return;
        }
        this.meta.purchaseUpgrade(upgrade);
        this.showFeedback('UPGRADED!');
    }
    showFeedback(text) {
        this.feedbackText = text;
        this.feedbackTimer = 1.5;
    }
    fixedUpdate(dt) {
        this.pulsePhase += dt * 3;
        if (this.feedbackTimer > 0)
            this.feedbackTimer -= dt;
    }
    render(_alpha) {
        const ctx = this.game.ctx;
        // Background
        ctx.fillStyle = '#060612';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Subtle grid
        ctx.strokeStyle = '#0a0a22';
        ctx.lineWidth = 1;
        for (let y = 0; y < CANVAS_H; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_W, y);
            ctx.stroke();
        }
        // Title
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#44ddff';
        ctx.shadowBlur = 10;
        ctx.fillText('UPGRADE LAB', CANVAS_W / 2, 35);
        ctx.shadowBlur = 0;
        // Shards display
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`SHARDS: ${this.meta.shards}`, CANVAS_W / 2, 65);
        // Stats line
        ctx.fillStyle = '#556677';
        ctx.font = '9px monospace';
        ctx.fillText(`RUNS: ${this.meta.totalRuns}  |  BEST: ${Math.floor(this.meta.bestScore).toLocaleString()}  |  ${Math.floor(this.meta.bestDepth / 10)}m`, CANVAS_W / 2, 85);
        // Upgrade list
        const startY = 110;
        for (let i = 0; i < META_UPGRADES.length; i++) {
            const upgrade = META_UPGRADES[i];
            const y = startY + i * 70;
            const selected = i === this.selectedIndex;
            const level = this.meta.getUpgradeLevel(upgrade.id);
            const maxed = level >= upgrade.maxLevel;
            // Selection bg
            if (selected) {
                ctx.fillStyle = '#44ddff';
                ctx.globalAlpha = 0.08;
                ctx.fillRect(10, y - 8, CANVAS_W - 20, 56);
                ctx.globalAlpha = 1;
            }
            // Name
            ctx.fillStyle = selected ? '#44ddff' : '#8899aa';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(upgrade.name, 20, y + 10);
            // Description
            ctx.fillStyle = '#556677';
            ctx.font = '10px monospace';
            ctx.fillText(upgrade.description, 20, y + 26);
            // Level pips
            for (let l = 0; l < upgrade.maxLevel; l++) {
                ctx.fillStyle = l < level ? '#44ff88' : '#222233';
                ctx.fillRect(20 + l * 14, y + 34, 10, 4);
            }
            // Cost / MAX button
            ctx.textAlign = 'right';
            if (maxed) {
                ctx.fillStyle = '#44ff88';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('MAX', CANVAS_W - 20, y + 18);
            }
            else {
                const cost = upgrade.costs[level];
                const canBuy = this.meta.shards >= cost;
                ctx.fillStyle = canBuy ? '#44ff88' : '#664444';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(`${cost}`, CANVAS_W - 20, y + 12);
                ctx.fillStyle = '#556677';
                ctx.font = '9px monospace';
                ctx.fillText('SHARDS', CANVAS_W - 20, y + 24);
            }
        }
        // Feedback text
        if (this.feedbackTimer > 0) {
            ctx.globalAlpha = Math.min(1, this.feedbackTimer);
            ctx.fillStyle = this.feedbackText === 'UPGRADED!' ? '#44ff88' : '#ff4466';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.feedbackText, CANVAS_W / 2, CANVAS_H - 110);
            ctx.globalAlpha = 1;
        }
        // Start Run button
        const pulse = 0.7 + Math.sin(this.pulsePhase * 2) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('START RUN', CANVAS_W / 2, CANVAS_H - 60);
        ctx.globalAlpha = 1;
        // Back hint
        ctx.fillStyle = '#334455';
        ctx.font = '9px monospace';
        ctx.fillText('ESC TO START RUN', CANVAS_W / 2, CANVAS_H - 20);
    }
}
