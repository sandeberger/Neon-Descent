import { CANVAS_W, CANVAS_H } from '@core/Constants';
function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function lerp(a, b, t) {
    return a + (b - a) * Math.min(1, t);
}
const DEATH_CAUSE_LABELS = {
    enemy: 'CRUSHED BY ENEMY',
    hazard: 'HIT A HAZARD',
    acid: 'DISSOLVED IN ACID',
    laser: 'CUT BY LASER',
    beam: 'VAPORIZED BY BEAM',
    explosion: 'CAUGHT IN EXPLOSION',
};
export class DeadState {
    constructor(game) {
        this.game = game;
        this.name = 'DEAD';
        this.timer = 0;
        this.canAct = false;
        this.actionQueued = null;
        // Animation state: 7 stats staggered 0.3s apart
        this.statTimers = [0, 0, 0, 0, 0, 0, 0];
        this.STAT_STAGGER = 0.3;
        this.STAT_ANIM_DURATION = 0.6;
    }
    onEnter() {
        this.timer = 0;
        this.canAct = false;
        this.actionQueued = null;
        this.statTimers = [0, 0, 0, 0, 0, 0, 0];
        // Show install prompt after 3+ runs
        const prompt = this.game.installPrompt;
        if (prompt.shouldShow(this.game.meta.totalRuns)) {
            prompt.show();
        }
        const handleTouch = (e) => {
            e.preventDefault();
            if (!this.canAct)
                return;
            const touch = e instanceof TouchEvent ? e.touches[0] || e.changedTouches[0] : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const x = (touch.clientX - rect.left) / scale;
            const y = (touch.clientY - rect.top) / scale;
            // Check install prompt first
            const promptAction = this.game.installPrompt.handleInput(x, y);
            if (promptAction === 'install') {
                this.game.installPrompt.triggerInstall();
                return;
            }
            if (promptAction === 'dismiss') {
                this.game.installPrompt.hide();
                return;
            }
            // Retry button zone (centered, around y=530)
            if (y >= 500 && y <= 560) {
                this.actionQueued = 'retry';
            }
            else if (y > 570) {
                this.actionQueued = 'shop';
            }
        };
        const keyHandler = (e) => {
            if (!this.canAct)
                return;
            if (e.code === 'Space' || e.code === 'Enter') {
                this.actionQueued = 'retry';
            }
            if (e.code === 'KeyU' || e.code === 'Tab') {
                e.preventDefault();
                this.actionQueued = 'shop';
            }
        };
        // Small delay before input allowed
        setTimeout(() => {
            this.game.canvas.addEventListener('touchstart', handleTouch, { passive: false });
            this.game.canvas.addEventListener('mousedown', handleTouch);
            window.addEventListener('keydown', keyHandler);
            // Store for cleanup
            this._cleanupTouch = handleTouch;
            this._cleanupKey = keyHandler;
        }, 500);
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
    fixedUpdate(dt) {
        this.timer += dt;
        if (this.timer > 1.5)
            this.canAct = true;
        // Update staggered stat timers
        for (let i = 0; i < this.statTimers.length; i++) {
            const startTime = 0.3 + i * this.STAT_STAGGER;
            if (this.timer > startTime) {
                this.statTimers[i] = Math.min(1, (this.timer - startTime) / this.STAT_ANIM_DURATION);
            }
        }
        this.game.installPrompt.update(dt);
        if (this.actionQueued === 'retry') {
            this.game.states.transition('PLAYING');
        }
        else if (this.actionQueued === 'shop') {
            this.game.states.transition('META_SHOP');
        }
    }
    render(_alpha) {
        const ctx = this.game.ctx;
        const isDaily = this.game.lastRunWasDaily;
        // Dark overlay
        ctx.fillStyle = 'rgba(10, 10, 26, 0.88)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Header
        const headerColor = isDaily ? '#ffaa22' : '#ff4466';
        const headerText = isDaily ? 'DAILY RUN OVER' : 'DESCENT OVER';
        ctx.fillStyle = headerColor;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = headerColor;
        ctx.shadowBlur = 15;
        ctx.fillText(headerText, CANVAS_W / 2, 60);
        ctx.shadowBlur = 0;
        // Death cause (slot 0)
        const deathCause = this.game.lastRunDeathCause;
        const causeLabel = DEATH_CAUSE_LABELS[deathCause] ?? 'DESCENT ENDED';
        if (this.statTimers[0] > 0) {
            const t = this.statTimers[0];
            const ease = easeOutBack(t);
            const offsetY = (1 - ease) * 15;
            ctx.globalAlpha = t * 0.8;
            ctx.fillStyle = '#ff6677';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(causeLabel, CANVAS_W / 2, 88 + offsetY);
            ctx.globalAlpha = 1;
        }
        // Stats area — staggered slide-up + fade-in with count-up
        const score = this.game.lastRunScore;
        const depth = Math.floor(this.game.lastRunDepth / 10);
        const maxCombo = this.game.lastRunMaxCombo;
        const kills = this.game.lastRunKills;
        const shards = this.game.lastRunShardsEarned;
        const isBestScore = this.game.lastRunWasBestScore;
        const isBestDepth = this.game.lastRunWasBestDepth;
        const baseY = 120;
        const statGap = 48;
        // Stat 1: SCORE
        this.renderStat(ctx, 1, baseY, 'SCORE', Math.floor(lerp(0, score, this.statTimers[1])).toLocaleString(), isBestScore, '#ffffff');
        // Stat 2: DEPTH
        this.renderStat(ctx, 2, baseY + statGap, 'DEPTH', `${Math.floor(lerp(0, depth, this.statTimers[2]))}m`, isBestDepth, '#aaaacc');
        // Stat 3: MAX COMBO
        this.renderStat(ctx, 3, baseY + statGap * 2, 'MAX COMBO', `x${Math.floor(lerp(0, maxCombo, this.statTimers[3]))}`, false, '#44ffff');
        // Stat 4: KILLS
        this.renderStat(ctx, 4, baseY + statGap * 3, 'ENEMIES DEFEATED', `${Math.floor(lerp(0, kills, this.statTimers[4]))}`, false, '#ff8844');
        // Stat 5: SHARDS
        this.renderStat(ctx, 5, baseY + statGap * 4, 'SHARDS EARNED', `+${Math.floor(lerp(0, shards, this.statTimers[5]))}`, false, '#44ff88');
        // Stat 6: TOTAL SHARDS + breakdown
        if (this.statTimers[6] > 0) {
            const t = this.statTimers[6];
            const ease = easeOutBack(t);
            const offsetY = (1 - ease) * 20;
            ctx.globalAlpha = t;
            ctx.fillStyle = '#556677';
            ctx.font = '10px monospace';
            ctx.fillText(`TOTAL: ${this.game.meta.shards}`, CANVAS_W / 2, baseY + statGap * 5 + offsetY);
            // Score breakdown mini-line
            const noDmg = this.game.lastRunNoDamageChunks;
            const elites = this.game.lastRunEliteKills;
            if (noDmg > 0 || elites > 0) {
                ctx.fillStyle = '#445566';
                ctx.font = '9px monospace';
                const parts = [];
                if (noDmg > 0)
                    parts.push(`${noDmg} FLAWLESS`);
                if (elites > 0)
                    parts.push(`${elites} ELITES`);
                ctx.fillText(parts.join('  |  '), CANVAS_W / 2, baseY + statGap * 5 + 14 + offsetY);
            }
            ctx.globalAlpha = 1;
        }
        // Daily best score
        if (isDaily && this.statTimers[6] > 0.5) {
            ctx.fillStyle = '#ffaa22';
            ctx.font = '10px monospace';
            ctx.fillText(`DAILY BEST: ${Math.floor(this.game.meta.dailyBestScore).toLocaleString()}`, CANVAS_W / 2, baseY + statGap * 5 + 30);
        }
        // Action buttons
        if (this.canAct) {
            const buttonFadeT = Math.min(1, (this.timer - 1.5) / 0.3);
            // Retry button with filled background
            const retryY = 530;
            const retryW = 180;
            const retryH = 36;
            const retryScale = easeOutBack(Math.min(1, buttonFadeT * 2));
            ctx.save();
            ctx.translate(CANVAS_W / 2, retryY);
            ctx.scale(retryScale, retryScale);
            // Button background
            ctx.fillStyle = '#112233';
            ctx.fillRect(-retryW / 2, -retryH / 2, retryW, retryH);
            ctx.strokeStyle = '#44ddff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-retryW / 2, -retryH / 2, retryW, retryH);
            const pulse = 0.7 + Math.sin(this.timer * 4) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#44ddff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('TAP TO RETRY', 0, 5);
            ctx.globalAlpha = 1;
            ctx.restore();
            // Upgrades button — fade in after retry
            if (buttonFadeT > 0.5) {
                const shopAlpha = Math.min(1, (buttonFadeT - 0.5) * 2);
                ctx.globalAlpha = shopAlpha;
                ctx.fillStyle = '#44ff88';
                ctx.font = 'bold 13px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('UPGRADES', CANVAS_W / 2, 585);
                // Hint
                ctx.fillStyle = '#445566';
                ctx.font = '9px monospace';
                ctx.fillText('TAP BELOW FOR UPGRADES  |  U KEY', CANVAS_W / 2, 605);
                ctx.globalAlpha = 1;
            }
        }
        // Install prompt (overlays on top)
        this.game.installPrompt.render(ctx);
    }
    renderStat(ctx, index, y, label, value, isBest, valueColor) {
        const t = this.statTimers[index];
        if (t <= 0)
            return;
        const ease = easeOutBack(t);
        const offsetY = (1 - ease) * 20;
        ctx.globalAlpha = t;
        // Label
        ctx.fillStyle = '#667788';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, CANVAS_W / 2, y + offsetY);
        // Value
        ctx.fillStyle = valueColor;
        ctx.font = 'bold 18px monospace';
        ctx.fillText(value, CANVAS_W / 2, y + 20 + offsetY);
        // NEW BEST badge
        if (isBest && t > 0.5) {
            const bestPulse = 0.6 + Math.sin(this.timer * 6) * 0.4;
            ctx.globalAlpha = bestPulse;
            ctx.fillStyle = '#ffaa22';
            ctx.font = 'bold 10px monospace';
            ctx.shadowColor = '#ffaa22';
            ctx.shadowBlur = 8;
            ctx.fillText('NEW BEST!', CANVAS_W / 2 + 80, y + 16 + offsetY);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
    }
}
