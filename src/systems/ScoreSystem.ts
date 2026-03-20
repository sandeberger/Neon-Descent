import type { EventBus } from '@core/EventBus';
import type { ComboSystem } from './ComboSystem';
import type { UpgradeSystem } from './UpgradeSystem';

export class ScoreSystem {
  score = 0;
  depth = 0;
  currency = 0;
  kills = 0;
  eliteKills = 0;
  noDamageChunks = 0;
  private chunkDamageTaken = false;

  constructor(
    private events: EventBus,
    private combo: ComboSystem,
    private upgrades: UpgradeSystem,
  ) {
    // Score on kill (uses combo multiplier)
    events.on('enemy:killed', (e) => {
      const delta = e.scoreValue * this.combo.multiplier;
      this.score += delta;
      this.kills++;
      // Track elite/boss kills (scoreValue >= 50 indicates elite/boss tier)
      if (e.scoreValue >= 50) this.eliteKills++;
      this.events.emit('score:update', { score: this.score, delta });
    });

    // Currency from pickups
    events.on('pickup:collected', (d) => {
      if (d.type === 'currency') {
        const currencyBonus = this.upgrades.getEffect('currency_bonus');
        this.currency += Math.max(1, Math.floor(d.value * (1 + currencyBonus)));
      }
    });

    // Track damage per chunk for no-damage tracking
    events.on('player:damage', () => {
      this.chunkDamageTaken = true;
    });

    events.on('chunk:entered', () => {
      if (!this.chunkDamageTaken) {
        this.noDamageChunks++;
      }
      this.chunkDamageTaken = false;
    });
  }

  addDepth(playerY: number): void {
    if (playerY > this.depth) {
      const delta = playerY - this.depth;
      this.depth = playerY;
      this.score += Math.floor(delta / 10);
      this.events.emit('depth:update', { depth: this.depth, delta });
    }
  }

  reset(): void {
    this.score = 0;
    this.depth = 0;
    this.currency = 0;
    this.kills = 0;
    this.eliteKills = 0;
    this.noDamageChunks = 0;
    this.chunkDamageTaken = false;
  }
}
