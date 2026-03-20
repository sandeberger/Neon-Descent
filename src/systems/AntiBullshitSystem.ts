import type { EventBus } from '@core/EventBus';
import type { ChunkTemplate, ChunkCategory } from '@world/ChunkTemplate';

export class AntiBullshitSystem {
  recentCategories: ChunkCategory[] = [];
  chunksSinceRecovery = 0;
  chunksSinceShop = 0;
  chunksSinceLoot = 0;
  chunksSinceMiniboss = 0;
  chunksSinceBoss = 0;
  chunksGenerated = 0;
  depth = 0;
  difficultyMultiplier = 1.0;

  constructor(events: EventBus) {
    events.on('depth:update', (e) => {
      this.depth = e.depth;
      this.difficultyMultiplier = 1.0 + (this.depth / 10000) * 0.5;
    });
  }

  filterAndWeight(templates: ChunkTemplate[], biomeId?: string): { pool: ChunkTemplate[]; weights: number[] } {
    // --- Soft weights (base) ---
    const prefs = new Map<ChunkCategory, number>();
    prefs.set('combat', 4);
    prefs.set('traversal', 3);
    prefs.set('hazard', 2);
    prefs.set('loot', 1);

    // Hollow Market: safe zone — heavily bias toward recovery, loot, shop, events
    if (biomeId === 'hollow_market') {
      prefs.set('combat', 1);
      prefs.set('hazard', 0.5);
      prefs.set('traversal', 2);
      prefs.set('recovery', 5);
      prefs.set('loot', 5);
      prefs.set('shop', 4);
      prefs.set('event', 4);
      prefs.set('elite', 0);
      prefs.set('miniboss', 0);
    }

    // Intro only in first 3 chunks, then never
    prefs.set('intro', this.chunksGenerated < 3 ? 5 : 0);

    // Recovery pressure boost when overdue
    if (this.chunksSinceRecovery > 5) {
      prefs.set('recovery', 4);
    }

    // Shop cadence boost
    if (this.chunksSinceShop > 12) {
      prefs.set('shop', 3);
    }

    // Loot cadence boost
    if (this.chunksSinceLoot > 8) {
      prefs.set('loot', 3);
    }

    // Same category penalty (x0.2)
    const last = this.recentCategories[this.recentCategories.length - 1];
    if (last) {
      const cur = prefs.get(last) ?? 1;
      prefs.set(last, cur * 0.2);
    }

    // 3-in-last-4 zeroing
    if (this.recentCategories.length >= 4) {
      const last4 = this.recentCategories.slice(-4);
      const counts = new Map<string, number>();
      for (const c of last4) counts.set(c, (counts.get(c) ?? 0) + 1);
      for (const [cat, count] of counts) {
        if (count >= 3) prefs.set(cat as ChunkCategory, 0);
      }
    }

    // Elite/miniboss depth gates
    if (this.depth > 3000 && this.chunksGenerated > 10) {
      prefs.set('elite', 2);
    }
    if (this.depth > 5000 && this.chunksSinceMiniboss > 18 && this.chunksGenerated > 15) {
      prefs.set('miniboss', 3);
    }

    // Boss depth gate — only after depth > 8000 and > 30 chunks since last boss
    if (this.depth > 8000 && this.chunksSinceBoss > 30 && this.chunksGenerated > 25) {
      prefs.set('boss' as any, 3);
    }

    // --- Hard filters ---

    // 0. Filter by biome (if specified and template has biome restrictions)
    let biomeFiltered = biomeId
      ? templates.filter(t => !t.biomes || t.biomes.includes(biomeId))
      : templates;
    if (biomeFiltered.length === 0) biomeFiltered = templates; // fallback to all

    // 1. Filter by difficulty
    let eligible = biomeFiltered.filter(t => t.difficulty <= this.difficultyMultiplier);
    if (eligible.length === 0) eligible = [biomeFiltered[0] ?? templates[0]!];

    // 2. Force recovery if overdue
    if (this.chunksSinceRecovery > 6) {
      const recoveries = eligible.filter(t => t.category === 'recovery');
      if (recoveries.length > 0) {
        return { pool: recoveries, weights: recoveries.map(() => 1) };
      }
    }

    // 3. No elite/miniboss in first 5 chunks
    // 4. No 3 high-intensity in a row
    // 5. Filter categories with weight 0
    const highIntensity: ChunkCategory[] = ['combat', 'elite', 'hazard'];
    const recent2 = this.recentCategories.slice(-2);
    const tooIntense = recent2.length === 2 && recent2.every(c => highIntensity.includes(c));

    const valid = eligible.filter(t => {
      if (this.chunksGenerated < 5 && (t.category === 'elite' || t.category === 'miniboss')) {
        return false;
      }
      if (tooIntense && highIntensity.includes(t.category)) {
        return false;
      }
      if ((prefs.get(t.category) ?? 1) <= 0) {
        return false;
      }
      return true;
    });

    const pool = valid.length > 0 ? valid : eligible;
    const weights = pool.map(t => prefs.get(t.category) ?? 1);

    return { pool, weights };
  }

  recordChunk(category: ChunkCategory): void {
    this.recentCategories.push(category);
    if (this.recentCategories.length > 8) this.recentCategories.shift();

    this.chunksSinceRecovery++;
    this.chunksSinceShop++;
    this.chunksSinceLoot++;
    this.chunksSinceMiniboss++;
    this.chunksSinceBoss++;
    this.chunksGenerated++;

    if (category === 'recovery') this.chunksSinceRecovery = 0;
    if (category === 'shop')     this.chunksSinceShop = 0;
    if (category === 'loot')     this.chunksSinceLoot = 0;
    if (category === 'miniboss') this.chunksSinceMiniboss = 0;
    if (category === 'boss' as any) this.chunksSinceBoss = 0;
  }

  reset(): void {
    this.recentCategories = [];
    this.chunksSinceRecovery = 0;
    this.chunksSinceShop = 0;
    this.chunksSinceLoot = 0;
    this.chunksSinceMiniboss = 0;
    this.chunksSinceBoss = 0;
    this.chunksGenerated = 0;
    this.depth = 0;
    this.difficultyMultiplier = 1.0;
  }
}
