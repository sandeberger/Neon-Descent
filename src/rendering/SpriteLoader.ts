/**
 * SpriteLoader — loads all game sprites from public/assets/ and provides
 * frame-based access for sprite sheet rendering.
 */

const ASSET_BASE = '/assets';

// ── Frame layout data per enemy (cumulative offsets) ──
// Each entry: [stateName, frameCount]
const ENEMY_FRAME_MAP: Record<string, [string, number][]> = {
  hopper:           [['IDLE',3],['BOUNCING',2],['HIT',1],['DEAD',3]],
  splitter:         [['IDLE',3],['HIT',1],['DEAD',4]],
  splitter_fragment:[['IDLE',2],['DEAD',2]],
  leech:            [['IDLE',3],['CHASING',2],['HIT',1],['DEAD',3]],
  swarm_drone:      [['IDLE',2],['DEAD',2]],
  turret_bloom:     [['IDLE',4],['CHARGING',3],['FIRING',2],['HIT',1],['DEAD',4]],
  parasite_cloud:   [['IDLE',3],['DEAD',2]],
  rail_sentinel:    [['IDLE',3],['MOVING',2],['FIRING',2],['HIT',1],['DEAD',4]],
  bomber:           [['IDLE',3],['THROWING',3],['HIT',1],['DEAD',4]],
  shield_bug:       [['IDLE',3],['ADVANCING',2],['HIT',1],['EXPOSED',2],['DEAD',3]],
  mirror:           [['IDLE',3],['REFLECTING',2],['HIT',1],['DEAD',3]],
  ambusher:         [['HIDDEN',2],['REVEALING',2],['ATTACKING',2],['HIT',1],['DEAD',3]],
  core_carrier:     [['IDLE',4],['HIT',2],['LOW_HP',3],['DEAD',5]],
  sentinel_miniboss:[['IDLE',4],['ATTACK_A',4],['ATTACK_B',3],['ENRAGE',2],['DEAD',6]],
  data_guardian:    [['IDLE',4],['TELEPORTING',3],['CHARGING',3],['FIRING',2],['PHASE2',1],['DEAD',5]],
  bloom_heart:      [['IDLE',4],['TENTACLE',4],['SPORE',3],['VULNERABLE',3],['DEAD',8]],
  acid_wyrm:        [['IDLE',4],['ATTACKING',3],['BURROWING',4],['DEAD',5]],
  acid_wyrm_seg:    [['IDLE',2]],
  drill_mother:     [['IDLE',4],['DRILLING',3],['CHARGING',3],['SPAWNING',3],['DEAD',8]],
  swarm_mother:     [['IDLE',4],['SPAWNING',4],['HIT',1],['DEAD',4]],
};

// Sprite size per enemy
const ENEMY_SPRITE_SIZE: Record<string, [number, number]> = {
  hopper: [28,28], splitter: [30,30], splitter_fragment: [18,18],
  leech: [22,22], swarm_drone: [16,16], turret_bloom: [32,32],
  parasite_cloud: [18,18], rail_sentinel: [30,30], bomber: [24,24],
  shield_bug: [28,24], mirror: [28,28], ambusher: [26,26],
  core_carrier: [40,40], sentinel_miniboss: [48,48], data_guardian: [52,52],
  bloom_heart: [64,64], acid_wyrm: [52,52], acid_wyrm_seg: [24,24],
  drill_mother: [68,68], swarm_mother: [36,36],
};

// Player sprite sizes and frame counts
const PLAYER_SHEETS: Record<string, { file: string; frames: number; w: number; h: number }> = {
  FALLING:       { file: 'player_fall.png',        frames: 3, w: 24, h: 32 },
  STOMP_STARTUP: { file: 'player_stomp_start.png', frames: 2, w: 24, h: 32 },
  STOMPING:      { file: 'player_stomp.png',       frames: 2, w: 24, h: 32 },
  BOUNCING:      { file: 'player_bounce.png',      frames: 3, w: 24, h: 32 },
  DASHING:       { file: 'player_dash.png',        frames: 3, w: 24, h: 32 },
  WALL_SLIDING:  { file: 'player_wallslide.png',   frames: 3, w: 24, h: 32 },
  DEAD:          { file: 'player_death.png',       frames: 5, w: 24, h: 32 },
  IDLE:          { file: 'player_idle.png',        frames: 4, w: 24, h: 32 },
};

// Pickup frame data
const PICKUP_SHEETS: Record<string, { file: string; frames: number; w: number; h: number }> = {
  heal:           { file: 'pickup_health.png',  frames: 4, w: 12, h: 12 },
  currency:       { file: 'pickup_shard.png',   frames: 3, w: 10, h: 10 },
  energy:         { file: 'pickup_emp.png',     frames: 3, w: 14, h: 14 },
  combo_extender: { file: 'pickup_weapon.png',  frames: 4, w: 16, h: 16 },
};

