import balance from '@data/balance.json';

// Fixed timestep
export const FIXED_DT       = 1 / 60;
export const MAX_FRAME_DT   = 0.1;

// Logical canvas (structural — not tunable)
export const CANVAS_W       = 360;
export const CANVAS_H       = 640;

// Tile grid (structural)
export const TILE_SIZE      = 30;
export const CHUNK_COLS     = 12;   // 360 / 30
export const CHUNK_ROWS     = 21;   // ~630px
export const CHUNK_HEIGHT   = CHUNK_ROWS * TILE_SIZE;

// Physics defaults (from balance.json)
export const GRAVITY            = balance.physics.gravity;
export const TERMINAL_VELOCITY  = balance.physics.terminalVelocity;
export const MOVE_ACCEL         = balance.physics.moveAccel;
export const MOVE_DECEL         = balance.physics.moveDecel;
export const MAX_MOVE_SPEED     = balance.physics.maxMoveSpeed;
export const AIR_STEER          = balance.physics.airSteer;

export const STOMP_SPEED        = balance.stomp.speed;
export const STOMP_BOUNCE       = balance.stomp.bounce;
export const STOMP_STARTUP_MS   = balance.stomp.startupMs;

export const DASH_SPEED         = balance.dash.speed;
export const DASH_DURATION_MS   = balance.dash.durationMs;
export const DASH_COOLDOWN_MS   = balance.dash.cooldownMs;
export const DASH_INVULN_MS     = balance.dash.invulnMs;
export const MAX_AIR_DASHES     = balance.dash.maxAirDashes;

// Weapon heat (from balance.json)
export const WEAPON_HEAT_PER_SHOT   = balance.weapon.heatPerShot;
export const WEAPON_OVERHEAT_PENALTY = balance.weapon.overheatPenalty;
export const WEAPON_COOL_RATE       = balance.weapon.coolRate;

export const WALL_SLIDE_SPEED   = balance.wallSlide.speed;
export const WALL_JUMP_VX       = balance.wallSlide.jumpVx;
export const WALL_JUMP_VY       = balance.wallSlide.jumpVy;

export const COYOTE_TIME_MS     = balance.coyoteTimeMs;

// Player (from balance.json)
export const PLAYER_BASE_HP     = balance.player.baseHp;
export const INVULN_DURATION    = balance.player.invulnDuration;
export const PLAYER_WIDTH       = balance.player.width;
export const PLAYER_HEIGHT      = balance.player.height;

// Combo (from balance.json)
export const COMBO_DECAY_TIME       = balance.combo.decayTime;
export const COMBO_TIER_THRESHOLDS  = balance.combo.tierThresholds;
export const COMBO_TIER_MULTIPLIERS = balance.combo.tierMultipliers;

// Scroll (from balance.json)
export const BASE_SCROLL_SPEED  = balance.scroll.baseSpeed;
export const MAX_SCROLL_SPEED   = balance.scroll.maxSpeed;

// Pools (structural — not tunable)
export const MAX_PARTICLES      = 512;
export const MAX_ENEMIES        = 16;
export const MAX_PLAYER_PROJ    = 32;
export const MAX_ENEMY_PROJ     = 24;
export const MAX_PICKUPS        = 20;

// Collision (structural)
export const SPATIAL_CELL_SIZE  = 64;

// Input (structural)
export const INPUT_BUFFER_MS    = 150;
export const SWIPE_THRESHOLD    = 40;
export const SWIPE_TIME_MAX     = 300;
export const DOUBLE_TAP_WINDOW  = 300;
export const HOLD_MIN_TIME      = 100;
export const MOVE_DEFLECTION    = 80;

// Pickup magnet (from balance.json)
export const PICKUP_MAGNET_RANGE = balance.pickup.magnetRange;
