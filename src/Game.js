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
import { SaveManager } from '@save/SaveManager';
import { InstallPrompt } from '@ui/InstallPrompt';
import { AnalyticsManager } from '@analytics/AnalyticsManager';
import { AchievementSystem } from '@systems/AchievementSystem';
import { LeaderboardSystem } from '@systems/LeaderboardSystem';
import { AccessibilitySettings } from '@systems/AccessibilitySettings';
import { CosmeticsSystem } from '@systems/CosmeticsSystem';
import { CodexSystem } from '@systems/CodexSystem';
import { RunModifierSystem } from '@systems/RunModifierSystem';
export class Game {
    constructor(canvas) {
        this.canvasScale = 1;
        // Pass data between states
        this.lastRunScore = 0;
        this.lastRunDepth = 0;
        this.lastRunCombo = 0;
        this.lastRunMaxCombo = 0;
        this.lastRunCurrency = 0;
        this.lastRunShardsEarned = 0;
        this.lastRunWasBestScore = false;
        this.lastRunWasBestDepth = false;
        this.lastRunDeathCause = '';
        this.lastRunKills = 0;
        this.lastRunEliteKills = 0;
        this.lastRunNoDamageChunks = 0;
        // Daily run flags
        this.pendingDailyRun = false;
        this.lastRunWasDaily = false;
        // Saved run resume
        this.pendingRunState = null;
        // Loadout selections (set by LoadoutState, read by PlayingState)
        this.pendingLoadoutWeapon = null;
        this.pendingLoadoutPerk = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
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
        this.accessibility = new AccessibilitySettings();
        this.cosmetics = new CosmeticsSystem();
        this.codex = new CodexSystem();
        this.runModifiers = new RunModifierSystem();
        this.loop = new GameLoop((dt) => this.states.fixedUpdate(dt), (alpha) => this.states.render(alpha));
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
                const playing = this.states.states?.get('PLAYING');
                if (this.states.currentName === 'PLAYING' && playing?.world) {
                    this.save.saveRun(playing.world.serialize());
                    // Track quit point
                    this.analytics.track('quit_point', {
                        depth: playing.world.scoring.depth,
                        score: playing.world.scoring.score,
                    });
                    this.analytics.flush();
                }
            }
            else {
                this.audio.resume();
                this.loop.start();
            }
        });
    }
    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const aspect = CANVAS_W / CANVAS_H;
        let drawW;
        let drawH;
        if (containerW / containerH < aspect) {
            drawW = containerW;
            drawH = containerW / aspect;
        }
        else {
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
    registerStates() {
        this.states.register(new BootState(this));
        this.states.register(new MenuState(this));
        this.states.register(new PlayingState(this));
        this.states.register(new DeadState(this));
        this.states.register(new PausedState(this));
        this.states.register(new RunShopState(this));
        this.states.register(new LoadoutState(this));
        this.states.register(new MetaShopState(this, this.meta));
    }
    async start() {
        await this.save.init();
        await this.meta.init(this.save.db);
        this.analytics.init(this.save.db);
        await this.leaderboard.init(this.save.db);
        await this.cosmetics.init(this.save.db);
        await this.codex.init(this.save.db);
        this.pendingRunState = await this.save.loadRun();
        this.states.transition('BOOT');
        this.loop.start();
    }
}
