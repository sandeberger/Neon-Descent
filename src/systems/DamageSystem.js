export class DamageSystem {
    constructor(events, upgrades, player) {
        this.upgrades = upgrades;
        this.player = player;
        // Lifesteal on kill
        events.on('enemy:killed', () => {
            const lifestealChance = this.upgrades.getEffect('lifesteal_chance');
            if (lifestealChance > 0 && Math.random() < lifestealChance) {
                this.player.heal(1);
            }
        });
    }
    dealDamageToPlayer(amount, source) {
        const reduction = Math.floor(this.upgrades.getEffect('damage_reduction'));
        const actual = Math.max(1, amount - reduction);
        this.player.takeDamage(actual, source);
    }
    dealDamageToEnemy(enemy, amount, _source) {
        const killed = enemy.takeDamage(amount);
        return { killed };
    }
    getStompDamage() {
        return 2 + this.upgrades.getEffect('stomp_damage_bonus');
    }
    getStompAoeRadius() {
        return this.upgrades.getEffect('stomp_aoe_radius');
    }
    reset() {
        // no-op for now
    }
}
