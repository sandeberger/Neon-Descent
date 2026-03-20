import { Player } from '@entities/Player';
import { Projectile } from '@entities/Projectile';
import { Pickup } from '@entities/Pickup';
import { Hopper } from '@entities/enemies/Hopper';
import { TurretBloom } from '@entities/enemies/TurretBloom';
import { Splitter } from '@entities/enemies/Splitter';
import { SplitterFragment } from '@entities/enemies/SplitterFragment';
import { ShieldBug } from '@entities/enemies/ShieldBug';
import { Leech } from '@entities/enemies/Leech';
import { ParasiteCloud } from '@entities/enemies/ParasiteCloud';
import { SentinelMiniboss } from '@entities/enemies/SentinelMiniboss';
import { RailSentinel } from '@entities/enemies/RailSentinel';
import { CoreCarrier } from '@entities/enemies/CoreCarrier';
import { BloomHeart } from '@entities/enemies/BloomHeart';
import { Ambusher } from '@entities/enemies/Ambusher';
import { Bomber } from '@entities/enemies/Bomber';
import { Mirror } from '@entities/enemies/Mirror';
import { SwarmMother } from '@entities/enemies/SwarmMother';
import { SwarmDrone } from '@entities/enemies/SwarmDrone';
import { DrillMother } from '@entities/enemies/DrillMother';
import { AcidWyrm } from '@entities/enemies/AcidWyrm';
import { DataGuardian } from '@entities/enemies/DataGuardian';
import type { EnemyBase } from '@entities/enemies/EnemyBase';
import { EventBus } from '@core/EventBus';
import { ObjectPool } from '@core/ObjectPool';
import { PhysicsSystem } from '@systems/PhysicsSystem';
import { CollisionSystem, aabbOverlap } from '@systems/CollisionSystem';
import { ComboSystem } from '@systems/ComboSystem';
import { WeaponSystem } from '@systems/WeaponSystem';
import { UpgradeSystem } from '@systems/UpgradeSystem';
import { DamageSystem } from '@systems/DamageSystem';
import { ScoreSystem } from '@systems/ScoreSystem';
import { AntiBullshitSystem } from '@systems/AntiBullshitSystem';
import { SpecialAbilitySystem } from '@systems/SpecialAbilitySystem';
import { AimAssist } from '@input/AimAssist';
import { VFXSystem } from '@vfx/VFXSystem';
import { Camera } from '@render/Camera';
import { Chunk } from './Chunk';
import { ChunkGenerator } from './ChunkGenerator';
import { PacingController } from './PacingController';
import { BUILT_IN_CHUNKS } from './ChunkData';
import { SeededRNG } from '@utils/SeededRNG';
import type { InputFrame } from '@input/InputTypes';
import type { AABB } from '@entities/Entity';
import type { RunState } from '@save/SaveManager';
import {
  CANVAS_W, CANVAS_H,
  CHUNK_HEIGHT, CHUNK_COLS, CHUNK_ROWS, TILE_SIZE,
  MAX_ENEMIES, MAX_PLAYER_PROJ, MAX_ENEMY_PROJ, MAX_PICKUPS,
  PICKUP_MAGNET_RANGE,
  STOMP_BOUNCE,
  COMBO_DECAY_TIME,
} from '@core/Constants';
import { TileType } from './ChunkTemplate';
import { RUN_UPGRADES } from '@systems/UpgradeSystem';

export class World {
  readonly events: EventBus;
  readonly player: Player;
  readonly camera: Camera;
  readonly vfx: VFXSystem;
  readonly combo: ComboSystem;
  readonly pacing: PacingController;
  readonly upgrades: UpgradeSystem;
  readonly damage: DamageSystem;
  readonly scoring: ScoreSystem;
  readonly antibullshit: AntiBullshitSystem;
  readonly special: SpecialAbilitySystem;
  readonly rng: SeededRNG;

  enemies: EnemyBase[] = [];
  readonly projPool: ObjectPool<Projectile>;
  readonly enemyProjPool: ObjectPool<Projectile>;
  readonly pickupPool: ObjectPool<Pickup>;

  chunks: Chunk[] = [];
  private generator: ChunkGenerator;
  private aimAssist: AimAssist;
  private physics: PhysicsSystem;
  readonly collision: CollisionSystem;
  readonly weapons: WeaponSystem;
  private nextChunkY = 0;

  // In-run shop trigger
  private chunksSinceUpgrade = 0;
  private readonly UPGRADE_INTERVAL = 12;
  shopPending = false;
  seed: number;
  chunksGenerated = 0;
  isDaily = false;

  // Near-miss tracking (cooldown per projectile to prevent spam)
  private nearMissCooldown = 0;
  private readonly NEAR_MISS_RADIUS = 15;
  private readonly NEAR_MISS_COOLDOWN = 0.15;

  // Chunk crossing tracking
  private lastChunkIndex = -1;

  // Threat density for camera
  threatDensity = 0;

  // Biome hazard state
  laserSweepTimer = 0;
  darknessRadius = 0;

