import biomesData from '@data/biomes.json';
const BIOMES = biomesData;
export class PacingController {
    constructor(events) {
        this.events = events;
        this.depth = 0;
        this.currentBiome = '';
        events.on('depth:update', (e) => {
            this.depth = e.depth;
            // Emit biome:enter when biome changes
            const newBiome = this.getBiomeId();
            if (newBiome !== this.currentBiome) {
                this.currentBiome = newBiome;
                this.events.emit('biome:enter', { id: newBiome, depth: this.depth });
            }
        });
    }
    /** Returns which biome should be active at current depth */
    getBiomeId() {
        for (let i = BIOMES.length - 1; i >= 0; i--) {
            if (this.depth >= BIOMES[i].minDepth)
                return BIOMES[i].id;
        }
        return BIOMES[0].id;
    }
    reset() {
        this.depth = 0;
        this.currentBiome = '';
    }
}
