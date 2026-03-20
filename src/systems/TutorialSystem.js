import { CANVAS_W, CANVAS_H } from '@core/Constants';
const STEPS = [
    {
        id: 'move',
        text: 'TOUCH LEFT / RIGHT TO MOVE',
        subtext: 'or use ARROW KEYS',
        triggerDepth: 0,
        dismissOnAction: 'move',
        duration: 5,
    },
    {
        id: 'fire',
        text: 'HOLD RIGHT SIDE TO FIRE',
        subtext: 'or hold SPACE',
        triggerDepth: 100,
        dismissOnAction: 'fire',
        duration: 5,
    },
    {
        id: 'stomp',
        text: 'SWIPE DOWN TO STOMP',
        subtext: 'slam down on enemies!  (S key)',
        triggerDepth: 300,
        dismissOnAction: 'stomp',
        duration: 6,
    },
    {
        id: 'dash',
        text: 'SWIPE UP TO DASH',
        subtext: 'burst upward to dodge  (W key)',
        triggerDepth: 600,
        dismissOnAction: 'dash',
        duration: 6,
    },
    {
        id: 'combo',
        text: 'CHAIN KILLS FOR COMBOS',
        subtext: 'higher combo = more points',
        triggerDepth: 1200,
        duration: 4,
    },
];
export class TutorialSystem {
    constructor(events, isFirstRun) {
        this.currentStepIndex = 0;
        this.showTimer = 0;
        this.fadeTimer = 0;
        this.dismissed = false;
        this.active = false;
        this.completedActions = new Set();
        this.depth = 0;
        // Animation
        this.FADE_IN = 0.4;
        this.FADE_OUT = 0.3;
        this.steps = [...STEPS];
        if (!isFirstRun) {
            // Skip tutorial for experienced players
            this.dismissed = true;
            return;
        }
        this.active = true;
        events.on('depth:update', (d) => {
            this.depth = d.depth;
        });
        // Track actions for dismissal
        events.on('player:stomp', () => this.completedActions.add('stomp'));
        events.on('player:dash', () => this.completedActions.add('dash'));
        events.on('weapon:fire', () => this.completedActions.add('fire'));
    }
    /** Call each frame from PlayingState with input moveX */
    notifyMove(moveX) {
        if (Math.abs(moveX) > 0.3)
            this.completedActions.add('move');
    }
    update(dt) {
        if (this.dismissed || !this.active)
            return;
        if (this.currentStepIndex >= this.steps.length) {
            this.active = false;
            return;
        }
        const step = this.steps[this.currentStepIndex];
        // Wait for trigger depth
        if (this.depth < step.triggerDepth)
            return;
        this.showTimer += dt;
        // Check dismiss condition
        if (step.dismissOnAction && this.completedActions.has(step.dismissOnAction)) {
            this.advance();
            return;
        }
        // Check timeout
        if (this.showTimer >= step.duration) {
            this.advance();
        }
    }
    advance() {
        this.fadeTimer = this.FADE_OUT;
        this.currentStepIndex++;
        this.showTimer = 0;
    }
    render(ctx) {
        if (this.dismissed || !this.active) {
            // Render fade-out of last step
            if (this.fadeTimer > 0) {
                this.fadeTimer -= 1 / 60;
                this.renderHint(ctx, this.steps[this.currentStepIndex - 1], this.fadeTimer / this.FADE_OUT);
            }
            return;
        }
        if (this.currentStepIndex >= this.steps.length)
            return;
        const step = this.steps[this.currentStepIndex];
        if (this.depth < step.triggerDepth)
            return;
        // Fade in/out
        let alpha = 1;
        if (this.showTimer < this.FADE_IN) {
            alpha = this.showTimer / this.FADE_IN;
        }
        if (this.showTimer > step.duration - this.FADE_OUT) {
            alpha = Math.max(0, (step.duration - this.showTimer) / this.FADE_OUT);
        }
        this.renderHint(ctx, step, alpha);
    }
    renderHint(ctx, step, alpha) {
        if (!step || alpha <= 0)
            return;
        const y = CANVAS_H * 0.38;
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        // Background pill
        ctx.fillStyle = '#0a0a1a';
        const textW = 280;
        ctx.fillRect(CANVAS_W / 2 - textW / 2, y - 16, textW, 42);
        ctx.strokeStyle = '#44ddff';
        ctx.lineWidth = 1;
        ctx.strokeRect(CANVAS_W / 2 - textW / 2, y - 16, textW, 42);
        ctx.globalAlpha = alpha;
        // Main text
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(step.text, CANVAS_W / 2, y + 2);
        // Sub text
        ctx.fillStyle = '#667788';
        ctx.font = '10px monospace';
        ctx.fillText(step.subtext, CANVAS_W / 2, y + 18);
        ctx.restore();
    }
    get isActive() {
        return this.active && !this.dismissed;
    }
}
