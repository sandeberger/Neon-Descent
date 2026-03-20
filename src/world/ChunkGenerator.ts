import type { ChunkTemplate } from './ChunkTemplate';
import type { AntiBullshitSystem } from '@systems/AntiBullshitSystem';
import type { SeededRNG } from '@utils/SeededRNG';

export class ChunkGenerator {
  private lastTemplateId = '';

  constructor(
    private templates: ChunkTemplate[],
    private rng: SeededRNG,
  ) {}

  next(abs: AntiBullshitSystem, biomeId: string): ChunkTemplate {
    let { pool, weights } = abs.filterAndWeight(this.templates, biomeId);

    // Own rule: no same template back-to-back
    const filtered = pool.filter(t => t.id !== this.lastTemplateId);
    if (filtered.length > 0) {
      const filteredWeights = pool
        .map((t, i) => t.id !== this.lastTemplateId ? weights[i]! : -1)
        .filter(w => w >= 0);
      pool = filtered;
      weights = filteredWeights;
    }

    const choice = this.rng.weightedPick(pool, weights);

    abs.recordChunk(choice.category);
    this.lastTemplateId = choice.id;
    return choice;
  }
}
