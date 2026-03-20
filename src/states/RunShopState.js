import { getRarityColor } from '@systems/UpgradeSystem';
import { CANVAS_W, CANVAS_H } from '@core/Constants';
export class RunShopState {
    constructor(game) {
        this.game = game;
        this.name = 'RUN_SHOP';
        this.choices = [];
        this.selectedIndex = 0;
        this.fadeIn = 0;
        this.pulsePhase = 0;
        // Frozen game frame for background
        this.frameSnapshot = null;
    }
    /** Call before transitioning to capture the current frame */
    captureFrame() {
        this.frameSnapshot = this.game.ctx.getImageData(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    onEnter() {
        this.selectedIndex = 0;
        this.fadeIn = 0;
        this.pulsePhase = 0;
        // Get upgrade choices from the playing state's world
        const playing = this.getPlayingState();
        if (playing?.world) {
            this.choices = playing.world.upgrades.generateChoices(playing.world.rng, 3);
        }
        // Bind input
        const handleTouch = (e) => {
            e.preventDefault();
            if (this.fadeIn < 0.3)
                return; // ignore during fade-in
            const touch = e instanceof TouchEvent
                ? e.touches[0] || e.changedTouches[0]
                : e;
            if (!touch)
                return;
            const rect = this.game.canvas.getBoundingClientRect();
            const scale = this.game.canvasScale;
            const y = (touch.clientY - rect.top) / scale;
            // Check which card was tapped
            const cardStartY = 130;
            const cardHeight = 105;
            const cardGap = 12;
            for (let i = 0; i < this.choices.length; i++) {
                const cardY = cardStartY + i * (cardHeight + cardGap);
                if (y >= cardY && y <= cardY + cardHeight) {
                    this.selectUpgrade(i);
                    return;
                }
            }
            // Skip button at bottom
            if (y > CANVAS_H - 60) {
                this.skipUpgrade();
            }
        };
        const handleKey = (e) => {
            if (this.fadeIn < 0.3)
                return;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.selectedIndex = Math.min(this.choices.length - 1, this.selectedIndex + 1);
            }
            if (e.code === 'Enter' || e.code === 'Space') {
                this.selectUpgrade(this.selectedIndex);
            }
            if (e.code === 'Escape') {
                this.skipUpgrade();
            }
        };
        this.game.canvas.addEventListener('touchstart', handleTouch, { passive: false });
        this.game.canvas.addEventListener('mousedown', handleTouch);
        window.addEventListener('keydown', handleKey);
        this._cleanupTouch = handleTouch;
        this._cleanupKey = handleKey;
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
        this.frameSnapshot = null;
    }
    selectUpgrade(index) {
        const choice = this.choices[index];
        if (!choice)
            return;
        const playing = this.getPlayingState();
        if (playing?.world) {
            // Handle weapon switch
            const switchEffect = choice.effects.find(e => e.type === 'switch_weapon');
            if (switchEffect && choice.category === 'weapon_switch') {
                // Derive weapon ID from upgrade ID: "weapon_beam_cutter" -> "beam_cutter"
                const weaponId = choice.id.replace(/^weapon_/, '');
                playing.world.player.currentWeaponId = weaponId;
            }
            playing.world.upgrades.apply(choice);
            // Apply immediate max HP effect
            if (choice.effects.some(e => e.type === 'max_hp_bonus')) {
                const bonus = choice.effects.find(e => e.type === 'max_hp_bonus').value;
                playing.world.player.maxHp += bonus;
                playing.world.player.hp += bonus;
            }
            playing.world.events.emit('upgrade:chosen', {
                id: choice.id,
                alternatives: this.choices.filter(c => c.id !== choice.id).map(c => c.id),
            });
        }
        this.game.states.transition('PLAYING');
    }
    skipUpgrade() {
        this.game.states.transition('PLAYING');
    }
    getPlayingState() {
        return this.game.states.states?.get('PLAYING');
    }
    fixedUpdate(dt) {
        if (this.fadeIn < 1)
            this.fadeIn += dt * 3;
        this.pulsePhase += dt * 2;
    }
    render(_alpha) {
        const ctx = this.game.ctx;
        const fade = Math.min(1, this.fadeIn);
        // Draw frozen game frame underneath
        if (this.frameSnapshot) {
            ctx.putImageData(this.frameSnapshot, 0, 0);
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        // Dim overlay
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.8 * fade;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = fade;
        // Title
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#44ddff';
        ctx.shadowBlur = 12;
        ctx.fillText('CHOOSE UPGRADE', CANVAS_W / 2, 55);
        ctx.shadowBlur = 0;
        // Active upgrades count
        const playing = this.getPlayingState();
        const activeUpgrades = playing?.world?.upgrades.getActiveUpgrades() ?? [];
        if (activeUpgrades.length > 0) {
            ctx.fillStyle = '#556677';
            ctx.font = '9px monospace';
            ctx.fillText(`${activeUpgrades.length} upgrade${activeUpgrades.length > 1 ? 's' : ''} active`, CANVAS_W / 2, 75);
        }
        // Depth indicator
        if (playing?.world) {
            ctx.fillStyle = '#334455';
            ctx.font = '9px monospace';
            ctx.fillText(`DEPTH ${Math.floor(playing.world.scoring.depth / 10)}m`, CANVAS_W / 2, 95);
        }
        // Upgrade cards
        const cardStartY = 115;
        const cardHeight = 105;
        const cardGap = 12;
        const cardPadX = 18;
        const cardW = CANVAS_W - cardPadX * 2;
        for (let i = 0; i < this.choices.length; i++) {
            const upgrade = this.choices[i];
            const cardY = cardStartY + i * (cardHeight + cardGap);
            const selected = i === this.selectedIndex;
            const rarityColor = getRarityColor(upgrade.rarity);
            // Card background
            ctx.fillStyle = selected ? '#141428' : '#0c0c1e';
            ctx.fillRect(cardPadX, cardY, cardW, cardHeight);
            // Border
            if (selected) {
                ctx.strokeStyle = rarityColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(cardPadX, cardY, cardW, cardHeight);
                // Glow
                ctx.globalAlpha = 0.15 * fade;
                ctx.strokeStyle = rarityColor;
                ctx.lineWidth = 6;
                ctx.strokeRect(cardPadX - 2, cardY - 2, cardW + 4, cardHeight + 4);
                ctx.globalAlpha = fade;
                ctx.lineWidth = 1;
            }
            else {
                ctx.strokeStyle = '#1a1a33';
                ctx.lineWidth = 1;
                ctx.strokeRect(cardPadX, cardY, cardW, cardHeight);
            }
            // Accent bar (left edge)
            ctx.fillStyle = upgrade.icon;
            ctx.fillRect(cardPadX, cardY, 4, cardHeight);
            // Rarity
            ctx.fillStyle = rarityColor;
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(upgrade.rarity.toUpperCase(), cardPadX + 14, cardY + 16);
            // Category
            ctx.fillStyle = '#445566';
            ctx.font = '8px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(upgrade.category.toUpperCase(), cardPadX + cardW - 10, cardY + 16);
            // Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(upgrade.name, cardPadX + 14, cardY + 38);
            // Description
            ctx.fillStyle = '#8899aa';
            ctx.font = '11px monospace';
            ctx.fillText(upgrade.description, cardPadX + 14, cardY + 58);
            // Stack info
            const existing = activeUpgrades.find(a => a.def.id === upgrade.id);
            ctx.font = '9px monospace';
            ctx.textAlign = 'right';
            if (existing) {
                ctx.fillStyle = '#44ff88';
                ctx.fillText(`STACK ${existing.stacks + 1}/${upgrade.maxStacks}`, cardPadX + cardW - 10, cardY + cardHeight - 14);
            }
            else if (upgrade.maxStacks > 1) {
                ctx.fillStyle = '#334455';
                ctx.fillText(`MAX ${upgrade.maxStacks}`, cardPadX + cardW - 10, cardY + cardHeight - 14);
            }
            // Selection indicator
            if (selected) {
                const pulse = 0.5 + Math.sin(this.pulsePhase * 3) * 0.3;
                ctx.globalAlpha = pulse * fade;
                ctx.fillStyle = rarityColor;
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('SELECT', cardPadX + cardW / 2, cardY + cardHeight - 12);
                ctx.globalAlpha = fade;
            }
        }
        // No choices available
        if (this.choices.length === 0) {
            ctx.fillStyle = '#556677';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('All upgrades maxed!', CANVAS_W / 2, CANVAS_H / 2);
        }
        // Skip button
        ctx.fillStyle = '#445566';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        const skipPulse = 0.5 + Math.sin(this.pulsePhase) * 0.15;
        ctx.globalAlpha = skipPulse * fade;
        ctx.fillText('SKIP', CANVAS_W / 2, CANVAS_H - 40);
        ctx.globalAlpha = 1;
        // Controls hint
        ctx.fillStyle = '#223344';
        ctx.font = '8px monospace';
        ctx.globalAlpha = 0.5;
        ctx.fillText('W/S nav \u2022 ENTER select \u2022 ESC skip', CANVAS_W / 2, CANVAS_H - 16);
        ctx.globalAlpha = 1;
    }
}
