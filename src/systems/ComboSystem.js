import { COMBO_DECAY_TIME, COMBO_TIER_THRESHOLDS, COMBO_TIER_MULTIPLIERS, } from '@core/Constants';
export class ComboSystem {
    constructor(events) {
        this.events = events;
        this.count = 0;
        this.multiplier = 1;
        this.tier = 0;
        this.decayTimer = 0;
        this.decayTimeOverride = null;
        this.maxCombo = 0;
        events.on('enemy:killed', (e) => this.increment(e.comboValue));
        events.on('stomp:hit', () => this.increment(2));
        events.on('near:miss', () => this.increment(1));
        events.on('player:damage', () => this.break());
    }
    get effectiveDecayTime() {
        return this.decayTimeOverride ?? COMBO_DECAY_TIME;
    }
    increment(value) {
        this.count += value;
        if (this.count > this.maxCombo)
            this.maxCombo = this.count;
        this.decayTimer = this.effectiveDecayTime;
        this.updateTier();
        this.events.emit('combo:increment', { count: this.count, tier: this.tier });
    }
    break() {
        if (this.count === 0)
            return;
        const prev = this.count;
        this.count = 0;
        this.multiplier = 1;
        this.tier = 0;
        this.decayTimer = 0;
        this.events.emit('combo:break', { finalCount: prev });
    }
    update(dt) {
        if (this.count > 0) {
            this.decayTimer -= dt;
            if (this.decayTimer <= 0) {
                this.break();
            }
        }
    }
    updateTier() {
        for (let i = COMBO_TIER_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this.count >= COMBO_TIER_THRESHOLDS[i]) {
                this.tier = i;
                this.multiplier = COMBO_TIER_MULTIPLIERS[i];
                break;
            }
        }
    }
    reset() {
        this.count = 0;
        this.multiplier = 1;
        this.tier = 0;
        this.decayTimer = 0;
        this.maxCombo = 0;
    }
}
