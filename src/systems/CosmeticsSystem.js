/**
 * Cosmetics System — visual customization rewards for meta progression.
 * Tracks unlocked cosmetics and active selections.
 * Persisted via IndexedDB alongside meta progression.
 */
export const COSMETICS = [
    // Player skins
    {
        id: 'skin_default',
        name: 'Neon Standard',
        category: 'player_skin',
        description: 'Default descent suit.',
        unlockCondition: 'Always unlocked',
        colors: { body: '#44ddff', glow: '#22aaff', dash: '#88eeff' },
    },
    {
        id: 'skin_ember',
        name: 'Ember Core',
        category: 'player_skin',
        description: 'Forged in the Molten Grid.',
        unlockCondition: 'Reach Molten Grid biome',
        colors: { body: '#ff6622', glow: '#ff4400', dash: '#ffaa44' },
    },
    {
        id: 'skin_void',
        name: 'Void Walker',
        category: 'player_skin',
        description: 'Touched by the Abyss.',
        unlockCondition: 'Reach Void Core biome',
        colors: { body: '#cc22ff', glow: '#8800cc', dash: '#dd66ff' },
    },
    {
        id: 'skin_ghost',
        name: 'Ghost Protocol',
        category: 'player_skin',
        description: 'Clear 10 chunks without taking damage.',
        unlockCondition: 'Earn "Ghost" achievement',
        colors: { body: '#ffffff', glow: '#aaccff', dash: '#ccddff' },
    },
    {
        id: 'skin_gold',
        name: 'Gilded Descent',
        category: 'player_skin',
        description: 'Wealth beyond measure.',
        unlockCondition: 'Accumulate 1000 total shards',
        colors: { body: '#ffcc22', glow: '#ff9900', dash: '#ffdd66' },
    },
    {
        id: 'skin_crimson',
        name: 'Crimson Fury',
        category: 'player_skin',
        description: 'Painted in enemy defeat.',
        unlockCondition: 'Kill 500 enemies total',
        colors: { body: '#ff2244', glow: '#cc0022', dash: '#ff6666' },
    },
    // Trail effects
    {
        id: 'trail_default',
        name: 'Standard Trail',
        category: 'trail_effect',
        description: 'Default movement trail.',
        unlockCondition: 'Always unlocked',
    },
    {
        id: 'trail_fire',
        name: 'Fire Trail',
        category: 'trail_effect',
        description: 'Leave flames in your wake.',
        unlockCondition: 'Complete 25 runs',
    },
    {
        id: 'trail_electric',
        name: 'Electric Trail',
        category: 'trail_effect',
        description: 'Sparks follow your descent.',
        unlockCondition: 'Reach 50x combo',
    },
    // Death effects
    {
        id: 'death_default',
        name: 'Standard Burst',
        category: 'death_effect',
        description: 'Default death effect.',
        unlockCondition: 'Always unlocked',
    },
    {
        id: 'death_shatter',
        name: 'Shatter',
        category: 'death_effect',
        description: 'Break apart into fragments.',
        unlockCondition: 'Die 50 times',
    },
    {
        id: 'death_nova',
        name: 'Nova Burst',
        category: 'death_effect',
        description: 'Go out with a bang.',
        unlockCondition: 'Defeat 3 bosses',
    },
];
export class CosmeticsSystem {
    constructor() {
        this.unlocked = new Set(['skin_default', 'trail_default', 'death_default']);
        this.equipped = {
            player_skin: 'skin_default',
            trail_effect: 'trail_default',
            death_effect: 'death_default',
        };
        this.db = null;
    }
    async init(db) {
        this.db = db;
        await this.load();
    }
    async load() {
        if (!this.db)
            return;
        return new Promise((resolve) => {
            const tx = this.db.transaction('meta', 'readonly');
            const store = tx.objectStore('meta');
            const req = store.get('cosmetics');
            req.onsuccess = () => {
                const data = req.result;
                if (data) {
                    this.unlocked = new Set(data.unlocked);
                    // Ensure defaults are always unlocked
                    this.unlocked.add('skin_default');
                    this.unlocked.add('trail_default');
                    this.unlocked.add('death_default');
                    this.equipped = { ...this.equipped, ...data.equipped };
                }
                resolve();
            };
            req.onerror = () => resolve();
        });
    }
    async save() {
        if (!this.db)
            return;
        const data = {
            unlocked: [...this.unlocked],
            equipped: { ...this.equipped },
        };
        return new Promise((resolve) => {
            const tx = this.db.transaction('meta', 'readwrite');
            const store = tx.objectStore('meta');
            store.put(data, 'cosmetics');
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    }
    unlock(id) {
        if (this.unlocked.has(id))
            return false;
        this.unlocked.add(id);
        this.save();
        return true;
    }
    isUnlocked(id) {
        return this.unlocked.has(id);
    }
    equip(id) {
        const cosmetic = COSMETICS.find(c => c.id === id);
        if (!cosmetic || !this.unlocked.has(id))
            return;
        this.equipped[cosmetic.category] = id;
        this.save();
    }
    getEquipped(category) {
        const id = this.equipped[category];
        return COSMETICS.find(c => c.id === id);
    }
    getPlayerColors() {
        const skin = this.getEquipped('player_skin');
        if (skin?.colors) {
            return {
                body: skin.colors.body,
                glow: skin.colors.glow,
                dash: skin.colors.dash ?? skin.colors.body,
            };
        }
        return { body: '#44ddff', glow: '#22aaff', dash: '#88eeff' };
    }
    getAllForCategory(category) {
        return COSMETICS.filter(c => c.category === category);
    }
    getUnlockedCount() {
        return this.unlocked.size;
    }
}
