import balanceData from '@data/balance.json';
const SPECIAL = balanceData.special ?? {
    killsPerCharge: 8,
    comboTierBonus: 0.5,
    empDamage: 3,
    cooldown: 0.5,
    maxCharges: 1,
};
export class SpecialAbilitySystem {
    constructor(events) {
        this.events = events;
        this.charges = 0;
        this.maxCharges = SPECIAL.maxCharges;
        this.killsAccumulated = 0;
        this.cooldownTimer = 0;
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
    get chargeProgress() {
        return Math.min(1, this.killsAccumulated / SPECIAL.killsPerCharge);
    }
    checkCharge() {
        if (this.killsAccumulated >= SPECIAL.killsPerCharge && this.charges < this.maxCharges) {
            this.charges++;
            this.killsAccumulated -= SPECIAL.killsPerCharge;
            this.events.emit('special:ready', {});
        }
    }
    tryActivate() {
        if (this.charges <= 0 || this.cooldownTimer > 0)
            return false;
        this.charges--;
        this.cooldownTimer = SPECIAL.cooldown;
        this.events.emit('special:activate', { abilityId: 'emp_blast' });
        return true;
    }
    update(dt) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt;
        }
    }
    reset() {
        this.charges = 0;
        this.killsAccumulated = 0;
        this.cooldownTimer = 0;
    }
}
