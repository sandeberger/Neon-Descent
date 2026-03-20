import { Entity } from './Entity';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_BASE_HP,
  INVULN_DURATION,
  STOMP_SPEED, STOMP_BOUNCE, STOMP_STARTUP_MS,
  DASH_SPEED, DASH_DURATION_MS, DASH_COOLDOWN_MS,
  MAX_AIR_DASHES,
} from '@core/Constants';
import type { InputFrame } from '@input/InputTypes';
import type { EventBus } from '@core/EventBus';

export type PlayerState =
  | 'FALLING'
  | 'STOMP_STARTUP'
  | 'STOMPING'
  | 'BOUNCING'
  | 'DASHING'
  | 'WALL_SLIDING'
  | 'DEAD';

export class Player extends Entity {
  state: PlayerState = 'FALLING';
  hp: number;
  maxHp: number;

  grounded = false;
  touchingWallLeft = false;
  touchingWallRight = false;

  // State timers (ms)
  stateTimer = 0;
  invulnTimer = 0;
  dashCooldownTimer = 0;
  coyoteTimer = 0;

  // Air dash tracking
  airDashesUsed = 0;

  // Combo / scoring
  airKills = 0;

  // Weapon
  currentWeaponId = 'balanced_auto';

  constructor(readonly events: EventBus) {
    super();
    this.hitbox = { width: PLAYER_WIDTH, height: PLAYER_HEIGHT, offsetX: 0, offsetY: 0 };
    this.maxHp = PLAYER_BASE_HP;
    this.hp = this.maxHp;
  }

  get isInvulnerable(): boolean {
    return this.invulnTimer > 0 || this.state === 'DASHING';
  }

  get touchingWall(): boolean {
    return this.touchingWallLeft || this.touchingWallRight;
  }

  handleInput(input: InputFrame, dt: number): void {
    if (this.state === 'DEAD') return;

    // Dash cooldown
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= dt * 1000;
    }

    // Coyote timer
    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt * 1000;
    }

    // Stomp input
    if (input.stomp && this.state === 'FALLING') {
      this.state = 'STOMP_STARTUP';
      this.stateTimer = STOMP_STARTUP_MS;
      this.vx *= 0.3; // reduce horizontal momentum
      this.vy = 0; // brief hang
      this.events.emit('player:stomp', { x: this.x, y: this.y });
      return;
    }

    // Dash input (limited air dashes)
    if (input.dash && this.dashCooldownTimer <= 0 && this.state !== 'STOMPING' &&
        this.airDashesUsed < MAX_AIR_DASHES) {
      this.state = 'DASHING';
      this.stateTimer = DASH_DURATION_MS;
      this.dashCooldownTimer = DASH_COOLDOWN_MS;
      this.airDashesUsed++;

      // Dash direction: primarily upward burst, with horizontal from input
      this.vy = -DASH_SPEED;
      if (Math.abs(input.moveX) > 0.3) {
        this.vx = Math.sign(input.moveX) * DASH_SPEED * 0.6;
      }

      this.events.emit('player:dash', { direction: { x: this.vx, y: this.vy } });
      return;
    }
  }

  updateState(dt: number): void {
    if (this.state === 'DEAD') return;

    this.stateTimer -= dt * 1000;

    // Invulnerability timer
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
    }

    switch (this.state) {
      case 'STOMP_STARTUP':
        if (this.stateTimer <= 0) {
          this.state = 'STOMPING';
          this.vy = STOMP_SPEED;
          this.vx = 0;
        }
        break;

      case 'STOMPING':
        // Stomp continues until collision resolves it
        this.vy = STOMP_SPEED;
        break;

      case 'BOUNCING':
        if (this.stateTimer <= 0) {
          this.state = 'FALLING';
        }
        break;

      case 'DASHING':
        if (this.stateTimer <= 0) {
          this.state = 'FALLING';
        }
        break;

      case 'WALL_SLIDING':
        if (!this.touchingWall) {
          this.state = 'FALLING';
        }
        break;
    }
  }

  /** Called on stomp collision with enemy/surface */
  bounce(): void {
    this.vy = STOMP_BOUNCE;
    this.state = 'BOUNCING';
    this.stateTimer = 200; // brief bouncing state
    this.airDashesUsed = 0; // reset air dashes on bounce
  }

  godMode = false;

  takeDamage(amount: number, source: string): void {
    if (this.godMode || this.isInvulnerable || this.state === 'DEAD') return;

    this.hp -= amount;
    this.invulnTimer = INVULN_DURATION;

    this.events.emit('player:damage', { amount, source });

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'DEAD';
      this.events.emit('player:dead', {
        position: { x: this.x, y: this.y },
        killer: source,
      });
    }
  }

  heal(amount: number): void {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.hp > prev) {
      this.events.emit('player:heal', { amount: this.hp - prev });
    }
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.state = 'FALLING';
    this.stateTimer = 0;
    this.invulnTimer = 0;
    this.dashCooldownTimer = 0;
    this.coyoteTimer = 0;
    this.grounded = false;
    this.touchingWallLeft = false;
    this.touchingWallRight = false;
    this.airDashesUsed = 0;
    this.airKills = 0;
    this.active = true;
  }
}
