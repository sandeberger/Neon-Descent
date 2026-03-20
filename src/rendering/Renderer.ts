import type { World } from '@world/World';
import type { Camera } from './Camera';
import {
  CANVAS_W, CANVAS_H,
  CHUNK_COLS, CHUNK_ROWS, TILE_SIZE,
  MAX_PARTICLES,
} from '@core/Constants';
import { TileType } from '@world/ChunkTemplate';
import type { Chunk } from '@world/Chunk';
import type { Player } from '@entities/Player';
import { LayerStack } from './LayerStack';
import { sprites } from './SpriteLoader';
import biomesData from '@data/biomes.json';
import type { BiomePaletteData } from '@data/types';

type BiomePalette = BiomePaletteData;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// Build palette lookup from biome JSON data
const BIOME_PALETTES: Record<string, BiomePalette> = {};
for (const biome of biomesData) {
  BIOME_PALETTES[biome.id] = biome.palette as BiomePalette;
}

const ENTITY_PALETTE = {
  playerBody: '#44ddff',
  playerGlow: '#22aaff',
  playerDash: '#88eeff',
};

// (tile type mapping handled inline in drawChunkSprite)

// Animation speed constants (ms per frame)
const ANIM = {
  playerIdle: 150,       // 600ms / 4 frames
  playerFall: 67,        // 200ms / 3 frames
  playerBounce: 50,      // 150ms / 3 frames
  playerDash: 27,        // 80ms / 3 frames
  playerWallslide: 100,  // 300ms / 3 frames
  playerDeath: 120,
  enemyDefault: 150,
  hazardTile: 200,
  bounceTile: 400,
  acidPool: 300,
  darkness: 600,
  pickupBob: 200,
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private layers: LayerStack;
  private heartbeatPhase = 0;

  constructor(ctx: CanvasRenderingContext2D, camera: Camera) {
    this.ctx = ctx;
    this.camera = camera;
    this.layers = new LayerStack();
  }

  /** Get time-based animation frame index */
  private animFrame(totalFrames: number, msPerFrame: number): number {
    return Math.floor(Date.now() / msPerFrame) % totalFrames;
  }

  render(world: World, alpha: number): void {
    const ctx = this.ctx;
    const cam = this.camera;
    const biomeId = world.pacing.getBiomeId();
    const palette = BIOME_PALETTES[biomeId] ?? BIOME_PALETTES['surface_fracture']!;
    const useSprites = sprites.loaded;

    // ── Layer 0: Background ──
    {
      const bgCtx = this.layers.contexts[0]!;
      this.layers.clearLayer(0);
      bgCtx.fillStyle = palette.background;
      bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (useSprites) {
        this.drawBackgroundSprite(bgCtx, cam, biomeId);
      }
      // Always draw procedural effects on top (they add atmosphere)
      this.drawBackground(bgCtx, cam, palette);
    }

    // ── Layer 1: Tiles ──
    {
      const tileCtx = this.layers.contexts[1]!;
      this.layers.clearLayer(1);
      cam.applyTransform(tileCtx);
      for (const chunk of world.chunks) {
        if (!cam.isVisible(0, chunk.worldY, CANVAS_W, CHUNK_ROWS * TILE_SIZE)) continue;
        const chunkBiome = chunk.biomeId ?? biomeId;
        if (useSprites) {
          this.drawChunkSprite(tileCtx, chunk, cam, chunkBiome);
        } else {
          const chunkPalette = BIOME_PALETTES[chunkBiome] ?? palette;
          this.drawChunkFallback(tileCtx, chunk, cam, chunkPalette);
        }
      }
      cam.restore(tileCtx);
    }

    // ── Layer 2: Entities ──
    {
      const entCtx = this.layers.contexts[2]!;
      this.layers.clearLayer(2);
      cam.applyTransform(entCtx);

      // Pickups
      for (const p of world.pickupPool.active) {
        if (!p.active) continue;
        const rx = p.renderX(alpha);
        const ry = p.renderY(alpha) + p.bobOffset;
        if (useSprites) {
          this.drawPickupSprite(entCtx, p.type, rx, ry);
        } else {
          entCtx.fillStyle = p.getColor();
          entCtx.globalAlpha = 0.9;
          entCtx.fillRect(rx - 5, ry - 5, 10, 10);
          entCtx.globalAlpha = 0.3;
          entCtx.fillRect(rx - 7, ry - 7, 14, 14);
          entCtx.globalAlpha = 1;
        }
      }

      // Enemies
      for (const e of world.enemies) {
        if (!e.active) continue;
        const rx = e.renderX(alpha);
        const ry = e.renderY(alpha);

        if (useSprites) {
          this.drawEnemySprite(entCtx, e.spriteId, e.state, rx, ry, e.flashTimer > 0);
        } else {
          entCtx.fillStyle = e.flashTimer > 0 ? '#ffffff' : e.bodyColor;
          entCtx.fillRect(rx - e.hitbox.width / 2, ry - e.hitbox.height / 2, e.hitbox.width, e.hitbox.height);
          entCtx.globalAlpha = 0.3;
          entCtx.fillStyle = e.glowColor;
          entCtx.fillRect(rx - e.hitbox.width / 2 - 2, ry - e.hitbox.height / 2 - 2, e.hitbox.width + 4, e.hitbox.height + 4);
          entCtx.globalAlpha = 1;
          if (e.renderExtra) e.renderExtra(entCtx, rx, ry);
        }
      }

      // Enemy projectiles
      for (const p of world.enemyProjPool.active) {
        if (!p.active) continue;
        const rx = p.renderX(alpha);
        const ry = p.renderY(alpha);
        if (useSprites) {
          const drawn = sprites.drawImage(entCtx, 'projectiles/proj_enemy_default.png', rx - 2, ry - 2);
          if (!drawn) {
            entCtx.fillStyle = p.color;
            entCtx.fillRect(rx - 2, ry - 2, 4, 4);
          }
        } else {
          entCtx.fillStyle = p.glowColor;
          entCtx.globalAlpha = 0.4;
          entCtx.fillRect(rx - 4, ry - 4, 8, 8);
          entCtx.fillStyle = p.color;
          entCtx.globalAlpha = 1;
          entCtx.fillRect(rx - 2, ry - 2, 4, 4);
        }
      }

      // Player projectiles
      for (const p of world.projPool.active) {
        if (!p.active) continue;
        const rx = p.renderX(alpha);
        const ry = p.renderY(alpha);

        if (useSprites && p.projectileLength === 0) {
          const path = sprites.projectilePath(p.color);
          const img = sprites.get(path);
          if (img) {
            entCtx.drawImage(img, rx - img.width / 2, ry - img.height / 2);
          } else {
            entCtx.fillStyle = p.color;
            entCtx.fillRect(rx - 2, ry - 2, 4, 4);
          }
        } else if (p.projectileLength > 0) {
          // Beam Cutter — keep procedural (rotation needed)
          const angle = Math.atan2(p.vy, p.vx);
          const len = p.projectileLength;
          entCtx.save();
          entCtx.translate(rx, ry);
          entCtx.rotate(angle);
          if (useSprites) {
            const img = sprites.get('projectiles/proj_beam.png');
            if (img) {
              entCtx.drawImage(img, -len / 2, -1.5);
            }
          }
          // Always draw glow overlay for beam
          entCtx.fillStyle = p.glowColor;
          entCtx.globalAlpha = 0.3;
          entCtx.fillRect(-len / 2 - 1, -3, len + 2, 6);
          entCtx.globalAlpha = 1;
          entCtx.restore();
        } else {
          entCtx.fillStyle = p.glowColor;
          entCtx.globalAlpha = 0.4;
          entCtx.fillRect(rx - 4, ry - 4, 8, 8);
          entCtx.fillStyle = p.color;
          entCtx.globalAlpha = 1;
          entCtx.fillRect(rx - 2, ry - 2, 4, 4);
        }
      }

      // Drones
      for (const drone of world.weapons.getDrones()) {
        if (useSprites) {
          sprites.drawImage(entCtx, 'projectiles/drone.png', drone.x - 4, drone.y - 4);
        }
        // Always add glow
        entCtx.fillStyle = '#ddaa22';
        entCtx.globalAlpha = 0.4;
        entCtx.fillRect(drone.x - 5, drone.y - 5, 10, 10);
        entCtx.globalAlpha = 1;
      }

      // Player
      this.drawPlayer(entCtx, world.player, alpha, useSprites);

      cam.restore(entCtx);
    }

    // ── Layer 3: Particles/VFX ──
    {
      const vfxCtx = this.layers.contexts[3]!;
      this.layers.clearLayer(3);
      cam.applyTransform(vfxCtx);
      this.drawParticles(vfxCtx, world);
      cam.restore(vfxCtx);
    }

    // Composite
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    this.layers.composite(ctx);

    // Screen flash
    if (world.vfx.flashAlpha > 0) {
      ctx.globalAlpha = world.vfx.flashAlpha;
      ctx.fillStyle = world.vfx.flashColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    }

    // Near-death effects
    if (world.player.hp === 1 && world.player.hp > 0 && world.player.state !== 'DEAD') {
      this.heartbeatPhase += 1 / 60 * 6;
      const pulse = 0.15 + Math.sin(this.heartbeatPhase) * 0.1;
      const vigGrad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.2, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.55);
      vigGrad.addColorStop(0, 'transparent');
      vigGrad.addColorStop(1, `rgba(180, 0, 0, ${pulse})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 0.08 + Math.sin(this.heartbeatPhase * 0.5) * 0.04;
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      const edgePulse = Math.max(0, Math.sin(this.heartbeatPhase)) * 0.25;
      ctx.globalAlpha = edgePulse;
      const topGrad = ctx.createLinearGradient(0, 0, 0, 30);
      topGrad.addColorStop(0, '#ff0022');
      topGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, CANVAS_W, 30);
      const botGrad = ctx.createLinearGradient(0, CANVAS_H, 0, CANVAS_H - 30);
      botGrad.addColorStop(0, '#ff0022');
      botGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 30);
      ctx.globalAlpha = 1;
    } else {
      this.heartbeatPhase = 0;
    }

    // Void Core darkness
    if (world.darknessRadius > 0) {
      const px = world.player.renderX(alpha);
      const py = world.player.renderY(alpha);
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPRITE-BASED RENDERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Draw parallax background images */
  private drawBackgroundSprite(ctx: Ctx, cam: Camera, biomeId: string): void {
    const layers: Array<{ key: 'far' | 'mid' | 'near'; speed: number; alpha: number }> = [
      { key: 'far',  speed: 0.05, alpha: 0.6 },
      { key: 'mid',  speed: 0.15, alpha: 0.4 },
      { key: 'near', speed: 0.3,  alpha: 0.3 },
    ];
    for (const layer of layers) {
      const path = sprites.bgPath(biomeId, layer.key);
      const img = sprites.get(path);
      if (!img) continue;
      const offsetY = -(cam.y * layer.speed) % CANVAS_H;
      ctx.globalAlpha = layer.alpha;
      ctx.drawImage(img, 0, offsetY, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, offsetY + CANVAS_H, CANVAS_W, CANVAS_H);
    }
    ctx.globalAlpha = 1;
  }

  /** Draw tiles using sprite sheets */
  private drawChunkSprite(ctx: Ctx, chunk: Chunk, cam: Camera, biomeId: string): void {
    for (let row = 0; row < CHUNK_ROWS; row++) {
      const wy = chunk.worldY + row * TILE_SIZE;
      if (wy + TILE_SIZE < cam.top || wy > cam.bottom) continue;

      for (let col = 0; col < CHUNK_COLS; col++) {
        const tile = chunk.getTile(col, row);
        if (tile === TileType.EMPTY) continue;
        const wx = col * TILE_SIZE;

        switch (tile) {
          case TileType.SOLID: {
            const variant = ((col * 7 + row * 13) & 3); // deterministic 0-3
            const path = sprites.tilePath('solid', biomeId);
            if (!sprites.drawFrame(ctx, path, variant, TILE_SIZE, TILE_SIZE, wx, wy)) {
              const palette = BIOME_PALETTES[biomeId];
              if (palette) { ctx.fillStyle = palette.tile; ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE); }
            }
            break;
          }
          case TileType.PLATFORM: {
            const path = sprites.tilePath('platform', biomeId);
            // Frame 0 = idle
            if (!sprites.drawFrame(ctx, path, 0, TILE_SIZE, TILE_SIZE, wx, wy)) {
              const palette = BIOME_PALETTES[biomeId];
              if (palette) { ctx.fillStyle = palette.platform; ctx.fillRect(wx, wy, TILE_SIZE, 4); }
            }
            break;
          }
          case TileType.HAZARD: {
            const frame = this.animFrame(4, ANIM.hazardTile);
            const path = sprites.tilePath('hazard', biomeId);
            if (!sprites.drawFrame(ctx, path, frame, TILE_SIZE, TILE_SIZE, wx, wy)) {
              const palette = BIOME_PALETTES[biomeId];
              if (palette) {
                ctx.fillStyle = palette.hazard;
                ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
                ctx.fillRect(wx + 2, wy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.globalAlpha = 1;
              }
            }
            break;
          }
          case TileType.BREAKABLE: {
            const dur = chunk.getTileDurability(col, row);
            // Frames: 0=intact, 1-2=cracking, 3-6=breaking
            const frame = dur >= 3 ? 0 : dur === 2 ? 1 : dur === 1 ? 2 : Math.min(6, 3 + this.animFrame(4, 50));
            const path = sprites.tilePath('breakable', biomeId);
            if (!sprites.drawFrame(ctx, path, frame, TILE_SIZE, TILE_SIZE, wx, wy)) {
              const palette = BIOME_PALETTES[biomeId];
              if (palette) {
                ctx.fillStyle = palette.breakable;
                ctx.globalAlpha = 0.5 + (dur / 3) * 0.5;
                ctx.fillRect(wx + 1, wy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.globalAlpha = 1;
              }
            }
            break;
          }
          case TileType.BOUNCE: {
            const frame = this.animFrame(2, ANIM.bounceTile); // idle: frames 0-1
            const path = sprites.tilePath('bounce', biomeId);
            if (!sprites.drawFrame(ctx, path, frame, TILE_SIZE, TILE_SIZE, wx, wy)) {
              const palette = BIOME_PALETTES[biomeId];
              if (palette) {
                ctx.fillStyle = palette.bounce;
                ctx.fillRect(wx, wy + TILE_SIZE - 6, TILE_SIZE, 6);
              }
            }
            break;
          }
          case TileType.ACID_POOL: {
            const frame = this.animFrame(4, ANIM.acidPool);
            if (!sprites.drawFrame(ctx, 'tiles/acid_pool.png', frame, TILE_SIZE, TILE_SIZE, wx, wy)) {
              ctx.fillStyle = '#88ff22';
              ctx.globalAlpha = 0.5;
              ctx.fillRect(wx, wy + TILE_SIZE - 8, TILE_SIZE, 8);
              ctx.globalAlpha = 1;
            }
            break;
          }
          case TileType.LASER: {
            const laserPhase = (Date.now() / 1000) % 4;
            const active = laserPhase < 1;
            const emitterFrame = active ? 0 : 1;
            if (!sprites.drawFrame(ctx, 'tiles/laser_emitter.png', emitterFrame, TILE_SIZE, TILE_SIZE, wx, wy)) {
              ctx.fillStyle = active ? '#cc44ff' : '#442266';
              ctx.globalAlpha = active ? 0.7 : 0.3;
              ctx.fillRect(wx, wy + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
              ctx.globalAlpha = 1;
            }
            break;
          }
          case TileType.DARKNESS: {
            const frame = this.animFrame(3, ANIM.darkness);
            if (!sprites.drawFrame(ctx, 'tiles/darkness_fog.png', frame, TILE_SIZE, TILE_SIZE, wx, wy)) {
              ctx.fillStyle = '#000000';
              ctx.globalAlpha = 0.3;
              ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
              ctx.globalAlpha = 1;
            }
            break;
          }
        }
      }
    }
  }

  /** Draw player using sprite sheets */
  private drawPlayerSprite(ctx: Ctx, player: Player, alpha: number): void {
    const rx = player.renderX(alpha);
    const ry = player.renderY(alpha);

    // Map state to sprite sheet — player.state is never 'IDLE', use FALLING as default
    const stateKey = player.state;
    const sheet = sprites.playerSheet(stateKey);
    if (!sheet) return;

    const path = `player/${sheet.file}`;
    const fw = sheet.w;
    const fh = sheet.h;

    // Calculate animation frame
    let frameIdx: number;
    const msPerFrame = stateKey === 'FALLING' ? ANIM.playerFall :
                       stateKey === 'DASHING' ? ANIM.playerDash :
                       stateKey === 'BOUNCING' ? ANIM.playerBounce :
                       stateKey === 'WALL_SLIDING' ? ANIM.playerWallslide :
                       stateKey === 'DEAD' ? ANIM.playerDeath :
                       stateKey === 'STOMPING' ? 100 :
                       stateKey === 'STOMP_STARTUP' ? 50 : ANIM.playerIdle;

    if (stateKey === 'DEAD' || stateKey === 'DASHING' || stateKey === 'BOUNCING' || stateKey === 'STOMP_STARTUP') {
      // One-shot: clamp to last frame based on stateTimer
      const elapsed = player.stateTimer * 1000;
      frameIdx = Math.min(sheet.frames - 1, Math.floor(elapsed / msPerFrame));
    } else {
      // Looping
      frameIdx = this.animFrame(sheet.frames, msPerFrame);
    }

    // Invulnerability blink
    if (player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Glow halo (procedural, below sprite)
    ctx.fillStyle = ENTITY_PALETTE.playerGlow;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * 0.2;
    ctx.fillRect(rx - fw / 2 - 4, ry - fh / 2 - 4, fw + 8, fh + 8);
    ctx.globalAlpha = prevAlpha;

    // Draw sprite frame
    sprites.drawFrame(ctx, path, frameIdx, fw, fh, rx - fw / 2, ry - fh / 2);

    // Hit flash overlay
    if (player.isInvulnerable) {
      sprites.drawImage(ctx, 'player/player_invuln_flash.png', rx - fw / 2, ry - fh / 2);
    }

    // Stomp trail effect (procedural)
    if (player.state === 'STOMPING') {
      ctx.fillStyle = '#ff6622';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(rx - 6, ry - fh / 2 - 8, 12, 8);
      ctx.fillStyle = '#ffaa44';
      ctx.globalAlpha = 0.25;
      ctx.fillRect(rx - 4, ry - fh / 2 - 16, 8, 8);
    }

    // Dash trail (procedural)
    if (player.state === 'DASHING') {
      ctx.fillStyle = ENTITY_PALETTE.playerDash;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(rx - 6, ry + fh / 2, 12, 12);
    }

    // Wall slide sparks (procedural)
    if (player.state === 'WALL_SLIDING') {
      const wallSide = player.touchingWallLeft ? -fw / 2 : fw / 2;
      ctx.fillStyle = '#ffcc44';
      ctx.globalAlpha = 0.5 + Math.random() * 0.3;
      ctx.fillRect(rx + wallSide - 1, ry - 2 + Math.random() * 8, 2, 2);
      ctx.fillRect(rx + wallSide - 1, ry + 4 + Math.random() * 8, 2, 2);
    }

    ctx.globalAlpha = 1;
  }

  /** Draw enemy using sprite sheet */
  private drawEnemySprite(ctx: Ctx, spriteId: string, state: string, rx: number, ry: number, flashing: boolean): void {
    const [sw, sh] = sprites.enemySpriteSize(spriteId);
    const path = `enemies/${spriteId}.png`;
    const info = sprites.enemyFrameInfo(spriteId, state);

    // Animated frame within state
    const frameInState = info.frameCount > 1
      ? this.animFrame(info.frameCount, ANIM.enemyDefault)
      : 0;
    const frameIdx = info.startFrame + frameInState;

    // Draw sprite
    const drawn = sprites.drawFrame(ctx, path, frameIdx, sw, sh, rx - sw / 2, ry - sh / 2);

    if (!drawn) {
      // Fallback to colored rect
      ctx.fillStyle = flashing ? '#ffffff' : '#ff4466';
      ctx.fillRect(rx - sw / 2 + 2, ry - sh / 2 + 2, sw - 4, sh - 4);
      return;
    }

    // Hit flash overlay
    if (flashing) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx - sw / 2, ry - sh / 2, sw, sh);
      ctx.globalAlpha = 1;
    }
  }

  /** Draw pickup using sprite sheet */
  private drawPickupSprite(ctx: Ctx, type: string, rx: number, ry: number): void {
    const sheet = sprites.pickupSheet(type);
    if (!sheet) {
      // Fallback
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(rx - 5, ry - 5, 10, 10);
      return;
    }
    const frame = this.animFrame(sheet.frames, ANIM.pickupBob);
    const path = `pickups/${sheet.file}`;
    if (!sprites.drawFrame(ctx, path, frame, sheet.w, sheet.h, rx - sheet.w / 2, ry - sheet.h / 2)) {
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(rx - 5, ry - 5, 10, 10);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PLAYER RENDERING (dispatches to sprite or fallback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private drawPlayer(ctx: Ctx, player: Player, alpha: number, useSprites: boolean): void {
    if (player.state === 'DEAD') {
      if (useSprites) {
        // Draw death animation
        const sheet = sprites.playerSheet('DEAD')!;
        const elapsed = player.stateTimer * 1000;
        const frame = Math.min(sheet.frames - 1, Math.floor(elapsed / ANIM.playerDeath));
        const rx = player.renderX(alpha);
        const ry = player.renderY(alpha);
        sprites.drawFrame(ctx, `player/${sheet.file}`, frame, sheet.w, sheet.h, rx - sheet.w / 2, ry - sheet.h / 2);
      }
      return;
    }

    if (useSprites) {
      this.drawPlayerSprite(ctx, player, alpha);
    } else {
      this.drawPlayerFallback(ctx, player, alpha);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FALLBACK PROCEDURAL RENDERING (original code)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private drawPlayerFallback(ctx: Ctx, player: Player, alpha: number): void {
    const rx = player.renderX(alpha);
    const ry = player.renderY(alpha);
    const hw = player.hitbox.width / 2;
    const hh = player.hitbox.height / 2;

    if (player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.fillStyle = ENTITY_PALETTE.playerGlow;
    ctx.globalAlpha *= 0.15;
    ctx.fillRect(rx - hw - 6, ry - hh - 6, player.hitbox.width + 12, player.hitbox.height + 12);
    ctx.globalAlpha = player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0 ? 0.4 : 1;

    ctx.fillStyle = ENTITY_PALETTE.playerGlow;
    ctx.globalAlpha *= 0.3;
    ctx.fillRect(rx - hw - 3, ry - hh - 3, player.hitbox.width + 6, player.hitbox.height + 6);
    ctx.globalAlpha = player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0 ? 0.4 : 1;

    const bodyColor = player.state === 'DASHING' ? ENTITY_PALETTE.playerDash :
                      player.state === 'STOMPING' ? '#ff8844' : ENTITY_PALETTE.playerBody;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(rx - hw, ry - hh, player.hitbox.width, player.hitbox.height);

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha *= 0.6;
    ctx.fillRect(rx - hw, ry - hh, 3, 3);
    ctx.fillRect(rx + hw - 3, ry - hh, 3, 3);
    ctx.globalAlpha = player.isInvulnerable && Math.floor(player.invulnTimer * 10) % 2 === 0 ? 0.4 : 1;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - 4, ry - 4, 3, 3);
    ctx.fillRect(rx + 2, ry - 4, 3, 3);

    if (player.state === 'STOMPING') {
      ctx.fillStyle = '#ff6622';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(rx - hw + 2, ry - hh - 8, player.hitbox.width - 4, 8);
      ctx.fillStyle = '#ffaa44';
      ctx.globalAlpha = 0.25;
      ctx.fillRect(rx - hw + 4, ry - hh - 16, player.hitbox.width - 8, 8);
      ctx.globalAlpha = 1;
    }

    if (player.state === 'DASHING') {
      ctx.fillStyle = ENTITY_PALETTE.playerDash;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(rx - hw, ry + hh, player.hitbox.width, 12);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.1;
      ctx.fillRect(rx - hw + 2, ry + hh + 8, player.hitbox.width - 4, 8);
      ctx.globalAlpha = 1;
    }

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

  /** Fallback tile rendering (original procedural code) */
  private drawChunkFallback(ctx: Ctx, chunk: Chunk, cam: Camera, palette: BiomePalette): void {
    for (let row = 0; row < CHUNK_ROWS; row++) {
      const wy = chunk.worldY + row * TILE_SIZE;
      if (wy + TILE_SIZE < cam.top || wy > cam.bottom) continue;
      for (let col = 0; col < CHUNK_COLS; col++) {
        const tile = chunk.getTile(col, row);
        if (tile === TileType.EMPTY) continue;
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
            ctx.strokeStyle = '#665533';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(wx + 5, wy + 5);
            ctx.lineTo(wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
            if (dur <= 2) { ctx.moveTo(wx + TILE_SIZE - 5, wy + 5); ctx.lineTo(wx + TILE_SIZE / 2, wy + TILE_SIZE / 2); }
            if (dur <= 1) { ctx.lineTo(wx + TILE_SIZE - 5, wy + TILE_SIZE - 5); ctx.moveTo(wx + 5, wy + TILE_SIZE - 5); ctx.lineTo(wx + TILE_SIZE / 2, wy + TILE_SIZE / 2); }
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
            ctx.globalAlpha = 1;
            break;
          case TileType.LASER: {
            const phase = (Date.now() / 1000) % 4;
            const on = phase < 1;
            ctx.fillStyle = on ? '#cc44ff' : '#442266';
            ctx.globalAlpha = on ? 0.7 : 0.3;
            ctx.fillRect(wx, wy + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
            ctx.globalAlpha = 1;
            break;
          }
          case TileType.DARKNESS:
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1;
            break;
        }
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROCEDURAL BACKGROUND (kept for atmosphere overlay)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private drawBackground(ctx: Ctx, cam: Camera, palette: BiomePalette): void {
    ctx.strokeStyle = palette.backgroundLine1;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    const farOffsetX = (cam.y * 0.02) % 60;
    for (let x = -farOffsetX; x < CANVAS_W + 60; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    const farOffsetY = (cam.y * 0.05) % 80;
    for (let y = -farOffsetY; y < CANVAS_H + 80; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = palette.backgroundLine2;
    const midOffset = (cam.y * 0.1) % 120;
    for (let y = -midOffset; y < CANVAS_H + 120; y += 120) {
      ctx.fillRect(0, y, CANVAS_W, 40);
    }

    ctx.strokeStyle = palette.backgroundLine1;
    ctx.globalAlpha = 0.12;
    const nearOffset = (cam.y * 0.2) % 30;
    for (let x = -nearOffset % 30; x < CANVAS_W + 30; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = palette.backgroundLine1;
    const particleOffset = cam.y * 0.08;
    for (let i = 0; i < 20; i++) {
      const seed = i * 137.5;
      const px = ((seed * 7.3 + particleOffset * 0.3) % CANVAS_W);
      const py = ((seed * 13.7 + particleOffset) % CANVAS_H);
      const size = 1 + (i % 4);
      ctx.fillRect(px, py, size, size);
    }

    this.drawBiomeBackground(ctx, cam, palette);
    ctx.globalAlpha = 1;
  }

  private drawBiomeBackground(ctx: Ctx, cam: Camera, palette: BiomePalette): void {
    const depth = cam.y;
    const time = Date.now() / 1000;

    if (depth < 2000) {
      ctx.fillStyle = palette.backgroundLine1; ctx.globalAlpha = 0.12;
      for (let i = 0; i < 8; i++) {
        const seed = i * 97.3;
        const px = (seed * 3.7) % CANVAS_W;
        const py = (seed * 11.3 + time * 30 + cam.y * 0.03) % CANVAS_H;
        ctx.fillRect(px, py, 1 + (i % 3), 2 + (i % 4));
      }
      ctx.globalAlpha = 0.06 + Math.sin(time * 2 + 1.3) * 0.03; ctx.fillStyle = '#44ddff';
      for (let i = 0; i < 4; i++) {
        const lx = (i * 89 + 20) % CANVAS_W; const ly = (i * 137 + cam.y * 0.01) % CANVAS_H;
        if (Math.sin(time * (3 + i) + i * 2.7) > 0.3) ctx.fillRect(lx, ly, 2, 2);
      }
    }

    if (depth >= 2000 && depth < 4000) {
      ctx.strokeStyle = palette.backgroundLine2; ctx.lineWidth = 2;
      ctx.globalAlpha = 0.08 + Math.sin(time * 1.5) * 0.03;
      const vo = cam.y * 0.06;
      for (let i = 0; i < 3; i++) {
        const bx = (i * 120 + 30) % CANVAS_W; ctx.beginPath();
        for (let y = 0; y < CANVAS_H; y += 20) { const x = bx + Math.sin((y + vo) * 0.03 + i) * 15; y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.fillStyle = '#ff44aa'; ctx.globalAlpha = 0.1;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect((i * 57 + 10) % CANVAS_W, (time * 40 + i * 107 + cam.y * 0.08) % CANVAS_H, 1, 3 + (i % 3));
      }
    }

    if (depth >= 4000 && depth < 6000) {
      ctx.fillStyle = palette.backgroundLine2; ctx.globalAlpha = 0.08;
      const so = cam.y * 0.25;
      for (let i = 0; i < 8; i++) { ctx.fillRect((i * 47 + so * 0.1) % CANVAS_W, (so * (1 + i * 0.2) + i * 43) % CANVAS_H, 2, 10 + (i * 17 % 40)); }
      ctx.fillStyle = '#44ffaa'; ctx.globalAlpha = 0.03;
      const gs = Math.floor(time * 4);
      for (let i = 0; i < 3; i++) { ctx.fillRect(((gs * 53 + i * 139) % CANVAS_W), ((gs * 73 + i * 211) % CANVAS_H), 20 + ((gs * 37 + i * 97) % 60), 2); }
    }

    if (depth >= 6000 && depth < 7500) {
      for (let i = 0; i < 6; i++) {
        const seed = i * 127.7;
        const lx = (seed * 2.3 + Math.sin(time * 0.5 + i * 1.8) * 20) % CANVAS_W;
        const ly = (seed * 5.1 + cam.y * 0.04 + Math.sin(time * 0.7 + i) * 10) % CANVAS_H;
        const glow = 0.08 + Math.sin(time * 1.2 + i * 2.1) * 0.04;
        ctx.fillStyle = '#ffcc88'; ctx.globalAlpha = glow; ctx.fillRect(lx - 3, ly - 3, 6, 6);
        ctx.globalAlpha = glow * 0.4; ctx.fillRect(lx - 6, ly - 6, 12, 12);
      }
    }

    if (depth >= 7500 && depth < 9500) {
      ctx.fillStyle = '#ff6622'; ctx.globalAlpha = 0.15;
      for (let i = 0; i < 10; i++) {
        const ey = CANVAS_H - ((time * 50 + i * 67 + cam.y * 0.05) % CANVAS_H);
        ctx.globalAlpha = 0.1 + (ey / CANVAS_H) * 0.1;
        ctx.fillRect((i * 37 + 15) % CANVAS_W, ey, 1 + (i % 2), 1 + (i % 2));
      }
    }

    if (depth >= 9500) {
      ctx.fillStyle = '#ff0011'; ctx.globalAlpha = 0.03;
      for (let i = 0; i < 12; i++) { ctx.fillRect(Math.random() * CANVAS_W, Math.random() * CANVAS_H, 1 + Math.random() * 4, 1); }
      const vp = 0.04 + Math.sin(time * 2) * 0.02;
      const vg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.2, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.6);
      vg.addColorStop(0, 'transparent'); vg.addColorStop(1, `rgba(120, 0, 0, ${vp})`);
      ctx.fillStyle = vg; ctx.globalAlpha = 1; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    ctx.globalAlpha = 1;
  }

  private drawParticles(ctx: Ctx, world: World): void {
    const particles = world.vfx.particles.particles;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i]!;
      if (!p.active) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
