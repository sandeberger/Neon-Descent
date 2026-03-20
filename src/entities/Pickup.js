import { Entity } from './Entity';
export class Pickup extends Entity {
    constructor() {
        super(...arguments);
        this.type = 'currency';
        this.value = 1;
        this.magnetRange = 50;
        // Bob animation
        this.bobOffset = 0;
        this.bobPhase = Math.random() * Math.PI * 2;
    }
    reset() {
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
    update(dt) {
        this.bobPhase += dt * 3;
        this.bobOffset = Math.sin(this.bobPhase) * 3;
    }
    getColor() {
        switch (this.type) {
            case 'currency': return '#44ff88';
            case 'heal': return '#ff4466';
            case 'energy': return '#44aaff';
            case 'combo_extender': return '#ffaa22';
        }
    }
}
