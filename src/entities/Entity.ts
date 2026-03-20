export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Hitbox {
  width:   number;
  height:  number;
  offsetX: number;
  offsetY: number;
}

let nextId = 1;

export abstract class Entity {
  readonly id: number;
  active = true;

  // Current position
  x = 0;
  y = 0;
  // Previous position (for interpolation)
  prevX = 0;
  prevY = 0;
  // Velocity
  vx = 0;
  vy = 0;

  hitbox: Hitbox = { width: 16, height: 16, offsetX: 0, offsetY: 0 };

  constructor() {
    this.id = nextId++;
  }

  savePrevious(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  renderX(alpha: number): number {
    return this.prevX + (this.x - this.prevX) * alpha;
  }

  renderY(alpha: number): number {
    return this.prevY + (this.y - this.prevY) * alpha;
  }

  getBounds(): AABB {
    return {
      x: this.x + this.hitbox.offsetX - this.hitbox.width / 2,
      y: this.y + this.hitbox.offsetY - this.hitbox.height / 2,
      w: this.hitbox.width,
      h: this.hitbox.height,
    };
  }
}

export function resetEntityIds(): void {
  nextId = 1;
}
