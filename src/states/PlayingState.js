import { World } from '@world/World';
import { Renderer } from '@render/Renderer';
import { HUD } from '@ui/HUD';
import { CANVAS_W, CANVAS_H, PLAYER_BASE_HP, MAX_AIR_DASHES } from '@core/Constants';
import { SeededRNG } from '@utils/SeededRNG';
import { HapticSystem } from '@systems/HapticSystem';
import { TutorialSystem } from '@systems/TutorialSystem';
import { RUN_UPGRADES } from '@systems/UpgradeSystem';
export class PlayingState {
    constructor(game) {
        this.game = game;
        this.name = 'PLAYING';
        this.haptic = new HapticSystem();
        this.tutorial = null;
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
        // Wire haptic feedback
        this.haptic.init(this.world.events);
        // Wire analytics
        this.game.analytics.bindToEvents(this.world.events);
        // Wire achievement system
        if (this.game.achievements) {
            this.game.achievements.init(this.world.events, this.game.save.db);
        }
        // Apply loadout selections
        if (this.game.pendingLoadoutWeapon) {
            this.world.player.currentWeaponId = this.game.pendingLoadoutWeapon;
            this.game.pendingLoadoutWeapon = null;
        }
        if (this.game.pendingLoadoutPerk) {
            const perkId = this.game.pendingLoadoutPerk;
            const perkDef = RUN_UPGRADES.find(u => u.id === perkId);
            if (perkDef)
                this.world.upgrades.apply(perkDef);
            this.game.pendingLoadoutPerk = null;
        }
        // Apply accessibility settings to VFX
        this.world.vfx.shake.intensityMultiplier = this.game.accessibility.shakeMultiplier;
        this.world.vfx.flashMultiplier = this.game.accessibility.flashMultiplier;
        // Tutorial system (show for first 3 runs)
        const isFirstRun = this.game.meta.totalRuns < 3;
        this.tutorial = new TutorialSystem(this.world.events, isFirstRun);
        // Wire codex discovery for biome lore
        this.world.events.on('biome:enter', (d) => {
            const biomeLoreMap = {
                surface_fracture: 'lore_surface',
                neon_gut: 'lore_gut',
                data_crypt: 'lore_crypt',
                hollow_market: 'lore_market',
                molten_grid: 'lore_molten',
                void_core: 'lore_void',
            };
            const loreId = biomeLoreMap[d.id];
            if (loreId)
                this.game.codex.discover(loreId);
        });
        // Wire codex discovery for boss lore
        this.world.events.on('boss:defeated', () => {
            // Discover lore on first boss kill
            this.game.codex.discover('lore_bloom_heart');
            this.game.codex.discover('lore_drill_mother');
        });
        // Start ambient music
        this.game.audio.startMusic();
        // Wire death event
        this.world.events.on('player:dead', (d) => {
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
            this.game.lastRunDeathCause = d.killer;
            this.game.lastRunKills = this.world.scoring.kills;
            this.game.lastRunEliteKills = this.world.scoring.eliteKills;
            this.game.lastRunNoDamageChunks = this.world.scoring.noDamageChunks;
            // Add to leaderboard
            if (this.game.leaderboard) {
                this.game.leaderboard.addEntry({
                    score,
                    depth,
                    maxCombo: this.world.combo.maxCombo,
                    timestamp: Date.now(),
                    isDaily: this.world.isDaily,
                    weaponId: this.world.player.currentWeaponId,
                });
            }
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
        // Tutorial
        if (this.tutorial) {
            this.tutorial.notifyMove(input.moveX);
            this.tutorial.update(dt);
        }
        // Adaptive music
        const nearDeath = this.world.player.hp <= 1 && this.world.player.hp > 0;
        this.game.audio.updateAdaptiveMusic(this.world.combo.tier, nearDeath, this.world.pacing.getBiomeId());
        // Achievement tracking
        if (this.game.achievements) {
            this.game.achievements.setHP(this.world.player.hp, this.world.player.maxHp);
            this.game.achievements.update();
        }
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
        // Tutorial overlay
        if (this.tutorial) {
            this.tutorial.render(this.game.ctx);
        }
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
