import type { EventBus } from '@core/EventBus';
import biomesData from '@data/biomes.json';
import type { BiomeData } from '@data/types';

const BIOMES: BiomeData[] = biomesData as BiomeData[];

// Biome-specific enemy speed/HP modifiers
const BIOME_ENEMY_MODS: Record<string, { speedMult: number; hpMult: number }> = {
  surface_fracture: { speedMult: 1.0, hpMult: 1.0 },
  neon_gut:         { speedMult: 1.15, hpMult: 1.1 },
  data_crypt:       { speedMult: 1.0, hpMult: 1.3 },
  hollow_market:    { speedMult: 0.7, hpMult: 0.8 },  // Safe zone — fewer/weaker enemies
  molten_grid:      { speedMult: 1.3, hpMult: 1.2 },
  void_core:        { speedMult: 1.5, hpMult: 1.5 },
};

export class PacingController {
  depth = 0;
  private currentBiome = '';

  constructor(private events: EventBus) {
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
  getBiomeId(): string {
    for (let i = BIOMES.length - 1; i >= 0; i--) {
      if (this.depth >= BIOMES[i]!.minDepth) return BIOMES[i]!.id;
    }
    return BIOMES[0]!.id;
  }

  /** Get enemy speed multiplier for current biome */
  getEnemySpeedMult(): number {
    return BIOME_ENEMY_MODS[this.getBiomeId()]?.speedMult ?? 1.0;
  }

  /** Get enemy HP multiplier for current biome */
  getEnemyHpMult(): number {
    return BIOME_ENEMY_MODS[this.getBiomeId()]?.hpMult ?? 1.0;
  }

  /** Whether the current biome is a safe zone (fewer enemies, more shops/recovery) */
  isSafeZone(): boolean {
    return this.getBiomeId() === 'hollow_market';
  }

  reset(): void {
    this.depth = 0;
    this.currentBiome = '';
  }
}
