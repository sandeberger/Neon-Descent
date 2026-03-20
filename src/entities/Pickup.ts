import { Entity } from './Entity';

export type PickupType = 'currency' | 'heal' | 'energy' | 'combo_extender';

export class Pickup extends Entity {
  type: PickupType = 'currency';
  value = 1;
  magnetRange = 50;

  // Bob animation
  bobOffset = 0;
  private bobPhase = Math.random() * Math.PI * 2;

  reset(): void {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;
    this.type = 'currency';
    this.value = 1;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt: number): void {
    this.bobPhase += dt * 3;
    this.bobOffset = Math.sin(this.bobPhase) * 3;
  }

  getColor(): string {
    switch (this.type) {
      case 'currency':       return '#44ff88';
      case 'heal':           return '#ff4466';
      case 'energy':         return '#44aaff';
      case 'combo_extender': return '#ffaa22';
    }
  }
}