  constructor(seed?: number, restoreState?: RunState) {
    this.seed = seed ?? (Date.now() | 0);
    this.rng = new SeededRNG(this.seed);
    this.events = new EventBus();
    this.player = new Player(this.events);
    this.camera = new Camera();
    this.vfx = new VFXSystem();
    this.combo = new ComboSystem(this.events);
    this.upgrades = new UpgradeSystem();
    this.damage = new DamageSystem(this.events, this.upgrades, this.player);
    this.scoring = new ScoreSystem(this.events, this.combo, this.upgrades);
    this.antibullshit = new AntiBullshitSystem(this.events);
    this.pacing = new PacingController(this.events);
    this.special = new SpecialAbilitySystem(this.events);
    this.aimAssist = new AimAssist();
    this.physics = new PhysicsSystem();
    this.collision = new CollisionSystem();
    this.generator = new ChunkGenerator(BUILT_IN_CHUNKS, this.rng);

    this.projPool = new ObjectPool<Projectile>(
      () => new Projectile(),
      (p) => p.reset(),
      (p) => p.active,
      MAX_PLAYER_PROJ,
    );

    this.enemyProjPool = new ObjectPool<Projectile>(
      () => new Projectile(),
      (p) => p.reset(),
      (p) => p.active,
      MAX_ENEMY_PROJ,
    );

    this.pickupPool = new ObjectPool<Pickup>(
      () => new Pickup(),
      (p) => p.reset(),
      (p) => p.active,
      MAX_PICKUPS,
    );

    this.weapons = new WeaponSystem(this.projPool, this.events, this.vfx, this.upgrades);

    // Heal on pickup (currency handled by ScoreSystem)
    this.events.on('pickup:collected', (d) => {
      if (d.type === 'heal') this.player.heal(d.value);
    });

    if (restoreState) {
      this.isDaily = restoreState.isDaily ?? false;
      this.restore(restoreState);
    } else {
      this.init();
    }
  }

  private init(): void {
    // Place player
    this.player.reset(CANVAS_W / 2, 100);

    // Generate initial chunks
    for (let i = 0; i < 6; i++) {
      this.generateNextChunk();
    }

    this.camera.y = this.player.y;
  }

  private generateNextChunk(): void {
    const biome = this.pacing.getBiomeId();
    const template = this.generator.next(this.antibullshit, biome);
    const chunk = new Chunk(template, this.nextChunkY, biome);
    this.chunks.push(chunk);
    this.nextChunkY += CHUNK_HEIGHT;
    this.chunksGenerated++;

    // Track upgrade shop cadence
    this.chunksSinceUpgrade++;
    if (this.chunksSinceUpgrade >= this.UPGRADE_INTERVAL) {
      this.chunksSinceUpgrade = 0;
      this.shopPending = true;
    }
  }

  fixedUpdate(dt: number, input: InputFrame): void {
    if (this.vfx.hitStop.active) {
      this.vfx.update(dt);
      return;
    }

    // Player input + state
    this.player.handleInput(input, dt);
    this.player.updateState(dt);

    // Physics (with move speed upgrade)
    const moveSpeedMod = 1 + this.upgrades.getEffect('move_speed_bonus');
    this.physics.update(dt, this.player, input, moveSpeedMod);

    // Tile collisions
    this.resolveTileCollisions();

    // Aim assist — find target before firing
    input.aimTarget = this.aimAssist.getTarget(this.player.x, this.player.y, this.enemies);

    // Weapon (with aim + upgrades)
    this.weapons.update(input, this.player, this.enemies);

    // Special ability (EMP blast)
    this.special.update(dt);
    if (input.special && this.special.tryActivate()) {
      this.executeEmpBlast();
    }

    // Update projectiles
    for (const p of this.projPool.active) {
      p.savePrevious();
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.update(dt);

      // Canvas-edge bouncing for ricochet projectiles
      if (p.bouncesRemaining > 0 && p.active) {
        if (p.x <= 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
          p.bouncesRemaining--;
        } else if (p.x >= CANVAS_W) {
          p.x = CANVAS_W;
          p.vx = -Math.abs(p.vx);
          p.bouncesRemaining--;
        }
      }
    }

    // Update enemies
    for (const e of this.enemies) {
      if (e.active) {
        e.savePrevious();
        e.update(dt, this.player.x, this.player.y);
      }
    }

    // Process enemy pending shots
    this.processEnemyShots();

    // Process enemy spawns (CoreCarrier + BloomHeart)
    this.processEnemySpawns();

    // RailSentinel beam damage
    this.resolveBeamDamage();

    // Update enemy projectiles
    for (const p of this.enemyProjPool.active) {
      p.savePrevious();
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.update(dt);
    }

    // Update pickups
    for (const p of this.pickupPool.active) {
      if (p.active) p.update(dt);
    }

    // Entity collisions
    this.resolveEntityCollisions();

    // Near-miss detection
    this.detectNearMisses(dt);

    // Bomber explosion processing
    this.processBomberExplosions();

    // SwarmMother spawns
    this.processSwarmMotherSpawns();

    // Projectile vs breakable tiles
    this.resolveProjectileTiles();

    // Pickup magnet
    this.resolvePickups();

    // Combo (apply decay time upgrade)
    const comboDecayBonus = this.upgrades.getEffect('combo_decay_bonus');
    this.combo.decayTimeOverride = comboDecayBonus > 0
      ? COMBO_DECAY_TIME * (1 + comboDecayBonus) : null;
    this.combo.update(dt);

    // VFX
    this.vfx.update(dt);

    // Threat density calculation for camera
    this.calculateThreatDensity();

    // Biome hazard updates
    this.updateBiomeHazards(dt);

    // Camera
    this.camera.shakeOffsetX = this.vfx.shake.offsetX;
    this.camera.shakeOffsetY = this.vfx.shake.offsetY;
    this.camera.threatDensity = this.threatDensity;
    this.camera.update(this.player.y, dt, this.combo.tier / 4);

    // Depth tracking (delegated to ScoreSystem)
    this.scoring.addDepth(this.player.y);

    // Emit chunk:entered when player crosses chunk boundaries
    const currentChunkIdx = Math.floor(this.player.y / CHUNK_HEIGHT);
    if (currentChunkIdx !== this.lastChunkIndex) {
      this.lastChunkIndex = currentChunkIdx;
      this.events.emit('chunk:entered', { chunkIndex: currentChunkIdx });
    }

    // Spawn enemies from new chunks
    this.spawnFromChunks();

    // Generate more chunks if needed
    this.advanceChunks();

    // Pool sweep
    this.projPool.sweep();
    this.enemyProjPool.sweep();
    this.pickupPool.sweep();
    this.pruneEnemies();
  }