// Projectile sprites (single frame unless noted)
const PROJECTILE_MAP: Record<string, string> = {
  '#ffff44': 'proj_pulse.png',    // Pulse Rifle
  '#ff6644': 'proj_scatter.png',  // Scatter Cannon
  '#ff2244': 'proj_beam.png',     // Beam Cutter
  '#44ffaa': 'proj_ricochet.png', // Ricochet
  '#44ddff': 'proj_chain.png',    // Chain Shock
  '#88ff22': 'proj_acid.png',     // Acid Scatter
  '#ffcc44': 'proj_pulse.png',    // Drone (fallback)
};

export interface FrameInfo {
  startFrame: number;
  frameCount: number;
}

export class SpriteLoader {
  private images = new Map<string, HTMLImageElement>();
  private _loaded = false;
  private _loading = false;

  get loaded(): boolean { return this._loaded; }

  /** Load all game assets. Call once at boot. */
  async loadAll(): Promise<void> {
    if (this._loading || this._loaded) return;
    this._loading = true;

    const paths: string[] = [];

    // Tiles
    const biomes = ['surface_fracture','neon_gut','data_crypt','hollow_market','molten_grid','void_core'];
    const tileTypes = ['solid','platform','hazard','breakable','bounce'];
    for (const b of biomes) {
      for (const t of tileTypes) {
        paths.push(`tiles/${t}_${b}.png`);
      }
    }
    paths.push('tiles/acid_pool.png', 'tiles/laser_emitter.png', 'tiles/laser_beam.png', 'tiles/darkness_fog.png');

    // Backgrounds
    const bgNames = ['surface','neongut','datacrypt','hollowmarket','moltengrid','voidcore'];
    for (const n of bgNames) {
      for (const layer of ['far','mid','near']) {
        paths.push(`backgrounds/bg_${n}_${layer}.png`);
      }
    }

    // Player
    for (const s of Object.values(PLAYER_SHEETS)) {
      paths.push(`player/${s.file}`);
    }
    paths.push('player/player_invuln_flash.png');
    for (const dir of ['up','down','left','right']) {
      paths.push(`player/player_fire_${dir}.png`);
    }

    // Enemies
    for (const id of Object.keys(ENEMY_FRAME_MAP)) {
      paths.push(`enemies/${id}.png`);
    }

    // Projectiles
    const projFiles = new Set(Object.values(PROJECTILE_MAP));
    for (const f of projFiles) paths.push(`projectiles/${f}`);
    paths.push('projectiles/proj_enemy_default.png', 'projectiles/proj_turret.png',
               'projectiles/proj_bomb.png', 'projectiles/proj_acid_spit.png',
               'projectiles/proj_laser_beam.png', 'projectiles/chain_arc.png', 'projectiles/drone.png');

    // Pickups
    for (const s of Object.values(PICKUP_SHEETS)) {
      paths.push(`pickups/${s.file}`);
    }

    // UI
    const uiFiles = [
      'ui_heart_full.png','ui_heart_empty.png','ui_heart_half.png',
      'ui_combo_bar.png','ui_combo_tier_0.png','ui_combo_tier_1.png',
      'ui_combo_tier_2.png','ui_combo_tier_3.png','ui_combo_tier_4.png',
      'ui_digits_0-9.png','ui_depth_bar.png','ui_heat_bar.png',
      'ui_dash_full.png','ui_dash_empty.png','ui_emp_ready.png','ui_emp_empty.png',
      'ui_logo.png','ui_menu_bg.png',
      'ui_button_normal.png','ui_button_hover.png','ui_button_pressed.png',
      'ui_death_overlay.png','ui_shop_frame.png',
    ];
    for (const f of uiFiles) paths.push(`ui/${f}`);

    // VFX
    const vfxFiles = [
      'vfx_stomp_wave.png','vfx_dash_trail.png','vfx_explosion_small.png',
      'vfx_explosion_boss.png','vfx_heal_sparkle.png','vfx_combo_fire.png',
      'vfx_wallspark.png','vfx_bounce.png','vfx_nearmiss.png',
      'vfx_biom_transition.png','vfx_attract.png','vfx_muzzle.png',
      'vfx_impact.png','vfx_enemy_hit.png',
    ];
    for (const f of vfxFiles) paths.push(`vfx/${f}`);

    // Load all in parallel
    const results = await Promise.all(paths.map(p => this.loadImage(p)));
    const loaded = results.filter(Boolean).length;
    const failed = results.length - loaded;
    console.log(`[SpriteLoader] ${loaded}/${results.length} sprites loaded, ${failed} failed`);
    if (failed > 0 && this.images.size === 0) {
      console.warn('[SpriteLoader] ALL sprites failed to load — check asset paths');
    }
    this._loaded = true;
    this._loading = false;
    // Debug: expose on window
    (window as any).__sprites = this;
  }

