import type { GameState } from '@core/StateMachine';
import type { Game } from '../Game';
import { CANVAS_W, CANVAS_H } from '@core/Constants';

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, t);
}

export class DeadState implements GameState {
  readonly name = 'DEAD';
  private timer = 0;
  private canAct = false;
  private actionQueued: 'retry' | 'shop' | null = null;

  // Animation state: 5 stats staggered 0.3s apart
  private statTimers: number[] = [0, 0, 0, 0, 0];
  private readonly STAT_STAGGER = 0.3;
  private readonly STAT_ANIM_DURATION = 0.6;

  constructor(private game: Game) {}

  onEnter(): void {
    this.timer = 0;
    this.canAct = false;
    this.actionQueued = null;
    this.statTimers = [0, 0, 0, 0, 0];

    // Show install prompt after 3+ runs
    const prompt = this.game.installPrompt;
    if (prompt.shouldShow(this.game.meta.totalRuns)) {
      prompt.show();
    }

    const handleTouch = (e: Event) => {
      e.preventDefault();
      if (!this.canAct) return;

      const touch = e instanceof TouchEvent ? e.touches[0] || e.changedTouches[0] : e as MouseEvent;
      if (!touch) return;

      const rect = this.game.canvas.getBoundingClientRect();
      const scale = this.game.canvasScale;
      const x = ((touch as any).clientX - rect.left) / scale;
      const y = ((touch as any).clientY - rect.top) / scale;

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

      // Retry button zone (centered, around y=490)
      if (y >= 460 && y <= 520) {
        this.actionQueued = 'retry';
      } else if (y > 530) {
        this.actionQueued = 'shop';
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (!this.canAct) return;
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
      (this as any)._cleanupTouch = handleTouch;
      (this as any)._cleanupKey = keyHandler;
    }, 500);
  }

  onExit(): void {
    const touch = (this as any)._cleanupTouch;
    const key = (this as any)._cleanupKey;
    if (touch) {
      this.game.canvas.removeEventListener('touchstart', touch);
      this.game.canvas.removeEventListener('mousedown', touch);
    }
    if (key) window.removeEventListener('keydown', key);
  }

  fixedUpdate(dt: number): void {
    this.timer += dt;
    if (this.timer > 1.2) this.canAct = true;

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
    } else if (this.actionQueued === 'shop') {
      this.game.states.transition('META_SHOP');
    }
  }

  render(_alpha: number): void {
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
    ctx.fillText(headerText, CANVAS_W / 2, 80);
    ctx.shadowBlur = 0;

    // Stats area — staggered slide-up + fade-in with count-up
    const score = this.game.lastRunScore;
    const depth = Math.floor(this.game.lastRunDepth / 10);
    const maxCombo = this.game.lastRunMaxCombo;
    const shards = this.game.lastRunShardsEarned;
    const isBestScore = this.game.lastRunWasBestScore;
    const isBestDepth = this.game.lastRunWasBestDepth;

    const baseY = 140;
    const statGap = 58;

    // Stat 0: SCORE
    this.renderStat(ctx, 0, baseY, 'SCORE',
      Math.floor(lerp(0, score, this.statTimers[0]!)).toLocaleString(),
      isBestScore, '#ffffff');

    // Stat 1: DEPTH
    this.renderStat(ctx, 1, baseY + statGap, 'DEPTH',
      `${Math.floor(lerp(0, depth, this.statTimers[1]!))}m`,
      isBestDepth, '#aaaacc');

    // Stat 2: MAX COMBO
    this.renderStat(ctx, 2, baseY + statGap * 2, 'MAX COMBO',
      `x${Math.floor(lerp(0, maxCombo, this.statTimers[2]!))}`,
      false, '#44ffff');

    // Stat 3: SHARDS
    this.renderStat(ctx, 3, baseY + statGap * 3, 'SHARDS EARNED',
      `+${Math.floor(lerp(0, shards, this.statTimers[3]!))}`,
      false, '#44ff88');

    // Stat 4: TOTAL SHARDS
    if (this.statTimers[4]! > 0) {
      const t = this.statTimers[4]!;
      const ease = easeOutBack(t);
      const offsetY = (1 - ease) * 20;
      ctx.globalAlpha = t;
      ctx.fillStyle = '#556677';
      ctx.font = '10px monospace';
      ctx.fillText(`TOTAL: ${this.game.meta.shards}`, CANVAS_W / 2, baseY + statGap * 4 + offsetY);
      ctx.globalAlpha = 1;
    }

    // Daily best score
    if (isDaily && this.statTimers[4]! > 0.5) {
      ctx.fillStyle = '#ffaa22';
      ctx.font = '10px monospace';
      ctx.fillText(`DAILY BEST: ${Math.floor(this.game.meta.dailyBestScore).toLocaleString()}`,
        CANVAS_W / 2, baseY + statGap * 4 + 18);
    }

    // Action buttons
    if (this.canAct) {
      const buttonFadeT = Math.min(1, (this.timer - 1.2) / 0.3);

      // Retry button with filled background
      const retryY = 490;
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
        ctx.fillText('UPGRADES', CANVAS_W / 2, 545);

        // Hint
        ctx.fillStyle = '#445566';
        ctx.font = '9px monospace';
        ctx.fillText('TAP BELOW FOR UPGRADES  |  U KEY', CANVAS_W / 2, 568);
        ctx.globalAlpha = 1;
      }
    }

    // Install prompt (overlays on top)
    this.game.installPrompt.render(ctx);
  }

  private renderStat(
    ctx: CanvasRenderingContext2D,
    index: number,
    y: number,
    label: string,
    value: string,
    isBest: boolean,
    valueColor: string,
  ): void {
    const t = this.statTimers[index]!;
    if (t <= 0) return;

    const ease = easeOutBack(t);
    const offsetY = (1 - ease) * 20;

    ctx.globalAlpha = t;

    // Label
    ctx.fillStyle = '#667788';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, CANVAS_W / 2, y + offsetY);

    // Value
    ctx.fillStyle = valueColor;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(value, CANVAS_W / 2, y + 22 + offsetY);

    // NEW BEST badge
    if (isBest && t > 0.5) {
      const bestPulse = 0.6 + Math.sin(this.timer * 6) * 0.4;
      ctx.globalAlpha = bestPulse;
      ctx.fillStyle = '#ffaa22';
      ctx.font = 'bold 10px monospace';
      ctx.shadowColor = '#ffaa22';
      ctx.shadowBlur = 8;
      ctx.fillText('NEW BEST!', CANVAS_W / 2 + 80, y + 18 + offsetY);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  }
}
