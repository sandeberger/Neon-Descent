import { GameLoop } from '@core/GameLoop';
import { StateMachine } from '@core/StateMachine';
import { InputManager } from '@input/InputManager';
import { AudioSystem } from '@audio/AudioSystem';
import { CANVAS_W, CANVAS_H } from '@core/Constants';
import { BootState } from '@states/BootState';
import { MenuState } from '@states/MenuState';
import { PlayingState } from '@states/PlayingState';
import { DeadState } from '@states/DeadState';
import { PausedState } from '@states/PausedState';
import { MetaShopState } from '@states/MetaShopState';
import { LoadoutState } from '@states/LoadoutState';
import { RunShopState } from '@states/RunShopState';
import { MetaProgression } from '@meta/MetaProgression';
import { SaveManager, type RunState } from '@save/SaveManager';
import { InstallPrompt } from '@ui/InstallPrompt';
import { AnalyticsManager } from '@analytics/AnalyticsManager';
import { AchievementSystem } from '@systems/AchievementSystem';
import { LeaderboardSystem } from '@systems/LeaderboardSystem';

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly states: StateMachine;
  readonly input: InputManager;
  readonly audio: AudioSystem;
  readonly loop: GameLoop;
  readonly meta: MetaProgression;
  readonly save: SaveManager;
  readonly installPrompt: InstallPrompt;
  readonly analytics: AnalyticsManager;
  readonly achievements: AchievementSystem;
  readonly leaderboard: LeaderboardSystem;

  canvasScale = 1;

  // Pass data between states
  lastRunScore = 0;
  lastRunDepth = 0;
  lastRunCombo = 0;
  lastRunMaxCombo = 0;
  lastRunCurrency = 0;
  lastRunShardsEarned = 0;
  lastRunWasBestScore = false;
  lastRunWasBestDepth = false;

  // Daily run flags
  pendingDailyRun = false;
  lastRunWasDaily = false;

  // Saved run resume
  pendingRunState: RunState | null = null;

  // Loadout selections (set by LoadoutState, read by PlayingState)
  pendingLoadoutWeapon: string | null = null;
  pendingLoadoutPerk: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.states = new StateMachine();
    this.input = new InputManager();
    this.audio = new AudioSystem();
    this.meta = new MetaProgression();
    this.save = new SaveManager();
    this.installPrompt = new InstallPrompt();
    this.installPrompt.init();
    this.analytics = new AnalyticsManager();
    this.achievements = new AchievementSystem();
    this.leaderboard = new LeaderboardSystem();
    this.loop = new GameLoop(
      (dt) => this.states.fixedUpdate(dt),
      (alpha) => this.states.render(alpha),
    );

    this.setupCanvas();
    this.registerStates();

    // Handle resize
    window.addEventListener('resize', () => this.setupCanvas());

    // Handle visibility change (pause/resume + auto-save + analytics quit tracking)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.loop.stop();
        this.audio.suspend();
        // Auto-save if playing
        const playing = (this.states as any).states?.get('PLAYING') as any;
        if (this.states.currentName === 'PLAYING' && playing?.world) {
          this.save.saveRun(playing.world.serialize());
          // Track quit point
          this.analytics.track('quit_point', {
            depth: playing.world.scoring.depth,
            score: playing.world.scoring.score,
          });
          this.analytics.flush();
        }
      } else {
        this.audio.resume();
        this.loop.start();
      }
    });
  }

  private setupCanvas(): void {
    const container = this.canvas.parentElement!;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const aspect = CANVAS_W / CANVAS_H;
    let drawW: number;
    let drawH: number;

    if (containerW / containerH < aspect) {
      drawW = containerW;
      drawH = containerW / aspect;
    } else {
      drawH = containerH;
      drawW = containerH * aspect;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    this.canvas.width = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    this.canvas.style.width = `${drawW}px`;
    this.canvas.style.height = `${drawH}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.canvasScale = drawW / CANVAS_W;
    this.input.updateScale(this.canvasScale);
  }

  private registerStates(): void {
    this.states.register(new BootState(this));
    this.states.register(new MenuState(this));
    this.states.register(new PlayingState(this));
    this.states.register(new DeadState(this));
    this.states.register(new PausedState(this));
    this.states.register(new RunShopState(this));
    this.states.register(new LoadoutState(this));
    this.states.register(new MetaShopState(this, this.meta));
  }

  async start(): Promise<void> {
    await this.save.init();
    await this.meta.init(this.save.db!);
    this.analytics.init(this.save.db!);
    await this.leaderboard.init(this.save.db!);
    this.pendingRunState = await this.save.loadRun();
    this.states.transition('BOOT');
    this.loop.start();
  }
}
