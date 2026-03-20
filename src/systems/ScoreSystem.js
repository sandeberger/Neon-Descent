export class ScoreSystem {
    constructor(events, combo, upgrades) {
        this.events = events;
        this.combo = combo;
        this.upgrades = upgrades;
        this.score = 0;
        this.depth = 0;
        this.currency = 0;
        // Score on kill (uses combo multiplier)
        events.on('enemy:killed', (e) => {
            const delta = e.scoreValue * this.combo.multiplier;
            this.score += delta;
            this.events.emit('score:update', { score: this.score, delta });
        });
        // Currency from pickups
        events.on('pickup:collected', (d) => {
            if (d.type === 'currency') {
                const currencyBonus = this.upgrades.getEffect('currency_bonus');
                this.currency += Math.max(1, Math.floor(d.value * (1 + currencyBonus)));
            }
        });
    }
    addDepth(playerY) {
        if (playerY > this.depth) {
            const delta = playerY - this.depth;
            this.depth = playerY;
            this.score += Math.floor(delta / 10);
            this.events.emit('depth:update', { depth: this.depth, delta });
        }
    }
    reset() {
        this.score = 0;
        this.depth = 0;
        this.currency = 0;
    }
}
