import { CANVAS_W, CANVAS_H } from '@core/Constants';
export class MenuState {
    constructor(game) {
        this.game = game;
        this.name = 'MENU';
        this.pulsePhase = 0;
        this.touchStarted = 'none';
        this.hasSavedRun = false;
    }
    onEnter() {
        this.pulsePhase = 0;
        this.touchStarted = 'none';
        this.hasSavedRun = this.game.pendingRunState !== null;
        // Listen for tap/click to start
        const handler = (e) => {
            e.preventDefault();
            // Unlock audio on first user gesture (required by mobile browsers)
            this.game.audio.unlock();
            this.game.audio.playMenuSelect();
            const touch = e instanceof TouchEvent ? e.touches[0] || e.changedTouches[0] : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const y = (touch.clientY - rect.top) / scale;
            if (this.hasSavedRun) {
                const continueY = CANVAS_H / 2 + 60;
                const newRunY = CANVAS_H / 2 + 100;
                const dailyY = CANVAS_H / 2 + 135;
                if (y >= continueY - 15 && y <= continueY + 15) {
                    this.touchStarted = 'continue';
                }
                else if (y >= newRunY - 15 && y <= newRunY + 15) {
                    this.touchStarted = 'new';
                }
                else if (y >= dailyY - 15 && y <= dailyY + 15) {
                    this.touchStarted = 'daily';
                }
            }
            else {
                const dailyY = CANVAS_H / 2 + 115;
                if (y >= dailyY - 15 && y <= dailyY + 15) {
                    this.touchStarted = 'daily';
                }
                else {
                    this.touchStarted = 'new';
                }
            }
            if (this.touchStarted !== 'none') {
                this.game.canvas.removeEventListener('touchstart', handler);
                this.game.canvas.removeEventListener('mousedown', handler);
            }
        };
        this.game.canvas.addEventListener('touchstart', handler, { passive: false });
        this.game.canvas.addEventListener('mousedown', handler);
        // Keyboard
        const keyHandler = (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                this.game.audio.unlock();
                this.game.audio.playMenuSelect();
                // Default to continue if saved run exists, otherwise new
                this.touchStarted = this.hasSavedRun ? 'continue' : 'new';
                window.removeEventListener('keydown', keyHandler);
            }
            else if (e.code === 'KeyN' && this.hasSavedRun) {
                this.game.audio.unlock();
                this.game.audio.playMenuSelect();
                this.touchStarted = 'new';
                window.removeEventListener('keydown', keyHandler);
            }
            else if (e.code === 'KeyD') {
                this.game.audio.unlock();
                this.game.audio.playMenuSelect();
                this.touchStarted = 'daily';
                window.removeEventListener('keydown', keyHandler);
            }
        };
        window.addEventListener('keydown', keyHandler);
    }
    onExit() { }
    fixedUpdate(dt) {
        this.pulsePhase += dt * 3;
        if (this.touchStarted === 'continue') {
            // pendingRunState already set in Game.start()
            this.game.states.transition('PLAYING');
        }
        else if (this.touchStarted === 'new') {
            this.game.pendingRunState = null;
            this.game.save.clearRun();
            this.game.states.transition('PLAYING');
        }
        else if (this.touchStarted === 'daily') {
            this.game.pendingRunState = null;
            this.game.save.clearRun();
            this.game.pendingDailyRun = true;
            this.game.states.transition('PLAYING');
        }
    }
    render(_alpha) {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Animated background lines
        ctx.strokeStyle = '#111122';
        ctx.lineWidth = 1;
        const time = this.pulsePhase;
        for (let y = 0; y < CANVAS_H; y += 30) {
            const offset = Math.sin(time + y * 0.01) * 10;
            ctx.beginPath();
            ctx.moveTo(offset, y);
            ctx.lineTo(CANVAS_W + offset, y);
            ctx.stroke();
        }
        // Title
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#44ddff';
        ctx.shadowBlur = 20;
        ctx.fillText('NEON', CANVAS_W / 2, CANVAS_H / 2 - 60);
        ctx.fillText('DESCENT', CANVAS_W / 2, CANVAS_H / 2 - 24);
        ctx.shadowBlur = 0;
        // Subtitle
        ctx.fillStyle = '#667788';
        ctx.font = '11px monospace';
        ctx.fillText('VERTICAL ACTION ROGUELITE', CANVAS_W / 2, CANVAS_H / 2 + 10);
        // Best stats
        const meta = this.game.meta;
        if (meta.totalRuns > 0) {
            ctx.fillStyle = '#445566';
            ctx.font = '10px monospace';
            ctx.fillText(`BEST: ${Math.floor(meta.bestScore).toLocaleString()}  |  ${Math.floor(meta.bestDepth / 10)}m  |  SHARDS: ${meta.shards}`, CANVAS_W / 2, CANVAS_H / 2 + 35);
        }
        if (this.hasSavedRun) {
            // CONTINUE button
            const pulse = 0.5 + Math.sin(this.pulsePhase * 2) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#44ff88';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('CONTINUE', CANVAS_W / 2, CANVAS_H / 2 + 64);
            ctx.globalAlpha = 1;
            // NEW RUN button
            ctx.fillStyle = '#888899';
            ctx.font = '13px monospace';
            ctx.fillText('NEW RUN', CANVAS_W / 2, CANVAS_H / 2 + 100);
            // DAILY RUN button
            ctx.fillStyle = '#ffaa22';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('DAILY RUN', CANVAS_W / 2, CANVAS_H / 2 + 135);
        }
        else {
            // Pulsing "TAP TO START"
            const pulse = 0.5 + Math.sin(this.pulsePhase * 2) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('TAP TO START', CANVAS_W / 2, CANVAS_H / 2 + 80);
            ctx.globalAlpha = 1;
            // DAILY RUN button
            ctx.fillStyle = '#ffaa22';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('DAILY RUN', CANVAS_W / 2, CANVAS_H / 2 + 115);
        }
        // Daily best score
        if (meta.dailyDate && meta.dailyBestScore > 0) {
            ctx.fillStyle = '#886622';
            ctx.font = '9px monospace';
            const dailyY = this.hasSavedRun ? CANVAS_H / 2 + 150 : CANVAS_H / 2 + 132;
            ctx.fillText(`TODAY'S BEST: ${Math.floor(meta.dailyBestScore).toLocaleString()}`, CANVAS_W / 2, dailyY);
        }
        // Controls hint
        ctx.fillStyle = '#445566';
        ctx.font = '9px monospace';
        ctx.fillText('LEFT SIDE: MOVE  |  RIGHT SIDE: FIRE', CANVAS_W / 2, CANVAS_H - 50);
        ctx.fillText('SWIPE DOWN: STOMP  |  SWIPE UP: DASH', CANVAS_W / 2, CANVAS_H - 36);
        // Version
        ctx.fillStyle = '#333344';
        ctx.font = '8px monospace';
        ctx.fillText('v0.3.0', CANVAS_W / 2, CANVAS_H - 12);
    }
}
