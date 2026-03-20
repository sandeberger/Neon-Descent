import type { EventBus } from '@core/EventBus';
import type { UpgradeSystem } from './UpgradeSystem';
import type { Player } from '@entities/Player';
import type { EnemyBase } from '@entities/enemies/EnemyBase';

export class DamageSystem {
  constructor(
    events: EventBus,
    private upgrades: UpgradeSystem,
    private player: Player,
  ) {
    // Lifesteal on kill
    events.on('enemy:killed', () => {
      const lifestealChance = this.upgrades.getEffect('lifesteal_chance');
      if (lifestealChance > 0 && Math.random() < lifestealChance) {
        this.player.heal(1);
      }
    });
  }

  dealDamageToPlayer(amount: number, source: string): void {
    const reduction = Math.floor(this.upgrades.getEffect('damage_reduction'));
    const actual = Math.max(1, amount - reduction);
    this.player.takeDamage(actual, source);
  }

  dealDamageToEnemy(enemy: EnemyBase, amount: number, _source: string): { killed: boolean } {
    const killed = enemy.takeDamage(amount);
    return { killed };
  }

  getStompDamage(): number {
    return 2 + this.upgrades.getEffect('stomp_damage_bonus');
  }

  getStompAoeRadius(): number {
    return this.upgrades.getEffect('stomp_aoe_radius');
  }

  reset(): void {
    // no-op for now
  }
}
