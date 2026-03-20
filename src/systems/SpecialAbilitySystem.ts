import type { EventBus } from '@core/EventBus';
import balanceData from '@data/balance.json';

const SPECIAL = (balanceData as any).special ?? {
  killsPerCharge: 8,
  comboTierBonus: 0.5,
  empDamage: 3,
  cooldown: 0.5,
  maxCharges: 1,
};

export class SpecialAbilitySystem {
  charges = 0;
  maxCharges: number = SPECIAL.maxCharges;
  killsAccumulated = 0;
  private cooldownTimer = 0;

  constructor(private events: EventBus) {
    events.on('enemy:killed', () => {
      this.killsAccumulated++;
      this.checkCharge();
    });

    events.on('combo:increment', (e) => {
      // Bonus charge progress at combo tier 3+
      if (e.tier >= 3) {
        this.killsAccumulated += SPECIAL.comboTierBonus;
        this.checkCharge();
      }
    });
  }

  get chargeProgress(): number {
    return Math.min(1, this.killsAccumulated / SPECIAL.killsPerCharge);
  }

  private checkCharge(): void {
    if (this.killsAccumulated >= SPECIAL.killsPerCharge && this.charges < this.maxCharges) {
      this.charges++;
      this.killsAccumulated -= SPECIAL.killsPerCharge;
      this.events.emit('special:ready', {});
    }
  }

  tryActivate(): boolean {
    if (this.charges <= 0 || this.cooldownTimer > 0) return false;
    this.charges--;
    this.cooldownTimer = SPECIAL.cooldown;
    this.events.emit('special:activate', { abilityId: 'emp_blast' });
    return true;
  }

  update(dt: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
  }

  reset(): void {
    this.charges = 0;
    this.killsAccumulated = 0;
    this.cooldownTimer = 0;
  }
}
