import { CANVAS_W, CANVAS_H } from '@core/Constants';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class InstallPrompt {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private dismissed = false;
  private showTimer = 0;
  private visible = false;
  private fadeIn = 0;

  init(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });
  }

  /** Check if we should show the install nudge (after 3+ completed runs) */
  shouldShow(totalRuns: number): boolean {
    return (
      !this.dismissed &&
      !this.visible &&
      this.deferredPrompt !== null &&
      totalRuns >= 3
    );
  }

  show(): void {
    if (!this.deferredPrompt) return;
    this.visible = true;
    this.fadeIn = 0;
    this.showTimer = 8; // auto-dismiss after 8 seconds
  }

  hide(): void {
    this.visible = false;
    this.dismissed = true;
  }

  async triggerInstall(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.visible = false;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.dismissed = true;
    }
    this.deferredPrompt = null;
  }

  update(dt: number): void {
    if (!this.visible) return;
    if (this.fadeIn < 1) this.fadeIn += dt * 3;
    this.showTimer -= dt;
    if (this.showTimer <= 0) {
      this.hide();
    }
  }

  get isVisible(): boolean {
    return this.visible;
  }

  /** Handle touch/click — returns 'install' | 'dismiss' | null */
  handleInput(x: number, y: number): 'install' | 'dismiss' | null {
    if (!this.visible) return null;

    const bannerY = CANVAS_H - 80;
    if (y < bannerY || y > CANVAS_H - 20) return null;

    // Install button (left half)
    if (x < CANVAS_W / 2) {
      return 'install';
    }
    // Dismiss button (right half)
    return 'dismiss';
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const fade = Math.min(1, this.fadeIn);
    const bannerY = CANVAS_H - 80;
    const bannerH = 60;

    // Background
    ctx.globalAlpha = 0.95 * fade;
    ctx.fillStyle = '#0c0c20';
    ctx.fillRect(0, bannerY, CANVAS_W, bannerH);

    // Top border accent
    ctx.fillStyle = '#44ddff';
    ctx.fillRect(0, bannerY, CANVAS_W, 2);

    ctx.globalAlpha = fade;

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Install NEON DESCENT?', CANVAS_W / 2, bannerY + 18);

    ctx.fillStyle = '#667788';
    ctx.font = '9px monospace';
    ctx.fillText('Play offline, fullscreen, no browser UI', CANVAS_W / 2, bannerY + 32);

    // Install button
    const btnW = 80;
    const btnH = 22;
    const installX = CANVAS_W / 2 - btnW - 8;
    const btnY = bannerY + 38;

    ctx.fillStyle = '#44ddff';
    ctx.fillRect(installX, btnY, btnW, btnH);
    ctx.fillStyle = '#0a0a1a';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('INSTALL', installX + btnW / 2, btnY + 15);

    // Dismiss button
    const dismissX = CANVAS_W / 2 + 8;
    ctx.fillStyle = '#222244';
    ctx.fillRect(dismissX, btnY, btnW, btnH);
    ctx.fillStyle = '#667788';
    ctx.fillText('NOT NOW', dismissX + btnW / 2, btnY + 15);

    ctx.globalAlpha = 1;
  }
}
