# NEON DESCENT — Technical Architecture Spec

**Version:** 1.0
**Status:** Pre-production
**Platform:** HTML5 / TypeScript / Canvas 2D / PWA
**Target:** Mobile-first portrait (360×640 logical)

---

## Table of Contents

1. [Tech Stack & Build Pipeline](#1-tech-stack--build-pipeline)
2. [Project File Structure](#2-project-file-structure)
3. [Core Game Loop](#3-core-game-loop)
4. [State Machine](#4-state-machine)
5. [Input System](#5-input-system)
6. [Entity Model](#6-entity-model)
7. [Physics & Movement System](#7-physics--movement-system)
8. [Collision System](#8-collision-system)
9. [Chunk-Based Procedural Generation](#9-chunk-based-procedural-generation)
10. [Enemy System](#10-enemy-system)
11. [Weapon System](#11-weapon-system)
12. [Combo System](#12-combo-system)
13. [Upgrade & Build System](#13-upgrade--build-system)
14. [VFX System](#14-vfx-system)
15. [Audio System](#15-audio-system)
16. [Camera System](#16-camera-system)
17. [UI System](#17-ui-system)
18. [Save & Progression System](#18-save--progression-system)
19. [PWA Architecture](#19-pwa-architecture)
20. [Performance Budget](#20-performance-budget)
21. [Analytics Hooks](#21-analytics-hooks)
22. [Content Data Architecture](#22-content-data-architecture)
23. [Implementation Sequence](#23-implementation-sequence)
24. [Critical Architectural Decisions](#24-critical-architectural-decisions)

---

## 1. Tech Stack & Build Pipeline

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript (strict mode) | Type safety, IDE support, refactor confidence |
| Renderer | Canvas 2D + OffscreenCanvas layers | Broad mobile support; WebGL optional later via renderer swap |
| Bundler | Vite | Fast HMR, native TS/ESM, tree-shaking, PWA plugin |
| PWA | vite-plugin-pwa (Workbox) | Service worker generation, precache manifest, offline |
| Package manager | npm | Standard, no extra tooling |
| Linting | ESLint + typescript-eslint | Catch issues early |
| Testing | Vitest | Vite-native, fast, TS-first |
| Asset pipeline | Vite static assets + TexturePacker JSON (sprites) | Spritesheet atlasing for draw call reduction |

### Build Targets

```
dev     → vite dev (HMR, no SW)
build   → vite build (minified, SW generated, PWA manifest)
preview → vite preview (local prod test)
test    → vitest run
```

### Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*":    ["src/core/*"],
      "@input/*":   ["src/input/*"],
      "@world/*":   ["src/world/*"],
      "@entities/*":["src/entities/*"],
      "@systems/*": ["src/systems/*"],
      "@render/*":  ["src/rendering/*"],
      "@audio/*":   ["src/audio/*"],
      "@ui/*":      ["src/ui/*"],
      "@data/*":    ["src/data/*"],
      "@utils/*":   ["src/utils/*"]
    }
  }
}
```

---

## 2. Project File Structure

```
neon-descent/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json
│   ├── icons/                    # PWA icons (192, 512)
│   ├── splash/                   # Splash screens
│   └── assets/
│       ├── sprites/              # Sprite atlases (.png + .json)
│       ├── audio/
│       │   ├── sfx/              # .webm / .ogg sound effects
│       │   └── music/            # Adaptive music stems
│       └── fonts/                # Web fonts
├── src/
│   ├── main.ts                   # Entry point — bootstrap Game
│   ├── Game.ts                   # Top-level orchestrator
│   ├── core/
│   │   ├── GameLoop.ts           # Fixed-timestep loop
│   │   ├── StateMachine.ts       # Generic FSM
│   │   ├── EventBus.ts           # Typed pub/sub
│   │   ├── ObjectPool.ts         # Generic reusable pool
│   │   ├── Timer.ts              # Countdown / cooldown helper
│   │   └── Constants.ts          # Global tuning constants
│   ├── input/
│   │   ├── InputManager.ts       # Touch/keyboard adapter
│   │   ├── GestureRecognizer.ts  # Swipe/hold/tap detection
│   │   ├── InputBuffer.ts        # Buffered action queue
│   │   ├── AimAssist.ts          # Soft target lock
│   │   └── InputTypes.ts         # InputFrame, Gesture enums
│   ├── states/
│   │   ├── BootState.ts          # Asset loading
│   │   ├── MenuState.ts          # Main menu
│   │   ├── PlayingState.ts       # Core gameplay
│   │   ├── PausedState.ts        # Pause overlay
│   │   ├── ShopState.ts          # Between-section shop
│   │   ├── DeadState.ts          # Death screen + results
│   │   └── GameState.ts          # State interface
│   ├── world/
│   │   ├── World.ts              # World orchestrator (holds all live entities)
│   │   ├── Chunk.ts              # Runtime chunk instance
│   │   ├── ChunkGenerator.ts     # Procedural sequencer
│   │   ├── ChunkTemplate.ts      # Template data structure
│   │   ├── PacingController.ts   # Intensity / rhythm manager
│   │   ├── AntiBullshit.ts       # Validation rules
│   │   ├── BiomeManager.ts       # Biome transitions
│   │   ├── ScrollSystem.ts       # Vertical auto-scroll
│   │   └── SpawnSystem.ts        # Enemy placement per chunk
│   ├── entities/
│   │   ├── Entity.ts             # Base entity
│   │   ├── Player.ts             # Player entity + states
│   │   ├── Projectile.ts         # Projectile (pooled)
│   │   ├── Pickup.ts             # Pickup (pooled)
│   │   └── enemies/
│   │       ├── EnemyBase.ts      # Enemy base class
│   │       ├── Hopper.ts
│   │       ├── TurretBloom.ts
│   │       ├── Splitter.ts
│   │       ├── ShieldBug.ts
│   │       ├── Leech.ts
│   │       ├── RailSentinel.ts
│   │       ├── ParasiteCloud.ts
│   │       └── CoreCarrier.ts
│   ├── systems/
│   │   ├── PhysicsSystem.ts      # Gravity, movement, wall slide
│   │   ├── CollisionSystem.ts    # Spatial hash + resolution
│   │   ├── DamageSystem.ts       # Damage application + events
│   │   ├── WeaponSystem.ts       # Firing logic
│   │   ├── ComboSystem.ts        # Combo tracking + decay
│   │   ├── UpgradeSystem.ts      # In-run upgrade application
│   │   └── ScoreSystem.ts        # Score calculation
│   ├── rendering/
│   │   ├── Renderer.ts           # Multi-layer compositor
│   │   ├── Camera.ts             # Vertical follow + shake + zoom
│   │   ├── LayerStack.ts         # OffscreenCanvas layer manager
│   │   ├── SpriteSheet.ts        # Atlas-based sprite drawing
│   │   ├── ParticleRenderer.ts   # Particle draw pass
│   │   └── BackgroundRenderer.ts # Parallax biome backgrounds
│   ├── vfx/
│   │   ├── VFXSystem.ts          # VFX orchestrator
│   │   ├── ParticlePool.ts       # Ring-buffer particle system
│   │   ├── ScreenShake.ts        # Additive camera shake
│   │   ├── HitStop.ts            # Frame-freeze on big hits
│   │   ├── Flash.ts              # Screen flash overlay
│   │   └── Presets.ts            # VFX preset definitions
│   ├── audio/
│   │   ├── AudioSystem.ts        # Web Audio API orchestrator
│   │   ├── SFXPool.ts            # Concurrent SFX instance pool
│   │   ├── MusicManager.ts       # Adaptive layered music
│   │   └── AudioTypes.ts         # Sound definitions
│   ├── ui/
│   │   ├── HUD.ts                # In-game overlay (HP, combo, score)
│   │   ├── MenuUI.ts             # Main menu rendering
│   │   ├── DeathUI.ts            # Death screen rendering
│   │   ├── ShopUI.ts             # Shop / upgrade cards
│   │   ├── UIRenderer.ts         # Shared UI primitives
│   │   └── InstallPrompt.ts      # PWA install nudge
│   ├── save/
│   │   ├── SaveManager.ts        # IndexedDB persistence
│   │   ├── MetaProgression.ts    # Unlocks, currency, loadouts
│   │   └── RunState.ts           # Serializable run snapshot
│   ├── analytics/
│   │   └── AnalyticsManager.ts   # Event batching + dispatch
│   ├── data/
│   │   ├── enemies.json          # Enemy definitions
│   │   ├── weapons.json          # Weapon definitions
│   │   ├── upgrades.json         # Upgrade definitions
│   │   ├── chunks.json           # Chunk templates
│   │   ├── biomes.json           # Biome definitions
│   │   └── balance.json          # Global tuning parameters
│   └── utils/
│       ├── math.ts               # Vec2, lerp, clamp, remap, dist
│       ├── SeededRNG.ts          # Deterministic RNG
│       └── debug.ts              # Debug overlay (dev only)
└── docs/
    ├── TECHNICAL_ARCHITECTURE.md # This document
    └── PRD.md                    # Product Requirements Document
```

---

## 3. Core Game Loop

### Architecture: Fixed Timestep with Interpolated Rendering

All gameplay logic runs at a fixed 60Hz tick rate, decoupled from the render frame rate. Rendering interpolates between states for smooth display on any refresh rate.

```
┌──────────────────────────────────────────────┐
│                  GameLoop                     │
│                                               │
│  accumulator += deltaTime                     │
│                                               │
│  while (accumulator >= FIXED_DT):             │
│    ├─ inputManager.poll()                     │
│    ├─ currentState.fixedUpdate(FIXED_DT)      │
│    └─ accumulator -= FIXED_DT                 │
│                                               │
│  alpha = accumulator / FIXED_DT               │
│  currentState.render(alpha)                   │
│                                               │
│  requestAnimationFrame(loop)                  │
└──────────────────────────────────────────────┘
```

### Key Constants

```typescript
// src/core/Constants.ts
export const FIXED_DT       = 1 / 60;           // 16.667ms
export const MAX_FRAME_DT   = 0.1;              // cap spiral of death
export const CANVAS_W       = 360;              // logical width
export const CANVAS_H       = 640;              // logical height
export const TILE_SIZE      = 30;               // px per tile
export const CHUNK_COLS     = 12;               // 360 / 30
export const CHUNK_ROWS     = 21;               // ~630px per chunk
export const CHUNK_HEIGHT   = CHUNK_ROWS * TILE_SIZE; // 630px
```

### GameLoop Implementation

```typescript
// src/core/GameLoop.ts
export class GameLoop {
  private accumulator = 0;
  private lastTime    = 0;
  private running     = false;
  private rafId       = 0;

  constructor(
    private fixedUpdate: (dt: number) => void,
    private render:      (alpha: number) => void
  ) {}

  start(): void {
    this.running  = true;
    this.lastTime = performance.now() / 1000;
    this.rafId    = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (nowMs: number): void => {
    if (!this.running) return;
    const now   = nowMs / 1000;
    let frameDt = now - this.lastTime;
    this.lastTime = now;

    // Cap to prevent spiral of death after tab-away
    if (frameDt > MAX_FRAME_DT) frameDt = MAX_FRAME_DT;

    this.accumulator += frameDt;

    while (this.accumulator >= FIXED_DT) {
      this.fixedUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    const alpha = this.accumulator / FIXED_DT;
    this.render(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
```

### Frame Budget

At 60fps, each frame has **16.67ms** total. Target allocation:

| Phase | Budget | Notes |
|-------|--------|-------|
| Input polling | 0.5ms | Gesture recognition, buffer prune |
| Fixed update | 6.0ms | Physics, collision, AI, combo, spawn |
| Render | 8.0ms | Clear, draw layers, composite, HUD |
| GC headroom | 2.0ms | Must stay allocation-free in hot path |
| **Total** | **16.5ms** | 0.17ms margin |

---

## 4. State Machine

### Generic FSM

```typescript
// src/core/StateMachine.ts
export interface GameState {
  readonly name: string;
  onEnter(prev: string | null): void;
  onExit(next: string): void;
  fixedUpdate(dt: number): void;
  render(alpha: number): void;
  onPause?(): void;
  onResume?(): void;
}

export class StateMachine {
  private states  = new Map<string, GameState>();
  private current: GameState | null = null;
  private history: string[] = [];

  register(state: GameState): void {
    this.states.set(state.name, state);
  }

  transition(name: string): void {
    const next = this.states.get(name);
    if (!next) throw new Error(`Unknown state: ${name}`);
    const prev = this.current;
    prev?.onExit(name);
    this.history.push(name);
    this.current = next;
    next.onEnter(prev?.name ?? null);
  }

  fixedUpdate(dt: number): void { this.current?.fixedUpdate(dt); }
  render(alpha: number): void   { this.current?.render(alpha); }

  get currentName(): string     { return this.current?.name ?? 'NONE'; }
}
```

### State Graph

```
                    ┌──────────┐
                    │   BOOT   │  (load assets)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
              ┌─────│   MENU   │◄────────────────┐
              │     └────┬─────┘                  │
              │          │ Play                    │
              │     ┌────▼─────┐                  │
              │     │ PLAYING  │◄──┐              │
              │     └──┬───┬───┘   │              │
              │        │   │       │              │
              │   Pause│   │Die    │Resume        │
              │   ┌────▼┐ ┌▼────┐  │              │
              │   │PAUSE│ │DEAD │──┼──► Retry ────┘
              │   └──┬──┘ └─┬───┘  │
              │      │      │      │
              │   Resume    │ Menu │
              │      │      │      │
              │      └──────┘      │
              │                    │
              │     ┌────────┐     │
              └────►│  SHOP  │─────┘
                    └────────┘
```

### State Responsibilities

| State | Owns | Updates |
|-------|------|---------|
| BOOT | Asset loader, progress bar | Load queue |
| MENU | Menu UI, daily challenge check | UI animations |
| PLAYING | World, Renderer, HUD, Input | Full gameplay simulation |
| PAUSED | Pause overlay | Nothing (frozen) |
| DEAD | Death UI, score summary | Tween animations |
| SHOP | Shop UI, upgrade cards | UI interaction |

---

## 5. Input System

### Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐    ┌────────────┐
│ Touch Events │───►│ GestureRecognizer│───►│ InputBuffer │───►│ InputFrame │
│ (raw)        │    │ (classify)       │    │ (buffer)    │    │ (consumed) │
└─────────────┘    └──────────────────┘    └─────────────┘    └────────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │  AimAssist  │
                                                              └─────────────┘
```

### Dual-Zone Touch Layout

```
┌─────────────────────┐
│                     │
│   LEFT ZONE         │   RIGHT ZONE
│   (move)            │   (actions)
│                     │
│   drag L/R =        │   hold = fire
│     horizontal      │   swipe ↓ = stomp
│     movement        │   swipe ↑ = dash
│                     │   double-tap = special
│                     │
│        50%          │        50%
└─────────────────────┘
```

### InputFrame (per-tick snapshot)

```typescript
// src/input/InputTypes.ts
export interface InputFrame {
  moveX:      number;    // -1.0 to 1.0 (left zone drag normalized)
  fire:       boolean;   // right zone held
  stomp:      boolean;   // swipe down detected (consumed once)
  dash:       boolean;   // swipe up detected (consumed once)
  special:    boolean;   // double-tap detected (consumed once)
  aimTarget:  number | null; // entity ID from aim assist
}

export const enum GestureType {
  NONE,
  HOLD,
  SWIPE_DOWN,
  SWIPE_UP,
  DOUBLE_TAP,
}

export interface Touch {
  id:        number;
  startX:    number;
  startY:    number;
  currentX:  number;
  currentY:  number;
  startTime: number;
  zone:      'left' | 'right';
}
```

### GestureRecognizer

```typescript
// src/input/GestureRecognizer.ts
export class GestureRecognizer {
  private readonly SWIPE_THRESHOLD  = 40;   // px minimum travel
  private readonly SWIPE_TIME_MAX   = 300;  // ms max duration
  private readonly DOUBLE_TAP_WINDOW = 300; // ms between taps
  private readonly HOLD_MIN_TIME    = 100;  // ms to count as hold

  private activeTouches = new Map<number, Touch>();
  private lastTapTime   = 0;
  private pendingGestures: GestureType[] = [];

  onTouchStart(e: TouchEvent): void { /* classify zone, store touch */ }
  onTouchMove(e: TouchEvent):  void { /* update currentX/Y */ }
  onTouchEnd(e: TouchEvent):   void { /* classify gesture, push to pending */ }

  getMoveX(): number {
    // Find active left-zone touch, return normalized drag delta
    for (const t of this.activeTouches.values()) {
      if (t.zone === 'left') {
        const dx = t.currentX - t.startX;
        return Math.max(-1, Math.min(1, dx / 80)); // 80px = full deflection
      }
    }
    return 0;
  }

  isHolding(): boolean {
    // Right-zone touch held longer than HOLD_MIN_TIME
    for (const t of this.activeTouches.values()) {
      if (t.zone === 'right' && performance.now() - t.startTime > this.HOLD_MIN_TIME) {
        return true;
      }
    }
    return false;
  }

  consumeGestures(): GestureType[] {
    const g = [...this.pendingGestures];
    this.pendingGestures.length = 0;
    return g;
  }
}
```

### Input Buffer

Buffers discrete actions (stomp, dash, special) so inputs registered slightly before the valid window still fire. Prevents "I pressed it but nothing happened" frustration.

```typescript
// src/input/InputBuffer.ts
export interface BufferedAction {
  type:      'stomp' | 'dash' | 'special';
  timestamp: number;
}

export class InputBuffer {
  private readonly BUFFER_WINDOW = 150; // ms
  private queue: BufferedAction[] = [];

  push(type: BufferedAction['type']): void {
    this.queue.push({ type, timestamp: performance.now() });
  }

  consume(type: BufferedAction['type']): boolean {
    const now = performance.now();
    const idx = this.queue.findIndex(
      a => a.type === type && now - a.timestamp < this.BUFFER_WINDOW
    );
    if (idx >= 0) { this.queue.splice(idx, 1); return true; }
    return false;
  }

  prune(): void {
    const now = performance.now();
    this.queue = this.queue.filter(a => now - a.timestamp < this.BUFFER_WINDOW);
  }
}
```

### AimAssist

Soft-locks the nearest enemy within a cone below the player so shots feel accurate without precision aiming.

```typescript
// src/input/AimAssist.ts
export class AimAssist {
  private readonly RADIUS     = 120; // px
  private readonly CONE_ANGLE = 45;  // degrees, centered on downward

  getTarget(player: Player, enemies: EnemyBase[]): EnemyBase | null {
    const coneRad = (this.CONE_ANGLE / 2) * (Math.PI / 180);
    let best: EnemyBase | null = null;
    let bestDist = Infinity;

    for (const e of enemies) {
      if (!e.active) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d  = Math.hypot(dx, dy);
      if (d > this.RADIUS) continue;

      // Check within downward cone
      const angle = Math.atan2(dy, dx);
      const diff  = Math.abs(angle - Math.PI / 2); // PI/2 = straight down
      if (diff > coneRad) continue;

      if (d < bestDist) { best = e; bestDist = d; }
    }
    return best;
  }
}
```

### Keyboard Fallback (Desktop)

| Key | Action |
|-----|--------|
| A / ← | Move left |
| D / → | Move right |
| Space / LMB | Fire |
| S / ↓ | Stomp |
| W / ↑ | Dash |
| E | Special |
| Escape | Pause |

---

## 6. Entity Model

### Architecture Decision: Class Inheritance (max 3 levels deep)

At fewer than ~80 active entities, a full ECS is over-engineered. Simple class hierarchy with shared interfaces keeps debugging straightforward and avoids indirection overhead.

```
Entity (base)
├── Player
├── Projectile (pooled)
├── Pickup (pooled)
└── EnemyBase
    ├── Hopper
    ├── TurretBloom
    ├── Splitter
    ├── ShieldBug
    ├── Leech
    ├── RailSentinel
    ├── ParasiteCloud
    └── CoreCarrier
```

### Base Entity

```typescript
// src/entities/Entity.ts
export abstract class Entity {
  id:       number;
  active:   boolean = true;

  // Position (current tick)
  x:        number = 0;
  y:        number = 0;
  // Position (previous tick, for interpolation)
  prevX:    number = 0;
  prevY:    number = 0;
  // Velocity
  vx:       number = 0;
  vy:       number = 0;

  // Hitbox (AABB, offset from x,y center)
  hitbox:   { width: number; height: number; offsetX: number; offsetY: number };

  // Visual
  sprite:   string = '';
  flipX:    boolean = false;
  alpha:    number = 1;

  constructor(id: number) { this.id = id; }

  /** Store previous position before physics step */
  savePrevious(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** Interpolated render position */
  renderX(alpha: number): number { return this.prevX + (this.x - this.prevX) * alpha; }
  renderY(alpha: number): number { return this.prevY + (this.y - this.prevY) * alpha; }

  /** AABB bounds in world space */
  getBounds(): AABB {
    return {
      x: this.x + this.hitbox.offsetX - this.hitbox.width / 2,
      y: this.y + this.hitbox.offsetY - this.hitbox.height / 2,
      w: this.hitbox.width,
      h: this.hitbox.height,
    };
  }

  abstract update(dt: number, world: World): void;
}

export interface AABB { x: number; y: number; w: number; h: number; }
```

### Object Pool

```typescript
// src/core/ObjectPool.ts
export class ObjectPool<T> {
  private pool: T[] = [];
  private active: T[] = [];

  constructor(
    private factory:  () => T,
    private reset:    (obj: T) => void,
    private isActive: (obj: T) => boolean,
    initialSize: number = 32
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    const obj = this.pool.length > 0 ? this.pool.pop()! : this.factory();
    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  /** Sweep inactive objects back to pool */
  sweep(): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (!this.isActive(this.active[i]!)) {
        this.release(this.active[i]!);
        this.active[i] = this.active[this.active.length - 1]!;
        this.active.pop();
      }
    }
  }

  getActive(): readonly T[] { return this.active; }
  get activeCount(): number { return this.active.length; }
}
```

---

## 7. Physics & Movement System

### Design: Custom Fixed-Step Integrator

No physics library. Full control over mobile feel tuning.

### Player Movement Constants

```typescript
// Tuning values in balance.json — hardcoded defaults shown
export const PLAYER_PHYSICS = {
  gravity:          1800,    // px/s² downward
  terminalVelocity: 600,    // px/s max fall speed
  moveAccel:        2400,   // px/s² horizontal
  moveDecel:        1800,   // px/s² friction when no input
  maxMoveSpeed:     280,    // px/s horizontal cap
  airSteerFactor:   0.85,   // multiplier on accel in air

  // Stomp
  stompSpeed:       900,    // px/s instant downward
  stompBounce:      -400,   // px/s upward on hit
  stompStartupMs:   50,     // brief hang time before stomp

  // Dash
  dashSpeed:        500,    // px/s burst (direction based on input)
  dashDurationMs:   120,    // active dash frames
  dashCooldownMs:   600,    // cooldown between dashes
  dashInvulnMs:     80,     // i-frames during dash

  // Wall slide
  wallSlideSpeed:   80,     // px/s (reduced fall)
  wallJumpVx:       200,    // horizontal kick off wall
  wallJumpVy:       -350,   // vertical kick off wall

  // Coyote time
  coyoteTimeMs:     100,    // grace period after leaving edge
};
```

### Physics System

```typescript
// src/systems/PhysicsSystem.ts
export class PhysicsSystem {
  fixedUpdate(dt: number, world: World, input: InputFrame): void {
    const p = world.player;
    p.savePrevious();

    // Horizontal movement
    if (Math.abs(input.moveX) > 0.1) {
      p.vx += input.moveX * PLAYER_PHYSICS.moveAccel *
              (p.grounded ? 1 : PLAYER_PHYSICS.airSteerFactor) * dt;
    } else {
      // Deceleration
      const decel = PLAYER_PHYSICS.moveDecel * dt;
      if (Math.abs(p.vx) < decel) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * decel;
    }
    p.vx = clamp(p.vx, -PLAYER_PHYSICS.maxMoveSpeed, PLAYER_PHYSICS.maxMoveSpeed);

    // Gravity (unless stomping or dashing)
    if (p.state !== 'STOMPING' && p.state !== 'DASHING') {
      p.vy += PLAYER_PHYSICS.gravity * dt;
      p.vy = Math.min(p.vy, PLAYER_PHYSICS.terminalVelocity);
    }

    // Wall slide
    if (p.touchingWall && p.vy > 0 && !p.grounded) {
      p.vy = Math.min(p.vy, PLAYER_PHYSICS.wallSlideSpeed);
      p.state = 'WALL_SLIDING';
    }

    // Apply velocity
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // World bounds (wrap or clamp)
    if (p.x < 0) p.x = 0;
    if (p.x > CANVAS_W) p.x = CANVAS_W;

    // Update all enemies
    for (const e of world.enemies) {
      e.savePrevious();
      e.update(dt, world);
    }

    // Update projectiles
    for (const proj of world.projectiles) {
      proj.savePrevious();
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      // Deactivate if out of bounds
      if (proj.y < world.camera.top - 100 || proj.y > world.camera.bottom + 100) {
        proj.active = false;
      }
    }
  }
}
```

### Player State Machine

```
          ┌──────────┐
    ┌─────│  FALLING  │◄─────────────────┐
    │     └──┬───┬───┘                   │
    │        │   │                        │
    │  Stomp │   │ Dash                   │ Land/Bounce
    │   ┌────▼┐ ┌▼──────┐               │
    │   │STOMP│ │DASHING │───────────────┤
    │   │START│ └────────┘               │
    │   └──┬──┘                          │
    │      │                             │
    │   ┌──▼──────┐    ┌──────────┐      │
    │   │STOMPING │───►│ BOUNCING │──────┘
    │   └─────────┘    └──────────┘
    │
    │   ┌────────────┐
    └──►│WALL_SLIDING│
        └────────────┘
```

---

## 8. Collision System

### Spatial Hash Grid

The game world is 360px wide. A spatial hash with 64px cells gives ~6 columns — sufficient for our entity density.

```typescript
// src/systems/CollisionSystem.ts
export class CollisionSystem {
  private cellSize: number;
  private grid = new Map<number, Entity[]>();

  constructor(worldWidth: number, cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  fixedUpdate(world: World): void {
    this.grid.clear();

    // Insert all entities
    for (const e of world.allEntities()) {
      if (!e.active) continue;
      const bounds = e.getBounds();
      const keys = this.getCellKeys(bounds);
      for (const key of keys) {
        let cell = this.grid.get(key);
        if (!cell) { cell = []; this.grid.set(key, cell); }
        cell.push(e);
      }
    }

    // Check collisions
    this.checkPlayerVsEnemies(world);
    this.checkPlayerVsPickups(world);
    this.checkProjectilesVsEnemies(world);
    this.checkPlayerVsTiles(world);
  }

  private getCellKeys(aabb: AABB): number[] {
    const keys: number[] = [];
    const x0 = Math.floor(aabb.x / this.cellSize);
    const y0 = Math.floor(aabb.y / this.cellSize);
    const x1 = Math.floor((aabb.x + aabb.w) / this.cellSize);
    const y1 = Math.floor((aabb.y + aabb.h) / this.cellSize);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        keys.push(y * 1000 + x); // simple hash
      }
    }
    return keys;
  }

  private aabbOverlap(a: AABB, b: AABB): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }
}
```

### Collision Layers

| Layer | Collides With |
|-------|---------------|
| Player | Tiles, Enemies, Pickups, Hazards |
| Player Projectile | Enemies, Tiles (some weapons) |
| Enemy | Player, Player Projectiles |
| Enemy Projectile | Player |
| Pickup | Player (magnet radius) |

### Tile Collision Resolution

Player vs tile collision uses standard AABB overlap with minimum penetration vector push-out. Tiles from chunks are static — only the player and enemies resolve against them.

---

## 9. Chunk-Based Procedural Generation

### Core Concept

The world is an infinite vertical stack of **chunks**. Each chunk is a **12×21 tile grid** (360×630px). Chunks are selected from a template library and composed by the **ChunkGenerator** according to pacing rules.

### Chunk Template

```typescript
// src/world/ChunkTemplate.ts
export interface ChunkTemplate {
  id:          string;
  category:    ChunkCategory;
  biomes:      string[];          // which biomes can use this
  difficulty:  number;            // 0.0 – 1.0
  intensity:   number;            // 0.0 – 1.0 (pacing tension)
  grid:        number[][];        // 21 rows × 12 cols (tile IDs)
  spawns:      SpawnPoint[];      // enemy/pickup spawn markers
  paths:       PathValidation;    // pre-validated traversal paths
  tags:        string[];          // e.g. 'has_shop', 'elite_arena', 'recovery'
}

export interface SpawnPoint {
  col:   number;
  row:   number;
  type:  'enemy' | 'pickup' | 'hazard' | 'event';
  id?:   string;  // specific entity ID, or null for generator choice
  group? :string; // group tag for linked spawns
}

export const enum ChunkCategory {
  INTRO      = 'intro',
  TRAVERSAL  = 'traversal',
  COMBAT     = 'combat',
  HAZARD     = 'hazard',
  LOOT       = 'loot',
  RECOVERY   = 'recovery',
  EVENT      = 'event',
  SHOP       = 'shop',
  ELITE      = 'elite',
  MINIBOSS   = 'miniboss',
  TRANSITION = 'transition',
}

export const enum TileType {
  EMPTY       = 0,
  SOLID       = 1,
  PLATFORM    = 2,  // one-way, pass through from below
  HAZARD      = 3,  // damage on touch
  BREAKABLE   = 4,  // destroyed by stomp/shots
  BOUNCE      = 5,  // bounces player upward
  WALL_LEFT   = 6,  // left wall (slide-able)
  WALL_RIGHT  = 7,  // right wall (slide-able)
}
```

### Pacing Controller

The pacing controller tracks the run's rhythm and tells the generator what kind of chunk to produce next.

```typescript
// src/world/PacingController.ts
export class PacingController {
  depth:            number = 0;     // total pixels descended
  intensity:        number = 0;     // 0–1 current tension level
  recentCategories: ChunkCategory[] = [];
  chunksSinceRecovery: number = 0;
  chunksSinceShop:     number = 0;
  chunksSinceLoot:     number = 0;
  currentBiomeIndex:   number = 0;
  difficultyMultiplier: number = 1.0;

  // Updated per chunk
  update(depthDelta: number): void {
    this.depth += depthDelta;
    this.difficultyMultiplier = 1.0 + (this.depth / 10000) * 0.5;
  }

  /** Returns weighted preferences for next chunk category */
  getPreferences(): Map<ChunkCategory, number> {
    const prefs = new Map<ChunkCategory, number>();

    // Base weights
    prefs.set(ChunkCategory.TRAVERSAL, 3);
    prefs.set(ChunkCategory.COMBAT,    3);
    prefs.set(ChunkCategory.HAZARD,    2);
    prefs.set(ChunkCategory.LOOT,      1);

    // Recovery pressure
    if (this.chunksSinceRecovery > 5) {
      prefs.set(ChunkCategory.RECOVERY, 4);
    }

    // Shop cadence
    if (this.chunksSinceShop > 12) {
      prefs.set(ChunkCategory.SHOP, 3);
    }

    // Prevent repeats
    const last = this.recentCategories[this.recentCategories.length - 1];
    if (last) {
      prefs.set(last, (prefs.get(last) ?? 1) * 0.3);
    }

    // Elite cadence (every ~15 chunks at current difficulty)
    if (this.depth > 3000 && this.chunksSinceLoot > 10) {
      prefs.set(ChunkCategory.ELITE, 2);
    }

    return prefs;
  }

  recordChunk(category: ChunkCategory): void {
    this.recentCategories.push(category);
    if (this.recentCategories.length > 8) this.recentCategories.shift();

    this.chunksSinceRecovery++;
    this.chunksSinceShop++;
    this.chunksSinceLoot++;

    if (category === ChunkCategory.RECOVERY) this.chunksSinceRecovery = 0;
    if (category === ChunkCategory.SHOP)     this.chunksSinceShop = 0;
    if (category === ChunkCategory.LOOT)     this.chunksSinceLoot = 0;
  }
}
```

### ChunkGenerator

```typescript
// src/world/ChunkGenerator.ts
export class ChunkGenerator {
  constructor(
    private templates: ChunkTemplate[],
    private rng:       SeededRNG,
    private validator: AntiBullshitValidator
  ) {}

  next(pacing: PacingController, biome: BiomeDefinition): ChunkTemplate {
    const prefs     = pacing.getPreferences();
    const eligible  = this.templates.filter(t =>
      t.biomes.includes(biome.id) &&
      t.difficulty <= pacing.difficultyMultiplier
    );

    // Weight by pacing preference
    const weighted = eligible.map(t => ({
      template: t,
      weight:   prefs.get(t.category) ?? 1,
    }));

    // Pick with weighted random
    let choice = this.rng.weightedPick(
      weighted.map(w => w.template),
      weighted.map(w => w.weight)
    );

    // Validate
    if (!this.validator.validate(choice, pacing)) {
      // Fallback to safest available
      choice = eligible.find(t => t.category === ChunkCategory.TRAVERSAL)
            ?? eligible[0]!;
    }

    pacing.recordChunk(choice.category);
    return choice;
  }
}
```

### Anti-Bullshit Validator

```typescript
// src/world/AntiBullshit.ts
export class AntiBullshitValidator {
  validate(chunk: ChunkTemplate, pacing: PacingController): boolean {
    // Rule 1: Chunk must have at least one traversable path
    if (!chunk.paths.hasValidPath) return false;

    // Rule 2: No more than 2 high-intensity chunks in a row
    const recent = pacing.recentCategories.slice(-2);
    const highIntensity = [ChunkCategory.COMBAT, ChunkCategory.ELITE, ChunkCategory.HAZARD];
    if (highIntensity.includes(chunk.category) &&
        recent.every(c => highIntensity.includes(c))) {
      return false;
    }

    // Rule 3: Recovery must appear within 6 chunks
    if (pacing.chunksSinceRecovery > 6 &&
        chunk.category !== ChunkCategory.RECOVERY) {
      return false; // force recovery
    }

    // Rule 4: No elite/miniboss in first 5 chunks
    if (pacing.depth < 3150 && // ~5 chunks
        (chunk.category === ChunkCategory.ELITE ||
         chunk.category === ChunkCategory.MINIBOSS)) {
      return false;
    }

    return true;
  }

  /** Offline validation: flood-fill every template to verify traversability */
  static validateTemplate(template: ChunkTemplate): boolean {
    // BFS from top row to bottom row, treating EMPTY/PLATFORM as passable
    // Returns false if no path exists (= broken chunk design)
    const grid = template.grid;
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;

    const visited = new Set<number>();
    const queue: number[] = [];

    // Seed from top row empty cells
    for (let c = 0; c < cols; c++) {
      if (grid[0]![c] === TileType.EMPTY || grid[0]![c] === TileType.PLATFORM) {
        queue.push(c);
        visited.add(c);
      }
    }

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const row = Math.floor(pos / cols);
      const col = pos % cols;

      if (row === rows - 1) return true; // reached bottom

      // Can move: down, left, right, down-left, down-right
      for (const [dr, dc] of [[1,0],[0,-1],[0,1],[1,-1],[1,1]]) {
        const nr = row + dr!;
        const nc = col + dc!;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const key = nr * cols + nc;
        if (visited.has(key)) continue;
        const tile = grid[nr]![nc]!;
        if (tile === TileType.EMPTY || tile === TileType.PLATFORM ||
            tile === TileType.BOUNCE || tile === TileType.BREAKABLE) {
          visited.add(key);
          queue.push(key);
        }
      }
    }
    return false;
  }
}
```

### Biome Definition

```typescript
// src/data/biomes.json schema
export interface BiomeDefinition {
  id:             string;
  name:           string;
  depthRange:     [number, number];  // start/end depth in px
  palette: {
    background:   string;
    tile:         string;
    tileAccent:   string;
    hazard:       string;
    ambient:      string;
  };
  tileVariant:    string;            // sprite variant key
  musicStem:      string;            // audio stem ID
  hazardTypes:    string[];
  enemyPool:      string[];          // enemy IDs available in this biome
  scrollSpeedMod: number;            // multiplier on base scroll
  parallaxLayers: ParallaxLayer[];
}
```

---

## 10. Enemy System

### Enemy Base Class

```typescript
// src/entities/enemies/EnemyBase.ts
export abstract class EnemyBase extends Entity {
  hp:          number;
  maxHp:       number;
  damage:      number;      // contact damage
  scoreValue:  number;
  comboValue:  number;      // combo points on kill
  role:        EnemyRole;
  state:       string = 'IDLE';
  stateTimer:  number = 0;

  abstract update(dt: number, world: World): void;
  abstract onDamage(amount: number, source: string, world: World): void;
  abstract onDeath(world: World): void;
}

export type EnemyRole =
  | 'pressure'
  | 'zoning'
  | 'punish'
  | 'fodder'
  | 'ambush'
  | 'elite'
  | 'disruptor';
```

### Enemy Data Schema (enemies.json)

```json
{
  "hopper": {
    "name": "Hopper",
    "role": "pressure",
    "hp": 2,
    "damage": 1,
    "speed": 180,
    "scoreValue": 100,
    "comboValue": 1,
    "sprite": "enemy_hopper",
    "hitbox": { "width": 24, "height": 24, "offsetX": 0, "offsetY": 0 },
    "biomes": ["surface_fracture", "neon_gut"],
    "behavior": {
      "type": "bounce",
      "bounceHeight": 150,
      "bounceInterval": 0.8,
      "horizontalDrift": 40
    }
  }
}
```

### Enemy AI Pattern: Simple State Machine

Each enemy type has its own `update()` with state transitions. No shared behavior tree — keeps each enemy self-contained and easy to tune.

```
Example: Hopper
  IDLE → (player nearby) → BOUNCING → (at peak) → FALLING → (landed) → BOUNCING
  Any state → (hp <= 0) → DYING → onDeath()

Example: TurretBloom
  IDLE → (player in range) → AIMING → (aim locked) → FIRING → (burst done) → COOLDOWN → AIMING
  Any state → (hp <= 0) → DYING → onDeath()
```

---

## 11. Weapon System

### Weapon Definition (weapons.json)

```json
{
  "balanced_auto": {
    "name": "Pulse Rifle",
    "type": "auto",
    "fireRate": 8,
    "damage": 1,
    "projectileSpeed": 700,
    "spread": 3,
    "recoilForce": -20,
    "projectilesPerShot": 1,
    "piercing": false,
    "heatPerShot": 0,
    "maxHeat": 0,
    "sfx": "sfx_pulse_fire",
    "muzzleVfx": "vfx_pulse_muzzle"
  },
  "shotgun_burst": {
    "name": "Scatter Cannon",
    "type": "burst",
    "fireRate": 2,
    "damage": 1,
    "projectileSpeed": 600,
    "spread": 25,
    "recoilForce": -80,
    "projectilesPerShot": 5,
    "piercing": false,
    "heatPerShot": 0,
    "maxHeat": 0,
    "sfx": "sfx_scatter_fire",
    "muzzleVfx": "vfx_scatter_muzzle"
  }
}
```

### Weapon System

```typescript
// src/systems/WeaponSystem.ts
export class WeaponSystem {
  private fireCooldown = 0;

  constructor(private projPool: ObjectPool<Projectile>) {}

  fixedUpdate(input: InputFrame, player: Player, world: World): void {
    this.fireCooldown -= FIXED_DT;

    if (input.fire && this.fireCooldown <= 0) {
      const weapon = player.currentWeapon;
      const interval = 1 / weapon.fireRate;
      this.fireCooldown = interval;

      for (let i = 0; i < weapon.projectilesPerShot; i++) {
        const proj = this.projPool.acquire();
        const spread = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
        const baseAngle = Math.PI / 2; // downward

        // Aim assist offset
        let aimAngle = baseAngle;
        if (input.aimTarget !== null) {
          const target = world.enemies.find(e => e.id === input.aimTarget);
          if (target) {
            aimAngle = Math.atan2(target.y - player.y, target.x - player.x);
          }
        }

        proj.x  = player.x;
        proj.y  = player.y + 10;
        proj.vx = Math.cos(aimAngle + spread) * weapon.projectileSpeed;
        proj.vy = Math.sin(aimAngle + spread) * weapon.projectileSpeed;
        proj.damage = weapon.damage;
        proj.active = true;
        proj.owner  = 'player';
      }

      // Recoil
      player.vy += weapon.recoilForce;

      // SFX + VFX
      world.audio.playSFX(weapon.sfx);
      world.vfx.emit(weapon.muzzleVfx, player.x, player.y + 10);
    }
  }
}
```

---

## 12. Combo System

### Combo Mechanics

```typescript
// src/systems/ComboSystem.ts
export class ComboSystem {
  count:        number = 0;
  multiplier:   number = 1;
  decayTimer:   number = 0;
  tier:         number = 0; // 0-4

  private readonly DECAY_TIME     = 2.0;   // seconds to lose combo
  private readonly TIER_THRESHOLDS = [0, 5, 15, 30, 60];
  private readonly TIER_MULTIPLIERS = [1, 1.5, 2, 3, 5];

  constructor(private events: EventBus) {
    events.on('enemy:killed',  () => this.increment(1));
    events.on('stomp:hit',     () => this.increment(2));
    events.on('near:miss',     () => this.increment(1));
    events.on('player:damage', () => this.break());
  }

  increment(value: number): void {
    this.count += value;
    this.decayTimer = this.DECAY_TIME;
    this.updateTier();
    this.events.emit('combo:increment', { count: this.count, tier: this.tier });
  }

  break(): void {
    if (this.count === 0) return;
    const prev = this.count;
    this.count = 0;
    this.multiplier = 1;
    this.tier = 0;
    this.decayTimer = 0;
    this.events.emit('combo:break', { finalCount: prev });
  }

  fixedUpdate(dt: number): void {
    if (this.count > 0) {
      this.decayTimer -= dt;
      if (this.decayTimer <= 0) {
        this.break();
      }
    }
  }

  private updateTier(): void {
    for (let i = this.TIER_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.count >= this.TIER_THRESHOLDS[i]!) {
        this.tier = i;
        this.multiplier = this.TIER_MULTIPLIERS[i]!;
        break;
      }
    }
  }
}
```

### Combo Triggers & Effects

| Trigger | Combo Points | Notes |
|---------|-------------|-------|
| Kill enemy | +1 | Base |
| Stomp kill | +2 | Risk/reward bonus |
| Kill in air (no wall contact) | +1 bonus | Skill reward |
| Near-miss (dodge within 20px) | +1 | Aggressive play reward |
| No-damage chunk clear | +3 | Chunk-level bonus |
| Hazard threading | +1 | Passed close to hazard |

| Tier | Count | Multiplier | Feedback |
|------|-------|-----------|----------|
| 0 | 0–4 | 1.0x | Baseline |
| 1 | 5–14 | 1.5x | UI pulse, slight glow |
| 2 | 15–29 | 2.0x | Screen edge glow, music layer +1 |
| 3 | 30–59 | 3.0x | Strong glow, particles, music layer +2 |
| 4 | 60+ | 5.0x | Full intensity, max music, screen edge fire |

---

## 13. Upgrade & Build System

### Upgrade Data Schema (upgrades.json)

```json
{
  "stomp_shockwave": {
    "name": "Shockwave Stomp",
    "description": "Stomp creates a damage ring",
    "category": "stomp",
    "rarity": "uncommon",
    "icon": "icon_shockwave",
    "effects": [
      { "type": "stomp_aoe_radius", "value": 60 },
      { "type": "stomp_aoe_damage", "value": 1 }
    ],
    "tags": ["aoe", "aggressive"],
    "maxStacks": 2
  }
}
```

### Upgrade Categories

| Category | Examples |
|----------|---------|
| weapon | Piercing rounds, faster fire rate, ricochet |
| mobility | Extra dash charge, faster move speed, air brake |
| stomp | Shockwave, bigger bounce, damage boost |
| combo | Slower decay, bonus points, tier perks |
| defense | Shield shard, lifesteal on kill, damage reduction |
| economy | Magnet range, bonus currency, lucky drops |
| special | Enhanced special ability, lower cooldown |

### Upgrade System

```typescript
// src/systems/UpgradeSystem.ts
export class UpgradeSystem {
  private active: Map<string, { def: UpgradeDef; stacks: number }> = new Map();

  apply(upgrade: UpgradeDef): void {
    const existing = this.active.get(upgrade.id);
    if (existing && existing.stacks < upgrade.maxStacks) {
      existing.stacks++;
    } else if (!existing) {
      this.active.set(upgrade.id, { def: upgrade, stacks: 1 });
    }
  }

  /** Query total effect value for a given effect type */
  getEffect(type: string): number {
    let total = 0;
    for (const { def, stacks } of this.active.values()) {
      for (const effect of def.effects) {
        if (effect.type === type) total += effect.value * stacks;
      }
    }
    return total;
  }

  /** Generate 3 upgrade choices weighted by rarity and tags */
  generateChoices(rng: SeededRNG, all: UpgradeDef[], count: number = 3): UpgradeDef[] {
    const available = all.filter(u => {
      const existing = this.active.get(u.id);
      return !existing || existing.stacks < u.maxStacks;
    });
    const choices: UpgradeDef[] = [];
    for (let i = 0; i < count && available.length > 0; i++) {
      const weights = available.map(u => RARITY_WEIGHTS[u.rarity] ?? 1);
      const pick = rng.weightedPick(available, weights);
      choices.push(pick);
      available.splice(available.indexOf(pick), 1);
    }
    return choices;
  }
}

const RARITY_WEIGHTS: Record<string, number> = {
  common:    5,
  uncommon:  3,
  rare:      1.5,
  legendary: 0.5,
};
```

---

## 14. VFX System

### Architecture

```
VFXSystem
├── ParticlePool (ring buffer, max 512 particles)
├── ScreenShake
├── HitStop
├── Flash
└── Presets (named configurations)
```

### Particle Pool (Ring Buffer)

```typescript
// src/vfx/ParticlePool.ts
export interface Particle {
  active:   boolean;
  x:        number;
  y:        number;
  vx:       number;
  vy:       number;
  life:     number;   // remaining
  maxLife:  number;
  size:     number;
  color:    string;
  alpha:    number;
  gravity:  number;
  friction: number;
}

export class ParticlePool {
  private particles: Particle[];
  private head = 0;
  readonly MAX = 512;

  constructor() {
    this.particles = Array.from({ length: this.MAX }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, size: 0, color: '', alpha: 1,
      gravity: 0, friction: 1,
    }));
  }

  emit(preset: ParticlePreset, x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.head]!;
      this.head = (this.head + 1) % this.MAX;

      p.active  = true;
      p.x       = x + (Math.random() - 0.5) * preset.spawnRadius;
      p.y       = y + (Math.random() - 0.5) * preset.spawnRadius;
      p.vx      = preset.vxRange[0] + Math.random() * (preset.vxRange[1] - preset.vxRange[0]);
      p.vy      = preset.vyRange[0] + Math.random() * (preset.vyRange[1] - preset.vyRange[0]);
      p.life    = preset.life + (Math.random() - 0.5) * preset.lifeVariance;
      p.maxLife = p.life;
      p.size    = preset.size;
      p.color   = preset.colors[Math.floor(Math.random() * preset.colors.length)]!;
      p.alpha   = 1;
      p.gravity = preset.gravity;
      p.friction = preset.friction;
    }
  }

  fixedUpdate(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.alpha = p.life / p.maxLife;
    }
  }

  get active(): readonly Particle[] { return this.particles; }
}
```

### HitStop

```typescript
// src/vfx/HitStop.ts
export class HitStop {
  active:   boolean = false;
  private remaining: number = 0;

  trigger(frames: number): void {
    this.active    = true;
    this.remaining = frames;
  }

  update(): void {
    if (!this.active) return;
    this.remaining--;
    if (this.remaining <= 0) this.active = false;
  }
}
```

### ScreenShake

```typescript
// src/vfx/ScreenShake.ts
export class ScreenShake {
  offsetX = 0;
  offsetY = 0;
  private intensity = 0;
  private decay     = 0.9;

  trigger(intensity: number): void {
    this.intensity = Math.max(this.intensity, intensity);
  }

  update(): void {
    if (this.intensity < 0.5) {
      this.intensity = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
    this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
    this.intensity *= this.decay;
  }
}
```

### VFX Presets

```typescript
// src/vfx/Presets.ts
export const VFX_PRESETS: Record<string, ParticlePreset> = {
  enemy_death: {
    count: 12,
    spawnRadius: 8,
    vxRange: [-200, 200],
    vyRange: [-300, 100],
    life: 0.4,
    lifeVariance: 0.15,
    size: 4,
    colors: ['#ff4466', '#ff6644', '#ffaa22'],
    gravity: 400,
    friction: 0.95,
  },
  stomp_impact: {
    count: 20,
    spawnRadius: 4,
    vxRange: [-300, 300],
    vyRange: [-50, 50],
    life: 0.3,
    lifeVariance: 0.1,
    size: 3,
    colors: ['#44ffff', '#88ffff', '#ffffff'],
    gravity: 0,
    friction: 0.9,
  },
  muzzle_flash: {
    count: 6,
    spawnRadius: 2,
    vxRange: [-50, 50],
    vyRange: [100, 300],
    life: 0.15,
    lifeVariance: 0.05,
    size: 3,
    colors: ['#ffff44', '#ffaa22', '#ffffff'],
    gravity: 0,
    friction: 0.85,
  },
};
```

---

## 15. Audio System

### Architecture: Raw Web Audio API

No library. Full control over adaptive music layer fading and SFX concurrency.

```typescript
// src/audio/AudioSystem.ts
export class AudioSystem {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private sfxGain:    GainNode;
  private musicGain:  GainNode;
  private sfxPool:    SFXPool;
  private music:      MusicManager;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.masterGain);

    this.sfxPool = new SFXPool(this.ctx, this.sfxGain, 16);
    this.music   = new MusicManager(this.ctx, this.musicGain);
  }

  /** Must be called from user gesture to unlock audio on mobile */
  unlock(): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSFX(id: string, volume?: number): void {
    this.sfxPool.play(id, volume);
  }

  /** Crossfade music layers based on combo tier + danger level */
  updateAdaptiveMusic(comboTier: number, nearDeath: boolean): void {
    this.music.setLayers(comboTier, nearDeath);
  }
}
```

### SFX Pool

```typescript
// src/audio/SFXPool.ts
export class SFXPool {
  private buffers = new Map<string, AudioBuffer>();
  private voices: AudioBufferSourceNode[] = [];
  private maxVoices: number;

  constructor(
    private ctx: AudioContext,
    private output: GainNode,
    maxVoices: number
  ) {
    this.maxVoices = maxVoices;
  }

  async loadBuffer(id: string, url: string): Promise<void> {
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    const buf  = await this.ctx.decodeAudioData(data);
    this.buffers.set(id, buf);
  }

  play(id: string, volume: number = 1): void {
    const buf = this.buffers.get(id);
    if (!buf) return;

    // Evict oldest voice if at capacity
    if (this.voices.length >= this.maxVoices) {
      const oldest = this.voices.shift()!;
      oldest.stop();
      oldest.disconnect();
    }

    const source = this.ctx.createBufferSource();
    const gain   = this.ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buf;
    source.connect(gain).connect(this.output);
    source.start();
    this.voices.push(source);

    source.onended = () => {
      const idx = this.voices.indexOf(source);
      if (idx >= 0) this.voices.splice(idx, 1);
      source.disconnect();
      gain.disconnect();
    };
  }
}
```

### Adaptive Music (4-layer stem system)

```
Layer 0: Base ambient/rhythm (always playing)
Layer 1: Percussion (combo tier >= 1)
Layer 2: Melody/lead (combo tier >= 2)
Layer 3: Intensity/climax (combo tier >= 3 OR near-death)

All stems loop-synced. Layers fade in/out with 0.5s crossfade.
Biome transition triggers stem swap with 2s crossfade.
```

---

## 16. Camera System

### Camera Behavior

```typescript
// src/rendering/Camera.ts
export class Camera {
  x:     number = CANVAS_W / 2;
  y:     number = 0;
  zoom:  number = 1;

  private targetY:     number = 0;
  private lookAhead:   number = 120;  // px below player
  private smoothSpeed: number = 8;    // lerp factor

  // From ScreenShake
  shakeOffsetX: number = 0;
  shakeOffsetY: number = 0;

  get top():    number { return this.y - CANVAS_H / 2 / this.zoom; }
  get bottom(): number { return this.y + CANVAS_H / 2 / this.zoom; }
  get left():   number { return this.x - CANVAS_W / 2 / this.zoom; }
  get right():  number { return this.x + CANVAS_W / 2 / this.zoom; }

  update(player: Player, dt: number, intensity: number): void {
    // Look-ahead: camera leads below player
    this.targetY = player.y + this.lookAhead;

    // Smooth follow
    this.y += (this.targetY - this.y) * this.smoothSpeed * dt;

    // Dynamic zoom based on intensity (zoom out when chaotic)
    const targetZoom = 1.0 - intensity * 0.08; // max 8% zoom out
    this.zoom += (targetZoom - this.zoom) * 3 * dt;
    this.zoom = Math.max(0.85, Math.min(1.0, this.zoom));
  }

  /** Apply camera transform to a 2D context */
  applyTransform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(CANVAS_W / 2 + this.shakeOffsetX, CANVAS_H / 2 + this.shakeOffsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    ctx.restore();
  }

  isVisible(rect: AABB): boolean {
    return rect.x + rect.w > this.left && rect.x < this.right &&
           rect.y + rect.h > this.top  && rect.y < this.bottom;
  }
}
```

---

## 17. UI System

### Architecture: Canvas-Based Overlay

UI is rendered on a separate canvas overlaid on the game canvas. No DOM elements during gameplay (performance).

### HUD Layout (Portrait 360×640)

```
┌─────────────────────────────┐
│ ♥♥♥          COMBO x3  1284│  ← HP left, combo center, score right
│                             │
│                             │
│                             │
│       (gameplay area)       │
│                             │
│                             │
│                             │
│                             │
│ 🔫 ████████████  ⚡ READY   │  ← weapon heat, special status
└─────────────────────────────┘
```

### HUD State

```typescript
// src/ui/HUD.ts
export interface HUDState {
  hp:           number;
  maxHp:        number;
  score:        number;
  comboCount:   number;
  comboTier:    number;
  comboDecay:   number;   // 0–1 for decay bar
  depth:        number;
  weaponHeat:   number;   // 0–1
  specialReady: boolean;
  currency:     number;
}

export class HUD {
  constructor(private ctx: CanvasRenderingContext2D) {}

  render(state: HUDState): void {
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawHP(state);
    this.drawCombo(state);
    this.drawScore(state);
    this.drawWeaponBar(state);
    this.drawDepth(state);
    if (state.comboTier >= 2) this.drawScreenEdgeGlow(state.comboTier);
  }

  private drawHP(state: HUDState): void {
    // Red hearts, left-aligned, top row
    for (let i = 0; i < state.maxHp; i++) {
      const filled = i < state.hp;
      this.ctx.fillStyle = filled ? '#ff4466' : '#333333';
      this.ctx.fillRect(10 + i * 22, 10, 18, 16);
    }
  }

  private drawCombo(state: HUDState): void {
    if (state.comboCount === 0) return;
    const tierColors = ['#ffffff', '#44ffff', '#44ff44', '#ffaa22', '#ff4466'];
    this.ctx.fillStyle = tierColors[state.comboTier] ?? '#ffffff';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`x${state.comboCount}`, CANVAS_W / 2, 28);
  }

  private drawScore(state: HUDState): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(state.score.toString(), CANVAS_W - 10, 24);
  }

  // ... drawWeaponBar, drawDepth, drawScreenEdgeGlow
}
```

### Menu / Death / Shop UI

Between-gameplay screens use the same canvas rendering approach. Transition effects (fade, slide) are handled by the state machine's `onEnter`/`onExit` with tween timers.

Key rule: **All touch targets minimum 44×44px** (Apple HIG minimum).

---

## 18. Save & Progression System

### Storage: IndexedDB (via idb-keyval)

```typescript
// src/save/SaveManager.ts
import { get, set, del } from 'idb-keyval';

export class SaveManager {
  async saveMeta(meta: MetaSaveData): Promise<void> {
    await set('meta', meta);
  }

  async loadMeta(): Promise<MetaSaveData | null> {
    return (await get('meta')) ?? null;
  }

  async saveRun(state: RunState): Promise<void> {
    await set('activeRun', state);
  }

  async loadRun(): Promise<RunState | null> {
    return (await get('activeRun')) ?? null;
  }

  async clearRun(): Promise<void> {
    await del('activeRun');
  }

  /** Auto-save every 30 seconds during gameplay */
  private autoSaveInterval: number = 0;
  startAutoSave(getState: () => RunState): void {
    this.autoSaveInterval = window.setInterval(() => {
      this.saveRun(getState());
    }, 30000);
  }

  stopAutoSave(): void {
    clearInterval(this.autoSaveInterval);
  }
}
```

### Meta Save Data

```typescript
export interface MetaSaveData {
  version:       number;
  currency:      number;
  totalRuns:     number;
  bestScore:     number;
  bestDepth:     number;
  bestCombo:     number;
  unlocks:       string[];     // upgrade/weapon/cosmetic IDs
  loadout:       LoadoutData;
  stats:         LifetimeStats;
  dailySeed:     string | null;
  dailyBestScore: number;
  settings:      PlayerSettings;
}

export interface LoadoutData {
  weaponId:   string;
  specialId:  string;
  cosmeticId: string;
}
```

### Run State (Serializable Snapshot)

```typescript
export interface RunState {
  seed:          number;
  depth:         number;
  score:         number;
  hp:            number;
  currency:      number;
  weaponId:      string;
  upgrades:      string[];
  comboCount:    number;
  chunkIndex:    number;
  biomeIndex:    number;
  playerX:       number;
  playerY:       number;
  timestamp:     number;
}
```

### Resume Flow

```
App Launch
  ├── loadMeta() → restore settings, unlocks
  ├── loadRun()
  │   ├── exists → prompt "Continue run?" → PLAYING (from snapshot)
  │   └── null   → MENU
  └── Visibility change (tab hidden / lock screen)
      └── auto-save current RunState immediately
```

---

## 19. PWA Architecture

### manifest.json

```json
{
  "name": "NEON DESCENT",
  "short_name": "NEON DESCENT",
  "description": "Vertical action-roguelite",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "theme_color": "#0a0a1a",
  "background_color": "#0a0a1a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker Strategy (Workbox via vite-plugin-pwa)

| Asset Type | Strategy | TTL |
|------------|----------|-----|
| App shell (HTML, JS, CSS) | Precache (build-time) | Until next deploy |
| Sprites, fonts | Precache | Until next deploy |
| Audio (SFX) | CacheFirst | 30 days |
| Music stems | CacheFirst | 30 days |
| Analytics/API calls | NetworkOnly | — |

### Offline Capability

After first visit + SW install, the full game is playable offline. Progression saves to IndexedDB. Analytics queue locally and flush on reconnect.

### Install Prompt

```typescript
// src/ui/InstallPrompt.ts
export class InstallPrompt {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private shown = false;

  init(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });
  }

  /** Show after 3rd run completion (not before) */
  shouldShow(totalRuns: number): boolean {
    return !this.shown && this.deferredPrompt !== null && totalRuns >= 3;
  }

  async prompt(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.shown = true;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
  }
}
```

### Visibility / Resume Handling

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.loop.stop();
    game.save.saveRun(RunState.fromWorld(game.world));
    game.audio.ctx.suspend();
  } else {
    game.audio.ctx.resume();
    game.loop.start(); // accumulator capped by MAX_FRAME_DT
  }
});
```

---

## 20. Performance Budget

### Entity Limits

| Entity | Max Active | Pool Size | Notes |
|--------|-----------|-----------|-------|
| Enemies | 16 | 24 | Per screen |
| Player projectiles | 32 | 48 | Auto weapons can sustain this |
| Enemy projectiles | 24 | 32 | Turrets, bosses |
| Pickups | 20 | 32 | Currency, HP, buffs |
| Particles | 512 | 512 (ring) | Ring buffer, no alloc |
| Active chunks | 4 | 6 | Visible + 1 buffer above/below |

### GC Mitigation Rules

1. **No allocations in hot path.** `fixedUpdate()` and `render()` must not create objects, arrays, or closures.
2. **Pre-allocate all pools** at boot.
3. **Reuse Vec2 scratch objects** instead of creating `{x, y}` literals.
4. **Swap-and-pop** for array removal (not `splice`).
5. **String constants** for event names (no template literals in emit).
6. **Avoid `Map.forEach`** — use `for...of` on entries.

### Render Budget

| Operation | Max Budget |
|-----------|-----------|
| Background (parallax, 2-3 layers) | 1.5ms |
| Tile rendering (visible chunks) | 2.0ms |
| Entity rendering | 2.0ms |
| Particle rendering | 1.5ms |
| HUD overlay | 0.5ms |
| Composite (layer merge) | 0.5ms |
| **Total render** | **8.0ms** |

### Canvas Layer Strategy

```
Layer 0: Background     (OffscreenCanvas) — redrawn on scroll
Layer 1: Tiles          (OffscreenCanvas) — redrawn on chunk change
Layer 2: Entities       (OffscreenCanvas) — redrawn every frame
Layer 3: Particles/VFX  (OffscreenCanvas) — redrawn every frame
Layer 4: HUD            (overlay canvas)  — redrawn on data change
```

Layers 0–1 can be cached and only re-rendered when camera moves significantly or chunks change. This saves ~3.5ms per frame in steady state.

---

## 21. Analytics Hooks

### Event Architecture

```typescript
// src/analytics/AnalyticsManager.ts
export class AnalyticsManager {
  private queue: AnalyticsEvent[] = [];
  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL = 30000; // 30s

  constructor(private events: EventBus) {
    // Tap game events
    events.on('run:start',     (d) => this.track('run_start', d));
    events.on('run:end',       (d) => this.track('run_end', d));
    events.on('player:death',  (d) => this.track('death', d));
    events.on('upgrade:chosen',(d) => this.track('upgrade_chosen', d));
    events.on('combo:break',   (d) => this.track('combo_break', d));
    events.on('biome:enter',   (d) => this.track('biome_enter', d));
    events.on('shop:purchase', (d) => this.track('shop_purchase', d));

    setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  track(name: string, data: Record<string, unknown> = {}): void {
    this.queue.push({
      name,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
    if (this.queue.length >= this.BATCH_SIZE) this.flush();
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    // Store in IndexedDB if offline, send when online
    if (navigator.onLine) {
      // POST to analytics endpoint
    } else {
      // Queue in IndexedDB for later
    }
  }
}
```

### Key Events

| Event | Data | Purpose |
|-------|------|---------|
| run_start | seed, loadout, biome | Session tracking |
| run_end | score, depth, duration, cause | Retention analysis |
| death | position, killer, hp, combo | Death heatmap |
| upgrade_chosen | upgradeId, alternatives | Balance tuning |
| combo_break | count, tier, cause | Combo design feedback |
| biome_enter | biomeId, depth, hp | Progression gating |
| quit_point | state, depth, duration | Frustration detection |

---

## 22. Content Data Architecture

All gameplay content is defined in JSON files under `src/data/`. The game loads these at boot and uses them as read-only configuration.

### Schema Overview

| File | Defines | Key Fields |
|------|---------|-----------|
| enemies.json | Enemy types | hp, damage, speed, behavior, hitbox, biomes |
| weapons.json | Weapon types | fireRate, damage, spread, recoil, projectiles |
| upgrades.json | Upgrades | effects, rarity, category, maxStacks, tags |
| chunks.json | Chunk templates | grid[][], spawns[], category, biomes, difficulty |
| biomes.json | Biome definitions | palette, enemies, hazards, music, depth range |
| balance.json | Global tuning | physics, combo, scoring, pacing, difficulty curve |

### balance.json Structure

```json
{
  "player": {
    "gravity": 1800,
    "terminalVelocity": 600,
    "moveAccel": 2400,
    "maxMoveSpeed": 280,
    "baseHp": 3,
    "invulnDuration": 1.0,
    "stompSpeed": 900,
    "stompBounce": -400,
    "dashSpeed": 500,
    "dashCooldown": 0.6,
    "wallSlideSpeed": 80
  },
  "combo": {
    "decayTime": 2.0,
    "tierThresholds": [0, 5, 15, 30, 60],
    "tierMultipliers": [1, 1.5, 2, 3, 5]
  },
  "pacing": {
    "baseScrollSpeed": 80,
    "maxScrollSpeed": 200,
    "recoveryInterval": 6,
    "shopInterval": 12,
    "eliteMinDepth": 3000,
    "bossInterval": 30
  },
  "scoring": {
    "depthPerPoint": 10,
    "killBase": 100,
    "eliteKillBonus": 500,
    "noDamageChunkBonus": 200,
    "comboBreakPenalty": 0
  },
  "difficulty": {
    "baseMultiplier": 1.0,
    "depthScaling": 0.00005,
    "maxMultiplier": 3.0
  }
}
```

---

## 23. Implementation Sequence

### Phase 1 — Engine Foundation (Week 1–2)

- [ ] Scaffold Vite + TypeScript project with path aliases
- [ ] `GameLoop` with fixed timestep
- [ ] `EventBus` with typed events
- [ ] `StateMachine` with `BootState` → `MenuState` → `PlayingState`
- [ ] `ObjectPool` generic
- [ ] `InputManager` + `GestureRecognizer` + `InputBuffer`
- [ ] Canvas setup with `Camera` + `LayerStack` (colored rectangles)
- [ ] DPR-aware canvas scaling

### Phase 2 — Player & Physics (Week 3–4)

- [ ] `Player` entity with state machine (falling, stomping, dashing, wall-sliding)
- [ ] `PhysicsSystem` (gravity, horizontal movement, terminal velocity)
- [ ] `CollisionSystem` with spatial hash and AABB tile resolution
- [ ] Stomp, dash, wall-slide, coyote time all functional
- [ ] `ScreenShake` + `HitStop` wired to test events
- [ ] Single hardcoded chunk renders + player traverses correctly

### Phase 3 — World Generation (Week 5–6)

- [ ] `ChunkTemplate` loader from `chunks.json`
- [ ] `ChunkGenerator` with weighted selection + biome filtering
- [ ] `AntiBullshitValidator` flood-fill on all templates
- [ ] `PacingController` driving chunk selection + scroll speed
- [ ] `BiomeManager` with palette swap on depth transitions
- [ ] Infinite descent working with 2–3 biomes
- [ ] `SeededRNG` for deterministic runs

### Phase 4 — Combat (Week 7–8)

- [ ] `WeaponSystem` with 2 weapon types (auto + burst)
- [ ] Projectile pool with enemy collision
- [ ] `EnemyBase` + 3–4 enemy types with AI state machines
- [ ] `SpawnSystem` reading chunk spawn points
- [ ] `DamageSystem` connecting hits → HP → events
- [ ] `ComboSystem` tracking kills, stomps, near-misses
- [ ] `AimAssist` for soft targeting
- [ ] `VFXSystem` with `ParticlePool`, muzzle flash, death burst

### Phase 5 — Progression & Audio (Week 9–10)

- [ ] `AudioSystem` with Web Audio, SFX pool, unlock on gesture
- [ ] `MusicManager` with 4-layer adaptive stems
- [ ] `ShopState` + `UpgradeSystem` with upgrade card UI
- [ ] `SaveManager` (IndexedDB) with auto-save + resume
- [ ] `MetaProgression` (currency, unlocks, loadout persistence)
- [ ] `ScoreSystem` with per-run calculation
- [ ] `DeadState` with results screen + quick retry

### Phase 6 — PWA & Polish (Week 11–12)

- [ ] `vite-plugin-pwa` setup: service worker, manifest, offline cache
- [ ] `InstallPrompt` (after 3rd run)
- [ ] Orientation lock + fullscreen
- [ ] `AnalyticsManager` with event batching
- [ ] `HUD` with all elements (HP, combo, score, weapon heat, depth)
- [ ] Performance profiling: entity limits enforced, GC audit
- [ ] All 5 biomes with distinct palette + enemy pool
- [ ] Lighthouse PWA audit ≥ 90

---

## 24. Critical Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ECS vs OOP | Class inheritance (3 levels max) | <80 entities; simpler debugging; no indirection overhead |
| Physics | Custom fixed-step integrator | Zero dependency; full control over mobile feel tuning |
| Rendering | Canvas 2D + OffscreenCanvas layers | Broad mobile compat; WebGL opt-in later via Renderer swap |
| Chunk size | 12×21 tiles, 30px = 360×630px | Matches logical portrait canvas exactly |
| RNG | Seeded LCG (`SeededRNG`) | Deterministic chunk replay from run seed |
| State persistence | IndexedDB via idb-keyval | Survives tab kill; async, non-blocking |
| Event system | Typed `EventBus` | Decouples systems; analytics tap any event |
| Object pooling | `ObjectPool<T>` + ring-buffer particles | GC-safe; ring buffer = O(1) particle emit |
| Collision | Spatial hash, 64px cells | Correct scale for 360px world; no library needed |
| Audio | Raw Web Audio API | No library weight; full adaptive layer control |
| UI | Canvas-based (no DOM in gameplay) | Avoids DOM reflow jank; consistent rendering |
| Build | Vite | Fast dev iteration; native TS; tree-shaking; PWA plugin |

---

## Appendix: EventBus Type Map

```typescript
// src/core/EventBus.ts
export interface GameEvents {
  'player:damage':    { amount: number; source: string };
  'player:dead':      { position: Vec2; killer: string };
  'player:heal':      { amount: number };
  'enemy:killed':     { enemy: EnemyBase; killer: string };
  'enemy:damaged':    { enemy: EnemyBase; amount: number };
  'stomp:hit':        { target: Entity; bounceForce: number };
  'dash:start':       { direction: Vec2 };
  'combo:increment':  { count: number; tier: number };
  'combo:break':      { finalCount: number };
  'near:miss':        { distance: number };
  'pickup:collected': { type: string; value: number };
  'upgrade:chosen':   { id: string; alternatives: string[] };
  'shop:purchase':    { id: string; cost: number };
  'biome:enter':      { id: string; depth: number };
  'chunk:entered':    { chunk: Chunk };
  'run:start':        { seed: number; loadout: LoadoutData };
  'run:end':          { score: number; depth: number; cause: string };
  'score:update':     { score: number; delta: number };
}

export class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof GameEvents>(event: K, fn: (data: GameEvents[K]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off<K extends keyof GameEvents>(event: K, fn: (data: GameEvents[K]) => void): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const fns = this.listeners.get(event);
    if (fns) for (const fn of fns) fn(data);
  }
}
```

## Appendix: Utility Functions

```typescript
// src/utils/math.ts
export interface Vec2 { x: number; y: number; }

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const remap = (v: number, a: number, b: number, c: number, d: number): number =>
  c + ((v - a) / (b - a)) * (d - c);

export const dist = (a: Vec2, b: Vec2): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

export const norm = (v: Vec2): Vec2 => {
  const m = Math.hypot(v.x, v.y);
  return m ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
};
```

## Appendix: SeededRNG

```typescript
// src/utils/SeededRNG.ts
export class SeededRNG {
  private s: number;

  constructor(seed: number) { this.s = seed >>> 0; }

  next(): number {
    this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0;
    return this.s / 0x100000000;
  }

  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)]!;
  }

  weightedPick<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }
}
```