  private executeEmpBlast(): void {
    let enemiesHit = 0;
    const empDamage = 3;

    // Damage all on-screen enemies
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      // Check if on-screen
      if (enemy.y < this.camera.top - 50 || enemy.y > this.camera.bottom + 50) continue;
      const { killed } = this.damage.dealDamageToEnemy(enemy, empDamage, 'emp');
      enemiesHit++;
      if (killed) {
        this.events.emit('enemy:killed', {
          enemyId: enemy.id, killer: 'emp',
          x: enemy.x, y: enemy.y,
          scoreValue: enemy.scoreValue, comboValue: enemy.comboValue,
        });
        this.vfx.emit('enemy_death', enemy.x, enemy.y);
        this.spawnPickupAt(enemy.x, enemy.y);
      }
    }

    // Clear all enemy projectiles
    for (const p of this.enemyProjPool.active) {
      if (p.active) p.active = false;
    }

    // VFX
    this.vfx.emit('emp_blast', this.player.x, this.player.y);
    this.vfx.flash('#44ffff', 0.6, 0.3);
    this.vfx.shake.trigger(12);
    this.vfx.hitStop.trigger(5);

    this.events.emit('special:emp', {
      x: this.player.x, y: this.player.y, enemiesHit,
    });
  }

  private resolveTileCollisions(): void {
    const p = this.player;
    const bounds = p.getBounds();

    for (const chunk of this.chunks) {
      // Only check chunks near the player
      if (chunk.worldY > p.y + CANVAS_H || chunk.bottom < p.y - CANVAS_H) continue;

      // Check tiles around player
      const startCol = Math.max(0, Math.floor(bounds.x / TILE_SIZE));
      const endCol   = Math.min(CHUNK_COLS - 1, Math.floor((bounds.x + bounds.w) / TILE_SIZE));
      const localTop = bounds.y - chunk.worldY;
      const localBot = bounds.y + bounds.h - chunk.worldY;
      const startRow = Math.max(0, Math.floor(localTop / TILE_SIZE));
      const endRow   = Math.min(CHUNK_ROWS - 1, Math.floor(localBot / TILE_SIZE));

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const tile = chunk.getTile(col, row);
          if (tile === TileType.EMPTY) continue;

          const tileRect = chunk.getTileRect(col, row);

          if (tile === TileType.HAZARD) {
            if (aabbOverlap(bounds, tileRect)) {
              this.damage.dealDamageToPlayer(1, 'hazard');
            }
            continue;
          }

          if (tile === TileType.SOLID) {
            if (!aabbOverlap(bounds, tileRect)) continue;
            this.pushOut(p, tileRect);
          }

          if (tile === TileType.BREAKABLE) {
            if (!aabbOverlap(bounds, tileRect)) continue;
            this.pushOut(p, tileRect);
            // Stomp instantly destroys breakable tiles
            if (p.state === 'STOMPING') {
              chunk.clearTile(col, row);
              this.vfx.emit('stomp_impact', tileRect.x + TILE_SIZE / 2, tileRect.y + TILE_SIZE / 2);
              this.vfx.shake.trigger(4);
            } else if (p.vy >= 0 && p.prevY + p.hitbox.height / 2 <= tileRect.y + 4) {
              // Landing on top damages durability
              chunk.damageTile(col, row, 1);
            }
          }

          if (tile === TileType.PLATFORM) {
            // One-way: only collide from above
            if (p.vy > 0 && p.prevY + p.hitbox.height / 2 <= tileRect.y) {
              if (aabbOverlap(bounds, tileRect)) {
                p.y = tileRect.y - p.hitbox.height / 2;
                p.vy = 0;
                p.grounded = true;
                p.airDashesUsed = 0;
                if (p.state === 'STOMPING') {
                  p.bounce();
                  this.vfx.emit('stomp_impact', p.x, p.y + p.hitbox.height / 2);
                  this.vfx.shake.trigger(6);
                }
              }
            }
          }

          if (tile === TileType.BOUNCE) {
            if (aabbOverlap(bounds, tileRect) && p.vy > 0) {
              p.vy = STOMP_BOUNCE * 1.5;
              p.y = tileRect.y - p.hitbox.height / 2;
              this.vfx.emit('stomp_impact', p.x, tileRect.y);
            }
          }

          if (tile === TileType.ACID_POOL) {
            if (aabbOverlap(bounds, tileRect)) {
              this.damage.dealDamageToPlayer(1, 'acid');
              this.vfx.emit('pickup_collect', tileRect.x + TILE_SIZE / 2, tileRect.y);
            }
          }

          if (tile === TileType.LASER) {
            // Sweep laser active every 3s for 1s
            const laserPhase = this.laserSweepTimer % 4;
            if (laserPhase < 1 && aabbOverlap(bounds, tileRect)) {
              this.damage.dealDamageToPlayer(1, 'laser');
              this.vfx.flash('#cc44ff', 0.2, 0.15);
            }
          }
        }
      }
    }
  }

  private pushOut(p: Player, rect: AABB): void {
    const pb = p.getBounds();
    const overlapX = Math.min(pb.x + pb.w - rect.x, rect.x + rect.w - pb.x);
    const overlapY = Math.min(pb.y + pb.h - rect.y, rect.y + rect.h - pb.y);

    if (overlapX < overlapY) {
      // Push horizontally
      if (p.x < rect.x + rect.w / 2) {
        p.x -= overlapX;
      } else {
        p.x += overlapX;
      }
      p.vx = 0;
    } else {
      // Push vertically
      if (p.y < rect.y + rect.h / 2) {
        // Push up (landing on top)
        p.y -= overlapY;
        if (p.vy > 0) {
          p.vy = 0;
          p.grounded = true;
          if (p.state === 'STOMPING') {
            p.bounce();
            this.vfx.emit('stomp_impact', p.x, p.y + p.hitbox.height / 2);
            this.vfx.shake.trigger(6);
          }
        }
      } else {
        // Push down (hitting ceiling)
        p.y += overlapY;
        if (p.vy < 0) p.vy = 0;
      }
    }
  }

  private resolveEntityCollisions(): void {
    const pb = this.player.getBounds();

    // Player projectiles vs enemies
    for (const proj of this.projPool.active) {
      if (!proj.active || proj.owner !== 'player') continue;
      const projB = proj.getBounds();

      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        if (aabbOverlap(projB, enemy.getBounds())) {
          // Shield check — deflect projectile
          if (enemy.isShielded(proj.x)) {
            if (!proj.piercing) proj.active = false;
            break;
          }

          const { killed } = this.damage.dealDamageToEnemy(enemy, proj.damage, 'projectile');
          if (!proj.piercing) proj.active = false;

          if (killed) {
            this.events.emit('enemy:killed', {
              enemyId: enemy.id, killer: 'projectile',
              x: enemy.x, y: enemy.y,
              scoreValue: enemy.scoreValue, comboValue: enemy.comboValue,
            });
            this.vfx.emit('enemy_death', enemy.x, enemy.y);
            this.vfx.hitStop.trigger(3);
            this.spawnPickupAt(enemy.x, enemy.y);

            // Chain Shock: chain damage to nearby enemies on kill
            if (this.player.currentWeaponId === 'chain_shock') {
              const chainTargets = this.weapons.chainShock(enemy.x, enemy.y, proj.damage, this.enemies);
              for (const ct of chainTargets) {
                const { killed: chainKilled } = this.damage.dealDamageToEnemy(ct, Math.max(1, proj.damage - 1), 'chain');
                if (chainKilled) {
                  this.events.emit('enemy:killed', {
                    enemyId: ct.id, killer: 'chain',
                    x: ct.x, y: ct.y,
                    scoreValue: ct.scoreValue, comboValue: ct.comboValue,
                  });
                  this.vfx.emit('enemy_death', ct.x, ct.y);
                  this.spawnPickupAt(ct.x, ct.y);
                }
              }
            }

            // Splitter: spawn 2 fragments on projectile kill
            if (enemy instanceof Splitter) {
              this.spawnSplitterFragments(enemy.x, enemy.y);
            }

            // Boss defeated
            if (enemy instanceof BloomHeart || enemy instanceof DrillMother) {
              this.vfx.emit('boss_death', enemy.x, enemy.y);
              this.events.emit('boss:defeated', { bossId: enemy.id, timeMs: Date.now() });
            }
          } else {
            this.events.emit('enemy:damaged', { enemyId: enemy.id, amount: proj.damage });
          }
          break;
        }
      }
    }

    // Player vs enemies (contact damage / stomp)
    if (this.player.state !== 'DEAD') {
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        if (!aabbOverlap(pb, enemy.getBounds())) continue;

        // Stomp: player falling onto enemy from above
        if ((this.player.state === 'STOMPING' || this.player.vy > 100) &&
            this.player.prevY + this.player.hitbox.height / 2 < enemy.y - enemy.hitbox.height / 4) {
          const stompDmg = this.damage.getStompDamage();
          const { killed } = this.damage.dealDamageToEnemy(enemy, stompDmg, 'stomp');
          this.player.bounce();
          this.vfx.emit('stomp_impact', enemy.x, enemy.y);
          this.vfx.shake.trigger(8);
          this.vfx.hitStop.trigger(4);
          this.events.emit('stomp:hit', {
            targetId: enemy.id,
            bounceForce: STOMP_BOUNCE,
            x: enemy.x, y: enemy.y,
          });

          // Shockwave AOE
          const aoeRadius = this.damage.getStompAoeRadius();
          if (aoeRadius > 0) {
            for (const other of this.enemies) {
              if (!other.active || other === enemy) continue;
              const dist = Math.hypot(other.x - enemy.x, other.y - enemy.y);
              if (dist < aoeRadius) {
                const { killed: aoeKilled } = this.damage.dealDamageToEnemy(other, 1, 'stomp_aoe');
                if (aoeKilled) {
                  this.events.emit('enemy:killed', {
                    enemyId: other.id, killer: 'stomp_aoe',
                    x: other.x, y: other.y,
                    scoreValue: other.scoreValue, comboValue: other.comboValue,
                  });
                  this.vfx.emit('enemy_death', other.x, other.y);
                  this.spawnPickupAt(other.x, other.y);
                }
              }
            }
            this.vfx.emit('stomp_impact', enemy.x, enemy.y); // extra burst for shockwave
          }

          if (killed) {
            this.events.emit('enemy:killed', {
              enemyId: enemy.id, killer: 'stomp',
              x: enemy.x, y: enemy.y,
              scoreValue: enemy.scoreValue, comboValue: enemy.comboValue,
            });
            this.vfx.emit('enemy_death', enemy.x, enemy.y);
            this.spawnPickupAt(enemy.x, enemy.y);

            if (enemy instanceof BloomHeart || enemy instanceof DrillMother) {
              this.vfx.emit('boss_death', enemy.x, enemy.y);
              this.events.emit('boss:defeated', { bossId: enemy.id, timeMs: Date.now() });
            }
          }
        } else {
          // Contact damage to player (with damage reduction)
          this.damage.dealDamageToPlayer(enemy.damage, 'enemy');
          if (this.player.hp > 0) {
            this.vfx.flash('#ff0000', 0.3, 0.2);
            this.vfx.shake.trigger(5);
          } else {
            this.vfx.emit('player_death', this.player.x, this.player.y);
            this.vfx.flash('#ff0000', 0.5, 0.5);
            this.vfx.shake.trigger(15);
          }
        }
      }
    }

    // Enemy projectiles vs player
    if (this.player.state !== 'DEAD') {
      for (const proj of this.enemyProjPool.active) {
        if (!proj.active) continue;
        if (aabbOverlap(pb, proj.getBounds())) {
          proj.active = false;
          this.damage.dealDamageToPlayer(proj.damage, 'enemy');
          if (this.player.hp > 0) {
            this.vfx.flash('#ff0000', 0.3, 0.2);
            this.vfx.shake.trigger(5);
          } else {
            this.vfx.emit('player_death', this.player.x, this.player.y);
            this.vfx.flash('#ff0000', 0.5, 0.5);
            this.vfx.shake.trigger(15);
          }
        }
      }
    }
  }

  private resolveProjectileTiles(): void {
    for (const proj of this.projPool.active) {
      if (!proj.active || proj.owner !== 'player') continue;
      for (const chunk of this.chunks) {
        if (chunk.worldY > proj.y + 30 || chunk.bottom < proj.y - 30) continue;
        const col = Math.floor(proj.x / TILE_SIZE);
        const localY = proj.y - chunk.worldY;
        const row = Math.floor(localY / TILE_SIZE);
        const tile = chunk.getTile(col, row);
        if (tile === TileType.BREAKABLE) {
          const destroyed = chunk.damageTile(col, row, 1);
          if (!proj.piercing) proj.active = false;
          if (destroyed) {
            const rect = chunk.getTileRect(col, row);
            this.vfx.emit('enemy_death', rect.x + TILE_SIZE / 2, rect.y + TILE_SIZE / 2);
            this.vfx.shake.trigger(3);
          }
          break;
        }
        if (tile === TileType.SOLID) {
          // Ricochet bounce off solid tiles
          if (proj.bouncesRemaining > 0) {
            const tileRect = chunk.getTileRect(col, row);
            const tileCX = tileRect.x + TILE_SIZE / 2;
            const tileCY = tileRect.y + TILE_SIZE / 2;
            const dx = proj.x - tileCX;
            const dy = proj.y - tileCY;
            // Determine which face was hit
            if (Math.abs(dx) > Math.abs(dy)) {
              proj.vx = -proj.vx;
              proj.x += Math.sign(dx) * 2;
            } else {
              proj.vy = -proj.vy;
              proj.y += Math.sign(dy) * 2;
            }
            proj.bouncesRemaining--;
          } else {
            if (!proj.piercing) proj.active = false;
          }
          break;
        }
      }
    }
  }

  private resolvePickups(): void {
    const px = this.player.x;
    const py = this.player.y;
    const magnetRange = PICKUP_MAGNET_RANGE * (1 + this.upgrades.getEffect('magnet_range_bonus'));

    for (const pickup of this.pickupPool.active) {
      if (!pickup.active) continue;
      const dx = px - pickup.x;
      const dy = py - pickup.y;
      const dist = Math.hypot(dx, dy);

      // Magnet pull
      if (dist < magnetRange && dist > 5) {
        const speed = 300;
        pickup.x += (dx / dist) * speed * (1 / 60);
        pickup.y += (dy / dist) * speed * (1 / 60);
      }

      // Collect
      if (dist < 15) {
        pickup.active = false;
        this.events.emit('pickup:collected', { type: pickup.type, value: pickup.value });
        this.vfx.emit('pickup_collect', pickup.x, pickup.y);
      }
    }
  }

  private spawnPickupAt(x: number, y: number): void {
    if (this.pickupPool.activeCount >= MAX_PICKUPS) return;
    const p = this.pickupPool.acquire();
    p.x = x;
    p.y = y;
    p.prevX = x;
    p.prevY = y;
    p.active = true;
    p.type = 'currency';
    p.value = 1;
    // Small random spread
    p.vx = (Math.random() - 0.5) * 60;
    p.vy = -Math.random() * 100;
  }

  private spawnFromChunks(): void {
    for (const chunk of this.chunks) {
      if (chunk.spawned) continue;
      // Spawn when chunk is about to enter viewport
      if (chunk.worldY < this.camera.bottom + CANVAS_H) {
        chunk.spawned = true;
        for (const sp of chunk.template.spawns) {
          const wx = (sp.col + 0.5) * TILE_SIZE;
          const wy = chunk.worldY + (sp.row + 0.5) * TILE_SIZE;

          if (sp.type === 'enemy') {
            this.spawnEnemy(wx, wy, sp.id);
          } else if (sp.type === 'pickup') {
            if (this.pickupPool.activeCount < MAX_PICKUPS) {
              const pickup = this.pickupPool.acquire();
              pickup.x = wx;
              pickup.y = wy;
              pickup.prevX = wx;
              pickup.prevY = wy;
              pickup.active = true;
              pickup.type = sp.id === 'heal' ? 'heal' : 'currency';
              pickup.value = sp.id === 'heal' ? 1 : 1;
            }
          }
        }
      }
    }
  }

  spawnEnemy(x: number, y: number, id?: string): void {
    // Allow extra capacity for bosses / elites
    const bosses = ['sentinel_miniboss', 'core_carrier', 'bloom_heart', 'drill_mother', 'acid_wyrm', 'data_guardian'];
    const limit = bosses.includes(id ?? '') ? MAX_ENEMIES + 4 : MAX_ENEMIES;
    if (this.enemies.length >= limit) return;
    let e: EnemyBase;
    switch (id) {
      case 'turret_bloom':      e = new TurretBloom(); break;
      case 'splitter':          e = new Splitter(); break;
      case 'shield_bug':        e = new ShieldBug(); break;
      case 'leech':             e = new Leech(); break;
      case 'parasite_cloud':    e = new ParasiteCloud(); break;
      case 'sentinel_miniboss': e = new SentinelMiniboss(); break;
      case 'rail_sentinel':     e = new RailSentinel(); break;
      case 'core_carrier':      e = new CoreCarrier(); break;
      case 'bloom_heart':       e = new BloomHeart(); break;
      case 'ambusher':          e = new Ambusher(); break;
      case 'bomber':            e = new Bomber(); break;
      case 'mirror':            e = new Mirror(); break;
      case 'swarm_mother':      e = new SwarmMother(); break;
      case 'swarm_drone':       e = new SwarmDrone(); break;
      case 'drill_mother':      e = new DrillMother(); break;
      case 'acid_wyrm':         e = new AcidWyrm(); break;
      case 'data_guardian':     e = new DataGuardian(); break;
      default:                  e = new Hopper(); break;
    }
    e.spriteId = id ?? 'hopper';
    e.reset(x, y);

    // Apply biome-specific enemy modifiers
    const hpMult = this.pacing.getEnemyHpMult();
    if (hpMult !== 1.0) {
      const bonusHp = Math.floor(e.maxHp * (hpMult - 1));
      e.hp += bonusHp;
      e.maxHp += bonusHp;
    }

    this.enemies.push(e);
  }

  private processEnemyShots(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.pendingShots.length === 0) continue;
      for (const shot of enemy.pendingShots) {
        if (this.enemyProjPool.activeCount >= MAX_ENEMY_PROJ) break;
        const p = this.enemyProjPool.acquire();
        p.x = shot.x;
        p.y = shot.y;
        p.prevX = shot.x;
        p.prevY = shot.y;
        p.vx = shot.vx;
        p.vy = shot.vy;
        p.damage = shot.damage;
        p.owner = 'enemy';
        p.color = '#ff44aa';
        p.glowColor = '#dd2288';
        p.active = true;
        p.life = 3;
      }
      enemy.pendingShots.length = 0;
    }
  }

  private processEnemySpawns(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      // CoreCarrier spawns
      if (enemy instanceof CoreCarrier) {
        if (enemy.pendingSpawns.length === 0) continue;
        for (const spawn of enemy.pendingSpawns) {
          this.spawnEnemy(spawn.x, spawn.y, spawn.id);
        }
        enemy.pendingSpawns.length = 0;
      }
      // BloomHeart spawns
      if (enemy instanceof BloomHeart) {
        if (enemy.pendingSpawns.length === 0) continue;
        for (const spawn of enemy.pendingSpawns) {
          this.spawnEnemy(spawn.x, spawn.y, spawn.id);
        }
        enemy.pendingSpawns.length = 0;
      }
    }
  }

  private resolveBeamDamage(): void {
    if (this.player.state === 'DEAD') return;
    const pb = this.player.getBounds();
    for (const enemy of this.enemies) {
      if (!enemy.active || !(enemy instanceof RailSentinel)) continue;
      if (!enemy.beamActive) continue;
      // Beam is full-width horizontal at enemy's Y, +/- 8px
      if (pb.y + pb.h > enemy.y - 8 && pb.y < enemy.y + 8) {
        this.damage.dealDamageToPlayer(1, 'beam');
        if (this.player.hp > 0) {
          this.vfx.flash('#ff6622', 0.3, 0.2);
          this.vfx.shake.trigger(5);
        } else {
          this.vfx.emit('player_death', this.player.x, this.player.y);
          this.vfx.flash('#ff0000', 0.5, 0.5);
          this.vfx.shake.trigger(15);
        }
        break; // Only take beam damage once per frame
      }
    }
  }

  private spawnSplitterFragments(x: number, y: number): void {
    for (let i = 0; i < 2; i++) {
      if (this.enemies.length >= MAX_ENEMIES) return;
      const frag = new SplitterFragment();
      frag.reset(x, y);
      // Scatter: one left, one right, both upward
      frag.vx = (i === 0 ? -1 : 1) * (80 + Math.random() * 40);
      frag.vy = -(100 + Math.random() * 60);
      this.enemies.push(frag);
    }
  }

  private detectNearMisses(dt: number): void {
    if (this.player.state === 'DEAD') return;
    this.nearMissCooldown -= dt;
    if (this.nearMissCooldown > 0) return;

    const px = this.player.x;
    const py = this.player.y;
    const pb = this.player.getBounds();

    for (const proj of this.enemyProjPool.active) {
      if (!proj.active) continue;
      const dx = proj.x - px;
      const dy = proj.y - py;
      const dist = Math.hypot(dx, dy);

      // Close but not overlapping with player hitbox
      if (dist < this.NEAR_MISS_RADIUS && dist > 5) {
        const projB = proj.getBounds();
        if (!(projB.x + projB.w > pb.x && projB.x < pb.x + pb.w &&
              projB.y + projB.h > pb.y && projB.y < pb.y + pb.h)) {
          this.events.emit('near:miss', { distance: dist });
          this.vfx.emit('near_miss', proj.x, proj.y);
          this.nearMissCooldown = this.NEAR_MISS_COOLDOWN;
          break; // One near-miss per cooldown window
        }
      }
    }
  }

  private calculateThreatDensity(): void {
    const px = this.player.x;
    const py = this.player.y;
    const threatRadius = 150;
    let threats = 0;

    for (const e of this.enemies) {
      if (!e.active) continue;
      const d = Math.hypot(e.x - px, e.y - py);
      if (d < threatRadius) threats++;
    }
    for (const p of this.enemyProjPool.active) {
      if (!p.active) continue;
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < threatRadius) threats += 0.5;
    }

    // Normalize: 0 threats = 0, 8+ threats = 1
    this.threatDensity = Math.min(1, threats / 8);
  }

  private processBomberExplosions(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (enemy instanceof Bomber && enemy.pendingExplosion) {
        const ex = enemy.pendingExplosion.x;
        const ey = enemy.pendingExplosion.y;
        enemy.pendingExplosion = null;

        // Deal damage to player if nearby
        const dist = Math.hypot(this.player.x - ex, this.player.y - ey);
        if (dist < 60 && this.player.state !== 'DEAD') {
          this.damage.dealDamageToPlayer(2, 'explosion');
          this.vfx.flash('#ff6622', 0.4, 0.3);
          this.vfx.shake.trigger(10);
        }

        // VFX
        this.vfx.emit('enemy_death', ex, ey);
        this.vfx.emit('stomp_impact', ex, ey);
        this.vfx.shake.trigger(8);
      }
    }
  }

  private processSwarmMotherSpawns(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (enemy instanceof SwarmMother && enemy.pendingSpawns.length > 0) {
        for (const spawn of enemy.pendingSpawns) {
          this.spawnEnemy(spawn.x, spawn.y, spawn.id);
        }
        enemy.pendingSpawns.length = 0;
      }
    }
  }

  private updateBiomeHazards(dt: number): void {
    const biome = this.pacing.getBiomeId();

    // Laser sweep timer (data_crypt)
    if (biome === 'data_crypt') {
      this.laserSweepTimer += dt;
    }

    // Darkness radius (void_core) — limited vision
    if (biome === 'void_core') {
      this.darknessRadius = 100;
    } else {
      this.darknessRadius = 0;
    }

    // Acid pool damage (neon_gut) — handled in tile collision
    // Tile types ACID_POOL, LASER, DARKNESS are handled in resolveTileCollisions
  }

  private advanceChunks(): void {
    // Remove chunks scrolled well above viewport
    const cullY = this.camera.top - CANVAS_H;
    while (this.chunks.length > 0 && this.chunks[0]!.bottom < cullY) {
      this.chunks.shift();
    }

    // Generate if running low on future chunks
    const lookAhead = this.camera.bottom + CANVAS_H * 2;
    while (this.nextChunkY < lookAhead) {
      this.generateNextChunk();
    }
  }

  private pruneEnemies(): void {
    const cullY = this.camera.top - CANVAS_H;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      if (!e.active || e.y < cullY) {
        this.enemies[i] = this.enemies[this.enemies.length - 1]!;
        this.enemies.pop();
      }
    }
  }

  serialize(): RunState {
    const upgradeIds = this.upgrades.getActiveUpgrades()
      .flatMap(({ def, stacks }) => Array(stacks).fill(def.id) as string[]);
    return {
      seed: this.seed,
      depth: this.scoring.depth,
      score: this.scoring.score,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      currency: this.scoring.currency,
      weaponId: this.player.currentWeaponId,
      upgrades: upgradeIds,
      comboCount: this.combo.count,
      chunkIndex: this.chunksGenerated,
      playerX: this.player.x,
      playerY: this.player.y,
      timestamp: Date.now(),
      isDaily: this.isDaily,
      specialCharges: this.special.charges,
      specialKillsAccum: this.special.killsAccumulated,
    };
  }

  private restore(state: RunState): void {
    // Set depth so pacing biome is correct during chunk generation
    this.pacing.depth = state.depth;
    this.scoring.depth = state.depth;
    this.scoring.score = state.score;
    this.scoring.currency = state.currency;

    // Regenerate chunks to advance RNG to approximately the right state
    for (let i = 0; i < state.chunkIndex; i++) {
      this.generateNextChunk();
    }

    // Cull chunks far from player position — keep chunks around player
    const keepBottom = state.playerY + CANVAS_H * 2;
    const keepTop = state.playerY - CANVAS_H;
    this.chunks = this.chunks.filter(c => c.bottom >= keepTop && c.worldY <= keepBottom);

    // Generate ahead if needed
    while (this.nextChunkY < state.playerY + CANVAS_H * 3) {
      this.generateNextChunk();
    }

    // Place player
    this.player.reset(state.playerX, state.playerY);
    this.player.hp = state.hp;
    this.player.maxHp = state.maxHp;
    this.player.currentWeaponId = state.weaponId;

    // Restore upgrades
    for (const id of state.upgrades) {
      const def = RUN_UPGRADES.find(u => u.id === id);
      if (def) this.upgrades.apply(def);
    }

    // Restore combo
    this.combo.count = state.comboCount;

    // Restore special ability state
    if (state.specialCharges !== undefined) {
      this.special.charges = state.specialCharges;
    }
    if (state.specialKillsAccum !== undefined) {
      this.special.killsAccumulated = state.specialKillsAccum;
    }

    this.camera.y = this.player.y;
  }

  reset(): void {
    this.events.clear();
    this.enemies.length = 0;
    this.chunks.length = 0;
    this.nextChunkY = 0;
    this.combo.reset();
    this.pacing.reset();
    this.damage.reset();
    this.scoring.reset();
    this.antibullshit.reset();
    this.vfx.reset();
    this.weapons.reset();
    this.upgrades.reset();
    this.special.reset();
    this.chunksSinceUpgrade = 0;
    this.shopPending = false;
    this.chunksGenerated = 0;
  }
}
