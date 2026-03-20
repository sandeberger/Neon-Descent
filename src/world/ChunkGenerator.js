export class ChunkGenerator {
    constructor(templates, rng) {
        this.templates = templates;
        this.rng = rng;
        this.lastTemplateId = '';
    }
    next(abs, biomeId) {
        let { pool, weights } = abs.filterAndWeight(this.templates, biomeId);
        // Own rule: no same template back-to-back
        const filtered = pool.filter(t => t.id !== this.lastTemplateId);
        if (filtered.length > 0) {
            const filteredWeights = pool
                .map((t, i) => t.id !== this.lastTemplateId ? weights[i] : -1)
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
