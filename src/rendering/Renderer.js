import { CANVAS_W, CANVAS_H, CHUNK_COLS, CHUNK_ROWS, TILE_SIZE, MAX_PARTICLES, } from '@core/Constants';
import { TileType } from '@world/ChunkTemplate';
import { LayerStack } from './LayerStack';
import biomesData from '@data/biomes.json';
// Build palette lookup from biome JSON data
const BIOME_PALETTES = {};
for (const biome of biomesData) {
    BIOME_PALETTES[biome.id] = biome.palette;
}
// Player/entity colors (shared across biomes)
const ENTITY_PALETTE = {
    playerBody: '#44ddff',
    playerGlow: '#22aaff',
    playerDash: '#88eeff',
};
export class Renderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
        this.layers = new LayerStack();
    }
    render(world, alpha) {
        const ctx = this.ctx;
        const cam = this.camera;
        // Determine active biome palette from pacing
        const biomeId = world.pacing.getBiomeId();
        const palette = BIOME_PALETTES[biomeId] ?? BIOME_PALETTES['surface_fracture'];
        // Layer 0: Background — redraws every frame (camera always moving)
        {
            const bgCtx = this.layers.contexts[0];
            this.layers.clearLayer(0);
            bgCtx.fillStyle = palette.background;
            bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            this.drawBackground(bgCtx, cam, palette);
        }
        // Layer 1: Tiles — redraws every frame (drawn in world-space via camera transform)
        {
            const tileCtx = this.layers.contexts[1];
            this.layers.clearLayer(1);
            cam.applyTransform(tileCtx);
            for (const chunk of world.chunks) {
                if (!cam.isVisible(0, chunk.worldY, CANVAS_W, CHUNK_ROWS * TILE_SIZE))
                    continue;
                const chunkPalette = BIOME_PALETTES[chunk.biomeId] ?? palette;
                this.drawChunk(tileCtx, chunk, cam, chunkPalette);
            }
            cam.restore(tileCtx);
        }
        // Layer 2: Entities (every frame)
        {
            const entCtx = this.layers.contexts[2];
            this.layers.clearLayer(2);
            cam.applyTransform(entCtx);
            // Pickups
            for (const p of world.pickupPool.active) {
                if (!p.active)
                    continue;
                const rx = p.renderX(alpha);
                const ry = p.renderY(alpha) + p.bobOffset;
                entCtx.fillStyle = p.getColor();
                entCtx.globalAlpha = 0.9;
                entCtx.fillRect(rx - 5, ry - 5, 10, 10);
                entCtx.globalAlpha = 0.3;
                entCtx.fillRect(rx - 7, ry - 7, 14, 14);
                entCtx.globalAlpha = 1;
            }
            // Enemies
            for (const e of world.enemies) {
                if (!e.active)
                    continue;
                const rx = e.renderX(alpha);
                const ry = e.renderY(alpha);
                entCtx.fillStyle = e.flashTimer > 0 ? '#ffffff' : e.bodyColor;
                entCtx.fillRect(rx - e.hitbox.width / 2, ry - e.hitbox.height / 2, e.hitbox.width, e.hitbox.height);
                entCtx.globalAlpha = 0.3;
                entCtx.fillStyle = e.glowColor;
                entCtx.fillRect(rx - e.hitbox.width / 2 - 2, ry - e.hitbox.height / 2 - 2, e.hitbox.width + 4, e.hitbox.height + 4);
                entCtx.globalAlpha = 1;
                if (e.renderExtra)
                    e.renderExtra(entCtx, rx, ry);
            }
            // Enemy projectiles
            for (const p of world.enemyProjPool.active) {
                if (!p.active)
                    continue;
                const rx = p.renderX(alpha);
                const ry = p.renderY(alpha);
                entCtx.fillStyle = p.glowColor;
                entCtx.globalAlpha = 0.4;
                entCtx.fillRect(rx - 4, ry - 4, 8, 8);
                entCtx.fillStyle = p.color;
                entCtx.globalAlpha = 1;
                entCtx.fillRect(rx - 2, ry - 2, 4, 4);
            }
            // Player projectiles
            for (const p of world.projPool.active) {
                if (!p.active)
                    continue;
                const rx = p.renderX(alpha);
                const ry = p.renderY(alpha);
                if (p.projectileLength > 0) {
                    // Beam Cutter: elongated rectangle along velocity direction
                    const angle = Math.atan2(p.vy, p.vx);
                    const len = p.projectileLength;
                    entCtx.save();
                    entCtx.translate(rx, ry);
                    entCtx.rotate(angle);
                    // Glow
                    entCtx.fillStyle = p.glowColor;
                    entCtx.globalAlpha = 0.4;
                    entCtx.fillRect(-len / 2 - 1, -3, len + 2, 6);
                    // Core
                    entCtx.fillStyle = p.color;
                    entCtx.globalAlpha = 1;
                    entCtx.fillRect(-len / 2, -1.5, len, 3);
                    entCtx.restore();
                }
                else {
                    // Standard square projectile
                    entCtx.fillStyle = p.glowColor;
                    entCtx.globalAlpha = 0.4;
                    entCtx.fillRect(rx - 4, ry - 4, 8, 8);
                    entCtx.fillStyle = p.color;
                    entCtx.globalAlpha = 1;
                    entCtx.fillRect(rx - 2, ry - 2, 4, 4);
                }
            }
            // Player
            this.drawPlayer(entCtx, world.player, alpha);
            cam.restore(entCtx);
        }
        // Layer 3: Particles/VFX (every frame)
        {
            const vfxCtx = this.layers.contexts[3];
            this.layers.clearLayer(3);
            cam.applyTransform(vfxCtx);
            this.drawParticles(vfxCtx, world, alpha);
            cam.restore(vfxCtx);
        }
        // Composite all layers to main canvas
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        this.layers.composite(ctx);
        // Screen flash (drawn directly on main canvas, on top of everything)
        if (world.vfx.flashAlpha > 0) {
            ctx.globalAlpha = world.vfx.flashAlpha;
            ctx.fillStyle = world.vfx.flashColor;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            ctx.globalAlpha = 1;
        }
    }
    drawBackground(ctx, cam, palette) {
        // Layer 1: Far — slow vertical grid lines
        ctx.strokeStyle = palette.backgroundLine1;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        const farOffsetX = (cam.y * 0.02) % 60;
        for (let x = -farOffsetX; x < CANVAS_W + 60; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_H);
            ctx.stroke();
        }
        const farOffsetY = (cam.y * 0.05) % 80;
        for (let y = -farOffsetY; y < CANVAS_H + 80; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_W, y);
            ctx.stroke();
        }
        // Layer 2: Mid — drifting horizontal bands
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = palette.backgroundLine2;
        const midOffset = (cam.y * 0.1) % 120;
        for (let y = -midOffset; y < CANVAS_H + 120; y += 120) {
            ctx.fillRect(0, y, CANVAS_W, 40);
        }
        // Layer 3: Near — denser vertical scan lines (parallax faster)
        ctx.strokeStyle = palette.backgroundLine1;
        ctx.globalAlpha = 0.12;
        const nearOffset = (cam.y * 0.2) % 30;
        for (let x = -nearOffset % 30; x < CANVAS_W + 30; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_H);
            ctx.stroke();
        }
        // Layer 3b: Near horizontal lines (faster parallax)
        const nearOffsetY = (cam.y * 0.15) % 40;
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = palette.backgroundLine2;
        for (let y = -nearOffsetY; y < CANVAS_H + 40; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_W, y);
            ctx.stroke();
        }
        // Floating particles (depth atmosphere)
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = palette.backgroundLine1;
        const particleOffset = cam.y * 0.08;
        for (let i = 0; i < 12; i++) {
            const seed = i * 137.5; // golden angle scatter
            const px = ((seed * 7.3 + particleOffset * 0.3) % CANVAS_W);
            const py = ((seed * 13.7 + particleOffset) % CANVAS_H);
            const size = 2 + (i % 3);
            ctx.fillRect(px, py, size, size);
        }
        ctx.globalAlpha = 1;
    }
    drawChunk(ctx, chunk, cam, palette) {
        for (let row = 0; row < CHUNK_ROWS; row++) {
            const wy = chunk.worldY + row * TILE_SIZE;
            if (wy + TILE_SIZE < cam.top || wy > cam.bottom)
                continue;
            for (let col = 0; col < CHUNK_COLS; col++) {
                const tile = chunk.getTile(col, row);
                if (tile === TileType.EMPTY)
                    continue;
                const wx = col * TILE_SIZE;
                switch (tile) {
                    case TileType.SOLID:
                        ctx.fillStyle = palette.tile;
                        ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = palette.tileAccent;
                        ctx.fillRect(wx, wy, TILE_SIZE, 2);
                        break;
                    case TileType.PLATFORM:
                        ctx.fillStyle = palette.platform;
                        ctx.fillRect(wx, wy, TILE_SIZE, 4);
                        ctx.fillStyle = palette.tileAccent;
                        ctx.fillRect(wx + 4, wy + 1, 2, 2);
                        ctx.fillRect(wx + TILE_SIZE - 6, wy + 1, 2, 2);
                        break;
                    case TileType.HAZARD:
                        ctx.fillStyle = palette.hazard;
                        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
                        ctx.fillRect(wx + 2, wy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                        ctx.globalAlpha = 1;
                        break;
                    case TileType.BREAKABLE: {
                        const dur = chunk.getTileDurability(col, row);
                        ctx.fillStyle = palette.breakable;
                        ctx.globalAlpha = 0.5 + (dur / 3) * 0.5;
                        ctx.fillRect(wx + 1, wy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                        ctx.globalAlpha = 1;
                        // Crack lines based on damage taken
                        ctx.strokeStyle = '#665533';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(wx + 5, wy + 5);
                        ctx.lineTo(wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
                        if (dur <= 2) {
                            ctx.moveTo(wx + TILE_SIZE - 5, wy + 5);
                            ctx.lineTo(wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
                        }
                        if (dur <= 1) {
                            ctx.lineTo(wx + TILE_SIZE - 5, wy + TILE_SIZE - 5);
                            ctx.moveTo(wx + 5, wy + TILE_SIZE - 5);
                            ctx.lineTo(wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
                        }
                        ctx.stroke();
                        break;
                    }
                    case TileType.BOUNCE:
                        ctx.fillStyle = palette.bounce;
                        ctx.fillRect(wx, wy + TILE_SIZE - 6, TILE_SIZE, 6);
                        ctx.fillStyle = '#88ffaa';
                        ctx.fillRect(wx + TILE_SIZE / 2 - 3, wy + TILE_SIZE - 10, 6, 4);
                        break;
                }
            }
        }
    }
    drawPlayer(ctx, player, alpha) {
        if (player.state === 'DEAD')
            return;
        const rx = player.renderX(alpha);
        const ry = player.renderY(alpha);
        const hw = player.hitbox.width / 2;
        const hh = player.hitbox.height / 2;
        // Invulnerability blink
        if (player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }
        // Glow
        ctx.fillStyle = ENTITY_PALETTE.playerGlow;
        ctx.globalAlpha *= 0.3;
        ctx.fillRect(rx - hw - 3, ry - hh - 3, player.hitbox.width + 6, player.hitbox.height + 6);
        ctx.globalAlpha = player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0 ? 0.4 : 1;
        // Body
        const bodyColor = player.state === 'DASHING' ? ENTITY_PALETTE.playerDash :
            player.state === 'STOMPING' ? '#ff8844' :
                ENTITY_PALETTE.playerBody;
        ctx.fillStyle = bodyColor;
        ctx.fillRect(rx - hw, ry - hh, player.hitbox.width, player.hitbox.height);
        // Eyes (simple 2-pixel dots)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 4, ry - 4, 3, 3);
        ctx.fillRect(rx + 2, ry - 4, 3, 3);
        // Stomp trail
        if (player.state === 'STOMPING') {
            ctx.fillStyle = '#ff6622';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(rx - hw + 2, ry - hh - 8, player.hitbox.width - 4, 8);
            ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = 1;
    }
    drawParticles(ctx, world, _alpha) {
        const particles = world.vfx.particles.particles;
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active)
                continue;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
}
