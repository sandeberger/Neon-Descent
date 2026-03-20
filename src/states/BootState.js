import { CANVAS_W, CANVAS_H } from '@core/Constants';
export class BootState {
    constructor(game) {
        this.game = game;
        this.name = 'BOOT';
        this.progress = 0;
        this.done = false;
    }
    onEnter() {
        // Simulate asset loading (real loading would go here)
        this.progress = 0;
        this.done = false;
        // In prototype, we have no real assets to load
        // Simulate a short load for feel
        const step = () => {
            this.progress += 0.05;
            if (this.progress >= 1) {
                this.done = true;
            }
            else {
                setTimeout(step, 16);
            }
        };
        step();
    }
    onExit() { }
    fixedUpdate(_dt) {
        if (this.done) {
            this.game.states.transition('MENU');
        }
    }
    render(_alpha) {
        const ctx = this.game.ctx;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Title
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON DESCENT', CANVAS_W / 2, CANVAS_H / 2 - 40);
        // Loading bar
        const barW = 160;
        const barH = 6;
        const barX = CANVAS_W / 2 - barW / 2;
        const barY = CANVAS_H / 2;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#44ddff';
        ctx.fillRect(barX, barY, barW * this.progress, barH);
        ctx.fillStyle = '#667788';
        ctx.font = '10px monospace';
        ctx.fillText('LOADING...', CANVAS_W / 2, barY + 24);
    }
}
