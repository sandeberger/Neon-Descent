import { World } from '@world/World';
import { Renderer } from '@render/Renderer';
import { HUD } from '@ui/HUD';
import { CANVAS_W, CANVAS_H, PLAYER_BASE_HP, MAX_AIR_DASHES } from '@core/Constants';
import { SeededRNG } from '@utils/SeededRNG';
export class PlayingState {
    constructor(game) {
        this.game = game;
        this.name = 'PLAYING';
        this.pauseKeyListener = null;
        this.pauseTouchListener = null;
        this.resuming = false;
        this.autoSaveTimer = 0;
    }
    onEnter(prev) {
        // If resuming from pause or shop, skip re-creating world
        if ((prev === 'PAUSED' || prev === 'RUN_SHOP') && this.resuming) {
            this.resuming = false;
            this.game.input.bind(this.game.canvas, this.game.canvasScale);
            this.bindPause();
            return;
        }
        // Resume from saved run or start fresh
        const pending = this.game.pendingRunState;
        if (pending) {
            this.world = new World(pending.seed, pending);
            this.game.pendingRunState = null;
        }
        else if (this.game.pendingDailyRun) {
            const dailySeed = SeededRNG.dailySeed();
            this.world = new World(dailySeed);
            this.world.isDaily = true;
            this.game.pendingDailyRun = false;
        }
        else {
            this.world = new World();
        }
        // Apply meta upgrades (only for fresh runs — restores already have correct HP)
        if (!pending) {
            const meta = this.game.meta;
            const hpBonus = meta.getEffectValue('max_hp');
            if (hpBonus > 0) {
                this.world.player.maxHp = PLAYER_BASE_HP + hpBonus;
                this.world.player.hp = this.world.player.maxHp;
            }
        }
        this.renderer = new Renderer(this.game.ctx, this.world.camera);
        this.hud = new HUD(this.game.ctx);
        // Wire audio to world events
        this.game.audio.init(this.world.events);
        // Wire analytics
        this.game.analytics.bindToEvents(this.world.events);
        // Start ambient music
        this.game.audio.startMusic();
        // Wire death event
        this.world.events.on('player:dead', () => {
            const score = this.world.scoring.score;
            const depth = this.world.scoring.depth;
            this.game.lastRunScore = score;
            this.game.lastRunDepth = depth;
            this.game.lastRunCombo = this.world.combo.count;
            this.game.lastRunMaxCombo = this.world.combo.maxCombo;
            this.game.lastRunCurrency = this.world.scoring.currency;
            this.game.lastRunWasBestScore = score > this.game.meta.bestScore;
            this.game.lastRunWasBestDepth = depth > this.game.meta.bestDepth;
            this.game.lastRunWasDaily = this.world.isDaily;
            // Clear saved run on death
            this.game.save.clearRun();
            // Record run end for meta-progression
            if (this.world.isDaily) {
                this.game.meta.recordDailyEnd(score, depth, this.world.scoring.currency)
                    .then(shardsEarned => { this.game.lastRunShardsEarned = shardsEarned; });
            }
            else {
                this.game.meta.recordRunEnd(score, depth, this.world.scoring.currency)
                    .then(shardsEarned => { this.game.lastRunShardsEarned = shardsEarned; });
            }
            this.game.states.transition('DEAD');
        });
        // Bind input
        this.game.input.bind(this.game.canvas, this.game.canvasScale);
        this.bindPause();
    }
    bindPause() {
        // ESC to pause
        this.pauseKeyListener = (e) => {
            if (e.code === 'Escape') {
                this.triggerPause();
            }
        };
        window.addEventListener('keydown', this.pauseKeyListener);
        // Pause button touch (top-right corner, 40x40 area)
        this.pauseTouchListener = (e) => {
            const touch = e instanceof TouchEvent ? e.touches[0] || e.changedTouches[0] : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const x = (touch.clientX - rect.left) / scale;
            const y = (touch.clientY - rect.top) / scale;
            // Pause button area: top-right 40x40
            if (x > CANVAS_W - 40 && y < 50) {
                e.preventDefault();
                this.triggerPause();
            }
        };
        this.game.canvas.addEventListener('touchstart', this.pauseTouchListener, { passive: false });
        this.game.canvas.addEventListener('mousedown', this.pauseTouchListener);
    }
    triggerPause() {
        this.resuming = true;
        const paused = this.game.states.states.get('PAUSED');
        if (paused)
            paused.captureFrame();
        this.game.states.transition('PAUSED');
    }
    onExit(next) {
        // Clean up pause listeners
        if (this.pauseKeyListener) {
            window.removeEventListener('keydown', this.pauseKeyListener);
            this.pauseKeyListener = null;
        }
        if (this.pauseTouchListener) {
            this.game.canvas.removeEventListener('touchstart', this.pauseTouchListener);
            this.game.canvas.removeEventListener('mousedown', this.pauseTouchListener);
            this.pauseTouchListener = null;
        }
        if (next !== 'PAUSED' && next !== 'RUN_SHOP') {
            this.game.audio.stopMusic();
            this.resuming = false;
        }
        this.game.input.unbind(this.game.canvas);
    }
    fixedUpdate(dt) {
        const input = this.game.input.buildFrame();
        this.world.fixedUpdate(dt, input);
        this.game.analytics.update(dt);
        // Adaptive music
        const nearDeath = this.world.player.hp <= 1 && this.world.player.hp > 0;
        this.game.audio.updateAdaptiveMusic(this.world.combo.tier, nearDeath, this.world.pacing.getBiomeId());
        // Check if upgrade shop should appear
        if (this.world.shopPending) {
            this.world.shopPending = false;
            this.triggerShop();
        }
        // Auto-save every 30s
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer >= 30) {
            this.autoSaveTimer = 0;
            this.game.save.saveRun(this.world.serialize());
        }
    }
    triggerShop() {
        this.resuming = true;
        const shop = this.game.states.states.get('RUN_SHOP');
        if (shop)
            shop.captureFrame();
        this.game.states.transition('RUN_SHOP');
    }
    render(alpha) {
        this.renderer.render(this.world, alpha);
        const special = this.world.special;
        const hudState = {
            hp: this.world.player.hp,
            maxHp: this.world.player.maxHp,
            score: Math.floor(this.world.scoring.score),
            comboCount: this.world.combo.count,
            comboTier: this.world.combo.tier,
            comboDecay: this.world.combo.decayTimer / this.world.combo.effectiveDecayTime,
            depth: this.world.scoring.depth,
            currency: this.world.scoring.currency,
            weaponHeat: this.world.weapons.heat,
            overheated: this.world.weapons.overheated,
            airDashesLeft: MAX_AIR_DASHES - this.world.player.airDashesUsed,
            maxAirDashes: MAX_AIR_DASHES,
            isDaily: this.world.isDaily,
            specialCharges: special.charges,
            specialMaxCharges: special.maxCharges,
            specialChargeProgress: special.chargeProgress,
            specialReady: special.charges > 0,
        };
        this.hud.render(hudState);
        // Pause button (top-right)
        const ctx = this.game.ctx;
        ctx.fillStyle = '#667788';
        ctx.globalAlpha = 0.6;
        // Two vertical bars for pause icon
        ctx.fillRect(CANVAS_W - 28, 12, 4, 14);
        ctx.fillRect(CANVAS_W - 20, 12, 4, 14);
        ctx.globalAlpha = 1;
        // Debug FPS
        ctx.fillStyle = '#44ff44';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.game.loop.fps} fps`, 4, CANVAS_H - 4);
    }
}
