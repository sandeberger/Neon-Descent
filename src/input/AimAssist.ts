import type { EnemyBase } from '@entities/enemies/EnemyBase';

const AIM_RADIUS = 120;
const AIM_CONE_HALF = (45 / 2) * (Math.PI / 180); // 22.5 degrees each side

export class AimAssist {
  /**
   * Find the nearest enemy within a downward cone from the player.
   * Returns the entity ID of the best target, or null.
   */
  getTarget(playerX: number, playerY: number, enemies: readonly EnemyBase[]): number | null {
    let bestId: number | null = null;
    let bestDist = Infinity;

    for (const e of enemies) {
      if (!e.active) continue;
      const dx = e.x - playerX;
      const dy = e.y - playerY;
      const d = Math.hypot(dx, dy);
      if (d > AIM_RADIUS || d < 1) continue;

      // Only target enemies below the player (downward cone)
      const angle = Math.atan2(dy, dx);
      const diff = Math.abs(angle - Math.PI / 2); // PI/2 = straight down
      if (diff > AIM_CONE_HALF) continue;

      if (d < bestDist) {
        bestId = e.id;
        bestDist = d;
      }
    }

    return bestId;
  }
}