  private loadImage(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(path, img);
        resolve(true);
      };
      img.onerror = () => {
        console.warn(`[SpriteLoader] Failed: ${ASSET_BASE}/${path}`);
        resolve(false);
      };
      img.src = `${ASSET_BASE}/${path}`;
    });
  }

  /** Get a loaded image by path (relative to assets/) */
  get(path: string): HTMLImageElement | undefined {
    return this.images.get(path);
  }

  /** Draw a specific frame from a horizontal sprite sheet */
  drawFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    path: string,
    frameIndex: number,
    frameW: number,
    frameH: number,
    destX: number,
    destY: number,
  ): boolean {
    const img = this.images.get(path);
    if (!img) return false;
    const sx = frameIndex * frameW;
    ctx.drawImage(img, sx, 0, frameW, frameH, destX, destY, frameW, frameH);
    return true;
  }

  /** Draw a full image (not a sheet) */
  drawImage(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    path: string,
    destX: number,
    destY: number,
    destW?: number,
    destH?: number,
  ): boolean {
    const img = this.images.get(path);
    if (!img) return false;
    if (destW !== undefined && destH !== undefined) {
      ctx.drawImage(img, destX, destY, destW, destH);
    } else {
      ctx.drawImage(img, destX, destY);
    }
    return true;
  }

  // ── Convenience accessors ──

  /** Get tile sprite sheet path for a biome */
  tilePath(type: string, biomeId: string): string {
    return `tiles/${type}_${biomeId}.png`;
  }

  /** Get background path */
  bgPath(biomeId: string, layer: 'far' | 'mid' | 'near'): string {
    const nameMap: Record<string, string> = {
      surface_fracture: 'surface', neon_gut: 'neongut', data_crypt: 'datacrypt',
      hollow_market: 'hollowmarket', molten_grid: 'moltengrid', void_core: 'voidcore',
    };
    return `backgrounds/bg_${nameMap[biomeId] ?? 'surface'}_${layer}.png`;
  }

  /** Get player sprite info for a state */
  playerSheet(state: string): typeof PLAYER_SHEETS[string] | undefined {
    return PLAYER_SHEETS[state] ?? PLAYER_SHEETS['IDLE'];
  }

  /** Get enemy frame info for a state, returns {startFrame, frameCount} */
  enemyFrameInfo(spriteId: string, enemyState: string): FrameInfo {
    const map = ENEMY_FRAME_MAP[spriteId];
    if (!map) return { startFrame: 0, frameCount: 1 };

    // Map common enemy states to sprite states
    const stateMapping: Record<string, string> = {
      'IDLE': 'IDLE', 'BOUNCING': 'BOUNCING', 'CHASING': 'CHASING',
      'CHARGING': 'CHARGING', 'FIRING': 'FIRING', 'MOVING': 'MOVING',
      'THROWING': 'THROWING', 'ADVANCING': 'ADVANCING', 'EXPOSED': 'EXPOSED',
      'REFLECTING': 'REFLECTING', 'HIDDEN': 'HIDDEN', 'REVEALING': 'REVEALING',
      'ATTACKING': 'ATTACKING', 'LOW_HP': 'LOW_HP', 'ATTACK_A': 'ATTACK_A',
      'ATTACK_B': 'ATTACK_B', 'ENRAGE': 'ENRAGE', 'TELEPORTING': 'TELEPORTING',
      'TENTACLE': 'TENTACLE', 'SPORE': 'SPORE', 'VULNERABLE': 'VULNERABLE',
      'BURROWING': 'BURROWING', 'DRILLING': 'DRILLING', 'SPAWNING': 'SPAWNING',
      'PHASE2': 'PHASE2',
    };

    const mappedState = stateMapping[enemyState] ?? 'IDLE';
    let offset = 0;
    for (const [name, count] of map) {
      if (name === mappedState) return { startFrame: offset, frameCount: count };
      offset += count;
    }
    // Fallback to IDLE (first entry)
    return { startFrame: 0, frameCount: map[0]?.[1] ?? 1 };
  }

  /** Get enemy sprite dimensions */
  enemySpriteSize(spriteId: string): [number, number] {
    return ENEMY_SPRITE_SIZE[spriteId] ?? [28, 28];
  }

  /** Get projectile sprite path from color */
  projectilePath(color: string): string {
    return `projectiles/${PROJECTILE_MAP[color] ?? 'proj_pulse.png'}`;
  }

  /** Get pickup sheet info */
  pickupSheet(type: string): typeof PICKUP_SHEETS[string] | undefined {
    return PICKUP_SHEETS[type];
  }
}

// Singleton instance
export const sprites = new SpriteLoader();
