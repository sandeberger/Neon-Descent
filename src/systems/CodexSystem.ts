/**
 * Codex / Lore System — collectible lore fragments discovered during runs.
 * Fragments are found at depth milestones and after boss defeats.
 * Persisted via IndexedDB.
 */

export interface LoreEntry {
  id: string;
  title: string;
  category: 'world' | 'enemy' | 'biome' | 'character';
  biome?: string;
  text: string;
  unlockCondition: string;
}

export const LORE_ENTRIES: LoreEntry[] = [
  // World lore
  {
    id: 'lore_origin',
    title: 'The Descent Begins',
    category: 'world',
    text: 'The surface cracked open centuries ago. Nobody remembers why. Only that below lies the Neon — a maze of impossible geometry, alive with hostile code.',
    unlockCondition: 'Complete your first run',
  },
  {
    id: 'lore_neon',
    title: 'The Neon',
    category: 'world',
    text: 'Not a substance. Not a light. The Neon is information made manifest — data folded into geometry, logic made physical. It pulses. It watches.',
    unlockCondition: 'Reach depth 1000m',
  },

  // Biome lore
  {
    id: 'lore_surface',
    title: 'Surface Fracture',
    category: 'biome',
    biome: 'surface_fracture',
    text: 'The outermost shell. Broken infrastructure and scattered debris mark where the old world ended and the descent began.',
    unlockCondition: 'Enter Surface Fracture',
  },
  {
    id: 'lore_gut',
    title: 'Neon Gut',
    category: 'biome',
    biome: 'neon_gut',
    text: 'Organic and digital matter fused together. The walls pulse with a slow rhythm, like breathing. Something metabolizes the data here.',
    unlockCondition: 'Reach Neon Gut',
  },
  {
    id: 'lore_crypt',
    title: 'Data Crypt',
    category: 'biome',
    biome: 'data_crypt',
    text: 'Ancient servers line the walls, still humming. The data stored here is corrupted beyond reading, but the guardians remain vigilant.',
    unlockCondition: 'Reach Data Crypt',
  },
  {
    id: 'lore_market',
    title: 'Hollow Market',
    category: 'biome',
    biome: 'hollow_market',
    text: 'A pocket of calm in the chaos. Strange vendors offer upgrades and respite. Their prices are fair but their motives are unclear.',
    unlockCondition: 'Reach Hollow Market',
  },
  {
    id: 'lore_molten',
    title: 'Molten Grid',
    category: 'biome',
    biome: 'molten_grid',
    text: 'The computational core runs hot. Processors the size of buildings glow orange, their heat warping reality around them.',
    unlockCondition: 'Reach Molten Grid',
  },
  {
    id: 'lore_void',
    title: 'Void Core',
    category: 'biome',
    biome: 'void_core',
    text: 'The deepest layer. Where data goes to die. The darkness here is not empty — it is full of things that have been deleted but refuse to stop existing.',
    unlockCondition: 'Reach Void Core',
  },

  // Enemy lore
  {
    id: 'lore_hopper',
    title: 'Hopper',
    category: 'enemy',
    text: 'The simplest hostile process. Hoppers are fragments of deleted code that gained locomotion. They seek contact, nothing more.',
    unlockCondition: 'Kill 50 Hoppers',
  },
  {
    id: 'lore_bloom_heart',
    title: 'The Bloom Heart',
    category: 'enemy',
    text: 'A biological processor that has grown too powerful. It pumps corrupted data through its network of organic cables, spawning parasites from its wounds.',
    unlockCondition: 'Defeat the Bloom Heart',
  },
  {
    id: 'lore_drill_mother',
    title: 'The Drill Mother',
    category: 'enemy',
    text: 'She bores through the Grid\'s walls, opening lanes that shouldn\'t exist. Her children ride in her wake, filling the tunnels she creates.',
    unlockCondition: 'Defeat the Drill Mother',
  },
];

export class CodexSystem {
  private discovered = new Set<string>();
  private db: IDBDatabase | null = null;

  async init(db: IDBDatabase): Promise<void> {
    this.db = db;
    await this.load();
  }

  private async load(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const req = store.get('codex');
      req.onsuccess = () => {
        const data = req.result as string[] | undefined;
        if (data) {
          this.discovered = new Set(data);
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  async save(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      store.put([...this.discovered], 'codex');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  discover(id: string): boolean {
    if (this.discovered.has(id)) return false;
    const entry = LORE_ENTRIES.find(e => e.id === id);
    if (!entry) return false;
    this.discovered.add(id);
    this.save();
    return true;
  }

  isDiscovered(id: string): boolean {
    return this.discovered.has(id);
  }

  getDiscoveredEntries(): LoreEntry[] {
    return LORE_ENTRIES.filter(e => this.discovered.has(e.id));
  }

  getEntriesForCategory(category: LoreEntry['category']): LoreEntry[] {
    return LORE_ENTRIES.filter(e => e.category === category);
  }

  getDiscoveredCount(): number {
    return this.discovered.size;
  }

  getTotalCount(): number {
    return LORE_ENTRIES.length;
  }
}
