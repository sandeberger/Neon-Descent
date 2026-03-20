import { Entity } from '../Entity';
import type { EnemyStatData } from '@data/types';

export type EnemyRole =
  | 'pressure'
  | 'zoning'
  | 'punish'
  | 'fodder'
  | 'ambush'
  | 'elite'
  | 'disruptor'
  | 'boss';

export interface PendingShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
}

export abstract class EnemyBase extends Entity {
  hp = 2;
  maxHp = 2;
  damage = 1;
  scoreValue = 100;
  comboValue = 1;
  role: EnemyRole = 'fodder';
  state = 'IDLE';
  stateTimer = 0;
  flashTimer = 0;

  bodyColor = '#ff4466';
  glowColor = '#ff2244';
  pendingShots: PendingShot[] = [];

  abstract onUpdate(dt: number, playerX: number, playerY: number): void;
  abstract reset(x: number, y: number): void;

  update(dt: number, playerX: number, playerY: number): void {
    if (this.flashTimer > 0) this.flashTimer -= dt;
    this.onUpdate(dt, playerX, playerY);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.flashTimer = 0.1;
    if (this.hp <= 0) {
      this.active = false;
      return true; // died
    }
    return false;
  }

  /** Override to block projectile damage from certain directions */
  isShielded(_projectileX: number): boolean {
    return false;
  }

  /** Override for custom rendering on top of the base rectangle */
  renderExtra?(_ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, _rx: number, _ry: number): void;

  protected applyStats(stats: EnemyStatData): void {
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.damage = stats.damage;
    this.scoreValue = stats.scoreValue;
    this.comboValue = stats.comboValue;
    this.bodyColor = stats.bodyColor;
    this.glowColor = stats.glowColor;
    this.hitbox = { width: stats.hitboxWidth, height: stats.hitboxHeight, offsetX: 0, offsetY: 0 };
  }

  resetBase(x: number, y: number, hp: number): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = hp;
    this.maxHp = hp;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.flashTimer = 0;
  }
}
