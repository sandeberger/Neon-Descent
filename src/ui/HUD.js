import { CANVAS_W, CANVAS_H } from '@core/Constants';
const TIER_COLORS = ['#ffffff', '#44ffff', '#44ff44', '#ffaa22', '#ff4466'];
export class HUD {
    constructor(ctx) {
        this.pulsePhase = 0;
        this.ctx = ctx;
    }
    render(state) {
        const ctx = this.ctx;
        this.pulsePhase += 1 / 60;
        // HP hearts — top left
        for (let i = 0; i < state.maxHp; i++) {
            ctx.fillStyle = i < state.hp ? '#ff4466' : '#333344';
            const x = 10 + i * 22;
            // Simple heart shape with rects
            ctx.fillRect(x, 10, 8, 8);
            ctx.fillRect(x + 10, 10, 8, 8);
            ctx.fillRect(x + 2, 18, 14, 4);
            ctx.fillRect(x + 4, 22, 10, 3);
            ctx.fillRect(x + 6, 25, 6, 2);
        }
        // Daily indicator below HP
        if (state.isDaily) {
            ctx.fillStyle = '#ffaa22';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('DAILY', 10, 40);
        }
        // Score — top right
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(state.score.toLocaleString(), CANVAS_W - 10, 22);
        // Depth — below score
        ctx.fillStyle = '#888899';
        ctx.font = '11px monospace';
        ctx.fillText(`${Math.floor(state.depth / 10)}m`, CANVAS_W - 10, 38);
        // Combo — center top
        if (state.comboCount > 0) {
            const color = TIER_COLORS[state.comboTier] ?? '#ffffff';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            // Combo count
            const size = 16 + state.comboTier * 4;
            ctx.font = `bold ${size}px monospace`;
            ctx.fillText(`x${state.comboCount}`, CANVAS_W / 2, 28);
            // Multiplier
            if (state.comboTier > 0) {
                ctx.font = '11px monospace';
                ctx.globalAlpha = 0.7;
                const mult = [1, 1.5, 2, 3, 5][state.comboTier] ?? 1;
                ctx.fillText(`${mult}x`, CANVAS_W / 2, 42);
                ctx.globalAlpha = 1;
            }
            // Decay bar
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            const barW = 60;
            const barX = CANVAS_W / 2 - barW / 2;
            ctx.fillRect(barX, 46, barW * state.comboDecay, 2);
            ctx.globalAlpha = 1;
        }
        // Special ability indicator — bottom left, above currency
        this.renderSpecialIndicator(ctx, state);
        // Weapon heat bar — bottom center
        if (state.weaponHeat > 0) {
            const barW = 80;
            const barH = 4;
            const barX = CANVAS_W / 2 - barW / 2;
            const barY = CANVAS_H - 18;
            // Background
            ctx.fillStyle = '#222233';
            ctx.fillRect(barX, barY, barW, barH);
            // Fill
            ctx.fillStyle = state.overheated ? '#ff2244' : (state.weaponHeat > 0.7 ? '#ffaa22' : '#44ffff');
            ctx.fillRect(barX, barY, barW * state.weaponHeat, barH);
            // Label
            if (state.overheated) {
                ctx.fillStyle = '#ff2244';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('OVERHEAT', CANVAS_W / 2, barY - 3);
            }
        }
        // Air dash pips — bottom right
        for (let i = 0; i < state.maxAirDashes; i++) {
            ctx.fillStyle = i < state.airDashesLeft ? '#44ddff' : '#333344';
            ctx.fillRect(CANVAS_W - 14 - i * 10, CANVAS_H - 16, 6, 6);
        }
        // Currency — bottom left
        ctx.fillStyle = '#44ff88';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${state.currency}`, 10, CANVAS_H - 10);
        // Combo tier edge glow
        if (state.comboTier >= 2) {
            this.drawEdgeGlow(ctx, state.comboTier);
        }
    }
    renderSpecialIndicator(ctx, state) {
        const x = 10;
        const y = CANVAS_H - 30;
        if (state.specialReady) {
            // Pulsing "READY" indicator
            const pulse = 0.5 + Math.sin(this.pulsePhase * 8) * 0.5;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#44ffff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('EMP READY', x, y);
            ctx.globalAlpha = 1;
        }
        else if (state.specialChargeProgress > 0) {
            // Progress bar
            const barW = 40;
            const barH = 3;
            ctx.fillStyle = '#222233';
            ctx.fillRect(x, y - 3, barW, barH);
            ctx.fillStyle = '#226688';
            ctx.fillRect(x, y - 3, barW * state.specialChargeProgress, barH);
        }
    }
    drawEdgeGlow(ctx, tier) {
        const color = TIER_COLORS[tier] ?? '#ffffff';
        const intensity = (tier - 1) * 0.08;
        // Left edge
        const grad = ctx.createLinearGradient(0, 0, 20, 0);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = intensity;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 20, CANVAS_H);
        // Right edge
        const grad2 = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W - 20, 0);
        grad2.addColorStop(0, color);
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(CANVAS_W - 20, 0, 20, CANVAS_H);
        ctx.globalAlpha = 1;
    }
}
