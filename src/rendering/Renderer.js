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
        this.heartbeatPhase = 0;
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
            // Drones (if drone_support weapon active)
            for (const drone of world.weapons.getDrones()) {
                entCtx.fillStyle = '#ddaa22';
                entCtx.globalAlpha = 0.5;
                entCtx.fillRect(drone.x - 5, drone.y - 5, 10, 10);
                entCtx.fillStyle = '#ffcc44';
                entCtx.globalAlpha = 1;
                entCtx.fillRect(drone.x - 3, drone.y - 3, 6, 6);
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
        // Near-death visual state: pulsating red vignette + desaturation at HP=1
        if (world.player.hp === 1 && world.player.hp > 0 && world.player.state !== 'DEAD') {
            this.heartbeatPhase += 1 / 60 * 6; // 6Hz pulse
            const pulse = 0.15 + Math.sin(this.heartbeatPhase) * 0.1;
            // Red vignette
            const vigGrad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.2, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.55);
            vigGrad.addColorStop(0, 'transparent');
            vigGrad.addColorStop(1, `rgba(180, 0, 0, ${pulse})`);
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            // Desaturation overlay
            ctx.globalAlpha = 0.08 + Math.sin(this.heartbeatPhase * 0.5) * 0.04;
            ctx.fillStyle = '#222222';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            ctx.globalAlpha = 1;
            // Heartbeat edge pulse
            const edgePulse = Math.max(0, Math.sin(this.heartbeatPhase)) * 0.25;
            ctx.globalAlpha = edgePulse;
            ctx.fillStyle = '#ff0022';
            // Top edge
            const topGrad = ctx.createLinearGradient(0, 0, 0, 30);
            topGrad.addColorStop(0, '#ff0022');
            topGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, CANVAS_W, 30);
            // Bottom edge
            const botGrad = ctx.createLinearGradient(0, CANVAS_H, 0, CANVAS_H - 30);
            botGrad.addColorStop(0, '#ff0022');
            botGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = botGrad;
            ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 30);
            ctx.globalAlpha = 1;
        }
        else {
            this.heartbeatPhase = 0;
        }
        // Void Core darkness effect: limited vision radius
        if (world.darknessRadius > 0) {
            const px = world.player.renderX(alpha);
            const py = world.player.renderY(alpha);
            // Transform player world coords to screen coords
            const screenX = CANVAS_W / 2 + (px - cam.x) * cam.zoom + cam.shakeOffsetX;
            const screenY = CANVAS_H / 2 + (py - cam.y) * cam.zoom + cam.shakeOffsetY;
            const radius = world.darknessRadius * cam.zoom;
            const darkGrad = ctx.createRadialGradient(screenX, screenY, radius * 0.6, screenX, screenY, radius * 2);
            darkGrad.addColorStop(0, 'transparent');
            darkGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
            darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
            ctx.fillStyle = darkGrad;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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
        // Floating particles (depth atmosphere — doubled count, varied sizes)
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = palette.backgroundLine1;
        const particleOffset = cam.y * 0.08;
        for (let i = 0; i < 20; i++) {
            const seed = i * 137.5; // golden angle scatter
            const px = ((seed * 7.3 + particleOffset * 0.3) % CANVAS_W);
            const py = ((seed * 13.7 + particleOffset) % CANVAS_H);
            const size = 1 + (i % 4);
            ctx.fillRect(px, py, size, size);
        }
        // Biome-specific background elements
        this.drawBiomeBackground(ctx, cam, palette);
        ctx.globalAlpha = 1;
    }
    drawBiomeBackground(ctx, cam, palette) {
        const depth = cam.y;
        const time = Date.now() / 1000;
        // Surface Fracture: falling debris particles + flickering distant lights
        if (depth < 2000) {
            // Falling debris
            ctx.fillStyle = palette.backgroundLine1;
            ctx.globalAlpha = 0.12;
            for (let i = 0; i < 8; i++) {
                const seed = i * 97.3;
                const px = (seed * 3.7) % CANVAS_W;
                const py = (seed * 11.3 + time * 30 + cam.y * 0.03) % CANVAS_H;
                ctx.fillRect(px, py, 1 + (i % 3), 2 + (i % 4));
            }
            // Distant flickering lights
            ctx.globalAlpha = 0.06 + Math.sin(time * 2 + 1.3) * 0.03;
            ctx.fillStyle = '#44ddff';
            for (let i = 0; i < 4; i++) {
                const lx = (i * 89 + 20) % CANVAS_W;
                const ly = (i * 137 + cam.y * 0.01) % CANVAS_H;
                const flicker = Math.sin(time * (3 + i) + i * 2.7) > 0.3 ? 1 : 0;
                if (flicker)
                    ctx.fillRect(lx, ly, 2, 2);
            }
        }
        // Neon Gut: pulsing organic veins + dripping particles
        if (depth >= 2000 && depth < 4000) {
            // Pulsing veins
            ctx.strokeStyle = palette.backgroundLine2;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.08 + Math.sin(time * 1.5) * 0.03;
            const veinOffset = cam.y * 0.06;
            for (let i = 0; i < 3; i++) {
                const baseX = (i * 120 + 30) % CANVAS_W;
                ctx.beginPath();
                for (let y = 0; y < CANVAS_H; y += 20) {
                    const x = baseX + Math.sin((y + veinOffset) * 0.03 + i) * 15;
                    if (y === 0)
                        ctx.moveTo(x, y);
                    else
                        ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            // Dripping particles
            ctx.fillStyle = '#ff44aa';
            ctx.globalAlpha = 0.1;
            for (let i = 0; i < 6; i++) {
                const dx = (i * 57 + 10) % CANVAS_W;
                const dy = (time * 40 + i * 107 + cam.y * 0.08) % CANVAS_H;
                ctx.fillRect(dx, dy, 1, 3 + (i % 3));
            }
        }
        // Data Crypt: scrolling data streams + glitch bars
        if (depth >= 4000 && depth < 6000) {
            // Vertical data streams
            ctx.fillStyle = palette.backgroundLine2;
            ctx.globalAlpha = 0.08;
            const streamOffset = cam.y * 0.25;
            for (let i = 0; i < 8; i++) {
                const sx = (i * 47 + streamOffset * 0.1) % CANVAS_W;
                const h = 10 + (i * 17 % 40);
                const sy = (streamOffset * (1 + i * 0.2) + i * 43) % CANVAS_H;
                ctx.fillRect(sx, sy, 2, h);
            }
            // Horizontal glitch bars
            ctx.fillStyle = '#44ffaa';
            ctx.globalAlpha = 0.03;
            const glitchSeed = Math.floor(time * 4);
            for (let i = 0; i < 3; i++) {
                const gy = ((glitchSeed * 73 + i * 211) % CANVAS_H);
                const gw = 20 + ((glitchSeed * 37 + i * 97) % 60);
                const gx = ((glitchSeed * 53 + i * 139) % CANVAS_W);
                ctx.fillRect(gx, gy, gw, 2);
            }
        }
        // Hollow Market: warm floating lanterns + gentle ambient glow
        if (depth >= 6000 && depth < 7500) {
            // Floating lantern-like lights
            ctx.globalAlpha = 0.12;
            for (let i = 0; i < 6; i++) {
                const seed = i * 127.7;
                const lx = (seed * 2.3 + Math.sin(time * 0.5 + i * 1.8) * 20) % CANVAS_W;
                const ly = (seed * 5.1 + cam.y * 0.04 + Math.sin(time * 0.7 + i) * 10) % CANVAS_H;
                const glow = 0.08 + Math.sin(time * 1.2 + i * 2.1) * 0.04;
                ctx.fillStyle = '#ffcc88';
                ctx.globalAlpha = glow;
                ctx.fillRect(lx - 3, ly - 3, 6, 6);
                ctx.globalAlpha = glow * 0.4;
                ctx.fillRect(lx - 6, ly - 6, 12, 12);
            }
            // Warm ambient glow band
            ctx.globalAlpha = 0.04 + Math.sin(time * 0.3) * 0.01;
            const grad = ctx.createLinearGradient(0, CANVAS_H * 0.3, 0, CANVAS_H * 0.7);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.5, '#332244');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }
        // Molten Grid: heat distortion waves + ember particles + lava glow
        if (depth >= 7500 && depth < 9500) {
            // Heat distortion waves
            ctx.strokeStyle = palette.backgroundLine1;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.06;
            const heatOffset = cam.y * 0.12;
            for (let y = 0; y < CANVAS_H; y += 40) {
                ctx.beginPath();
                for (let x = 0; x < CANVAS_W; x += 8) {
                    const oy = y + Math.sin((x + heatOffset + time * 30) * 0.04) * 4;
                    if (x === 0)
                        ctx.moveTo(x, oy);
                    else
                        ctx.lineTo(x, oy);
                }
                ctx.stroke();
            }
            // Rising ember particles
            ctx.fillStyle = '#ff6622';
            ctx.globalAlpha = 0.15;
            for (let i = 0; i < 10; i++) {
                const ex = (i * 37 + 15) % CANVAS_W;
                const ey = CANVAS_H - ((time * 50 + i * 67 + cam.y * 0.05) % CANVAS_H);
                const sz = 1 + (i % 2);
                ctx.globalAlpha = 0.1 + (ey / CANVAS_H) * 0.1;
                ctx.fillRect(ex, ey, sz, sz);
            }
            // Bottom lava glow
            ctx.globalAlpha = 0.06 + Math.sin(time * 0.8) * 0.02;
            const lavaGrad = ctx.createLinearGradient(0, CANVAS_H * 0.8, 0, CANVAS_H);
            lavaGrad.addColorStop(0, 'transparent');
            lavaGrad.addColorStop(1, '#ff440022');
            ctx.fillStyle = lavaGrad;
            ctx.fillRect(0, CANVAS_H * 0.8, CANVAS_W, CANVAS_H * 0.2);
        }
        // Void Core: static interference + blood-red flickers + reality tears
        if (depth >= 9500) {
            // Static interference
            ctx.fillStyle = '#ff0011';
            ctx.globalAlpha = 0.03;
            for (let i = 0; i < 12; i++) {
                const sx = Math.random() * CANVAS_W;
                const sy = Math.random() * CANVAS_H;
                ctx.fillRect(sx, sy, 1 + Math.random() * 4, 1);
            }
            // Reality tear lines
            ctx.strokeStyle = '#ff2244';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.05 + Math.sin(time * 3) * 0.02;
            const tearSeed = Math.floor(time * 2);
            for (let i = 0; i < 2; i++) {
                const tx = ((tearSeed * 73 + i * 157) % CANVAS_W);
                const ty = ((tearSeed * 47 + i * 113) % (CANVAS_H * 0.8));
                const tLen = 10 + ((tearSeed * 31 + i * 89) % 30);
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx + ((tearSeed * 11 + i * 7) % 20) - 10, ty + tLen);
                ctx.stroke();
            }
            // Pulsing crimson vignette
            const voidPulse = 0.04 + Math.sin(time * 2) * 0.02;
            const voidGrad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.2, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.6);
            voidGrad.addColorStop(0, 'transparent');
            voidGrad.addColorStop(1, `rgba(120, 0, 0, ${voidPulse})`);
            ctx.fillStyle = voidGrad;
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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
                    case TileType.ACID_POOL:
                        ctx.fillStyle = '#88ff22';
                        ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 300 + wx * 0.1) * 0.2;
                        ctx.fillRect(wx, wy + TILE_SIZE - 8, TILE_SIZE, 8);
                        // Bubbles
                        ctx.fillStyle = '#aaff44';
                        ctx.globalAlpha = 0.6;
                        const bx = wx + 5 + Math.sin(Date.now() / 500 + wx) * 4;
                        ctx.fillRect(bx, wy + TILE_SIZE - 12, 3, 3);
                        ctx.fillRect(bx + 12, wy + TILE_SIZE - 10, 2, 2);
                        ctx.globalAlpha = 1;
                        break;
                    case TileType.LASER: {
                        const laserPhase = (Date.now() / 1000) % 4;
                        const laserActive = laserPhase < 1;
                        // Warning indicator
                        ctx.fillStyle = laserActive ? '#cc44ff' : '#442266';
                        ctx.globalAlpha = laserActive ? (0.5 + Math.sin(Date.now() / 80) * 0.3) : 0.3;
                        ctx.fillRect(wx, wy + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
                        // Emitter dot on left
                        ctx.fillStyle = laserActive ? '#ff44ff' : '#664488';
                        ctx.fillRect(wx, wy + TILE_SIZE / 2 - 4, 4, 8);
                        ctx.globalAlpha = 1;
                        break;
                    }
                    case TileType.DARKNESS:
                        // Darkness tiles just render as slightly darker empty
                        ctx.fillStyle = '#000000';
                        ctx.globalAlpha = 0.3;
                        ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
                        ctx.globalAlpha = 1;
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
        // Enhanced outer glow (larger, softer)
        ctx.fillStyle = ENTITY_PALETTE.playerGlow;
        ctx.globalAlpha *= 0.15;
        ctx.fillRect(rx - hw - 6, ry - hh - 6, player.hitbox.width + 12, player.hitbox.height + 12);
        ctx.globalAlpha = player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0 ? 0.4 : 1;
        // Inner glow
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
        // Shoulder accents
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha *= 0.6;
        ctx.fillRect(rx - hw, ry - hh, 3, 3);
        ctx.fillRect(rx + hw - 3, ry - hh, 3, 3);
        ctx.globalAlpha = player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0 ? 0.4 : 1;
        // Eyes (simple 2-pixel dots)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx - 4, ry - 4, 3, 3);
        ctx.fillRect(rx + 2, ry - 4, 3, 3);
        // Stomp trail (enhanced with multiple layers)
        if (player.state === 'STOMPING') {
            ctx.fillStyle = '#ff6622';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(rx - hw + 2, ry - hh - 8, player.hitbox.width - 4, 8);
            ctx.fillStyle = '#ffaa44';
            ctx.globalAlpha = 0.25;
            ctx.fillRect(rx - hw + 4, ry - hh - 16, player.hitbox.width - 8, 8);
            ctx.globalAlpha = 1;
        }
        // Dash trail (afterimage)
        if (player.state === 'DASHING') {
            ctx.fillStyle = ENTITY_PALETTE.playerDash;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(rx - hw, ry + hh, player.hitbox.width, 12);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.1;
            ctx.fillRect(rx - hw + 2, ry + hh + 8, player.hitbox.width - 4, 8);
            ctx.globalAlpha = 1;
        }
        // Wall slide sparks
        if (player.state === 'WALL_SLIDING') {
            const wallSide = player.touchingWallLeft ? -hw : hw;
            ctx.fillStyle = '#ffcc44';
            ctx.globalAlpha = 0.5 + Math.random() * 0.3;
            ctx.fillRect(rx + wallSide - 1, ry - 2 + Math.random() * 8, 2, 2);
            ctx.fillRect(rx + wallSide - 1, ry + 4 + Math.random() * 8, 2, 2);
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
