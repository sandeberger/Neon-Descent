import type { EventBus } from '@core/EventBus';
import {
  COMBO_DECAY_TIME,
  COMBO_TIER_THRESHOLDS,
  COMBO_TIER_MULTIPLIERS,
} from '@core/Constants';

export class ComboSystem {
  count = 0;
  multiplier = 1;
  tier = 0;
  decayTimer = 0;
  decayTimeOverride: number | null = null;
  maxCombo = 0;

  constructor(private events: EventBus) {
    events.on('enemy:killed', (e) => this.increment(e.comboValue));
    events.on('stomp:hit', () => this.increment(2));
    events.on('near:miss', () => this.increment(1));
    events.on('player:damage', () => this.break());
  }

  get effectiveDecayTime(): number {
    return this.decayTimeOverride ?? COMBO_DECAY_TIME;
  }

  increment(value: number): void {
    this.count += value;
    if (this.count > this.maxCombo) this.maxCombo = this.count;
    this.decayTimer = this.effectiveDecayTime;
    this.updateTier();
    this.events.emit('combo:increment', { count: this.count, tier: this.tier });
  }

  break(): void {
    if (this.count === 0) return;
    const prev = this.count;
    this.count = 0;
    this.multiplier = 1;
    this.tier = 0;
    this.decayTimer = 0;
    this.events.emit('combo:break', { finalCount: prev });
  }

  update(dt: number): void {
    if (this.count > 0) {
      this.decayTimer -= dt;
      if (this.decayTimer <= 0) {
        this.break();
      }
    }
  }

  private updateTier(): void {
    const prevTier = this.tier;
    for (let i = COMBO_TIER_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.count >= COMBO_TIER_THRESHOLDS[i]!) {
        this.tier = i;
        this.multiplier = COMBO_TIER_MULTIPLIERS[i]!;
        break;
      }
    }
    if (this.tier > prevTier) {
      this.events.emit('combo:threshold', { tier: this.tier });
    }
  }

  reset(): void {
    this.count = 0;
    this.multiplier = 1;
    this.tier = 0;
    this.decayTimer = 0;
    this.maxCombo = 0;
  }
}
