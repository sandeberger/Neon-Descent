import type { SeededRNG } from '@utils/SeededRNG';
import upgradesData from '@data/upgrades.json';
import type { RunUpgradeData, UpgradeEffectData } from '@data/types';

export type UpgradeEffect = UpgradeEffectData;
export type UpgradeDef = RunUpgradeData;

const RARITY_WEIGHTS: Record<string, number> = {
  common: 5,
  uncommon: 3,
  rare: 1.5,
  legendary: 0.5,
};

const RARITY_COLORS: Record<string, string> = {
  common: '#8899aa',
  uncommon: '#44ff88',
  rare: '#44ddff',
  legendary: '#ffaa22',
};

export const RUN_UPGRADES: UpgradeDef[] = upgradesData as UpgradeDef[];

export class UpgradeSystem {
  private active = new Map<string, { def: UpgradeDef; stacks: number }>();

  apply(upgrade: UpgradeDef): void {
    const existing = this.active.get(upgrade.id);
    if (existing && existing.stacks < upgrade.maxStacks) {
      existing.stacks++;
    } else if (!existing) {
      this.active.set(upgrade.id, { def: upgrade, stacks: 1 });
    }
  }

  /** Get total effect value for a given effect type across all active upgrades */
  getEffect(type: string): number {
    let total = 0;
    for (const { def, stacks } of this.active.values()) {
      for (const effect of def.effects) {
        if (effect.type === type) total += effect.value * stacks;
      }
    }
    return total;
  }

  hasEffect(type: string): boolean {
    return this.getEffect(type) > 0;
  }

  /** Generate N random upgrade choices weighted by rarity */
  generateChoices(rng: SeededRNG, count: number = 3): UpgradeDef[] {
    const available = RUN_UPGRADES.filter(u => {
      const existing = this.active.get(u.id);
      return !existing || existing.stacks < u.maxStacks;
    });

    const choices: UpgradeDef[] = [];
    const pool = [...available];
    let weaponSwitchOffered = false;

    for (let i = 0; i < count && pool.length > 0; i++) {
      const weights = pool.map(u => RARITY_WEIGHTS[u.rarity] ?? 1);
      const pick = rng.weightedPick(pool, weights);
      choices.push(pick);
      pool.splice(pool.indexOf(pick), 1);

      // Limit at most 1 weapon_switch per offering
      if (pick.category === 'weapon_switch') {
        if (weaponSwitchOffered) {
          // Remove pick and try again
          choices.pop();
          i--;
          continue;
        }
        weaponSwitchOffered = true;
        // Remove remaining weapon_switch from pool
        for (let j = pool.length - 1; j >= 0; j--) {
          if (pool[j]!.category === 'weapon_switch') pool.splice(j, 1);
        }
      }
    }

    return choices;
  }

  getActiveUpgrades(): { def: UpgradeDef; stacks: number }[] {
    return [...this.active.values()];
  }

  get activeCount(): number {
    return this.active.size;
  }

  reset(): void {
    this.active.clear();
  }
}

export function getRarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? '#8899aa';
}
